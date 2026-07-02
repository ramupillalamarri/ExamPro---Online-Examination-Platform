import fitz
import re
import json

def test_perfect_alignment(pdf_path, correct_digest):
    doc = fitz.open(pdf_path)
    print(f"\n==================================================")
    print(f"TESTING PERFECT ALIGNMENT FOR: {pdf_path}")
    print(f"==================================================")
    
    # 1. Find all question headers across the PDF (Pages 2 to N)
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
                
    # Deduplicate headers: keep the one with smallest (page_idx, y) for each q_num
    q_to_best = {}
    for h in headers:
        q = h["q_num"]
        pos = (h["page_idx"], h["y"])
        if q not in q_to_best or pos < (q_to_best[q]["page_idx"], q_to_best[q]["y"]):
            q_to_best[q] = h
            
    headers = [q_to_best[q] for q in sorted(q_to_best.keys())]
    print(f"Total deduplicated headers: {len(headers)} / 200")
    
    if len(headers) != 200:
        print(f"ERROR: Found {len(headers)} headers instead of 200!")
        # Let's see which ones are missing
        found_nums = {h["q_num"] for h in headers}
        missing = [i for i in range(1, 201) if i not in found_nums]
        print(f"Missing question numbers: {missing}")
        return
        
    # 2. Define the start and end ranges for each question
    # We will represent position as a tuple: (page_idx, y)
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
        
    # 3. Gather all 16x16 icons and other images from pages 2 to N
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
                
    # 4. Map icons and images to questions using lexicographical ranges
    questions_data = {q: {"icons": [], "images": []} for q in range(1, 201)}
    
    for icon in all_icons:
        pos = (icon["page_idx"], icon["y_center"])
        # Find which question this icon belongs to
        assigned = False
        for q in range(1, 201):
            r = q_ranges[q]
            if r["start"] <= pos < r["end"]:
                questions_data[q]["icons"].append(icon)
                assigned = True
                break
        if not assigned:
            print(f"WARNING: Icon at page {icon['page_idx']+1}, y={icon['y_center']:.1f} was not assigned to any question!")
            
    for img in all_images:
        pos = (img["page_idx"], img["y_center"])
        assigned = False
        for q in range(1, 201):
            r = q_ranges[q]
            if r["start"] <= pos < r["end"]:
                questions_data[q]["images"].append(img)
                assigned = True
                break
                
    # 5. Validate the mapping
    anomalous_icons = 0
    anomalous_images = 0
    answer_key = {}
    
    for q in range(1, 201):
        q_data = questions_data[q]
        icons = q_data["icons"]
        images = q_data["images"]
        
        # Sort icons by y_center
        icons.sort(key=lambda x: (x["page_idx"], x["y_center"]))
        
        # Validate option icons count
        if len(icons) != 4:
            print(f"ERROR: Question {q} has {len(icons)} icons instead of 4!")
            anomalous_icons += 1
        else:
            # Determine correct option
            corr_opt = None
            for idx, icon in enumerate(icons):
                if icon["digest"].startswith(correct_digest):
                    corr_opt = idx
            answer_key[q] = corr_opt
            
        # Verify question image crops and option alignment
        opt_imgs = []
        if len(icons) == 4:
            for idx, icon in enumerate(icons):
                # Find an image on the same page that overlaps vertically with this icon
                aligned_img = None
                best_dist = 9999
                for img in images:
                    if img["page_idx"] == icon["page_idx"] and img["bbox"][0] >= 48:
                        # Check vertical distance between centers
                        dist = abs(img["y_center"] - icon["y_center"])
                        if dist < 25 and dist < best_dist:
                            best_dist = dist
                            aligned_img = img
                if aligned_img:
                    opt_imgs.append(aligned_img)
                else:
                    opt_imgs.append(None)
                    
            none_count = opt_imgs.count(None)
            if none_count > 0:
                print(f"  Question {q}: {none_count} options did not find aligned images!")
                
    print("\n--- Summary of Verification ---")
    print(f"Questions with anomalous icon count: {anomalous_icons}")
    print(f"Total correct answers mapped: {len([k for k, v in answer_key.items() if v is not None])} / 200")
    
test_perfect_alignment("ecet_2023_cse.pdf", "ea13bea000")
test_perfect_alignment("ecet_2022_cse.pdf", "918813cb36")
