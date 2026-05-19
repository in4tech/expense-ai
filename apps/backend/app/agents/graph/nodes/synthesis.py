
from app.agents.graph.agent_state import AgentState
from app.agents.graph.prompt_context import (
    current_date_line,
    format_rerank_docs,
    format_tool_results,
    language_instruction,
)
from app.db.session import reasoning_llm


def synthesis_node(state: AgentState):
    reflection = state.get("reflection") or ""
    reasoning = "\n".join(
        item if isinstance(item, str) else str(item)
        for item in state["scratchpad"]
    )

    prompt = f"""
    Write the final user-facing answer for the user.

    {language_instruction(state)}

    Today's date: {current_date_line()}

    User question:
    {state["user_input"]}

    Evidence (source of truth — must not contradict this):
    --- Tool results ---
    {format_tool_results(state.get("tool_results"))}

    --- Retrieved context ---
    {format_rerank_docs(state.get("rerank_docs") or [])}

    Reasoning draft:
    {reasoning}

    Reflection (critique — apply only when consistent with evidence above):
    {reflection}

    Rules:
    1. Facts about dates, events, and "current" information must match Tool results / Retrieved context.
    2. If reflection disagrees with evidence, ignore that part of reflection and keep evidence.
    3. Do not add years, dates, or claims not supported by evidence or reasoning grounded in evidence.
    4. Be clear and concise; no meta-commentary about the pipeline.
    """

    result = reasoning_llm.invoke(prompt)

    return {
        "final_answer": result.content,
    }