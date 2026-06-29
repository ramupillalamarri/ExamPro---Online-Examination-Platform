import fitz
import re

def inspect_headers(pdf_path):
    doc = fitz.open(pdf_path)
    print(f"--- Inspecting Headers for {pdf_path} ---")
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
                
    # Count occurrences
    counts = {}
    for h in headers:
        q = h["q_num"]
        counts[q] = counts.get(q, []) + [h]
        
    print(f"Total headers found: {len(headers)}")
    duplicate_count = 0
    for q, occurrences in sorted(counts.items()):
        if len(occurrences) > 1:
            duplicate_count += 1
            print(f"Question {q} has {len(occurrences)} occurrences:")
            for idx, occ in enumerate(occurrences):
                print(f"  {idx+1}: page={occ['page_idx']+1}, y={occ['y']:.1f}, text='{occ['text'][:80]}'")
                
    print(f"Total questions with duplicates: {duplicate_count}")

inspect_headers("ecet_2022_cse.pdf")
