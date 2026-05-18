


from app.agents.graph.base_node import BaseNode
from app.agents.autonomous.autonomous_agent import AutonomouseAgent
from app.agents.synthesis.synthesis_agent import synthesis_stream
from app.agents.graph.graph_state import GraphState


class AutonomousAgentNode(BaseNode):
    def __init__(self):
        self.agent = AutonomouseAgent()
        
    async def run(
        self,
        state: GraphState,
        send_event
    ):
        execution_results = await self.agent.run(
            db=state["db"],
            user_query=state["user_query"],
            user_id=state["user_id"],
            conversation_id=state["conversation_id"],
            send_event=send_event
        )

        draft_answer = ""
        async for delta in synthesis_stream(
            user_query=state["user_query"],
            execution_results=execution_results,
        ):
            draft_answer += delta
            await send_event({
                "type": "content",
                "content": delta,
            })

        state["draft_anwser"] = draft_answer
        state["final_anwser"] = draft_answer