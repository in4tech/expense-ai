
from app.ai.agent_tools import TOOLS_MAP

async def execute_task(
    db,
    task,
    user_id,
    conversation_id
):
    tool_name = task["tool"]

    if tool_name == "None":
        return None
    
    tool_function = TOOLS_MAP[tool_name]
    if(tool_name == "search_knowledge_base"):
        result = (
            await tool_function(
                db=db,
                query=task["task"],
                user_id=user_id,
                conversation_id=conversation_id
            )
        )

        return result
    
    if tool_name == "web_search":
        result = (
            await tool_function(
                query=task["task"]
            )
        )

        return result

    return None