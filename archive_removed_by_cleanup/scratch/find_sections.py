import fitz
import re

def find_sections(pdf_path):
    doc = fitz.open(pdf_path)
    print(f"=== Sections in {pdf_path} ===")
    for page_num in range(len(doc)):
        text = doc[page_num].get_text()
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        for line in lines:
            # Look for section names
            if any(s in line.lower() for s in ["mathematics", "physics", "chemistry", "computer science"]):
                # Check if it's a section header page (contains Section Id or Section Number)
                if "section" in text.lower() or "group" in text.lower():
                    print(f"Page {page_num+1}: {line}")
                    break
    print("-" * 50)

find_sections("ecet_2019_cse.pdf")
find_sections("ecet_2022_cse.pdf")
find_sections("ecet_2023_cse.pdf")
