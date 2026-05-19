

from typing import List

from pydantic import BaseModel, Field

from app.agents.graph.agent_state import AgentState
from app.agents.graph.prompt_context import (
    detect_user_language,
    language_instruction_from_code,
    merge_language,
    normalize_language,
)
from app.db.session import planner_llm


class PlanNode(BaseModel):
    use_retrieval: bool = False
    tools: List[str] = []
    reasoning_steps: List[str] = []
    response_language: str = Field(
        description="ISO 639-1 code for the language the user wrote in (e.g. vi, en, zh, ja)",
    )

strutured_llm = planner_llm.with_structured_output(PlanNode)

def planner_node(state: AgentState):
    heuristic_lang = detect_user_language(state["user_input"])

    prompt = f"""
    You are a planning agent.

    {language_instruction_from_code(heuristic_lang)}

    User input:
    {state["user_input"]}

    Relevant memories:
    {state["memory_context"]}

    Available tools:
    - search_knowledge_base
    - search_web

    Decide:
    - retrieval needed?
    - tools needed?
    - reasoning steps?
    - response_language: ISO 639-1 code matching the user's message language (not the language of memories or tool docs).
    """

    result = strutured_llm.invoke(prompt)
    user_language = merge_language(heuristic_lang, result.response_language)
    planner_output = result.model_dump()
    planner_output["response_language"] = normalize_language(user_language)

    return {
        "planner_output": planner_output,
        "user_language": user_language,
    }
