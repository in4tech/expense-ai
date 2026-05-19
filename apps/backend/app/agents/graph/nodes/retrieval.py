

from langchain_openai import OpenAIEmbeddings
from app.agents.graph.agent_state import AgentState

embeddings = OpenAIEmbeddings()

def retrieval_node(state: AgentState):
    semantic_results = [
            "LangGraph supports stateful workflows",
            "Reflection agents improve reasoning quality"
        ]

    keyboard_results = [
        "Hybrid retrieval combines vector and BM25"
    ]

    docs = semantic_results + keyboard_results
    return {
        "retrieval_docs": docs
    }