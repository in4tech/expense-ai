import pytesseract

def extract_text(image_path: str):
    return pytesseract.image_to_string(image_path)