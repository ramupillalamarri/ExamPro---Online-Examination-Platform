import json

transcript_path = r"C:\Users\ramup\.gemini\antigravity\brain\5bb35ba6-354d-4103-94c5-077feeb18acb\.system_generated\logs\transcript.jsonl"

with open(transcript_path, "r", encoding="utf-8") as f:
    for idx in range(5):
        line = f.readline()
        if not line:
            break
        try:
            data = json.loads(line)
            print(f"Line {idx}: keys = {list(data.keys())}")
            if "type" in data:
                print(f"  type = {data['type']}")
            if "source" in data:
                print(f"  source = {data['source']}")
            # Print a snippet of the content
            content = str(data.get("content", ""))
            print(f"  content length = {len(content)}")
            if len(content) > 0:
                print(f"  content snippet: {content[:200]}")
            # Print tool calls if any
            if "tool_calls" in data:
                print(f"  tool_calls = {data['tool_calls']}")
            print("-" * 50)
        except Exception as e:
            print(f"Error parsing line {idx}: {e}")
