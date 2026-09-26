"""
IR Emitter: converts JOCKY AST into an intermediate representation.
"""

from typing import Any


OPCODES = {
    "NOP": 0x00,
    "CALL": 0x01,
    "COLLECT": 0x02,
    "DUMP": 0x03,
    "ANALYZE": 0x04,
    "EXEC": 0x05,
    "RET": 0x06,
    "PUSH": 0x07,
    "POP": 0x08,
    "JMP": 0x09,
    "JNZ": 0x0A,
    "ENCRYPT": 0x0B,
    "LOG": 0x0C,
}


class IREmitter:
    def __init__(self, ast: Any):
        self.ast = ast

    def emit(self) -> bytes:
        """
        Convert a JOCKY FunctionCall AST into a simple IR instruction.

        Current instruction format:

            [opcode][namespace_length][namespace][function_length][function]

        Example:

            system.info()

        becomes:

            CALL system info
        """

        if not hasattr(self.ast, "namespace"):
            raise ValueError("AST does not contain a namespace")

        if not hasattr(self.ast, "function"):
            raise ValueError("AST does not contain a function")

        namespace = self.ast.namespace.encode("utf-8")
        function = self.ast.function.encode("utf-8")

        if len(namespace) > 255:
            raise ValueError("Namespace is too long")

        if len(function) > 255:
            raise ValueError("Function name is too long")

        bytecode = bytearray()

        # CALL opcode
        bytecode.append(OPCODES["CALL"])

        # Namespace
        bytecode.append(len(namespace))
        bytecode.extend(namespace)

        # Function
        bytecode.append(len(function))
        bytecode.extend(function)

        return bytes(bytecode)