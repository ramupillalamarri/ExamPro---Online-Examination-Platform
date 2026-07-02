import os
from PIL import Image

for filename in os.listdir("scratch"):
    if filename.startswith("img_p25_") and filename.endswith((".jpeg", ".png")):
        filepath = os.path.join("scratch", filename)
        try:
            with Image.open(filepath) as img:
                print(f"{filename}: format={img.format}, size={img.size}, mode={img.mode}")
        except Exception as e:
            print(f"Error reading {filename}: {e}")
