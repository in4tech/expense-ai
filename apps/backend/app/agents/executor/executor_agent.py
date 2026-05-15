
from app.agents.executor.executor_loop import executor_loop


async def execute_task(
    db,
    task,
    memory_context,
    user_id,
    conversation_id,
    send_event,
    out_result: list[str],
):
    async for sse in executor_loop(
        db=db,
        task=task,
        memory_context=memory_context,
        user_id=user_id,
        conversation_id=conversation_id,
        send_event=send_event,
        completion=out_result,
    ):
        yield sse
