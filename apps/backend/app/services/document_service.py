from pypdf import PdfReader
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.document import DocumentChunk

def extract_pdf_text(file):
    reader = PdfReader(file)

    text = ""
    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text


def chunk_text(text, chunk_size=1000):
    chunks = []

    start = 0

    while start < len(text):
        end = start + chunk_size

        chunk = text[start:end]

        chunks.append(chunk)

        start = end

    return chunks


async def create_document_chunk(
    db: AsyncSession,
    conversation_id,
    content,
    embedding
):
    chunk = DocumentChunk(
        conversation_id=conversation_id,
        content=content,
        embedding=embedding
    )

    db.add(chunk)

    await db.commit()
    await db.refresh(chunk)

    return chunk


async def search_document_chunks(
    db: AsyncSession,
    conversation_id: int,
    embedding,
    limit=5
):
    result = await db.execute(
        select(DocumentChunk)
        .filter(DocumentChunk.conversation_id == conversation_id)
        .order_by(DocumentChunk.embedding.cosine_distance(
            embedding
        ))
        .limit(limit)
    )

    return result.scalars().all()