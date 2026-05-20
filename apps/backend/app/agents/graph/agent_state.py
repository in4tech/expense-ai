


from typing import Any, List, Optional, TypedDict

from sqlalchemy.ext.asyncio import AsyncSession


class AgentState(TypedDict):
    db: AsyncSession

    user_id: str
    user_input: str
    user_language: str

    memory_context: str
    conversation_id: str

    planner_output: Optional[dict]

    retrieval_docs: List[Any]

    rerank_docs: List[Any]

    tool_results: List[dict]

    scratchpad: List[dict]

    reflection: Optional[str]

    final_answer: Optional[str]

    iteration_count: int


    