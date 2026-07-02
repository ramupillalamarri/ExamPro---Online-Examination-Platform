import json
import os

filepath = r"C:\Users\ramup\.gemini\antigravity\brain\5bb35ba6-354d-4103-94c5-077feeb18acb\scratch\parsed_questions.json"

if not os.path.exists(filepath):
    print("File does not exist!")
else:
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"File loaded successfully. Number of pages/keys: {len(data)}")
    print("Keys:")
    print(list(data.keys())[:20])
    
    total_q = 0
    for k, v in data.items():
        total_q += len(v)
    print(f"Total questions across all pages in this file: {total_q}")
    
    # Check if there are other files in the directory
    dirpath = os.path.dirname(filepath)
    print(f"Files in {dirpath}:")
    print(os.listdir(dirpath))
