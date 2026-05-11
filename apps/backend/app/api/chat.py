import os
from fastapi import APIRouter, HTTPException
from openai import OpenAI
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post('/chat')
async def chat(request: ChatRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured")

    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "Bạn là AI assistant thân thiện"
            },
            {
                "role" : "user",
                "content" : request.message
            }
        ]
    )

    return {
        "reply" : response.choices[0].message.content
    }
