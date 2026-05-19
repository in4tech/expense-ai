
from app.agents.planner.planner_node import PlannerNode
from app.agents.graph.nodes.reflection_node import ReflectionNode
from app.agents.graph.graph_state import GraphState
from app.services.memory_service import extract_memory, save_memories
from app.agents.autonomous.autonomous_agent import AutonomouseAgent


class GraphRunner:
    def __init__(self):
        self.planner = PlannerNode()
        self.agent = AutonomouseAgent()
        self.reflection = ReflectionNode()

    
    async def run(
        self,
        state: GraphState,
        send_event
    ):
        # =================================================
        # PLANNER
        # =================================================
        async for event in self.planner.run(state, send_event):
            yield event

        # =================================================
        # AUTONOMOUS AGENT
        # =================================================
        async for event in self.agent.run(state, send_event):
            yield event

        # =================================================
        # REFLECTION
        # =================================================
        async for event in self.reflection.run(state, send_event):
            yield event

        # =====================================================
        # MEMORY EXTRACTION
        # =====================================================
        assistant_response = (
            state.get("final_anwser")
            or state.get("draft_anwser")
            or ""
        ).strip()

        yield send_event({
            "type": "memory_extraction",
            "message": state["user_query"],
            "assistant_response": assistant_response,
        })

        if not assistant_response:
            yield send_event({
                "type": "memory_saved",
                "count": 0,
            })
            return

        memories = await extract_memory(
            message=state["user_query"],
            assistant_response=assistant_response,
        )

        memory_items = memories.get("memories") or []

        # =====================================================
        # SAVE MEMORIES
        # =====================================================
        saved_count = await save_memories(
            db=state["db"],
            user_id=state["user_id"],
            memories=memory_items,
        )

        yield send_event({
            "type": "memory_saved",
            "count": saved_count,
        })


            

