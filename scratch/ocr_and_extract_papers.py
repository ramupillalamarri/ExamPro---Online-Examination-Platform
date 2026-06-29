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

def get_line_bbox(line):
    words = list(line.words)
    if not words:
        return None
    min_x = min(w.bounding_rect.x for w in words)
    min_y = min(w.bounding_rect.y for w in words)
    max_x = max(w.bounding_rect.x + w.bounding_rect.width for w in words)
    max_y = max(w.bounding_rect.y + w.bounding_rect.height for w in words)
    return (min_x, min_y, max_x, max_y)

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

async def extract_exam_pdf(pdf_path, correct_digest, output_json_path):
    print(f"\n==================================================")
    print(f"STARTING EXTRACTION FOR: {pdf_path}")
    print(f"==================================================")
    
    doc = fitz.open(pdf_path)
    print(f"Total pages: {len(doc)}")
    
    all_icons = []
    question_images_info = []
    option_images_info = []
    ocr_lines_by_page = []
    question_to_page = {} # Map question_number -> 0-indexed page index
    
    # 1. Gather all images, icons, and OCR text from pages 2 to N
    for page_num in range(1, len(doc)):
        page = doc[page_num]
        info = page.get_image_info(hashes=True)
        
        page_icons = []
        page_q_imgs = []
        page_opt_imgs = []
        
        for img in info:
            w = img.get("width")
            h = img.get("height")
            bbox = img.get("bbox")
            if not bbox:
                continue
                
            x_min = bbox[0]
            
            if w == 16 and h == 16:
                page_icons.append(img)
            elif x_min < 50:
                page_q_imgs.append(img)
            else:
                page_opt_imgs.append(img)
                
        page_icons.sort(key=lambda x: (x["bbox"][1], x["bbox"][0]))
        page_q_imgs.sort(key=lambda x: (x["bbox"][1], x["bbox"][0]))
        page_opt_imgs.sort(key=lambda x: (x["bbox"][1], x["bbox"][0]))
        
        for icon in page_icons:
            all_icons.append({
                "page_idx": page_num,
                "bbox": icon["bbox"],
                "digest": icon["digest"].hex()
            })
            
        for q_img in page_q_imgs:
            question_images_info.append({
                "page_idx": page_num,
                "bbox": q_img["bbox"]
            })
            
        for opt_img in page_opt_imgs:
            option_images_info.append({
                "page_idx": page_num,
                "bbox": opt_img["bbox"]
            })
            
        # Run OCR on this page
        print(f"Running OCR on Page {page_num+1}/{len(doc)}...")
        ocr_text = await get_page_ocr(page, page_num + 1)
        ocr_lines_by_page.append(ocr_text)
        
        # Track which question starts on this page
        matches = re.findall(r'Question Number\s*:\s*(\d+)', ocr_text)
        for q_num_str in matches:
            q_num = int(q_num_str)
            if q_num not in question_to_page:
                question_to_page[q_num] = page_num # Store 0-indexed page number
                
    print(f"Total 16x16 icons found: {len(all_icons)}")
    print(f"Total question images found: {len(question_images_info)}")
    print(f"Total option images found: {len(option_images_info)}")
    
    # 2. Compute the answer key from the sorted icons
    answer_key = {}
    for idx, icon in enumerate(all_icons):
        q_num = (idx // 4) + 1
        opt_idx = idx % 4
        is_correct = icon["digest"].startswith(correct_digest)
        if is_correct:
            answer_key[q_num] = opt_idx
            
    print(f"Answer key computed. Total answers found: {len(answer_key)}")
    
    # 3. Call Groq Llama 3.3 70B in 8 batches (25 questions each) using sliced page OCR
    client = Groq(api_key=api_key)
    parsed_questions = []
    
    for batch_idx in range(8):
        start_q = batch_idx * 25 + 1
        end_q = (batch_idx + 1) * 25
        
        # Find which pages correspond to this batch of questions
        start_page_idx = question_to_page.get(start_q, 1) - 1 # Default to page 2 (index 1)
        
        # End page is the page of the first question in the NEXT batch
        next_batch_start_q = end_q + 1
        if next_batch_start_q in question_to_page:
            end_page_idx = question_to_page[next_batch_start_q] + 1 # Include next page to be safe
        else:
            end_page_idx = len(doc)
            
        # Clamp page indices
        start_page_idx = max(0, start_page_idx)
        end_page_idx = min(len(doc), end_page_idx)
        
        # Slice OCR text for this batch
        # Note: ocr_lines_by_page is 0-indexed corresponding to pages 2 to N (page_num range starts at 1)
        # So page_num = K corresponds to ocr_lines_by_page[K - 1]
        sliced_ocr_lines = []
        for p_idx in range(start_page_idx, end_page_idx):
            ocr_idx = p_idx - 1
            if 0 <= ocr_idx < len(ocr_lines_by_page):
                sliced_ocr_lines.append(f"--- Page {p_idx+1} OCR ---\n{ocr_lines_by_page[ocr_idx]}")
                
        sliced_ocr_text = "\n\n".join(sliced_ocr_lines)
        batch_key = {q: answer_key.get(q, 0) for q in range(start_q, end_q + 1)}
        
        print(f"Processing Batch {batch_idx+1}/8 (Questions {start_q} to {end_q}, Pages {start_page_idx+1} to {end_page_idx})...")
        print(f"  OCR Text size: {len(sliced_ocr_text)} characters (approx {len(sliced_ocr_text)//4} tokens)")
        
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
5. Set "needs_image" to true if the question contains complex mathematical formulas, tables, matrices, drawings, C code blocks, or special formatting where the raw text is difficult to read. Set it to false for simple plain text questions.

Return the output ONLY as a valid JSON array of exactly 25 objects matching this schema:
[
  {{
    "question_number": 1,
    "question_text": "...",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correct_option_index": 2,
    "needs_image": true
  }}
]

Return ONLY the raw JSON string without any markdown formatting.
OCR Text:
{sliced_ocr_text}
"""
        # Try to call API with retry logic and small delay
        success = False
        retries = 3
        for attempt in range(retries):
            try:
                # Small delay between calls to avoid RPM limits
                time.sleep(2.0)
                
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
                print(f"  Successfully parsed {len(batch_qs)} questions in Batch {batch_idx+1}")
                parsed_questions.extend(batch_qs)
                success = True
                break
            except Exception as e:
                print(f"  Attempt {attempt+1} failed for Batch {batch_idx+1}: {e}")
                time.sleep(4.0) # Wait longer on error
                
        if not success:
            print(f"  ❌ FAILED Batch {batch_idx+1} after all attempts. Adding placeholders.")
            for q_num in range(start_q, end_q + 1):
                parsed_questions.append({
                    "question_number": q_num,
                    "question_text": f"Question {q_num} placeholder",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_option_index": batch_key.get(q_num, 0),
                    "needs_image": True
                })
                
    # Sort parsed questions by question_number
    parsed_questions.sort(key=lambda x: x["question_number"])
    
    # 4. Crop and embed images for questions/options that need them
    print("Cropping and embedding question/option images...")
    for idx, q in enumerate(parsed_questions):
        q_num = q["question_number"]
        needs_image = q.get("needs_image", False)
        
        q_img_b64 = None
        opt_imgs_b64 = [None, None, None, None]
        
        if idx < len(question_images_info):
            q_info = question_images_info[idx]
            q_page = doc[q_info["page_idx"]]
            
            if needs_image:
                q_img_b64 = get_base64_crop(q_page, q_info["bbox"])
                
            for opt_idx in range(4):
                opt_global_idx = idx * 4 + opt_idx
                if opt_global_idx < len(option_images_info):
                    opt_info = option_images_info[opt_global_idx]
                    opt_page = doc[opt_info["page_idx"]]
                    if needs_image:
                        opt_imgs_b64[opt_idx] = get_base64_crop(opt_page, opt_info["bbox"])
                        
        q["question_image"] = q_img_b64
        q["option_images"] = opt_imgs_b64
        
    # 5. Save the final 200 structured questions to JSON
    print(f"Saving {len(parsed_questions)} questions to {output_json_path}...")
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(parsed_questions, f, indent=2)
    print(f"Seeding preparation completed successfully for {pdf_path}!")

async def run_extraction():
    await extract_exam_pdf("ecet_2022_cse.pdf", "918813cb36", "scratch/cse_2022_questions.json")
    await extract_exam_pdf("ecet_2023_cse.pdf", "ea13bea000", "scratch/cse_2023_questions.json")

if __name__ == "__main__":
    asyncio.run(run_extraction())
