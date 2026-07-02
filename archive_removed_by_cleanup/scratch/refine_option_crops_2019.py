import fitz
import json
import os

def base64_encode(b):
    import base64
    return base64.b64encode(b).decode('ascii')

def main():
    pdf = 'ecet_2019_cse.pdf'
    js_in = 'scratch/cse_2019_questions.json'
    js_out = 'scratch/cse_2019_questions_refined.json'
    if not os.path.exists(pdf):
        print('PDF missing:', pdf); return
    if not os.path.exists(js_in):
        print('Input JSON missing:', js_in); return

    with open(js_in, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    doc = fitz.open(pdf)
    headers = []
    import re
    for page_idx in range(1, len(doc)):
        page = doc[page_idx]
        rects = page.search_for('Question Number')
        for rect in rects:
            mtext = page.get_text('text', clip=fitz.Rect(rect.x0, rect.y0-6, page.rect.width, rect.y1+6)).strip().replace('\n',' ')
            m = re.search(r'Question Number\s*:\s*(\d+)', mtext)
            if m:
                qnum = int(m.group(1))
                headers.append({'q_num': qnum, 'page_idx': page_idx, 'y': rect.y0})

    qmap = {}
    for h in headers:
        q = h['q_num']; pos = (h['page_idx'], h['y'])
        if q not in qmap or pos < (qmap[q]['page_idx'], qmap[q]['y']):
            qmap[q] = h
    headers = [qmap[q] for q in sorted(qmap.keys())]

    q_ranges = {}
    for i,h in enumerate(headers):
        qnum = h['q_num']
        start = (h['page_idx'], h['y'])
        if i+1 < len(headers):
            nxt = headers[i+1]
            end = (nxt['page_idx'], nxt['y'])
        else:
            end = (len(doc)-1, doc[-1].rect.height)
        q_ranges[qnum] = {'start': start, 'end': end, 'page_idx': h['page_idx'], 'y': h['y']}

    updated = 0
    for q in questions:
        qnum = q.get('question_number')
        r = q_ranges.get(qnum)
        if not r:
            continue
        page = doc[r['page_idx']]
        header_y = r['y']
        y0 = header_y + 24
        y1 = min(page.rect.height - 24, y0 + 400)
        if y1 <= y0:
            continue
        # include options earlier and include left-side margin so answer markers are visible
        options_start = y0 + (y1 - y0) * 0.50
        options_end = y1
        if options_end <= options_start:
            options_start = y0 + (y1 - y0) * 0.5

        band_h = max(12, (options_end - options_start) / 4.0)
        # include left margin to capture answer markers/icons
        x0 = max(20, page.rect.width * 0.08)
        x1 = page.rect.width - 30

        opt_imgs = [None, None, None, None]
        for i in range(4):
            oy0 = options_start + i * band_h
            oy1 = oy0 + band_h
            bbox = fitz.Rect(x0, oy0, x1, min(oy1, page.rect.height - 10))
            try:
                pix = page.get_pixmap(clip=bbox, matrix=fitz.Matrix(2,2))
                png = pix.tobytes('png')
                opt_imgs[i] = 'data:image/png;base64,' + base64_encode(png)
            except Exception as e:
                opt_imgs[i] = None

        q['option_images'] = opt_imgs
        updated += 1

    print('Updated option images for', updated, 'questions')
    with open(js_out, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2)
    os.replace(js_out, js_in)
    print('Wrote refined JSON to', js_in)

if __name__ == '__main__':
    main()
