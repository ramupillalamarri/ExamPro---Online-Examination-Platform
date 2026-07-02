import asyncio
from ocr_and_extract_papers_v2 import extract_exam_pdf, load_env

def main():
    load_env()
    # Use an empty digest fallback; extraction code will still perform cropping even if icons are missing
    asyncio.run(extract_exam_pdf('ecet_2019_cse.pdf', '000000000000', 'scratch/cse_2019_questions.json'))

if __name__ == '__main__':
    main()
