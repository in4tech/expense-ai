
from app.agents.planner.planner_agent import create_plan
from app.agents.executor.executor_agent import execute_task
from app.agents.reflection.reflection_service import reflection_pipeline
from app.agents.synthesis import synthesis_agent


def _normalize_tasks(plan: dict, user_query: str) -> list[dict]:
    raw = plan.get("tasks")
    if not isinstance(raw, list):
        raw = []
    tasks = [
        t
        for t in raw
        if isinstance(t, dict) and str(t.get("task", "")).strip()
    ]
    if not tasks:
        q = (user_query or "").strip() or "Answer the user."
        tasks = [{"step": 1, "task": q, "tool": None}]
    return tasks


async def run_multi_agent(
    db,
    user_query,
    memory_context,
    user_id,
    conversation_id,
    send_event
):
    # ========================================
    # PLANNING
    # ========================================
    yield send_event({
        "type": "planning"
    })

    plan = await create_plan(
        user_query=user_query,
        memory_context=memory_context
    )

    tasks = _normalize_tasks(plan, user_query)
    yield send_event({
        "type": "plan_created",
        "tasks": tasks
    })

    # ========================================
    # EXECUTION
    # ========================================
    execution_results = []
    for task in tasks:
        yield send_event({
            "type": "executing_task",
            "task": task
        })

        out_result: list[str] = []
        async for chunk in execute_task(
            db=db,
            task=task,
            memory_context=memory_context,
            user_id=user_id,
            conversation_id=conversation_id,
            send_event=send_event,
            out_result=out_result,
        ):
            yield chunk

        result = out_result[-1] if out_result else ""

        execution_results.append({
            "task": task,
            "result": result
        })

    # ========================================
    # SYNTHESIS STREAM
    # ========================================
    draft_answer = ""
    async for delta in synthesis_agent.synthesis_stream(
        user_query=user_query,
        execution_results=execution_results
    ):
        draft_answer += delta
        yield send_event({
            "type": "content",
            "content": delta
        })

    # ========================================
    # REFLECTION
    # ========================================
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

