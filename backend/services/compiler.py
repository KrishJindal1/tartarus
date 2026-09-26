"""
Compiler service interface for compiling forensic DSL scripts to intermediate representation (IR).
"""


def compile_script(source: str) -> bytes:
    """Compile forensic script source into executable bytecode/IR stream."""
    raise NotImplementedError("Compiler service not implemented yet")
