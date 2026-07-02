import json

filepath = r"C:\Users\ramup\.gemini\antigravity\brain\5bb35ba6-354d-4103-94c5-077feeb18acb\scratch\parsed_questions.json"

with open(filepath, "r", encoding="utf-8") as f:
    data = json.load(f)

print("=== SAMPLE QUESTIONS IN PARSED_QUESTIONS.JSON ===")
count = 0
for page, qs in data.items():
    for q in qs:
        print(f"Page: {page}, QNum: {q.get('question_number')}")
        print(f"Text: {q.get('question_text')}")
        print(f"Options: {q.get('options')}")
        print(f"Correct Option Index: {q.get('correct_option_index')}")
        print("-" * 50)
        count += 1
        if count >= 10:
            break
    if count >= 10:
        break
