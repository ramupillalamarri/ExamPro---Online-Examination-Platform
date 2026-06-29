import fitz
import re

def test_y_grouping(pdf_path, page_num):
    doc = fitz.open(pdf_path)
    page = doc[page_num - 1]
    
    # 1. Find all question headers on this page and their y-coordinates
    # We can search for "Question Number" using page.search_for
    rects = page.search_for("Question Number")
    print(f"--- Page {page_num} Question Headers ---")
    
    headers = []
    for rect in rects:
        # Extend rect to the right to capture the full line with the number
        line_rect = fitz.Rect(rect.x0, rect.y0 - 5, page.rect.width, rect.y1 + 5)
        line_text = page.get_text("text", clip=line_rect).strip().replace('\n', ' ')
        
        match = re.search(r'Question Number\s*:\s*(\d+)', line_text)
        if match:
            q_num = int(match.group(1))
            headers.append({
                "q_num": q_num,
                "y": rect.y0,
                "rect": rect
            })
            print(f"  Found Question {q_num} at y={rect.y0:.1f}, line='{line_text[:80]}'")
            
    # Sort headers by y-coordinate
    headers.sort(key=lambda x: x["y"])
    
    # 2. Get all images on this page
    images = page.get_image_info(hashes=True)
    print(f"\n--- Images on Page {page_num} ---")
    for idx, img in enumerate(images):
        w = img.get("width")
        h = img.get("height")
        bbox = img.get("bbox")
        x0, y0, x1, y1 = bbox
        
        # Determine which question this image belongs to
        # It belongs to the question header that is closest to it from above (highest y that is <= y0)
        belong_q = None
        for h_idx, header in enumerate(headers):
            if header["y"] <= y0 + 10: # Add small tolerance
                belong_q = header["q_num"]
                
        print(f"  Img {idx+1}: size=({w}x{h}), bbox=({x0:.1f}, {y0:.1f}, {x1:.1f}, {y1:.1f}), belongs to Q: {belong_q}")

test_y_grouping("ecet_2023_cse.pdf", 3)
test_y_grouping("ecet_2023_cse.pdf", 4)
