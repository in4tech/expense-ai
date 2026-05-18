

from app.agents.graph.base_node import BaseNode
from app.agents.graph.graph_state import GraphState
from app.agents.planner.planner_agent import create_plan


class PlannerNode(BaseNode):
    async def run(
        self,
        state: GraphState,
        send_event
    ):
        await send_event({
            "type": "planning"
        })

        plan = await create_plan(
            user_query=state["user_query"],
            memory_context=state["memory_context"]
        )

        state["tasks"] = plan["tasks"]
        await send_event({
            "type": "plan_created",
            "tasks": state["tasks"]
        })