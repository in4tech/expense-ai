

from app.agents.graph.agent_state import AgentState
from app.tools.agent_tools import TOOLS_MAP


async def tool_node(state: AgentState):
    planner = state.get("planner_output") or {}
    query = state["user_input"]
    tool_results = []

    for tool_name in planner.get("tools", []):
        if tool_name not in TOOLS_MAP:
            continue

        tool = TOOLS_MAP[tool_name]
        try:
            if tool_name == "search_knowledge_base":
                result = await tool.ainvoke({
                    "db": state["db"],
                    "query": query,
                    "user_id": state["user_id"],
                    "conversation_id": state["conversation_id"],
                })
            else:
                result = await tool.ainvoke({"query": query})
        except Exception as e:
            result = f"Tool error: {str(e)}"

        tool_results.append({
            "tool": tool_name,
            "result": result,
        })

    return {
        "tool_results": tool_results,
    }
    
