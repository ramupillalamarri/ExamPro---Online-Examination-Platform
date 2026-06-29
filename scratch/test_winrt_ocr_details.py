import asyncio
import os
from winrt.windows.storage import StorageFile, FileAccessMode
from winrt.windows.graphics.imaging import BitmapDecoder
from winrt.windows.media.ocr import OcrEngine

async def main():
    image_path = os.path.abspath("scratch/page2.png")
    
    file = await StorageFile.get_file_from_path_async(image_path)
    stream = await file.open_async(FileAccessMode.READ)
    decoder = await BitmapDecoder.create_async(stream)
    software_bitmap = await decoder.get_software_bitmap_async()
    
    engine = OcrEngine.try_create_from_user_profile_languages()
    if not engine:
        print("Error: Could not create OCR engine.")
        return
        
    result = await engine.recognize_async(software_bitmap)
    
    print(f"OCR lines found: {len(result.lines)}")
    # Print the first 10 lines with their text and bounding boxes
    for idx, line in enumerate(list(result.lines)[:15]):
        # Bounding box is in line.rect
        rect = line.rect
        print(f"Line {idx}: text='{line.text}'")
        print(f"  rect: x={rect.x}, y={rect.y}, width={rect.width}, height={rect.height}")

if __name__ == "__main__":
    asyncio.run(main())
