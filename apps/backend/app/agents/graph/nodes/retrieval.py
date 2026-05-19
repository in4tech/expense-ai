from app.agents.graph.agent_state import AgentState
from app.services.compression_service import unified_retrieval


async def retrieval_node(state: AgentState):
    docs = await unified_retrieval(
        db=state["db"],
        query=state["user_input"],
        user_id=state["user_id"],
        conversation_id=state["conversation_id"],
    )
    return {"retrieval_docs": docs}