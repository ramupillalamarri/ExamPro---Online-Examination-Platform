import fitz

doc = fitz.open("ecet_2019_cse.pdf")
print(f"Total pages: {len(doc)}")
for idx in range(len(doc)):
    text = doc[idx].get_text().strip()
    lines = text.split('\n')
    non_empty_lines = [l.strip() for l in lines if l.strip()]
    if len(non_empty_lines) > 5:
        # Check if there is actual question content or just metadata
        has_keywords = any(k in text.lower() for k in ["math", "physics", "chemistry", "computer", "matrix", "integral", "derivative", "value", "following", "correct", "wrong"])
        print(f"Page {idx+1}: {len(non_empty_lines)} lines. Keywords: {has_keywords}")
        # print first few lines
        for line in non_empty_lines[:10]:
            print(f"  {line}")
        print("-" * 50)
        if idx > 20: # Just show a few pages
            break
