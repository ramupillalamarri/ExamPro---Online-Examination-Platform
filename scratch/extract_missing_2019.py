import asyncio
import os
import fitz
import base64
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

async def main():
    doc = fitz.open("ecet_2019_cse.pdf")
    missing_pages = {
        46: 20, # Page 21 (0-indexed 20)
        48: 21, # Page 22 (0-indexed 21)
        192: 78 # Page 79 (0-indexed 78)
    }
    
    client = Groq(api_key=api_key)
    
    for q_num, page_idx in missing_pages.items():
        print(f"=== Extracting Q{q_num} from Page {page_idx+1} ===")
        page = doc[page_idx]
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_path = os.path.abspath(f"scratch/missing_{q_num}.png")
        pix.save(img_path)
        
        # Run OCR
        file = await StorageFile.get_file_from_path_async(img_path)
        stream = await file.open_async(FileAccessMode.READ)
        decoder = await BitmapDecoder.create_async(stream)
        software_bitmap = await decoder.get_software_bitmap_async()
        
        engine = OcrEngine.try_create_from_user_profile_languages()
        result = await engine.recognize_async(software_bitmap)
        ocr_text = result.text
        
        # Call Groq to clean up and structure
        prompt = f"""
Here is raw OCR text of a page from the TS ECET 2019 question paper.
Please extract Question {q_num} and its 4 options from this text.
Determine the correct option from the context of the question (since we don't have the key directly, use your knowledge of engineering/science to identify the correct option, or if the OCR indicates a correct choice).
Format the output as a clean JSON object:
{{
  "question_number": {q_num},
  "question_text": "...",
  "options": ["option 1", "option 2", "option 3", "option 4"],
  "correct_option_index": 0
}}

Return ONLY the JSON string. Do not include any other text.
OCR Text:
{ocr_text}
"""
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0
            )
            print(response.choices[0].message.content)
            print("="*60)
        except Exception as e:
            print("Groq Error:", e)
            
        # Clean up temp image
        if os.path.exists(img_path):
            os.remove(img_path)

if __name__ == "__main__":
    asyncio.run(main())
