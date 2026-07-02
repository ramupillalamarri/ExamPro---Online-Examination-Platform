import json
import os
import fitz
import base64

def get_image_base64(pix):
    png_bytes = pix.tobytes("png")
    return "data:image/png;base64," + base64.b64encode(png_bytes).decode("utf-8")

def prepare_2019_exam():
    parsed_path = r"C:\Users\ramup\.gemini\antigravity\brain\5bb35ba6-354d-4103-94c5-077feeb18acb\scratch\parsed_questions.json"
    pdf_path = "ecet_2019_cse.pdf"
    
    if not os.path.exists(parsed_path):
        print("Error: parsed_questions.json not found in artifacts!")
        return
        
    with open(parsed_path, "r", encoding="utf-8") as f:
        parsed_data = json.load(f)
        
    doc = fitz.open(pdf_path)
    
    # We will build a clean dict of questions numbered 1 to 200
    clean_questions = {}
    
    # Load existing questions from parsed_questions.json
    for page, qs in parsed_data.items():
        for q in qs:
            q_num = q.get("question_number")
            if q_num is not None:
                try:
                    q_num = int(q_num)
                    if 1 <= q_num <= 200:
                        # Normalize options format: list of strings
                        opts = q.get("options", [])
                        if not isinstance(opts, list):
                            opts = []
                        # Ensure we have 4 options, if not, pad them
                        while len(opts) < 4:
                            opts.append(f"Option {len(opts)+1}")
                        opts = opts[:4]
                        
                        # Correct option index
                        corr_idx = q.get("correct_option_index")
                        if corr_idx is None:
                            corr_idx = 0
                        else:
                            try:
                                corr_idx = int(corr_idx)
                                if not (0 <= corr_idx <= 3):
                                    corr_idx = 0
                            except:
                                corr_idx = 0
                                
                        clean_questions[q_num] = {
                            "question_number": q_num,
                            "question_text": q.get("question_text") or f"Question {q_num}",
                            "options": opts,
                            "correct_option_index": corr_idx,
                            "question_image": q.get("question_image") # Keep existing image if any
                        }
                except ValueError:
                    pass
                    
    print(f"Loaded {len(clean_questions)} unique questions from parsed_questions.json")
    
    # Missing questions are 46, 48, 192
    # Let's add them by rendering their respective pages and cropping the question boxes!
    # Q46 is on Page 21. Q48 is on Page 22. Q192 is on Page 79.
    
    # We'll write helper to crop the question area based on the page layout.
    # In 2019 PDF:
    # Page 21: Q45 starts at top, Q46 is at bottom.
    # Page 22: Q47 is at top, Q48 is at bottom.
    # Page 79: Q191 is at top, Q192 is at bottom.
    # Let's crop the bottom half of the page for these questions!
    # A standard page is 595 x 842. Bottom half is y: 400 to 800.
    
    missing_info = {
        46: {"page": 20, "bbox": fitz.Rect(40, 300, 550, 750), "text": "The Laplace transform of a function $f(x)$ is $F(s) = \\frac{e^{-s}}{s^2+2s}$. Then, $\\lim_{x \\to \\infty} f(x) =$", "options": ["$0$", "$1$", "$\\frac{1}{2}$", "$\\infty$"], "correct": 2},
        48: {"page": 21, "bbox": fitz.Rect(40, 450, 550, 800), "text": "If $L(y(x)) = Y(s)$ and $y(x) = \\cos x + \\sin x$, then $L(y''(x)) =$", "options": ["$s^2 Y(s) - s - 1$", "$s^2 Y(s) + s + 1$", "$s^2 Y(s) - s$", "$s^2 Y(s) + s$"], "correct": 0},
        192: {"page": 78, "bbox": fitz.Rect(40, 450, 550, 800), "text": "Which of the following JavaScript statements is the correct definition of an array?", "options": ["var a = new Array[100]", "a = new Array[1, 2, 3, 4]", "a = new Array(1, 2, 3, 4)", "a = new Array[]"], "correct": 2}
    }
    
    for q_num, info in missing_info.items():
        page = doc[info["page"]]
        # Crop the bounding box
        pix = page.get_pixmap(clip=info["bbox"], matrix=fitz.Matrix(2, 2))
        img_b64 = get_image_base64(pix)
        
        clean_questions[q_num] = {
            "question_number": q_num,
            "question_text": info["text"],
            "options": info["options"],
            "correct_option_index": info["correct"],
            "question_image": img_b64 # Crop of the question from PDF
        }
        print(f"Successfully cropped and added missing Q{q_num}")
        
    # Let's make sure we have exactly 200 questions
    final_questions = []
    missing_all = []
    for i in range(1, 201):
        if i in clean_questions:
            final_questions.append(clean_questions[i])
        else:
            missing_all.append(i)
            # Add a dummy question if it's missing to ensure exactly 200 questions
            final_questions.append({
                "question_number": i,
                "question_text": f"Question {i} placeholder. Please contact administrator.",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_option_index": 0,
                "question_image": None
            })
            
    print(f"Final 2019 questions count: {len(final_questions)}")
    print(f"Missing questions that were padded: {missing_all}")
    
    # Write to cse_2019_questions.json
    output_path = "scratch/cse_2019_questions.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final_questions, f, indent=2)
    print(f"Saved {output_path} successfully.")

if __name__ == "__main__":
    prepare_2019_exam()
