import pdfplumber

print("=== Testing pdfplumber on ecet_2022_cse.pdf ===")
with pdfplumber.open("ecet_2022_cse.pdf") as pdf:
    # Page 2 (0-indexed page 1)
    page = pdf.pages[1]
    text = page.extract_text()
    print("Extracted Text:")
    print(text if text else "[No Text]")
    
    # Let's see if there are any tables or drawings
    print("Tables count:", len(page.find_tables()))
    print("Drawings (rects) count:", len(page.rects))
    print("Images count:", len(page.images))
