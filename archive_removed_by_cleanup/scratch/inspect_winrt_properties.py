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
    result = await engine.recognize_async(software_bitmap)
    
    line = list(result.lines)[0]
    print("OcrLine properties/methods:")
    print(dir(line))
    
    # Let's see what is inside line.words
    if len(list(line.words)) > 0:
        word = list(line.words)[0]
        print("OcrWord properties/methods:")
        print(dir(word))

if __name__ == "__main__":
    asyncio.run(main())
