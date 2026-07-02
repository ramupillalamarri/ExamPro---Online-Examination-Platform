import os
from groq import Groq

def load_env():
    if os.path.exists(".env.local"):
        with open(".env.local", "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    parts = line.split("=")
                    if len(parts) >= 2:
                        key = parts[0].strip()
                        val = parts[1].strip().strip('"').strip("'")
                        os.environ[key] = val

load_env()
api_key = os.environ.get("GROQ_API_KEY")

client = Groq(api_key=api_key)
models = client.models.list()
print("Available Groq Models:")
for m in models.data:
    print(f"- {m.id}")
