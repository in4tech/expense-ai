

import json
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import client, CHAT_MODELS
from app.services.embedding_service import create_embedding
from app.services.chat_service import hybrid_search_messages
from app.services.memory_service import hybrid_search_memories
from app.services.document_service import hybrid_search_document_chunks
from app.db.uuid_columns import as_uuid
from app.services.rerank_service import rerank_pipeline

async def compress_context(
    query,
    retrieved_context
):
    context_text = ""

    for item in retrieved_context:
        context_text += f"""
        [{item['type']}]

        {item['content']}
        
        """

    response = await client.chat.completions.create(
        model=CHAT_MODELS,
        response_format={
            "type": "json_object"
        },
        messages=[
            {
                "role": "system",
                "content": f"""
                You are a context compression engine.

                Your task:
                - exact ONLY information relevant to user query
                - remove irrelevant details
                - preserve import facts
                - preserve technical details
                - preserve code/API names

                Return JSON"
                {
                    "compressed_text": "..."
                } 
                """
            },
            {
                "role": "user",
                "content": f"""
                USER QUERY:

                {query}

                RETRIEVED CONTEXT:

                {context_text}
                
                """
            }
        ]
    )

    result = json.loads(response.choices[0].message.content)
    return result["compressed_text"]



async def unified_retrieval(
    db: AsyncSession,
    query,
    user_id,
    conversation_id,
    *,
    messages_limit: int = 3,
    memories_limit: int = 3,
    documents_limit: int = 8,
    top_n: int = 10,
):
    user_id = as_uuid(user_id)
    conversation_id = as_uuid(conversation_id)
    embedding = await create_embedding(query)

    # ========================================
    # MESSAGES
    # ========================================
    vector_messages = await hybrid_search_messages(
        db=db,
        query=query,
        conversation_id=conversation_id,
        embedding=embedding,
        limit=messages_limit,
    )

    # ========================================
    # MEMORIES
    # ========================================
    vector_memories = await hybrid_search_memories(
        db=db,
        user_id=user_id,
        embedding=embedding,
        query=query,
        limit=memories_limit,
    )

    # ========================================
    # DOCUMENTS (uploaded PDFs for this conversation)
    # ========================================
    vector_documents = await hybrid_search_document_chunks(
        db=db,
        conversation_id=conversation_id,
        embedding=embedding,
        query=query,
        limit=documents_limit,
    )

    # ========================================
    # MERGE — documents first so a non-Cohere fallback rerank (which just
    # slices [:top_n]) still keeps uploaded-PDF chunks instead of discarding
    # them behind messages + memories.
    # ========================================
    retrieved_context: list[dict] = []

    for chunk in vector_documents:
        retrieved_context.append({
            "type": "document",
            "content": chunk.content,
        })

    for memory in vector_memories:
        retrieved_context.append({
            "type": "memory",
            "content": memory["content"],
        })

    for msg in vector_messages:
        retrieved_context.append({
            "type": "message",
            "content": msg.content,
        })

    # ========================================
    # DEDUPLICATE (preserve first occurrence — documents survive)
    # ========================================
    seen: set[str] = set()
    unique_context: list[dict] = []
    for item in retrieved_context:
        content = (item.get("content") or "").strip()
        if not content or content in seen:
            continue
        seen.add(content)
        unique_context.append(item)

    # ========================================
    # RERANK
    # ========================================
    reranked = await rerank_pipeline(
        query=query,
        chunks=unique_context,
        top_n=top_n,
    )

    return reranked


