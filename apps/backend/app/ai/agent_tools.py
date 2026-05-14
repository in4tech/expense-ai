
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.web_search_service import search_web
from app.services.compression_service import compress_context, unified_retrieval


async def search_web_tool(query):
    result = await search_web(query)

    return result


async def search_knowledge_base_tool(
    db: AsyncSession,
    query,
    user_id,
    conversation_id
):
    retrieved_context = await unified_retrieval(
        db=db,
        query=query,
        user_id=user_id,
        conversation_id=conversation_id,
    )

    compressed_context = await compress_context(
        query=query,
        retrieved_context=retrieved_context
    )

    return compressed_context


TOOLS_MAP = {
    "search_knowledge_base":
        search_knowledge_base_tool,

    "search_web":
        search_web_tool
}