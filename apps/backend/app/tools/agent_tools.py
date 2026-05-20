from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from langchain.tools import tool

from app.db.uuid_columns import as_uuid
from app.services.compression_service import compress_context, unified_retrieval
from app.services.web_search_service import search_web

@tool(description="Search the web for realtime information such as news, current events, and factual lookups.")
async def search_web_tool(query: str):
    return await search_web(query)


@tool(description="Search memories, messages, and uploaded documents relevant to the query.")
async def search_knowledge_base_tool(
    db: AsyncSession,
    query: str,
    user_id: str | UUID,
    conversation_id: str | UUID,
):
    retrieved_context = await unified_retrieval(
        db=db,
        query=query,
        user_id=as_uuid(user_id),
        conversation_id=as_uuid(conversation_id),
    )

    return await compress_context(
        query=query,
        retrieved_context=retrieved_context,
    )


TOOLS_MAP = {
    "search_knowledge_base": search_knowledge_base_tool,
    "search_web": search_web_tool
}