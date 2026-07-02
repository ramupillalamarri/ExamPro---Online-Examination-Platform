import fitz
import base64
import os
import json
from groq import Groq

# Load environment variables
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

def test_ocr():
    doc = fitz.open("ecet_2019_cse.pdf")
    # Page 2 (0-indexed page 1)
    page = doc[1]
    
    # Render page to PNG
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # Zoom 2x for high quality OCR
    png_bytes = pix.tobytes("png")
    
    # Encode to base64
    base64_image = base64.b64encode(png_bytes).decode("utf-8")
    
    # Initialize Groq
    client = Groq(api_key=api_key)
    
    prompt = """
This is a page from the TS ECET 2019 Computer Science and Engineering previous year question paper.
Please extract all questions and options from this image. 
For each question on this page:
1. Identify the question number.
2. Extract the question text. If there is a mathematical formula or special notation, write it in clean LaTeX format (e.g. using $...$ or $$\\dots$$).
3. Extract the 4 options. They are numbered 1, 2, 3, 4. Format them as an array of strings in order.
4. Identify the correct option. In these official papers, the correct option is marked with a green checkmark icon or shown in green text, or has a specific indicator (usually a checkmark or green highlight). If option 3 is correct, the correct_option_index is 2 (0-indexed).

Return the output ONLY as a JSON array of objects with this schema:
[
  {
    "question_number": 1,
    "question_text": "...",
    "options": ["option 1", "option 2", "option 3", "option 4"],
    "correct_option_index": 2
  }
]

Make sure the JSON is valid and contain no other text before or after the JSON block.
"""
    
    print("Calling Groq Vision API...")
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
        
        print("API Call SUCCESS!")
        content = response.choices[0].message.content
        print("Response Content:")
        print(content)
        
        # Save response to a file
        with open("scratch/ocr_test_response.json", "w", encoding="utf-8") as f:
            f.write(content)
            
    except Exception as e:
        print("API Call FAILED:", e)

test_ocr()
