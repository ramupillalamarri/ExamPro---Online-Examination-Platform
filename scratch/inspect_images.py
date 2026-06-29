import fitz

doc = fitz.open("ecet_2019_cse.pdf")
page = doc[24] # Page 25
print("Page 25 image list:")
images = page.get_images(full=True)
print(f"Number of images: {len(images)}")
for idx, img in enumerate(images):
    xref = img[0]
    base_image = doc.extract_image(xref)
    image_bytes = base_image["image"]
    image_ext = base_image["ext"]
    print(f"  Image {idx}: xref={xref}, ext={image_ext}, size={len(image_bytes)} bytes")
    # Let's save the first few images to see what they are
    if idx < 3:
        with open(f"scratch/img_p25_{idx}.{image_ext}", "wb") as f:
            f.write(image_bytes)
        print(f"    Saved scratch/img_p25_{idx}.{image_ext}")
