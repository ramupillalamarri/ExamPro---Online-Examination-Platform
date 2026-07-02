import fitz
import base64
import os
import json
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

def test_ocr_for_pdf(pdf_name, page_num):
    print(f"=== Testing OCR on {pdf_name} Page {page_num+1} ===")
    doc = fitz.open(pdf_name)
    page = doc[page_num]
    
    # Render page to PNG
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    png_bytes = pix.tobytes("png")
    base64_image = base64.b64encode(png_bytes).decode("utf-8")
    
    client = Groq(api_key=api_key)
    
    prompt = """
This is a page from the TS ECET previous year question paper.
Please extract all questions and options from this image.
For each question on this page:
1. Identify the question number.
2. Extract the question text. If there is a mathematical formula, code block, or special notation, write it in clean, readable LaTeX or Markdown.
3. Extract the 4 options. They are numbered 1, 2, 3, 4. Format them as an array of strings in order.
4. Identify the correct option. In these papers, the correct option is shown in green or has a green checkmark next to it. The incorrect options are in black/red or have a red cross. Report the correct option index as 0-indexed (e.g., if option 1 is correct, correct_option_index is 0; if option 4 is correct, it is 3).

Return the output ONLY as a JSON array of objects with this schema:
[
  {
    "question_number": 1,
    "question_text": "...",
    "options": ["option 1", "option 2", "option 3", "option 4"],
    "correct_option_index": 2
  }
]

Do not include any markdown formatting like ```json or ```. Return ONLY the raw JSON string.
"""
    
    try:
        response = client.chat.completions.create(
            model="llama-3.2-11b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            temperature=0.0,
            max_tokens=1024
        )
        print("API Response:")
        print(response.choices[0].message.content)
    except Exception as e:
        print("Error:", e)
    print("-" * 50)

test_ocr_for_pdf("ecet_2022_cse.pdf", 2) # Page 3
test_ocr_for_pdf("ecet_2023_cse.pdf", 3) # Page 4
