import fitz

doc = fitz.open("ecet_2019_cse.pdf")
print(f"Total pages: {len(doc)}")
# Let's find pages that have the word "Question" or anything like that but also actual questions.
# We'll write a text file with the contents of pages 25 to 30.
with open("scratch/page_text_25_30.txt", "w", encoding="utf-8") as f:
    for idx in range(24, 30):
        f.write(f"=== Page {idx+1} ===\n")
        f.write(doc[idx].get_text())
        f.write("\n" + "="*50 + "\n")

# Let's also check if there are images on these pages.
for idx in range(24, 30):
    page = doc[idx]
    image_list = page.get_images()
    print(f"Page {idx+1} has {len(image_list)} images")
