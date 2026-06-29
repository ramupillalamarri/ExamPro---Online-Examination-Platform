import fitz
import collections

def main():
    doc = fitz.open('ecet_2019_cse.pdf')
    counts = collections.Counter()
    for i in range(1, len(doc)):
        page = doc[i]
        try:
            info = page.get_image_info(hashes=True)
        except Exception:
            info = []
        for img in info:
            w = img.get('width')
            h = img.get('height')
            if w == 16 and h == 16:
                counts[img['digest'].hex()] += 1

    print('Total pages:', len(doc))
    print('Distinct 16x16 digests and counts:')
    for d, c in counts.most_common():
        print(d, c)

if __name__ == '__main__':
    main()
