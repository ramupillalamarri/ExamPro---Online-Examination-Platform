import fitz
import json
import base64
import re
import os

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
    best_y1 = header_y + 55  # default fallback
    min_dist = 9999
    for r in rects:
        if r.y0 >= header_y - 2:
            dist = r.y0 - header_y
            if dist < min_dist and dist < 120:
                min_dist = dist
                best_y1 = r.y1
    return best_y1

def extract_2019():
    pdf_path = "ecet_2019_cse.pdf"
    json_path = "scratch/cse_2019_questions.json"
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found!")
        return
        
    with open(json_path, "r", encoding="utf-8") as f:
        questions = json.load(f)
        
    doc = fitz.open(pdf_path)
    print(f"Loaded PDF: {pdf_path} ({len(doc)} pages)")
    
    # 1. Find all question headers on all pages
    headers = []
    for page_idx in range(1, len(doc)):
        page = doc[page_idx]
        rects = page.search_for("Question Number")
        for rect in rects:
            line_rect = fitz.Rect(rect.x0 - 5, rect.y0 - 5, page.rect.width, rect.y1 + 5)
            line_text = page.get_text("text", clip=line_rect).strip().replace('\n', ' ')
            match = re.search(r'Question Number\s*:\s*(\d+)', line_text)
            if match:
                q_num = int(match.group(1))
                headers.append({
                    "q_num": q_num,
                    "page_idx": page_idx,
                    "y": rect.y0
                })
                
    # Deduplicate headers
    q_to_best = {}
    for h in headers:
        q = h["q_num"]
        pos = (h["page_idx"], h["y"])
        if q not in q_to_best or pos < (q_to_best[q]["page_idx"], q_to_best[q]["y"]):
            q_to_best[q] = h
            
    headers_dict = q_to_best
    print(f"Mapped {len(headers_dict)} headers.")
    
    # 2. Crop questions and options
    for q_idx, q in enumerate(questions):
        q_num = q["question_number"]
        if q_num not in headers_dict:
            print(f"Warning: Question {q_num} header not found in PDF!")
            continue
            
        h_curr = headers_dict[q_num]
        header_page = h_curr["page_idx"]
        header_y = h_curr["y"]
        
        page = doc[header_page]
        
        # Search for "Options" on the current page below header_y
        opt_rects = page.search_for("Options")
        local_opt_rect = None
        for r in opt_rects:
            if r.y0 >= header_y:
                if r.y1 < page.rect.height - 80:
                    local_opt_rect = r
                break
                
        if local_opt_rect:
            # Options are on the same page
            q_page_idx = header_page
            q_page = page
            y0 = get_header_bottom(q_page, header_y) + 5
            y1 = local_opt_rect.y0 - 4
            opt_start_y = local_opt_rect.y1 + 4
        else:
            # Options are on the next page
            q_page_idx = header_page + 1
            q_page = doc[q_page_idx]
            
            # Find the first "Options" on the next page
            next_opt_rects = q_page.search_for("Options")
            if next_opt_rects:
                local_opt_rect = next_opt_rects[0]
                y1 = local_opt_rect.y0 - 4
                opt_start_y = local_opt_rect.y1 + 4
            else:
                y1 = q_page.rect.height - 20
                opt_start_y = 150 # fallback
                
            y0 = 15
            
        # Determine where the options end
        # Look if there is a next question header on q_page_idx
        next_header_y = q_page.rect.height - 20
        for next_q_num, next_h in headers_dict.items():
            if next_h["page_idx"] == q_page_idx and next_h["y"] > opt_start_y:
                if next_h["y"] < next_header_y:
                    next_header_y = next_h["y"]
                    
        opt_end_y = next_header_y - 5
        
        # Safeguards
        if y0 >= y1 - 2:
            y1 = q_page.rect.height - 10
            if y0 >= y1 - 2:
                y0 = 15
                
        # 3. Crop Question Image
        q_bbox = fitz.Rect(40, y0, q_page.rect.width - 20, y1)
        q["question_image"] = get_base64_crop(q_page, q_bbox)
        
        # 4. Crop Option Images
        opt_height = (opt_end_y - opt_start_y) / 4
        opt_images_b64 = []
        for i in range(4):
            oy0 = opt_start_y + i * opt_height
            oy1 = opt_start_y + (i + 1) * opt_height
            # x0 starts at 70 to exclude the checkbox and tick mark
            opt_bbox = fitz.Rect(70, oy0, q_page.rect.width - 20, oy1)
            opt_images_b64.append(get_base64_crop(q_page, opt_bbox))
            
        q["option_images"] = opt_images_b64
        
        if q_num % 20 == 0 or q_num == 200:
            print(f"Cropped questions up to {q_num}/200...")
            
    # Clean placeholders just in case
    for q in questions:
        q_text = q.get("question_text", "").strip()
        if re.search(r'^Question\s+\d+\s+placeholder$', q_text, re.IGNORECASE) or q_text.lower() in ["placeholder", "question placeholder", "no question text available", "no question text", "no question"]:
            q["question_text"] = ""
            
        cleaned_options = []
        for opt in q.get("options", []):
            opt_str = opt.strip()
            if re.search(r'^(Option\s+)?[A-D]$', opt_str, re.IGNORECASE) or opt_str.lower() in ["option a", "option b", "option c", "option d", "a", "b", "c", "d", "option_a", "option_b", "option_c", "option_d"]:
                cleaned_options.append("")
            else:
                cleaned_options.append(opt_str)
        q["options"] = cleaned_options
        
    # Save the updated JSON file
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2)
    print(f"SUCCESS: Saved updated 2019 questions to {json_path}")

if __name__ == "__main__":
    extract_2019()
