import fitz
import re

def count_questions(pdf_path):
    doc = fitz.open(pdf_path)
    questions = []
    current_section = "Unknown"
    
    for page_num in range(len(doc)):
        text = doc[page_num].get_text()
        
        # Look for section headers
        sec_match = re.findall(r'Subject Name\s*:\s*(.*?)\n|Mathematics|Physics|Chemistry|Computer Science', text, re.IGNORECASE)
        for m in sec_match:
            if m:
                current_section = m.strip()
        
        # Find all question metadata matches
        matches = re.finditer(r'Question Number\s*:\s*(\d+)\s+Question Id\s*:\s*(\d+)', text)
        for match in matches:
            q_num = int(match.group(1))
            q_id = match.group(2)
            questions.append({
                "page": page_num + 1,
                "q_num": q_num,
                "q_id": q_id,
                "section": current_section
            })
            
    # Sort and filter unique questions
    unique_questions = {}
    for q in questions:
        unique_questions[q["q_num"]] = q
        
    print(f"PDF: {pdf_path}")
    print(f"Total pages: {len(doc)}")
    print(f"Total question occurrences: {len(questions)}")
    print(f"Unique questions found: {len(unique_questions)}")
    if unique_questions:
        max_q = max(unique_questions.keys())
        print(f"Max question number: {max_q}")
        # Print sections distribution
        sections = {}
        for q in unique_questions.values():
            sections[q["section"]] = sections.get(q["section"], 0) + 1
        print("Sections distribution:", sections)
    print("-" * 50)

count_questions("ecet_2019_cse.pdf")
count_questions("ecet_2022_cse.pdf")
count_questions("ecet_2023_cse.pdf")
