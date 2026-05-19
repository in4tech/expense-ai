
from app.agents.graph.agent_state import AgentState
from app.agents.graph.prompt_context import (
    current_date_line,
    format_rerank_docs,
    format_tool_results,
    language_instruction,
)
from app.db.session import critic_llm

def reflection_node(state: AgentState):
    scratchpad = "\n".join(
        item if isinstance(item, str) else str(item)
        for item in state["scratchpad"]
    )
    tool_results = format_tool_results(state.get("tool_results"))
    retrieved = format_rerank_docs(state.get("rerank_docs") or [])

    prompt = f"""
    You are a grounded critic. Your job is to review reasoning against evidence — not to rewrite facts from memory.

    {language_instruction(state)}

    Today's date: {current_date_line()}

    User question:
    {state["user_input"]}

    Evidence (source of truth — always prefer this over reasoning or your training knowledge):
    --- Tool results ---
    {tool_results}

    --- Retrieved context ---
    {retrieved}

    Reasoning to review:
    {scratchpad}

    Rules:
    1. Treat Tool results and Retrieved context as authoritative for dates, numbers, names, and current events.
    2. If reasoning contradicts evidence (e.g. evidence says 2026 but reasoning says 2024), flag it and state the value from evidence.
    3. Do NOT "correct" toward years or facts from your parametric knowledge when evidence already states otherwise.
    4. For time-sensitive topics (news, prices, schedules, "latest", "current"), defer to search_web and other tool output.
    5. Only flag missing information if it was available in evidence but omitted from reasoning.
    6. Output concise critique: bullet list of issues (if any), then "Corrections from evidence:" with exact fixes grounded in the blocks above. If reasoning matches evidence, say "No issues — reasoning aligns with evidence."

    Improvement guidance for the final answer writer (do not invent new facts):
    - hallucinations to remove
    - claims to soften or drop (unsupported)
    - facts to add only when explicitly present in evidence
    - structure/clarity notes
    """

    result = critic_llm.invoke(prompt)

    return {
        "reflection": result.content,
    }
