

from app.agents.graph.agent_state import AgentState


def rerank_node(state: AgentState):
    docs = state["retrieval_docs"]
    
    reranked = sorted(docs, key=len)
    return {
        "rerank_docs": reranked
    }