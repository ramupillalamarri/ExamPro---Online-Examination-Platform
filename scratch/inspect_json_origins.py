import json

transcript_path = r"C:\Users\ramup\.gemini\antigravity\brain\5bb35ba6-354d-4103-94c5-077feeb18acb\.system_generated\logs\transcript.jsonl"

print("Searching transcript for JSON file origins...")
with open(transcript_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            tool_calls = data.get("tool_calls", [])
            for tc in tool_calls:
                name = tc.get("name", "")
                args = tc.get("args", {})
                target = args.get("TargetFile", "")
                if "parsed_questions" in target or "refined_questions" in target:
                    print(f"Line {idx}: Tool={name}, Target={target}")
                    code = args.get("CodeContent", "") or args.get("ReplacementContent", "")
                    if code:
                        print(f"  Length: {len(code)} characters")
                        print(f"  Snippet: {code[:300]}")
                        print("-" * 50)
        except Exception as e:
            pass
print("Done.")
