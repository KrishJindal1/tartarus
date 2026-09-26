from typing import Callable


class FunctionRegistry:
    def __init__(self):
        self.functions: dict[str, Callable] = {}

    def register(
        self,
        namespace: str,
        name: str,
        function: Callable,
    ):
        key = f"{namespace}.{name}"
        self.functions[key] = function

    def get(
        self,
        namespace: str,
        name: str,
    ) -> Callable:
        key = f"{namespace}.{name}"

        if key not in self.functions:
            raise KeyError(
                f"JOCKY function not registered: {key}"
            )

        return self.functions[key]

    def call(
        self,
        namespace: str,
        name: str,
    ):
        function = self.get(namespace, name)
        return function()