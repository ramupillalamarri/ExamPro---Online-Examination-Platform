import asyncio
import os
import fitz
from winrt.windows.storage import StorageFile, FileAccessMode
from winrt.windows.graphics.imaging import BitmapDecoder
from winrt.windows.media.ocr import OcrEngine

async def main():
    doc = fitz.open("ecet_2019_cse.pdf")
    pages = [20, 21] # Page 21, 22
    for p in pages:
        page = doc[p]
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_path = f"scratch/temp_{p}.png"
        pix.save(img_path)
        file = await StorageFile.get_file_from_path_async(os.path.abspath(img_path))
        stream = await file.open_async(FileAccessMode.READ)
        decoder = await BitmapDecoder.create_async(stream)
        software_bitmap = await decoder.get_software_bitmap_async()
        engine = OcrEngine.try_create_from_user_profile_languages()
        result = await engine.recognize_async(software_bitmap)
        print(f"=== Page {p+1} Raw OCR ===")
        print(result.text)
        print("="*50)
        os.remove(img_path)

if __name__ == "__main__":
    asyncio.run(main())
