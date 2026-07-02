import fitz
import collections

def main():
    doc = fitz.open('ecet_2019_cse.pdf')
    counts = collections.Counter()
    sizes = collections.Counter()
    for i in range(1, len(doc)):
        page = doc[i]
        try:
            info = page.get_image_info(hashes=True)
        except Exception:
            info = []
        for img in info:
            w = img.get('width')
            h = img.get('height')
            digest = img['digest'].hex()
            if max(w,h) < 80:
                counts[(digest,w,h)] += 1
                sizes[(w,h)] += 1

    print('Total pages:', len(doc))
    print('\nDistinct small image sizes and counts:')
    for (w,h), c in sizes.most_common():
        print(f'{w}x{h}: {c}')

    print('\nTop distinct small-image digests:')
    for (d,w,h), c in counts.most_common()[:40]:
        print(d, f'{w}x{h}', c)

if __name__ == '__main__':
    main()
