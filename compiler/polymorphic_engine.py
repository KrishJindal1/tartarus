"""
JOCKY polymorphic engine.

Every compilation/deployment passes through this engine so that each emitted
instance has a unique SHA-256, defeating file-reputation and static signature
databases. Safe mutations (semantics preserving):

    1. Random XOR key per instruction (variable encryption)   - applied at encode time
    2. NOP sled injection at the program head                 - jump targets patched
    3. Balanced dead-code (PUSH literal / POP) before final RET
    4. Random tail padding after the terminating RET
    5. (emitter-side) dependency-free statement scheduling

Mutation never changes execution semantics: the VM halts at the first RET and
skips NOPs; dead code is balanced push/pop with no side effects.
"""

import hashlib
import random
import struct
from typing import Optional

from compiler.ir_emitter import (
    JUMP_OPS,
    OP_POP,
    OP_PUSH,
    OP_RET,
    Instruction,
    ProgramIR,
    _literal_operand,
)


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def mutate_ir(
    ir_bytes: bytes,
    *,
    nop_sled: Optional[int] = None,
    dead_code: Optional[int] = None,
    tail_padding: Optional[int] = None,
) -> bytes:
    """
    Convenience: decode bytes -> mutate -> re-encode with fresh random keys.
    Raises if the input IR is undecodable (must contain a RET).
    """
    from compiler.ir_emitter import decode_instructions

    instrs = decode_instructions(ir_bytes)
    prog = ProgramIR(instructions=instrs)
    mutated = mutate_program(prog, nop_sled=nop_sled, dead_code=dead_code,
                             tail_padding=tail_padding)
    return mutated.to_bytes()


def mutate_program(
    prog: ProgramIR,
    *,
    nop_sled: Optional[int] = None,
    dead_code: Optional[int] = None,
    tail_padding: Optional[int] = None,
) -> ProgramIR:
    instructions = [Instruction(i.op, bytes(i.operand)) for i in prog.instructions]

    # Programs must terminate with RET; if missing, append one.
    if not instructions or instructions[-1].op != OP_RET:
        instructions.append(Instruction(OP_RET))

    # Find the index of the terminating RET (must be last logical instruction).
    ret_index = len(instructions) - 1

    # ---- 1. balanced dead code immediately before RET --------------------
    n_dead = dead_code if dead_code is not None else random.randint(2, 6)
    dead: list[Instruction] = []
    dead_literals = [
        random.randint(-0x7FFFFFFF, 0x7FFFFFFF),
        random.randint(0, 255),
        "0x%08x" % random.getrandbits(32),
        random.choice(["EVASION", "CLEAN", "NODE", "TRACE"]),
    ]
    for _ in range(max(0, n_dead)):
        lit = random.choice(dead_literals)
        dead.append(Instruction(OP_PUSH, _literal_operand(lit)))
        dead.append(Instruction(OP_POP))
    instructions[ret_index:ret_index] = dead

    # ---- 2. NOP sled at head (patch absolute jump targets) ---------------
    n_nop = nop_sled if nop_sled is not None else random.randint(3, 12)
    n_nop = max(0, n_nop)
    if n_nop:
        for instr in instructions:
            if instr.op in JUMP_OPS and len(instr.operand) >= 2:
                target = struct.unpack(">H", instr.operand[:2])[0]
                instr.operand = struct.pack(">H", target + n_nop)
        instructions = [Instruction(0x00) for _ in range(n_nop)] + instructions

    # ---- 3. random tail padding after RET (ignored by the VM) ------------
    pad = tail_padding if tail_padding is not None else random.randint(4, 16)

    mutated = ProgramIR(
        instructions=instructions,
        stmt_metas=list(prog.stmt_metas),
        source_hash=prog.source_hash,
        tail_padding=pad,
    )
    return mutated


def generate_unique_ir(source: str) -> tuple[bytes, str]:
    """
    Compile JOCKY source -> polymorphic IR. Returns (ir_bytes, sha256_hex).
    Guaranteed fresh hash per call thanks to random keys/NOPs/padding/scheduling.
    """
    from compiler.ir_emitter import IREmitter

    prog = IREmitter(source).emit_program()
    mutated = mutate_program(prog)
    data = mutated.to_bytes()
    return data, sha256_hex(data)
