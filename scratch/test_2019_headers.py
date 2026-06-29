import fitz
import re

doc = fitz.open("ecet_2019_cse.pdf")
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

q_to_best = {}
for h in headers:
    q = h["q_num"]
    pos = (h["page_idx"], h["y"])
    if q not in q_to_best or pos < (q_to_best[q]["page_idx"], q_to_best[q]["y"]):
        q_to_best[q] = h

headers = [q_to_best[q] for q in sorted(q_to_best.keys())]
print(f"Total headers found: {len(headers)} / 200")
if len(headers) < 200:
    missing = [q for q in range(1, 201) if q not in q_to_best]
    print(f"Missing headers: {missing}")
