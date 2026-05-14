from openai import AsyncOpenAI

from app.core.config import settings

MODELS = "text-embedding-3-small"

async def create_embedding(text: str):
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )

    return response.data[0].embedding
