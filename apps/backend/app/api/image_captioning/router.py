import asyncio

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.api.image_captioning.schemas import CaptionPredictResponse
from app.services.image_caption_service import generate_caption

router = APIRouter()


@router.post("/predict", response_model=CaptionPredictResponse)
async def predict_caption(file: UploadFile = File(...)):
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=422, detail="Uploaded file is empty")

    try:
        caption = await asyncio.to_thread(generate_caption, content)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return CaptionPredictResponse(caption=caption)
