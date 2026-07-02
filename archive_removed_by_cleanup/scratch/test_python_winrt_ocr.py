import asyncio
import os
from winrt.windows.storage import StorageFile, FileAccessMode
from winrt.windows.graphics.imaging import BitmapDecoder
from winrt.windows.media.ocr import OcrEngine

async def main():
    image_path = os.path.abspath("scratch/page2.png")
    print(f"Loading image: {image_path}")
    
    # Open file
    file = await StorageFile.get_file_from_path_async(image_path)
    # Open stream in Read mode
    stream = await file.open_async(FileAccessMode.READ)
    
    # Create decoder
    decoder = await BitmapDecoder.create_async(stream)
    # Get software bitmap
    software_bitmap = await decoder.get_software_bitmap_async()
    
    # Create OCR engine
    engine = OcrEngine.try_create_from_user_profile_languages()
    if not engine:
        print("Error: Could not create OCR engine.")
        return
        
    print("Running Windows OCR...")
    result = await engine.recognize_async(software_bitmap)
    print("=== OCR Result ===")
    print(result.text)

if __name__ == "__main__":
    asyncio.run(main())
