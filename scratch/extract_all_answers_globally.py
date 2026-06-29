import fitz

def extract_answers_globally_skip_page1(pdf_path, correct_digest):
    doc = fitz.open(pdf_path)
    print(f"=== Globally Extracting Answers from {pdf_path} (Skipping Page 1) ===")
    
    all_icons = []
    
    # Start from page index 1 (Page 2)
    for page_num in range(1, len(doc)):
        page = doc[page_num]
        info = page.get_image_info(hashes=True)
        
        page_icons = []
        for img in info:
            w = img.get("width")
            h = img.get("height")
            if w == 16 and h == 16:
                page_icons.append(img)
                
        # Sort page icons by y first, then x
        page_icons.sort(key=lambda x: (x["bbox"][1], x["bbox"][0]))
        
        for icon in page_icons:
            all_icons.append({
                "page": page_num + 1,
                "bbox": icon["bbox"],
                "digest": icon["digest"].hex()
            })
            
    print(f"Total 16x16 icons found (excluding Page 1): {len(all_icons)}")
    
    questions_answers = {}
    for idx, icon in enumerate(all_icons):
        q_num = (idx // 4) + 1
        opt_num = (idx % 4) + 1
        
        is_correct = icon["digest"].startswith(correct_digest)
        
        if q_num not in questions_answers:
            questions_answers[q_num] = []
        questions_answers[q_num].append((opt_num, is_correct, icon["page"]))
        
    correct_counts = 0
    anomalies = []
    for q_num, opts in questions_answers.items():
        correct_opts = [opt_num for opt_num, is_correct, page in opts if is_correct]
        if len(correct_opts) != 1:
            anomalies.append((q_num, correct_opts))
        else:
            correct_counts += 1
            
    print(f"Total questions: {len(questions_answers)}")
    print(f"Total questions with exactly one correct option: {correct_counts}")
    if anomalies:
        print(f"Anomalies found (total {len(anomalies)}):")
        for q_num, opts in anomalies[:10]:
            print(f"  Q{q_num} has correct options: {opts}")
    else:
        print("SUCCESS! No anomalies found. Every single question has exactly one correct option.")
    print("-" * 50)

# Correct digests:
# 2022: '918813cb36'
# 2023: 'ea13bea000'
extract_answers_globally_skip_page1("ecet_2022_cse.pdf", "918813cb36")
extract_answers_globally_skip_page1("ecet_2023_cse.pdf", "ea13bea000")
