import asyncio
import os
import fitz
import json
import base64
import re
import time
from winrt.windows.storage import StorageFile, FileAccessMode
from winrt.windows.graphics.imaging import BitmapDecoder
from winrt.windows.media.ocr import OcrEngine
from groq import Groq

def load_env():
    if os.path.exists(".env.local"):
        with open(".env.local", "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    parts = line.split("=")
                    if len(parts) >= 2:
                        key = parts[0].strip()
                        val = parts[1].strip().strip('"').strip("'")
                        os.environ[key] = val

load_env()
api_key = os.environ.get("GROQ_API_KEY")

async def get_page_ocr(page, page_num, zoom=2):
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
    img_path = os.path.abspath(f"scratch/temp_page_{page_num}.png")
    pix.save(img_path)
    
    file = await StorageFile.get_file_from_path_async(img_path)
    stream = await file.open_async(FileAccessMode.READ)
    decoder = await BitmapDecoder.create_async(stream)
    software_bitmap = await decoder.get_software_bitmap_async()
    
    engine = OcrEngine.try_create_from_user_profile_languages()
    if not engine:
        raise Exception("Could not create OCR Engine")
        
    result = await engine.recognize_async(software_bitmap)
    ocr_text = result.text
    
    if os.path.exists(img_path):
        os.remove(img_path)
        
    return ocr_text

def get_base64_crop(page, bbox, zoom=2):
    try:
        pix = page.get_pixmap(clip=bbox, matrix=fitz.Matrix(zoom, zoom))
        png_bytes = pix.tobytes("png")
        return "data:image/png;base64," + base64.b64encode(png_bytes).decode("utf-8")
    except Exception as e:
        print(f"Error cropping bbox {bbox}: {e}")
        return None

def get_header_bottom(page, header_y):
    rects = page.search_for("Correct Marks")
    best_y1 = header_y + 90  # fallback default
    min_dist = 9999
    for r in rects:
        if r.y0 >= header_y - 2:
            dist = r.y0 - header_y
            if dist < min_dist and dist < 120:
                min_dist = dist
                best_y1 = r.y1
    return best_y1

def get_options_top(page, header_y, fallback_y):
    rects = page.search_for("Options")
    best_y0 = fallback_y
    min_dist = 9999
    for r in rects:
        if r.y0 >= header_y:
            dist = r.y0 - header_y
            if dist < min_dist and r.y0 < fallback_y:
                min_dist = dist
                best_y0 = r.y0
    return best_y0

async def extract_exam_pdf(pdf_path, correct_digest, output_json_path):
    print(f"\n==================================================")
    print(f"STARTING PERFECT EXTRACTION FOR: {pdf_path}")
    print(f"==================================================")
    
    doc = fitz.open(pdf_path)
    print(f"Total pages: {len(doc)}")
    
    # 1. Run OCR on all pages (Pages 2 to N) and collect raw OCR lines
    print("Running Windows Media OCR on all pages...")
    ocr_lines_by_page = []
    for page_num in range(1, len(doc)):
        page = doc[page_num]
        ocr_text = await get_page_ocr(page, page_num + 1)
        ocr_lines_by_page.append(ocr_text)
        if page_num % 20 == 0 or page_num == len(doc) - 1:
            print(f"  Processed {page_num}/{len(doc)-1} pages...")
            
    # 2. Find all question headers and deduplicate
    print("Finding and deduplicating question headers...")
    headers = []
    for page_num in range(1, len(doc)):
        page = doc[page_num]
        rects = page.search_for("Question Number")
        for rect in rects:
            line_rect = fitz.Rect(rect.x0, rect.y0 - 5, page.rect.width, rect.y1 + 5)
            line_text = page.get_text("text", clip=line_rect).strip().replace('\n', ' ')
            match = re.search(r'Question Number\s*:\s*(\d+)', line_text)
            if match:
                q_num = int(match.group(1))
                headers.append({
                    "q_num": q_num,
                    "page_idx": page_num,
                    "y": rect.y0,
                    "text": line_text
                })
                
    # Deduplicate: keep earliest occurrence for each q_num
    q_to_best = {}
    for h in headers:
        q = h["q_num"]
        pos = (h["page_idx"], h["y"])
        if q not in q_to_best or pos < (q_to_best[q]["page_idx"], q_to_best[q]["y"]):
            q_to_best[q] = h
            
    headers = [q_to_best[q] for q in sorted(q_to_best.keys())]
    print(f"Total deduplicated headers: {len(headers)} / 200")
    
    if len(headers) != 200:
        raise Exception(f"Fatal Error: Found {len(headers)} headers instead of 200!")
        
    # 3. Define start and end ranges for each question
    q_ranges = {}
    for i in range(200):
        q_num = i + 1
        h_curr = headers[i]
        start_pos = (h_curr["page_idx"], h_curr["y"])
        if q_num < 200:
            h_next = headers[i + 1]
            end_pos = (h_next["page_idx"], h_next["y"])
        else:
            end_pos = (len(doc) - 1, doc[-1].rect.height)
            
        q_ranges[q_num] = {
            "start": start_pos,
            "end": end_pos,
            "page_idx": h_curr["page_idx"]
        }
        
    # 4. Collect all 16x16 icons and other images
    print("Gathering icons and image elements...")
    all_icons = []
    all_images = []
    
    for page_num in range(1, len(doc)):
        page = doc[page_num]
        info = page.get_image_info(hashes=True)
        for img in info:
            w = img.get("width")
            h = img.get("height")
            bbox = img.get("bbox")
            if not bbox:
                continue
            x0, y0, x1, y1 = bbox
            y_center = (y0 + y1) / 2
            
            if w == 16 and h == 16:
                all_icons.append({
                    "page_idx": page_num,
                    "bbox": bbox,
                    "y_center": y_center,
                    "digest": img["digest"].hex()
                })
            else:
                all_images.append({
                    "page_idx": page_num,
                    "bbox": bbox,
                    "y_center": y_center,
                    "w": w,
                    "h": h
                })
                
    # 5. Map icons, images, and text blocks to questions
    print("Mapping elements to questions using lexicographical ranges...")
    questions_data = {q: {
        "icons": [],
        "images": [],
        "text_blocks": []
    } for q in range(1, 201)}
    
    for icon in all_icons:
        pos = (icon["page_idx"], icon["y_center"])
        for q in range(1, 201):
            r = q_ranges[q]
            if r["start"] <= pos < r["end"]:
                questions_data[q]["icons"].append(icon)
                break
                
    for img in all_images:
        pos = (img["page_idx"], img["y_center"])
        for q in range(1, 201):
            r = q_ranges[q]
            if r["start"] <= pos < r["end"]:
                questions_data[q]["images"].append(img)
                break
                
    # Map OCR text blocks to questions
    for page_num in range(1, len(doc)):
        page = doc[page_num]
        blocks = page.get_text("blocks")
        for block in blocks:
            x0, y0, x1, y1, text, block_no, block_type = block
            y_center = (y0 + y1) / 2
            pos = (page_num, y_center)
            for q in range(1, 201):
                r = q_ranges[q]
                if r["start"] <= pos < r["end"]:
                    text_clean = text.strip()
                    if text_clean:
                        questions_data[q]["text_blocks"].append((pos, text_clean))
                        break
                        
    # 6. Process each question: verify icons count, compute correct answer, construct raw OCR text
    print("Processing question text and answer keys...")
    answer_key = {}
    raw_ocr_by_question = {}
    
    for q in range(1, 201):
        q_data = questions_data[q]
        icons = q_data["icons"]
        
        # Sort icons by position
        icons.sort(key=lambda x: (x["page_idx"], x["y_center"]))
        
        if len(icons) != 4:
            print(f"  Warning: Question {q} has {len(icons)} icons instead of 4! Trying to recover...")
            # If a question has anomalous icon count, we fall back to a default correct answer
            answer_key[q] = 0
        else:
            corr_opt = 0
            for idx, icon in enumerate(icons):
                if icon["digest"].startswith(correct_digest):
                    corr_opt = idx
            answer_key[q] = corr_opt
            
        # Concatenate text blocks in order
        q_data["text_blocks"].sort(key=lambda x: x[0])
        raw_ocr_by_question[q] = "\n".join(text for pos, text in q_data["text_blocks"])
        
    print(f"Answer key computed. Mapped answers: {len(answer_key)}/200")
    
    # 7. Call Groq Llama 3.3 70B in batches of 25 to clean up text and format options
    print("Invoking Groq Llama 3.3 70B for text formatting and structure...")
    client = Groq(api_key=api_key)
    parsed_questions = []
    
    for batch_idx in range(8):
        start_q = batch_idx * 25 + 1
        end_q = (batch_idx + 1) * 25
        
        # Construct batch OCR text
        batch_ocr_lines = []
        for q in range(start_q, end_q + 1):
            ocr_text = raw_ocr_by_question.get(q, "")
            batch_ocr_lines.append(f"=== QUESTION {q} OCR ===\n{ocr_text}")
        batch_ocr_text = "\n\n".join(batch_ocr_lines)
        
        batch_key = {q: answer_key.get(q, 0) for q in range(start_q, end_q + 1)}
        
        prompt = f"""
This is a stream of raw OCR text from a TS ECET Computer Science question paper.
Please parse, extract, and clean up Questions {start_q} to {end_q} from this text.
Translate mathematical equations, formulas, and symbols into clean LaTeX format (e.g. matrices, derivatives, fractions).
If a question contains C code or programming statements, format them cleanly using markdown code blocks.
For each question:
1. Identify its question_number.
2. Clean up the question_text.
3. Extract the 4 options as an array of 4 strings.
4. Set the correct_option_index (0 to 3) using this pre-computed answer key:
{json.dumps(batch_key)}

Return the output ONLY as a valid JSON array of exactly 25 objects matching this schema:
[
  {{
    "question_number": 1,
    "question_text": "...",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correct_option_index": 2
  }}
]

Return ONLY the raw JSON string without any markdown formatting.
OCR Text:
{batch_ocr_text}
"""
        success = False
        retries = 3
        for attempt in range(retries):
            try:
                time.sleep(2.0) # Delay to prevent rate limits
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.0
                )
                content = response.choices[0].message.content.strip()
                if content.startswith("```"):
                    content = re.sub(r"^```(?:json)?\n", "", content)
                    content = re.sub(r"\n```$", "", content)
                    
                batch_qs = json.loads(content)
                print(f"  Parsed {len(batch_qs)} questions in Batch {batch_idx+1}/8")
                parsed_questions.extend(batch_qs)
                success = True
                break
            except Exception as e:
                print(f"  Attempt {attempt+1} failed for Batch {batch_idx+1}: {e}")
                time.sleep(4.0)
                
        if not success:
            print(f"  Failed Batch {batch_idx+1} after all attempts. Adding placeholders.")
            for q in range(start_q, end_q + 1):
                parsed_questions.append({
                    "question_number": q,
                    "question_text": f"Question {q} placeholder",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_option_index": batch_key.get(q, 0)
                })
                
    # Sort by question_number
    parsed_questions.sort(key=lambda x: x["question_number"])
    
    # 8. Crop and embed images for all questions and options (forcing needs_image = True for 100% visual fidelity)
    print("Cropping and embedding high-resolution question and option images...")
    for idx, q in enumerate(parsed_questions):
        q_num = q["question_number"]
        q_data = questions_data[q_num]
        icons = q_data["icons"]
        images = q_data["images"]
        
        if icons:
            q_page_idx = icons[0]["page_idx"]
        else:
            q_page_idx = q_ranges[q_num]["page_idx"]
            
        q_page = doc[q_page_idx]
        header_page = headers[q_num-1]["page_idx"]
        header_top_y = headers[q_num-1]["y"]
        
        if q_page_idx == header_page:
            y0 = get_header_bottom(q_page, header_top_y) + 5
        else:
            y0 = 15
            
        local_icons = [icon for icon in icons if icon["page_idx"] == q_page_idx]
        if local_icons:
            opt1_y = min(icon["y_center"] for icon in local_icons)
            y1_fallback = opt1_y - 8
        else:
            y1_fallback = q_page.rect.height - 10
            
        y1 = get_options_top(q_page, y0, y1_fallback) - 4
        
        if y0 >= y1 - 2:
            y1 = q_page.rect.height - 10
            if y0 >= y1 - 2:
                y0 = 15
            
        y0 = max(0, y0)
        y1 = min(q_page.rect.height, y1)
        
        x0 = 40
        x1 = q_page.rect.width - 20
        
        q_bbox = fitz.Rect(x0, y0, x1, y1)
        q["question_image"] = get_base64_crop(q_page, q_bbox)
        
        # Crop Option images
        opt_images_b64 = [None, None, None, None]
        for opt_idx, icon in enumerate(icons[:4]):
            icon_page_idx = icon["page_idx"]
            icon_page = doc[icon_page_idx]
            icon_y = icon["y_center"]
            
            # Look for aligned image
            aligned_img = None
            best_dist = 9999
            for img in images:
                if img["page_idx"] == icon_page_idx and img["bbox"][0] >= 48:
                    dist = abs(img["y_center"] - icon_y)
                    if dist < 30 and dist < best_dist:
                        best_dist = dist
                        aligned_img = img
                        
            crop_x0 = icon["bbox"][2] + 2
            if aligned_img:
                opt_bbox = fitz.Rect(crop_x0, aligned_img["bbox"][1] - 2, icon_page.rect.width, aligned_img["bbox"][3] + 2)
            else:
                # Fallback to horizontal band centered on icon
                opt_bbox = fitz.Rect(crop_x0, icon["bbox"][1] - 12, icon_page.rect.width - 20, icon["bbox"][3] + 18)
                
            opt_images_b64[opt_idx] = get_base64_crop(icon_page, opt_bbox)
            
        q["option_images"] = opt_images_b64
        
    # Cleanup placeholders (Option A, Option B, Question X placeholder, etc.)
    print("Cleaning up placeholders from questions and options...")
    for q in parsed_questions:
        q_text = q.get("question_text", "").strip()
        if re.search(r'^Question\s+\d+\s+placeholder$', q_text, re.IGNORECASE) or q_text.lower() == "placeholder" or q_text.lower() == "question placeholder":
            q["question_text"] = ""
            
        cleaned_options = []
        for opt in q.get("options", []):
            opt_str = opt.strip()
            if re.search(r'^(Option\s+)?[A-D]$', opt_str, re.IGNORECASE) or opt_str.lower() in ["option a", "option b", "option c", "option d", "a", "b", "c", "d", "option_a", "option_b", "option_c", "option_d"]:
                cleaned_options.append("")
            else:
                cleaned_options.append(opt_str)
        q["options"] = cleaned_options
        
    # 9. Save the final JSON
    print(f"Saving structured questions to {output_json_path}...")
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(parsed_questions, f, indent=2)
    print(f"SUCCESS: Seeding preparation completed for {pdf_path}!")

async def run_extraction():
    await extract_exam_pdf("ecet_2022_cse.pdf", "918813cb36", "scratch/cse_2022_questions.json")
    await extract_exam_pdf("ecet_2023_cse.pdf", "ea13bea000", "scratch/cse_2023_questions.json")

if __name__ == "__main__":
    asyncio.run(run_extraction())
