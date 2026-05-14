

import json
from openai import OpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.services.embedding_service import create_embedding
from app.services.chat_service import keyboard_search_messages, search_similar_messages
from app.services.memory_service import search_memories
from apps.backend.app.services.document_service import keyword_search_chunks, search_document_chunks
from apps.backend.app.services.rerank_service import rerank_pipeline


client = OpenAI(settings.OPENAI_API_KEY)

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
        model="gpt-4.1-mini",
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

    vector_messages = await search_similar_messages(
        db=db,
        conversation_id=conversation_id,
        embedding=embedding
    )

    keyboard_messages = await keyboard_search_messages(
        db=db,
        conversation_id=conversation_id,
        query=query
    )

    # ========================================
    # MEMORIES
    # ========================================

    vector_memories = await search_memories(
        db=db,
        user_id=user_id,
        embedding=embedding,
        limit=5
    )

    # ========================================
    # DOCUMENTS
    # ========================================

    vector_documents = await search_document_chunks(
        db=db,
        embedding=embedding,
        conversation_id=conversation_id,
        limit=5
    )

    keyboard_documents = await keyword_search_chunks(
        db=db,
        query=query,
        conversation_id=conversation_id,
        limit=5
    )

    # ========================================
    # MERGE
    # ========================================
    retrieved_context = []

    [retrieved_context.append({
        "type": "message",
        "content": msg.content
    }) for msg in vector_messages]

    [retrieved_context.append({
        "type": "message",
        "content": row.content
    }) for row in keyboard_messages]

    [retrieved_context.append({
        "type": "message",
        "content": msg.content
    }) for msg in vector_memories]

    [retrieved_context.append({
        "type": "message",
        "content": msg.content
    }) for msg in vector_documents]

    [retrieved_context.append({
        "type": "message",
        "content": row.content
    }) for row in keyboard_documents]

    # ========================================
    # DEDUPLICATE
    # ========================================

    seen = set()
    unique_context = []

    for item in retrieved_context:
        if item['content'] not in seen:
            seen.add(item['content'])

            unique_context.append(item)

    print(unique_context)
    reranked = await rerank_pipeline(
        query=query,
        chunks=unique_context,
        top_n=5
    )

    return reranked


