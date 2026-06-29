import fitz

doc = fitz.open("ecet_2022_cse.pdf")
page = doc[1] # Page 2 (0-indexed page 1)
pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # Zoom 2x
pix.save("scratch/page2.png")
print("Saved scratch/page2.png successfully.")
