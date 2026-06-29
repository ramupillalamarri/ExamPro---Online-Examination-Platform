import asyncio
import os
import fitz
import json
from winrt.windows.storage import StorageFile, FileAccessMode
from winrt.windows.graphics.imaging import BitmapDecoder
from winrt.windows.media.ocr import OcrEngine
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

async def get_page_ocr(page, page_num):
    # Render page to PNG
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    img_path = f"scratch/temp_p{page_num}.png"
    pix.save(img_path)
    
    # Run Windows OCR
    file = await StorageFile.get_file_from_path_async(os.path.abspath(img_path))
    stream = await file.open_async(FileAccessMode.READ)
    decoder = await BitmapDecoder.create_async(stream)
    software_bitmap = await decoder.get_software_bitmap_async()
    engine = OcrEngine.try_create_from_user_profile_languages()
    result = await engine.recognize_async(software_bitmap)
    
    # Clean up
    os.remove(img_path)
    return result.text

async def main():
    doc = fitz.open("ecet_2022_cse.pdf")
    print("Running OCR on pages 2 to 5 of ecet_2022_cse.pdf...")
    
    # Get OCR for pages 2 to 5
    ocr_texts = []
    for page_idx in range(1, 5): # Pages 2, 3, 4, 5
        text = await get_page_ocr(doc[page_idx], page_idx + 1)
        ocr_texts.append(f"--- Page {page_idx + 1} OCR ---\n{text}")
        
    continuous_ocr = "\n\n".join(ocr_texts)
    print("\n=== Continuous OCR (Snippet) ===")
    print(continuous_ocr[:1000])
    
    # Pre-computed correct options from our global icon hash list for Q1 to Q10:
    # Q1: 3, Q2: 2, Q3: 4, Q4: 3, Q5: 2, Q6: 2, Q7: 1, Q8: 3, Q9: 4, Q10: 3
    # Let's verify if Q2 is indeed 2 (we will check the options in the OCR output)
    correct_options = {
        1: 3, # Option 3
        2: 2, # Option 2
        3: 4, # Option 4
        4: 3, # Option 3
        5: 2, # Option 2
    }
    
    client = Groq(api_key=api_key)
    prompt = f"""
This is a continuous stream of OCR text from TS ECET 2022.
Please extract questions 1 to 5 and their options from this text.
Clean up the OCR typos. If a question contains mathematical formulas, format them in clean, standard LaTeX (e.g. matrices, fractions, derivatives, integrals).
For each question:
1. Set the correct question_number.
2. Formulate the question_text.
3. Formulate the options as a list of 4 strings in order.
4. Set the correct_option_index (0-indexed) using this pre-computed answer key:
{json.dumps(correct_options)}

Return the output ONLY as a JSON array of objects matching this schema:
[
  {{
    "question_number": 1,
    "question_text": "...",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correct_option_index": 2
  }}
]

Return ONLY the raw JSON string without any formatting.
OCR Text:
{continuous_ocr}
"""
    print("\nCalling Groq API to parse questions...")
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0
        )
        print("\n=== Groq Parse Success ===")
        print(response.choices[0].message.content)
    except Exception as e:
        print("Groq Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
