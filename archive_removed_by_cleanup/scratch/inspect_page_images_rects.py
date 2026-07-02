import fitz

doc = fitz.open("ecet_2022_cse.pdf")
page = doc[1] # Page 2

print("=== Images info on Page 2 ===")
info = page.get_image_info(hashes=True)
print(f"Number of images: {len(info)}")
for idx, img in enumerate(info):
    print(f"Image {idx}:")
    print(f"  bbox: {img.get('bbox')}")
    print(f"  width: {img.get('width')}")
    print(f"  height: {img.get('height')}")
    print(f"  size: {img.get('size')}")
    print(f"  digest: {img.get('digest')}")
    print(f"  xref: {img.get('xref')}")
