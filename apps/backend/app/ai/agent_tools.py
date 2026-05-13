


from app.services.embedding_service import create_embedding
from app.services.document_service import keyword_search_chunks, search_document_chunks
from app.services.chat_service import get_messages
from app.services.web_search_service import search_web

async def hybrid_search_documents(
    db,
    query,
    conversation_id
):
    embbeding = await create_embedding(query)

    vector_results = await search_document_chunks(
        db=db,
        embedding=embbeding,
        conversation_id=conversation_id,
        limit=5
    )

    keyboard_results = await keyword_search_chunks(
        db=db,
        query=query,
        conversation_id=conversation_id,
        limit=5
    )

    merged = {}
    for chunk in vector_results:
        merged[chunk.id] = chunk

    for row in keyboard_results:
        chunk = row[0]

        merged[chunk.id] = chunk

    final_chunks = list(merged.values())

    return final_chunks[:8]

async def get_recent_messages_tool(
    db,
    conversation_id,
    limit=10
):
    messages = await get_messages(
        db=db,
        conversation_id=conversation_id,
        limit=limit
    )

    result = ""

    for msg in messages:
        result += (
            f"{msg.role}: "
            f"{msg.content}:\n"
        )
        
    return result

async def search_web_tool(query):
    result = await search_web(query)

    return result
