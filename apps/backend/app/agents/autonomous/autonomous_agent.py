
import json

from app.agents.autonomous.scratchpad import Scratchpad
from app.db.session import client
from app.tools.agent_tools import TOOLS_MAP
from app.tools.tool_definitions import TOOLS
from app.agents.synthesis.synthesis_agent import synthesis_stream
from app.agents.graph.graph_state import GraphState


class AutonomouseAgent:
    def __init__(self):
        self.max_iterations = 8

    async def run(
        self,
        state: GraphState,
        send_event,
    ):
        db = state["db"]
        user_query = state["user_query"]
        user_id = state["user_id"]
        conversation_id = state["conversation_id"]
        scratchpad = Scratchpad()

        messages = [
            {
                "role": "system",
                "content": """
                You are an autonomous AI agent.

                Your job:
                - solve user tasks
                - use tools dynamically
                - reason step-by-step
                - retry if necessary
                - verify information

                You can:
                - search internal knowledge
                - search web
                - combine information
                - synthesize answers

                Be concise and accurate.
                """
            },
            {
                "role": "user",
                "content": user_query
            }
        ]

        execution_results = ""

        for iteration in range(self.max_iterations):
            yield send_event({
                "type": "agent_iteration",
                "iteration": iteration + 1
            })

            scratchpad_content = scratchpad.format()
            runtime_messages = (
                messages +
                [
                    {
                        "role": "system",
                        "content": f"""

                        CURRENT SCRATCHPAD:

                        {scratchpad_content}

                        """
                    }
                ]
            )

            response = await client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=runtime_messages,
                tools=TOOLS,
                tool_choice="auto"
            )
                
            assistant_message = response.choices[0].message
            
            # =============================================
            # TOOL CALLS
            # =============================================
            if assistant_message.tool_calls:
                messages.append({
                    "role": "assistant",
                    "tool_calls": assistant_message.tool_calls
                })

                for tool_call in assistant_message.tool_calls:
                    tool_name = tool_call.function.name
                    
                    args = json.loads(tool_call.function.arguments)

                    yield send_event({
                        "type": "tool_running",
                        "tool": tool_name,
                        "args": args
                    })

                    # =====================================
                    # GET TOOL
                    # =====================================
                    tool_function = TOOLS_MAP[tool_name]
                        

                    # =====================================
                    # EXECUTE TOOL
                    # =====================================
                    try:
                        # KNOWLEDGE BASE
                        if (tool_name == "search_knowledge_base"):
                            result = await tool_function(
                                db=db,
                                query= args["query"],
                                user_id= user_id,
                                conversation_id= conversation_id
                            )
                            
                        # WEB SEARCH
                        elif (tool_name == "search_web"):
                            result = await tool_function(
                                query= args["query"]
                            )

                        else:
                            result = "Unknown tool"

                    except Exception as e:
                        result = f"Tool Error: {str(e)}"

                    yield send_event({
                        "type": "tool_completed",
                        "tool": tool_name
                    })

                    # =====================================
                    # UPDATE SCRATCHPAD
                    # =====================================
                    scratchpad.add(
                        thought=f"Used {tool_name}",
                        action=args,
                        observation=str(result)
                    )

                    # =====================================
                    # TOOL RESPONSE
                    # =====================================
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(result)
                    })

                continue

            execution_results = assistant_message.content or scratchpad.format()
            break

        if not execution_results:
            execution_results = scratchpad.format()

        draft_answer = ""
        async for delta in synthesis_stream(
            user_query=user_query,
            execution_results=execution_results,
        ):
            draft_answer += delta
            yield send_event({
                "type": "content",
                "content": delta,
            })

        state["draft_anwser"] = draft_answer
        state["final_anwser"] = draft_answer

