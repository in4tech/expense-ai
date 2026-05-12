import os

from openai import AsyncOpenAI

MODELS = "text-embedding-3-small"

async def create_embedding(text: str):
    api_key = os.getenv("OPENAI_API_KEY")
    client = AsyncOpenAI(api_key=api_key)
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )

    return response.data[0].embedding
