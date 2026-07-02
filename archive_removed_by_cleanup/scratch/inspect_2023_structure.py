import fitz

def inspect_structure(pdf_path):
    doc = fitz.open(pdf_path)
    print(f"PDF: {pdf_path}, Total Pages: {len(doc)}")
    
    total_q_imgs = 0
    total_opt_imgs = 0
    total_icons = 0
    
    for page_num in range(1, len(doc)):
        page = doc[page_num]
        info = page.get_image_info(hashes=True)
        
        page_icons = []
        page_q_imgs = []
        page_opt_imgs = []
        
        for img in info:
            w = img.get("width")
            h = img.get("height")
            bbox = img.get("bbox")
            if not bbox:
                continue
            x_min = bbox[0]
            
            if w == 16 and h == 16:
                page_icons.append(img)
            elif x_min < 50:
                page_q_imgs.append(img)
            else:
                page_opt_imgs.append(img)
                
        q_count = len(page_q_imgs)
        opt_count = len(page_opt_imgs)
        icon_count = len(page_icons)
        
        total_q_imgs += q_count
        total_opt_imgs += opt_count
        total_icons += icon_count
        
        # Log pages that are anomalous or have questions
        if q_count > 0 or opt_count > 0 or icon_count > 0:
            expected_opts = q_count * 4
            status = "OK" if opt_count == expected_opts and icon_count == expected_opts else "MISMATCH"
            print(f"Page {page_num+1}: Q-Imgs: {q_count}, Opt-Imgs: {opt_count} (Expected: {expected_opts}), Icons: {icon_count} (Expected: {expected_opts}) - {status}")
            
    print("=" * 50)
    print(f"Totals - Q-Imgs: {total_q_imgs}, Opt-Imgs: {total_opt_imgs}, Icons: {total_icons}")

inspect_structure("ecet_2023_cse.pdf")
inspect_structure("ecet_2022_cse.pdf")
