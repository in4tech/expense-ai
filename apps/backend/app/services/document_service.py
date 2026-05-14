from pypdf import PdfReader
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import client, CHAT_MODELS
from app.db.models.document import DocumentChunk

def extract_pdf_text(file):
    reader = PdfReader(file)

    pages = []

    for index, page in enumerate(reader.pages):
        text = page.extract_text()

        if text:
            pages.append({
                "page": index + 1,
                "text": text
            })

    return pages


def chunk_page_text(text, page, chunk_size=1000, overlap=200):
    chunks = []

    start = 0

    while start < len(text):
        end = start + chunk_size

        chunk = text[start:end]

        chunks.append({
            "content": chunk,
            "page": page
        })

        start = (chunk_size - overlap)

    return chunks


async def create_document_chunk(
    db: AsyncSession,
    conversation_id,
    content,
    embedding,
    page
):
    chunk = DocumentChunk(
        conversation_id=conversation_id,
        content=content,
        embedding=embedding,
        page=page
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


async def keyword_search_chunks(
    db: AsyncSession,
    query,
    conversation_id,
    limit=5,
):
    tsq = func.plainto_tsquery(query)
    result = await db.execute(
        select(DocumentChunk)
        .where(DocumentChunk.conversation_id == conversation_id)
        .where(DocumentChunk.search_vector.op("@@")(tsq))
        .order_by(desc(func.ts_rank(DocumentChunk.search_vector, tsq)))
        .limit(limit)
    )
    return result.scalars().all()

async def hybrid_search_document_chunks(
    db: AsyncSession,
    conversation_id: int,
    embedding,
    query,
    limit=5
):
    vector_chunks = await search_document_chunks(db, conversation_id, embedding, limit)
    keyword_chunks = await keyword_search_chunks(db, query, conversation_id, limit)
    return vector_chunks + keyword_chunks

async def summarize_pdf(text):
    truncated_text = text[:12000]

    response = await client.chat.completions.create(
        model=CHAT_MODELS,
        messages=[
            {
                "role": "system",
                "content": """
                You are a friendly AI Assistant.

                You are given a PDF file and you need to summarize the content of the file.

                Include the following information in the summary:
                - The main topics or sections of the document
                - The key points or insights from the document
                - The most important information or data from the document
                - The most important conclusions or recommendations from the document
                
                The summary should be in a short and concise manner.
                """
            },
            {
                "role": "user",
                "content": truncated_text
            }
        ]
    )

    return response.choices[0].message.content