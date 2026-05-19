

from app.agents.graph.base_node import BaseNode
from app.agents.graph.graph_state import GraphState
from app.agents.reflection.reflection_service import reflection_pipeline
from app.db.session import CHAT_MODELS, client


class ReflectionNode(BaseNode):
    async def run(
        self,
        state: GraphState,
        send_event
    ):
        reflection = await reflection_pipeline(
            user_query=state["user_query"],
            draft_answer=state.get("draft_anwser") or state.get("final_anwser", ""),
        )

        state["reflection"] = reflection
        yield send_event({
            "type": "reflection",
            "confidence": reflection["confidence"],
        })

        
