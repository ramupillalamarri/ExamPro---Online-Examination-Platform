import json

filepath = r"C:\Users\ramup\.gemini\antigravity\brain\5bb35ba6-354d-4103-94c5-077feeb18acb\scratch\parsed_questions.json"

with open(filepath, "r", encoding="utf-8") as f:
    data = json.load(f)

# Collect all question numbers
q_numbers = []
pages_with_no_questions = []

for page, qs in data.items():
    if not qs:
        pages_with_no_questions.append(page)
    for q in qs:
        q_num = q.get("question_number")
        if q_num is not None:
            try:
                q_numbers.append(int(q_num))
            except:
                pass

print(f"Total questions loaded: {len(q_numbers)}")
print(f"Unique question numbers: {len(set(q_numbers))}")
print(f"Min question number: {min(q_numbers) if q_numbers else None}")
print(f"Max question number: {max(q_numbers) if q_numbers else None}")

# Check which numbers between 1 and 200 are missing
missing = [i for i in range(1, 201) if i not in q_numbers]
print(f"Missing question numbers (total {len(missing)}): {missing}")
