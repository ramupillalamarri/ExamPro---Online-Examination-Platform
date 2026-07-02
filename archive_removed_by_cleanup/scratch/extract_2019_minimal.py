import fitz
import json
import re
import base64
import os

def get_base64_crop(page, bbox, zoom=2):
    try:
        pix = page.get_pixmap(clip=bbox, matrix=fitz.Matrix(zoom, zoom))
        return 'data:image/png;base64,' + base64.b64encode(pix.tobytes('png')).decode('utf-8')
    except Exception as e:
        print('Crop error:', e)
        return None

def main():
    pdf = 'ecet_2019_cse.pdf'
    out = 'scratch/cse_2019_questions_extracted.json'
    if not os.path.exists(pdf):
        print('PDF not found:', pdf)
        return

    doc = fitz.open(pdf)
    headers = []
    for page_idx in range(1, len(doc)):
        page = doc[page_idx]
        rects = page.search_for('Question Number')
        for rect in rects:
            clip = fitz.Rect(rect.x0, rect.y0 - 6, page.rect.width, rect.y1 + 6)
            line = page.get_text('text', clip=clip).strip().replace('\n', ' ')
            m = re.search(r'Question Number\s*:\s*(\d+)', line)
            if m:
                qnum = int(m.group(1))
                headers.append({'q_num': qnum, 'page_idx': page_idx, 'y': rect.y0, 'text': line})

    # Deduplicate keep earliest
    qmap = {}
    for h in headers:
        q = h['q_num']
        pos = (h['page_idx'], h['y'])
        if q not in qmap or pos < (qmap[q]['page_idx'], qmap[q]['y']):
            qmap[q] = h

    headers = [qmap[q] for q in sorted(qmap.keys())]
    print(f'Found headers: {len(headers)}')
    if len(headers) != 200:
        print('Warning: expected 200 headers, found', len(headers))

    # Build ranges
    q_ranges = {}
    for i, h in enumerate(headers):
        qnum = h['q_num']
        start = (h['page_idx'], h['y'])
        if i+1 < len(headers):
            nxt = headers[i+1]
            end = (nxt['page_idx'], nxt['y'])
        else:
            end = (len(doc)-1, doc[-1].rect.height)
        q_ranges[qnum] = {'start': start, 'end': end, 'page_idx': h['page_idx'], 'y': h['y']}

    questions = []
    for q in range(1, 201):
        r = q_ranges.get(q)
        if not r:
            # placeholder
            questions.append({'question_number': q, 'question_text': '', 'options': ['', '', '', ''], 'correct_option_index': 0, 'question_image': None, 'option_images': [None, None, None, None]})
            continue

        page = doc[r['page_idx']]
        header_y = r['y']
        # conservative crop: start a bit below header, end before bottom to avoid answer marks
        y0 = header_y + 24
        y1 = min(page.rect.height - 24, y0 + 400)  # limit height to avoid spanning into next question
        # widen left margin to avoid embedded answer markers/icons near the left edge
        x0 = 80
        x1 = page.rect.width - 80
        bbox = fitz.Rect(x0, y0, x1, y1)
        img_b64 = get_base64_crop(page, bbox)

        questions.append({
            'question_number': q,
            'question_text': '',
            'options': ['', '', '', ''],
            'correct_option_index': 0,
            'question_image': img_b64,
            'option_images': [None, None, None, None]
        })

    with open(out, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2)

    print('Saved', out)

if __name__ == '__main__':
    main()
