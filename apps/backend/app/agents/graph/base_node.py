
class BaseNode:
    async def run(
        self,
        state,
        send_event
    ):
        raise NotImplementedError