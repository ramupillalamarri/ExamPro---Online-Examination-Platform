import fitz

doc = fitz.open("ecet_2022_cse.pdf")
page = doc[1] # Page 2
info = page.get_image_info(hashes=True)

# Image 0 is the question text
img0 = info[0]
bbox0 = img0["bbox"]
print(f"Cropping Image 0 at bbox: {bbox0}")
pix0 = page.get_pixmap(clip=bbox0, matrix=fitz.Matrix(2, 2))
pix0.save("scratch/q1_text_crop.png")
print("Saved scratch/q1_text_crop.png")

# Image 2 is Option 1 text
img2 = info[2]
bbox2 = img2["bbox"]
print(f"Cropping Image 2 at bbox: {bbox2}")
pix2 = page.get_pixmap(clip=bbox2, matrix=fitz.Matrix(2, 2))
pix2.save("scratch/q1_opt1_crop.png")
print("Saved scratch/q1_opt1_crop.png")
