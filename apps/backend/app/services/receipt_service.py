import os
import shutil

from app.ai.ocr.extractor import extract_text
from app.ai.ocr.parser import parse_receipt

from app.db.session import SessionLocal
from app.db.models.receipt import Receipt


UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


async def process_receipt(file):
    # Save uploaded file
    file_path = f"{UPLOAD_DIR}/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # OCR extract text
    ocr_text = extract_text(file_path)

    # Parse receipt data
    parsed_data = parse_receipt(ocr_text)

    # Save to database
    async with SessionLocal() as db:
        receipt = Receipt(
            merchant=parsed_data.get("merchant"),
            total=parsed_data.get("total"),
            category=parsed_data.get("category")
        )

        db.add(receipt)

        await db.commit()

        await db.refresh(receipt)

    return {
        "id": receipt.id,
        "ocr_text": ocr_text,
        "parsed_data": {
            "merchant": receipt.merchant,
            "total": receipt.total,
            "category": receipt.category
        }
    }