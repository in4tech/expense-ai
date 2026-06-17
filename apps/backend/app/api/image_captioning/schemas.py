from pydantic import BaseModel


class CaptionPredictResponse(BaseModel):
    caption: str
