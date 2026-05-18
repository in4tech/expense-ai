

class Scratchpad:
    def __init__(self):
        self.steps = []

    def add(
        self,
        thought,
        action=None,
        observation=None
    ):
        self.steps.append({
            "thought": thought,
            "action": action,
            "observation": observation
        })

    def format(self):
        output = ""

        for i, step in enumerate(self.steps):
            output += f"""
                
            STEP {i+1}

            Thought:
            {step["thought"]}

            Action:
            {step["action"]}
                
            Observation
            {step["observation"]}
                
            """

        return output