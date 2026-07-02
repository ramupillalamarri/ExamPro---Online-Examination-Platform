import fitz

doc = fitz.open("ecet_2022_cse.pdf")
page = doc[1] # Page 2
info = page.get_image_info(hashes=True)
print(f"Number of images on Page 2: {len(info)}")
for idx, img in enumerate(info[:3]):
    print(f"Image {idx}:")
    print(f"  keys: {list(img.keys())}")
    print(f"  xref: {img.get('xref')}")
    # Check if there is an 'image' key or 'size'
    print(f"  size: {img.get('size')}")
    # Let's see if we can get the image using page.get_images()
    # page.get_images() returns a list of tuples: (xref, smask, width, height, bpc, colorspace, ...)
    # If it is inline, how do we extract it?
    # PyMuPDF has page.get_image_rects(item) or we can extract using fitz.Pixmap(doc, xref)
    # Let's check page.get_images()
print("get_images() list:")
print(page.get_images())
