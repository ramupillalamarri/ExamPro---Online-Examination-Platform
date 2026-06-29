import fitz

def print_pages_text(path, page_indices):
    doc = fitz.open(path)
    print(f"==================================================")
    print(f"PDF: {path}")
    print(f"==================================================")
    for idx in page_indices:
        if idx < len(doc):
            print(f"--- Page {idx+1} ---")
            text = doc[idx].get_text().strip()
            print(text if text else "[No Text]")
            print(f"Images count: {len(doc[idx].get_images())}")
            print("-" * 50)

print_pages_text("ecet_2019_cse.pdf", [1, 2, 3])
print_pages_text("ecet_2022_cse.pdf", [1, 2, 3])
print_pages_text("ecet_2023_cse.pdf", [1, 2, 3])
