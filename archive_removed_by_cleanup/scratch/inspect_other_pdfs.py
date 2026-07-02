import fitz

def check_pdf(path):
    doc = fitz.open(path)
    print(f"=== {path} ===")
    print(f"Total pages: {len(doc)}")
    # Scan first 20 pages for pages with actual question text
    found_text = False
    for idx in range(min(30, len(doc))):
        text = doc[idx].get_text().strip()
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        # Filter out lines that are just numbers or metadata
        question_lines = [l for l in lines if not l.startswith("Question Number") and not l.startswith("Single Line") and not l.startswith("Correct Marks") and not l.startswith("Options") and not l.startswith("Option Orientation")]
        if len(question_lines) > 5:
            print(f"Page {idx+1} has substantial non-metadata text ({len(question_lines)} lines):")
            for line in question_lines[:8]:
                print(f"  {line}")
            print("-" * 40)
            found_text = True
            break
    if not found_text:
        print("No pages with substantial text found in the first 30 pages. Showing page 5 raw text:")
        print(doc[4].get_text())

check_pdf("ecet_2022_cse.pdf")
check_pdf("ecet_2023_cse.pdf")
