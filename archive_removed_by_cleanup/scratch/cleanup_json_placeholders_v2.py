import json
import re

def clean_file(file_path):
    print(f"Cleaning placeholders in {file_path}...")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            questions = json.load(f)
            
        cleaned_q = 0
        cleaned_opt = 0
        
        for q in questions:
            # Clean question text placeholders
            q_text = q.get("question_text", "").strip()
            if (re.search(r'^Question\s+\d+\s+placeholder$', q_text, re.IGNORECASE) or 
                "no question" in q_text.lower() or
                q_text.lower() in ["placeholder", "question placeholder"]):
                q["question_text"] = ""
                cleaned_q += 1
                
            # Clean option text placeholders
            cleaned_options = []
            for opt in q.get("options", []):
                opt_str = opt.strip()
                if (re.search(r'^(Option\s+)?[A-D]$', opt_str, re.IGNORECASE) or 
                    "no option" in opt_str.lower() or
                    opt_str.lower() in [
                        "option a", "option b", "option c", "option d", 
                        "a", "b", "c", "d", 
                        "option_a", "option_b", "option_c", "option_d"
                    ]):
                    cleaned_options.append("")
                    cleaned_opt += 1
                else:
                    cleaned_options.append(opt_str)
            q["options"] = cleaned_options
            
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(questions, f, indent=2)
            
        print(f"  Successfully cleaned: {cleaned_q} question texts and {cleaned_opt} option texts.")
    except Exception as e:
        print(f"  Error cleaning {file_path}: {e}")

def main():
    clean_file("scratch/cse_2019_questions.json")
    clean_file("scratch/cse_2022_questions.json")
    clean_file("scratch/cse_2023_questions.json")

if __name__ == "__main__":
    main()
