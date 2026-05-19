from app.agents.graph.agent_state import AgentState


def rerank_node(state: AgentState):
    docs = state["retrieval_docs"] or []
    return {"rerank_docs": list(docs)}