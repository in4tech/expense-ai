from fastapi import APIRouter, UploadFile, File

from app.services.receipt_service import process_receipt

router = APIRouter()

@router.post("/upload")
async def upload_receipt(
    file: UploadFile = File(...)
):
    result = await process_receipt(file)

    return result