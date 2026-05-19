
from langgraph.graph import END, StateGraph
from app.agents.graph.nodes.tool import tool_node
from app.agents.graph.agent_state import AgentState
from app.agents.graph.nodes.rerank import rerank_node 
from app.agents.graph.nodes.retrieval import retrieval_node
from app.agents.graph.nodes.planner import planner_node
from app.agents.graph.nodes.reasoning import reasoning_node
from app.agents.graph.nodes.reflection import reflection_node
from app.agents.graph.nodes.synthesis import synthesis_node


workflow = StateGraph(AgentState)

workflow.add_node("planner", planner_node)
workflow.add_node("retrieval", retrieval_node)
workflow.add_node("rerank", rerank_node)
workflow.add_node("tools", tool_node)
workflow.add_node("reasoning", reasoning_node)
workflow.add_node("reflection", reflection_node)
workflow.add_node("synthesis", synthesis_node)

workflow.set_entry_point("planner")

workflow.add_edge("planner", "retrieval")
workflow.add_edge("retrieval", "rerank")
workflow.add_edge("rerank", "tools")
workflow.add_edge("tools", "reasoning")
workflow.add_edge("reasoning", "reflection")
workflow.add_edge("reflection", "synthesis")
workflow.add_edge("synthesis", END)

app = workflow.compile()