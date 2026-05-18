

from app.agents.graph.graph_state import GraphState
from app.agents.graph.base_node import BaseNode
from app.agents.synthesis.synthesis_agent import synthesis_stream


class SynthesisNode(BaseNode):
    async def run(
        self,
        state: GraphState,
        send_event
    ):

        draft_answer = ""

        async for delta in synthesis_stream(
            user_query=state["user_query"],
            execution_results=state["execution_results"]
        ):
            draft_answer += delta
            await send_event({
                "type":"content",
                "content":delta
            })

        state["draft_answer"] = draft_answer

        return state