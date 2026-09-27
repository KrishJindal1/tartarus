"""
Polymorphic engine service interface.

Every job's IR passes through the compiler-level polymorphic engine so that
each deployment carries NOP sleds, dead code, per-instruction XOR keys and
random padding - guaranteeing a unique SHA-256 per deployment.
"""

import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)


def mutate_ir(ir_bytes: bytes) -> bytes:
    """Apply polymorphic mutation to IR bytes (semantics preserving)."""
    from compiler.polymorphic_engine import mutate_ir as _mutate

    return _mutate(ir_bytes)


def mutate_source(source: str):
    """Compile JOCKY source straight to unique polymorphic IR: (bytes, sha256)."""
    from compiler.polymorphic_engine import generate_unique_ir

    return generate_unique_ir(source)
