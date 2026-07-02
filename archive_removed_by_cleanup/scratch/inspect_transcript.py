import json

transcript_path = r"C:\Users\ramup\.gemini\antigravity\brain\5bb35ba6-354d-4103-94c5-077feeb18acb\.system_generated\logs\transcript.jsonl"

print("Searching transcript...")
with open(transcript_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            tool_calls = data.get("tool_calls", [])
            
            for tc in tool_calls:
                name = tc.get("name", "")
                args = tc.get("args", {})
                
                # Check if it is write_to_file or replace_file_content
                if name in ["write_to_file", "replace_file_content"]:
                    target = args.get("TargetFile", "")
                    # If target matches some keywords
                    if any(k in target.lower() for k in ["pdf", "ocr", "question", "exam", "parse", "extract", "refined"]):
                        print(f"Line {idx}: Tool={name}, Target={target}")
                        code = args.get("CodeContent", "") or args.get("ReplacementContent", "")
                        if code:
                            # Show first 400 characters
                            print(f"  Code Snippet:\n{code[:600]}\n...")
                            print("-" * 60)
                
                # Also check run_command to see if python scripts were executed
                if name == "run_command":
                    cmd = args.get("CommandLine", "")
                    if any(k in cmd.lower() for k in ["python", "node", "parse", "pdf", "ocr", "question"]):
                        print(f"Line {idx}: Tool={name}, Cmd={cmd}")
                        print("-" * 60)
                            
        except Exception as e:
            pass
print("Done searching.")
