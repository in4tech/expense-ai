import cohere

from app.core.config import settings

_co_client: cohere.Client | None = None

def _get_cohere_client() -> cohere.Client | None:
    global _co_client
    key = (settings.COHERE_API_KEY or "").strip()
    if not key:
        return None
    if _co_client is None:
        _co_client = cohere.Client(key)
    return _co_client


async def rerank_pipeline(
    query,
    chunks,
    top_n=5,
):
    if not chunks:
        return []

    client = _get_cohere_client()
    if client is None:
        return list(chunks)[:top_n]

    documents = [chunk.content for chunk in chunks]
    response = await client.rerank(
        model="rerank-english-v3.0",
        query=query,
        documents=documents,
        top_n=top_n,
    )

    return [chunks[result.index] for result in response.results]


rerank_documents = rerank_pipeline