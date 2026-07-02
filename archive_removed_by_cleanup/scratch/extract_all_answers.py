import fitz

def check_pdf_icons(pdf_path):
    doc = fitz.open(pdf_path)
    print(f"=== {pdf_path} ===")
    digests = {}
    for page_num in range(len(doc)):
        page = doc[page_num]
        info = page.get_image_info(hashes=True)
        for img in info:
            w = img.get("width")
            h = img.get("height")
            if w == 16 and h == 16:
                d = img["digest"].hex()
                digests[d] = digests.get(d, 0) + 1
    for d, count in digests.items():
        print(f"  Digest: {d[:10]}, count: {count}")
    print("-" * 40)

check_pdf_icons("ecet_2019_cse.pdf")
check_pdf_icons("ecet_2023_cse.pdf")
