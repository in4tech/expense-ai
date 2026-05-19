
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.web_search_service import search_web
from app.services.compression_service import compress_context, unified_retrieval
from langchain.tools import tool

@tool(description="Search the web for realtime information such as news, current events, and factual lookups.")
async def search_web_tool(query: str):
    """Search the web for realtime information such as news, current events, and factual lookups."""
    return await search_web(query)


@tool(description="Search memories, messages, and uploaded documents relevant to the query.")
async def search_knowledge_base_tool(
    db: AsyncSession,
    query: str,
    user_id: int,
    conversation_id: int,
):
    """Search memories, messages, and uploaded documents relevant to the query."""
    retrieved_context = await unified_retrieval(
        db=db,
        query=query,
        user_id=user_id,
        conversation_id=conversation_id,
    )

    return await compress_context(
        query=query,
        retrieved_context=retrieved_context,
    )


TOOLS_MAP = {
    "search_knowledge_base": search_knowledge_base_tool,
    "search_web": search_web_tool
}