"""
Compiler service: compiles JOCKY DSL scripts to IR bytes via the compiler/
package at the repository root, then runs the polymorphic engine so every
deployment instance has a unique hash.
"""

import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)


def compile_script(source: str) -> bytes:
    """Compile forensic script source into polymorphic executable IR bytes."""
    from compiler.ir_emitter import IREmitter

    prog = IREmitter(source).emit_program()
    return prog.to_bytes()


def compile_mutable(source: str):
    """Compile + polymorphic mutation. Returns (ir_bytes, sha256_hex)."""
    from compiler.polymorphic_engine import generate_unique_ir

    return generate_unique_ir(source)
