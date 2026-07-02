import fitz

def debug_page_alignment(pdf_path, page_num):
    doc = fitz.open(pdf_path)
    page = doc[page_num - 1]
    info = page.get_image_info(hashes=True)
    
    print(f"--- Bounding Boxes for Page {page_num} of {pdf_path} ---")
    
    icons = []
    others = []
    
    for idx, img in enumerate(info):
        w = img.get("width")
        h = img.get("height")
        bbox = img.get("bbox")
        if not bbox:
            continue
        x_min, y_min, x_max, y_max = bbox
        
        if w == 16 and h == 16:
            icons.append(img)
        else:
            others.append(img)
            
    # Sort icons and others by y-coordinate
    icons.sort(key=lambda x: (x["bbox"][1], x["bbox"][0]))
    others.sort(key=lambda x: (x["bbox"][1], x["bbox"][0]))
    
    print(f"Icons found: {len(icons)}")
    for idx, icon in enumerate(icons):
        print(f"  Icon {idx+1}: bbox={icon['bbox']}, digest={icon['digest'].hex()[:10]}")
        
    print(f"Other images found: {len(others)}")
    for idx, img in enumerate(others):
        w = img.get("width")
        h = img.get("height")
        print(f"  Img {idx+1}: size=({w}x{h}), bbox={img['bbox']}")
        
    # Let's also print OCR text blocks with coordinates if possible
    print("\n--- OCR Text Blocks ---")
    text_instances = page.get_text("blocks")
    for idx, block in enumerate(text_instances):
        x0, y0, x1, y1, text, block_no, block_type = block
        text_clean = text.replace('\n', ' ').strip()
        if text_clean:
            print(f"  Block {idx+1}: bbox=({x0:.1f}, {y0:.1f}, {x1:.1f}, {y1:.1f}), text='{text_clean[:60]}'")

debug_page_alignment("ecet_2023_cse.pdf", 3)
