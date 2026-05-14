
from app.ai.planner_agent import create_plan
from apps.backend.app.ai.executor_agent import execute_task
from apps.backend.app.ai.reflection_service import reflection_pipeline
from apps.backend.app.db.session import CHAT_MODELS, client


async def run_multi_agent(
    db,
    user_query,
    user_id,
    conversation_id,
    send_event
):
    yield send_event({
        "type": "planning"
    })

    plan = await create_plan(user_query)

    tasks = plan["tasks"]
    yield send_event({
        "type": "plan_created",
        "tasks": tasks
    })

    execution_results = []
    for task in tasks:
        yield send_event({
            "type": "executing_task",
            "task": task
        })

        result = await execute_task(
            db=db,
            task=task,
            user_id=user_id,
            conversation_id=conversation_id
        )

        execution_results.append({
            "task": task,
            "result": result
        })

    response = await client.chat.completions.create(
        model=CHAT_MODELS,
        stream=True,
        messages=[
            {
                "role": "system",
                "content": """
                You are a synthesis agent.

                Combine all execution
                results into final answer.
                """
            },
            {
                "role": "user",
                "content": f"""

                USER QUERY:

                {user_query}

                EXECUTION RESULTS:

                {execution_results}

                """
            } 
        ]
    )

    draft_answer = ""
    for chunk in response:
        delta = chunk.choices[0].delta.content

        if delta:
            draft_answer += delta
            yield send_event({
                "type": "content",
                "content": delta
            })

    yield send_event({
        "type": "relection",
        "status": "running"
    })

    reflection_result = (
        await reflection_pipeline(
            user_query=user_query,
            draft_answer=draft_answer
        )
    )

    yield send_event({
        "type": "reflection",
        "status": "completed",
        "improved": reflection_result["improved"]
    })

    yield send_event({
        "type": "done"
    })



