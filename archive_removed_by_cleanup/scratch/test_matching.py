import asyncio
import os
import fitz
from winrt.windows.storage import StorageFile, FileAccessMode
from winrt.windows.graphics.imaging import BitmapDecoder
from winrt.windows.media.ocr import OcrEngine

def get_line_bbox(line):
    words = list(line.words)
    if not words:
        return None
    min_x = min(w.bounding_rect.x for w in words)
    min_y = min(w.bounding_rect.y for w in words)
    max_x = max(w.bounding_rect.x + w.bounding_rect.width for w in words)
    max_y = max(w.bounding_rect.y + w.bounding_rect.height for w in words)
    return (min_x, min_y, max_x, max_y)

async def main():
    pdf_path = "ecet_2022_cse.pdf"
    doc = fitz.open(pdf_path)
    page_num = 1 # Page 2
    page = doc[page_num]
    
    # Render page to PNG at 2x zoom
    zoom = 2
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
    image_path = os.path.abspath("scratch/page2_temp.png")
    pix.save(image_path)
    
    # Run OCR
    file = await StorageFile.get_file_from_path_async(image_path)
    stream = await file.open_async(FileAccessMode.READ)
    decoder = await BitmapDecoder.create_async(stream)
    software_bitmap = await decoder.get_software_bitmap_async()
    
    engine = OcrEngine.try_create_from_user_profile_languages()
    result = await engine.recognize_async(software_bitmap)
    
    # Extract 16x16 icons from PDF page
    img_info = page.get_image_info(hashes=True)
    icons = []
    for img in img_info:
        w = img.get("width")
        h = img.get("height")
        if w == 16 and h == 16:
            icons.append(img)
            
    print(f"Total icons found in PDF: {len(icons)}")
    
    # Let's find OCR lines that look like options (start with 1., 2., 3., 4. or are just numbers)
    # We will match each icon to the closest OCR line in vertical position
    matches = []
    for icon in icons:
        # Icon coordinate in PDF
        bbox_pdf = icon["bbox"]
        # Scale to PNG coordinate
        icon_y = (bbox_pdf[1] + bbox_pdf[3]) / 2 * zoom
        icon_x = (bbox_pdf[0] + bbox_pdf[2]) / 2 * zoom
        
        # Find closest OCR line
        closest_line = None
        min_dist = 999999
        for line in result.lines:
            line_bbox = get_line_bbox(line)
            if not line_bbox:
                continue
            line_y = (line_bbox[1] + line_bbox[3]) / 2
            # Bounding box of line covers the text. The icon is usually to the left.
            # So we check if y coordinate is close
            dist_y = abs(line_y - icon_y)
            if dist_y < min_dist:
                min_dist = dist_y
                closest_line = line
                
        # The correct digest for 2022 is '918813cb36' (or starts with 918813cb36)
        is_correct = icon["digest"].hex().startswith("918813cb36")
        
        matches.append({
            "icon_x": icon_x,
            "icon_y": icon_y,
            "digest": icon["digest"].hex()[:10],
            "is_correct": is_correct,
            "closest_line_text": closest_line.text if closest_line else "None",
            "min_dist": min_dist
        })
        
    print("\n=== Matching Results ===")
    for m in matches:
        print(f"Icon at Y={m['icon_y']:.1f}: digest={m['digest']}, is_correct={m['is_correct']}")
        print(f"  Matched Line (dist={m['min_dist']:.1f}): '{m['closest_line_text']}'")
        
    # Clean up temp image
    if os.path.exists(image_path):
        os.remove(image_path)

if __name__ == "__main__":
    asyncio.run(main())
