from app.db.session import client, MODELS

async def create_embedding(text: str):
    response = await client.embeddings.create(
        model=MODELS,
        input=text
    )

    return response.data[0].embedding
