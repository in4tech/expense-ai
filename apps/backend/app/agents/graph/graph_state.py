


from typing import TypedDict

from app.db.session import DbSession


class GraphState(TypedDict):
    db: DbSession
    
    user_id: int
    
    user_query: str
    memory_context: str

    conversation_id: int

    memories: list
    tasks: list
    execution_results: list

    draft_anwser: str
    final_anwser: str

    reflection: dict
    