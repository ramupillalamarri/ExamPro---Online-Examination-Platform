import fitz
import re

doc = fitz.open("ecet_2019_cse.pdf")
print("Searching for Q46, Q48, Q192 in ecet_2019_cse.pdf...")

for page_num in range(len(doc)):
    text = doc[page_num].get_text()
    
    # Find question numbers
    matches = re.findall(r'Question Number\s*:\s*(\d+)', text)
    for q_num_str in matches:
        q_num = int(q_num_str)
        if q_num in [46, 48, 192]:
            print(f"Question {q_num} is on Page {page_num + 1}")
            # Print the text of this page
            print(f"--- Page {page_num + 1} Text ---")
            print(text.strip())
            print("-" * 50)
