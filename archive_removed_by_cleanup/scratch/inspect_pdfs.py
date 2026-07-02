import fitz # PyMuPDF
import os

pdfs = ["ecet_2019_cse.pdf", "ecet_2022_cse.pdf", "ecet_2023_cse.pdf"]

for pdf_name in pdfs:
    print(f"=== {pdf_name} ===")
    if not os.path.exists(pdf_name):
        print(f"File {pdf_name} does not exist!")
        continue
    
    doc = fitz.open(pdf_name)
    print(f"Total pages: {len(doc)}")
    
    # Print the text of the first page to see the layout
    print("--- First Page Text ---")
    first_page_text = doc[0].get_text()
    # Print first 1000 characters
    print(first_page_text[:1500])
    print("\n")
