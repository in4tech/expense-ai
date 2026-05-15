

import json
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import client, CHAT_MODELS
from app.services.embedding_service import create_embedding
from app.services.chat_service import hybrid_search_messages
from app.services.memory_service import hybrid_search_memories
from app.services.document_service import hybrid_search_document_chunks
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
    conversation_id
):
    embedding = await create_embedding(query)

    # ========================================
    # MESSAGES
    # ========================================
    vector_messages = await hybrid_search_messages(
        db=db,
        conversation_id=conversation_id,
        embedding=embedding
    )

    # ========================================
    # MEMORIES
    # ========================================
    vector_memories = await hybrid_search_memories(
        db=db,
        user_id=user_id,
        embedding=embedding,
        query=query,
    )

    # ========================================
    # DOCUMENTS
    # ========================================
    vector_documents = await hybrid_search_document_chunks(
        db=db,
        conversation_id=conversation_id,
        embedding=embedding,
        query=query,
    )

    # ========================================
    # MERGE
    # ========================================
    retrieved_context = []

    # MESSAGES
    [retrieved_context.append({
        "type": "message",
        "content": msg.content
    }) for msg in vector_messages]

    # MEMORIES
    [retrieved_context.append({
        "type": "memory",
        "content": memory["content"],
    }) for memory in vector_memories]

    # DOCUMENTS
    [retrieved_context.append({
        "type": "message",
        "content": msg.content
    }) for msg in vector_documents]

    # ========================================
    # DEDUPLICATE
    # ========================================
    seen = set()
    unique_context = []

    for item in retrieved_context:
        if item['content'] not in seen:
            seen.add(item['content'])

            unique_context.append(item)

    # ========================================
    # RERANK CONTEXT
    # ========================================
    reranked = await rerank_pipeline(
        query=query,
        chunks=unique_context,
        top_n=5
    )

    return reranked


