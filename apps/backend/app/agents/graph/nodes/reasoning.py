

from app.agents.graph.agent_state import AgentState
from app.agents.graph.prompt_context import (
    current_date_line,
    format_rerank_docs,
    format_tool_results,
    language_instruction,
)
from app.db.session import reasoning_llm


async def reasoning_node(state: AgentState):
    prompt = f"""
    Think step-by-step to answer the user. Use evidence first; do not guess dates or current events.

    {language_instruction(state)}

    Today's date: {current_date_line()}

    User question:
    {state["user_input"]}

    Retrieved context:
    {format_rerank_docs(state.get("rerank_docs") or [])}

    Tool results (authoritative for realtime / web facts):
    {format_tool_results(state.get("tool_results"))}

    Rules:
    - When tool results conflict with general knowledge, follow tool results.
    - Quote or paraphrase specific facts (years, names, numbers) from tool results when used.
    - If evidence is insufficient, say what is missing instead of inventing.
    """

    chunks = []
    async for chunk in reasoning_llm.astream(prompt):
        if chunk.content:
            chunks.append(chunk.content)

    final_text = "".join(chunks)
    return {
        "scratchpad": [final_text],
    }