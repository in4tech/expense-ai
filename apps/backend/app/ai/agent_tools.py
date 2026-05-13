


from app.services.embedding_service import create_embedding
from app.services.document_service import search_document_chunks
from app.services.chat_service import get_messages


async def search_documents_tool(
    db,
    query,
    conversation_id
): 
    embedding = await create_embedding(query)

    chunks = await search_document_chunks(
        db=db,
        embedding=embedding,
        conversation_id=conversation_id,
        limit=5
    )

    result = ""

    for chunk in chunks:
        result += f"""
        [Page {chunk.page}]

        {chunk.content}

        """

    return result


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

