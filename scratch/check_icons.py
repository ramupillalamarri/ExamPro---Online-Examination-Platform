import fitz

def check_pdf(pdf_path):
    print(f"=== {pdf_path} ===")
    doc = fitz.open(pdf_path)
    for page_num in range(1, min(10, len(doc))):
        page = doc[page_num]
        info = page.get_image_info(hashes=True)
        for img in info:
            w = img.get("width")
            h = img.get("height")
            bbox = img.get("bbox")
            if w == 16 and h == 16:
                print(f"Page {page_num}: bbox={bbox}, digest={img['digest'].hex()[:10]}")

check_pdf("ecet_2022_cse.pdf")
check_pdf("ecet_2023_cse.pdf")
