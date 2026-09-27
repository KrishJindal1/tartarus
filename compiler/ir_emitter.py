"""
IR Emitter: converts a JOCKY AST into executable JOCKY-IR bytecode.

Instruction encoding (consumed by agent/executor/ir_interpreter.go):

    NOP  (0x00)                    -> [op]
    RET  (0x06)                    -> [op]
    others                         -> [op][operand_len u8][xor_key u8][encoded]

where encoded = raw_operand XOR xor_key, and raw_operand is:

    CALL/COLLECT/DUMP/ANALYZE/EXEC/BYOVD/SYSCALL/HOLLOW:
        [name_len u8][name][argc u8]
        (argument values are pushed on the VM stack before the call)
    PUSH:   [type u8][len u8][bytes]   type: 0=str, 1=int64 BE, 2=bool
    STORE:  [name bytes]
    LOAD:   [name bytes]
    OUTPUT: [label bytes]              label may be empty
    LOG:    [level bytes]
    JMP/JZ/JNZ: [u16 big-endian absolute instruction index]
    TEST:   [kind u8]  0== 1!= 2< 3> 4<= 5>=
    ADD/SUB/MUL/DIV/AND/OR/NOT: empty or kind byte

The emitter always appends a trailing RET. Programs are decorated with
statement metadata (def/use sets, shuffled ordering) so the polymorphic
engine can mutate safely.
"""

import os
import random
import struct
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set

from compiler.grammar import BUILTINS
from compiler.parser import (
    Binary,
    Call,
    ExprStmt,
    FnDecl,
    Ident,
    If,
    Let,
    Literal,
    Output,
    Program,
    Unary,
    parse,
)


# ------------------------------------------------------------------ opcodes
OP_NOP     = 0x00
OP_CALL    = 0x01
OP_COLLECT = 0x02
OP_DUMP    = 0x03
OP_ANALYZE = 0x04
OP_EXEC    = 0x05
OP_RET     = 0x06
OP_PUSH    = 0x07
OP_POP     = 0x08
OP_JMP     = 0x09
OP_JNZ     = 0x0A
OP_ENCRYPT = 0x0B
OP_LOG     = 0x0C
OP_SYSCALL = 0x0D
OP_BYOVD   = 0x0E
OP_HOLLOW  = 0x0F
OP_STORE   = 0x10
OP_LOAD    = 0x11
OP_TEST    = 0x12
OP_JZ      = 0x13
OP_OUTPUT  = 0x14
OP_ADD     = 0x15
OP_SUB     = 0x16
OP_MUL     = 0x17
OP_DIV     = 0x18
OP_AND     = 0x19
OP_OR      = 0x1A
OP_NOT     = 0x1B

OPCODE_NAMES = {
    OP_NOP: "NOP", OP_CALL: "CALL", OP_COLLECT: "COLLECT", OP_DUMP: "DUMP",
    OP_ANALYZE: "ANALYZE", OP_EXEC: "EXEC", OP_RET: "RET", OP_PUSH: "PUSH",
    OP_POP: "POP", OP_JMP: "JMP", OP_JNZ: "JNZ", OP_ENCRYPT: "ENCRYPT",
    OP_LOG: "LOG", OP_SYSCALL: "SYSCALL", OP_BYOVD: "BYOVD", OP_HOLLOW: "HOLLOW",
    OP_STORE: "STORE", OP_LOAD: "LOAD", OP_TEST: "TEST", OP_JZ: "JZ",
    OP_OUTPUT: "OUTPUT", OP_ADD: "ADD", OP_SUB: "SUB", OP_MUL: "MUL",
    OP_DIV: "DIV", OP_AND: "AND", OP_OR: "OR", OP_NOT: "NOT",
}

JUMP_OPS = {OP_JMP, OP_JZ, OP_JNZ}

# name -> opcode for builtin calls
BUILTIN_OPCODES = {name: _op for name, _op in {
    "collect_processes": OP_COLLECT,
    "collect_network": OP_COLLECT,
    "collect_files": OP_COLLECT,
    "collect_logons": OP_COLLECT,
    "collect_system": OP_COLLECT,
    "dump_memory": OP_DUMP,
    "dump_registry": OP_DUMP,
    "analyze_persistence": OP_ANALYZE,
    "scan_byovd": OP_BYOVD,
    "exec_hollow": OP_EXEC,
    "exec_direct_syscall": OP_EXEC,
    "encrypt": OP_ENCRYPT,
    "log": OP_LOG,
}.items()}

# legacy map kept for grammar.BUILTINS consumers
BUILTIN_OPCODES.update({k: v for k, v in BUILTINS.items() if k not in BUILTIN_OPCODES})


@dataclass
class Instruction:
    op: int
    operand: bytes = b""

    @property
    def name(self) -> str:
        return OPCODE_NAMES.get(self.op, f"0x{self.op:02x}")

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<{self.name} {self.operand!r}>"


@dataclass
class StmtMeta:
    start: int
    end: int                 # exclusive
    uses: Set[str] = field(default_factory=set)
    defs: Set[str] = field(default_factory=set)
    shufflable: bool = True


def encode_instruction(instr: Instruction, xor_key: Optional[int] = None) -> bytes:
    if instr.op in (OP_NOP, OP_RET):
        return bytes([instr.op])
    key = xor_key if xor_key is not None else random.randint(1, 255)
    raw = instr.operand
    encoded = bytes(b ^ key for b in raw)
    if len(encoded) > 255:
        raise ValueError("IR operand exceeds 255 bytes")
    return bytes([instr.op, len(encoded), key]) + encoded


def decode_instructions(data: bytes) -> List[Instruction]:
    """Reference decoder (used by tests and the polymorphic engine)."""
    out: List[Instruction] = []
    i = 0
    while i < len(data):
        op = data[i]
        i += 1
        if op in (OP_NOP, OP_RET):
            out.append(Instruction(op))
            if op == OP_RET:
                break
            continue
        if i + 2 > len(data):
            raise ValueError("truncated IR instruction")
        n = data[i]
        key = data[i + 1]
        enc = data[i + 2:i + 2 + n]
        if len(enc) != n:
            raise ValueError("truncated IR operand")
        raw = bytes(b ^ key for b in enc)
        out.append(Instruction(op, raw))
        i += 2 + n
    return out


def format_ir(data: bytes) -> str:
    """Human-readable IR listing (frontend AST/SSA-style inspector)."""
    lines = []
    try:
        instrs = decode_instructions(data)
    except ValueError as exc:
        return f"<undecodable IR: {exc}>"
    for idx, ins in enumerate(instrs):
        detail = ""
        if ins.op in (OP_CALL, OP_COLLECT, OP_DUMP, OP_ANALYZE, OP_EXEC,
                      OP_BYOVD, OP_SYSCALL, OP_HOLLOW, OP_ENCRYPT, OP_LOG):
            if ins.operand:
                name_len = ins.operand[0]
                name = ins.operand[1:1 + name_len].decode("utf-8", "replace")
                argc = ins.operand[1 + name_len] if len(ins.operand) > 1 + name_len else 0
                detail = f" {name} argc={argc}"
        elif ins.op in JUMP_OPS and len(ins.operand) >= 2:
            detail = f" -> {struct.unpack('>H', ins.operand[:2])[0]}"
        elif ins.op in (OP_STORE, OP_LOAD, OP_OUTPUT) and ins.operand:
            detail = f" {ins.operand.decode('utf-8', 'replace')}"
        elif ins.op == OP_PUSH and ins.operand:
            detail = f" {ins.operand.hex()}"
        lines.append(f"{idx:04d}  {ins.name}{detail}")
    return "\n".join(lines)


@dataclass
class ProgramIR:
    instructions: List[Instruction] = field(default_factory=list)
    stmt_metas: List[StmtMeta] = field(default_factory=list)
    source_hash: str = ""
    tail_padding: int = 0

    def to_bytes(self, tail_padding: Optional[int] = None, xor_keys: Optional[List[int]] = None) -> bytes:
        out = bytearray()
        for i, instr in enumerate(self.instructions):
            key = None
            if xor_keys is not None and i < len(xor_keys):
                key = xor_keys[i]
            out.extend(encode_instruction(instr, key))
        pad = self.tail_padding if tail_padding is None else tail_padding
        if pad:
            out.extend(os.urandom(pad))
        return bytes(out)


# ------------------------------------------------------------------ emitter

class IREmitter:
    def __init__(self, ast):
        """
        Accepts:
          - Program            (full script)
          - a single Call/Expr (legacy: emits one instruction + RET)
          - str                (source, parsed automatically)
        """
        if isinstance(ast, str):
            ast = parse(ast)
        self.ast = ast

    # ---- public API

    def emit(self) -> bytes:
        """Emit full IR bytecode for the program (unmutated, random keys)."""
        return self.emit_program().to_bytes()

    def emit_program(self) -> ProgramIR:
        if isinstance(self.ast, Program):
            return self._emit_full_program(self.ast)
        # Legacy single-expression form
        prog = ProgramIR()
        self._emit_expr(self.ast, prog, {})
        prog.instructions.append(Instruction(OP_RET))
        return prog

    # ---- program-level

    def _emit_full_program(self, program: Program) -> ProgramIR:
        prog = ProgramIR()
        env: Dict[str, Set[str]] = {"vars": set(), "defined": set()}

        # Top-level statements (shuffled when dependency-free)
        self._emit_stmt_sequence(self._schedule(program.stmts), prog, env)

        # Functions: run `main` if present, otherwise every declared fn in order.
        fns = program.functions
        order = [program.function_map["main"]] if "main" in program.function_map else fns
        for fn in order:
            self._emit_fn(fn, prog, env)

        prog.instructions.append(Instruction(OP_RET))
        return prog

    def _emit_fn(self, fn: FnDecl, prog: ProgramIR, env) -> None:
        local: Dict[str, Set[str]] = {"vars": set(fn.params), "defined": set(fn.params)}
        self._emit_stmt_sequence(fn.body, prog, local)
        # propagate defined names upward for cross-function visibility warnings
        env["defined"] |= local["defined"]

    def _schedule(self, stmts: List[object]) -> List[object]:
        """
        Deterministic-safe statement scheduling: shuffle runs of pairwise
        independent Let/ExprStmt statements. Output/If statements break runs
        (their ordering/branch layout is semantically significant).
        """
        result: List[object] = []
        i = 0
        while i < len(stmts):
            stmt = stmts[i]
            if not isinstance(stmt, (Let, ExprStmt)):
                result.append(stmt)
                i += 1
                continue
            # gather maximal run of shufflable statements
            run = []
            j = i
            while j < len(stmts) and isinstance(stmts[j], (Let, ExprStmt)):
                run.append(stmts[j])
                j += 1
            if len(run) > 1:
                independent = _run_is_independent(run)
                if independent:
                    run = list(run)
                    random.shuffle(run)
            result.extend(run)
            i = j
        return result

    def _emit_stmt_sequence(self, stmts, prog: ProgramIR, env) -> None:
        for stmt in stmts:
            start = len(prog.instructions)
            uses: Set[str] = set()
            defs: Set[str] = set()
            shufflable = isinstance(stmt, (Let, ExprStmt))

            if isinstance(stmt, Let):
                self._emit_expr(stmt.expr, prog, env, uses)
                self._bind(stmt.name, prog, env, defs)
            elif isinstance(stmt, Output):
                self._emit_expr(stmt.expr, prog, env, uses)
                prog.instructions.append(Instruction(OP_OUTPUT, stmt.name_label() if hasattr(stmt, "name_label") else b""))
            elif isinstance(stmt, ExprStmt):
                self._emit_expr(stmt.expr, prog, env, uses)
                prog.instructions.append(Instruction(OP_POP))
            elif isinstance(stmt, If):
                shufflable = False
                self._emit_if(stmt, prog, env, uses, defs)
            elif isinstance(stmt, FnDecl):
                shufflable = False
                self._emit_fn(stmt, prog, env)
            else:
                raise TypeError(f"Unknown statement type: {type(stmt)!r}")

            prog.stmt_metas.append(StmtMeta(start, len(prog.instructions), uses, defs, shufflable))

    def _bind(self, name: str, prog, env, defs: Set[str]) -> None:
        prog.instructions.append(Instruction(OP_STORE, name.encode("utf-8")))
        defs.add(name)
        env["defined"].add(name)

    def _emit_if(self, stmt: If, prog, env, uses, defs) -> None:
        self._emit_expr(stmt.cond, prog, env, uses)
        jz_index = len(prog.instructions)
        prog.instructions.append(Instruction(OP_JZ, b"\x00\x00"))  # patch later

        then_start = len(prog.instructions)
        self._emit_stmt_sequence(stmt.then_body, prog, env)

        if stmt.else_body is not None:
            jmp_index = len(prog.instructions)
            prog.instructions.append(Instruction(OP_JMP, b"\x00\x00"))  # patch later
            else_start = len(prog.instructions)
            self._emit_stmt_sequence(stmt.else_body, prog, env)
            end_index = len(prog.instructions)
            # else -> end
            prog.instructions[jmp_index].operand = struct.pack(">H", end_index)
            prog.instructions[jz_index].operand = struct.pack(">H", else_start)
        else:
            end_index = len(prog.instructions)
            prog.instructions[jz_index].operand = struct.pack(">H", end_index)

        _ = then_start

    # ---- expressions (leave exactly one value on the stack)

    def _emit_expr(self, expr, prog, env, uses: Optional[Set[str]] = None) -> None:
        uses = uses if uses is not None else set()

        if isinstance(expr, Literal):
            prog.instructions.append(Instruction(OP_PUSH, _literal_operand(expr.value)))
        elif isinstance(expr, Ident):
            uses.add(expr.name)
            prog.instructions.append(Instruction(OP_LOAD, expr.name.encode("utf-8")))
        elif isinstance(expr, Unary):
            self._emit_expr(expr.operand, prog, env, uses)
            if expr.op == "!":
                prog.instructions.append(Instruction(OP_NOT))
            elif expr.op == "-":
                prog.instructions.append(Instruction(OP_PUSH, _literal_operand(0)))
                prog.instructions.append(Instruction(OP_SUB))
        elif isinstance(expr, Binary):
            self._emit_expr(expr.left, prog, env, uses)
            self._emit_expr(expr.right, prog, env, uses)
            prog.instructions.append(Instruction(_binary_opcode(expr.op), _binary_operand(expr.op)))
        elif isinstance(expr, Call):
            self._emit_call(expr, prog, env, uses)
        else:
            raise TypeError(f"Unknown expression type: {type(expr)!r}")

    def _emit_call(self, call: Call, prog, env, uses: Set[str]) -> None:
        for arg in call.args:
            self._emit_expr(arg, prog, env, uses)

        name = call.name
        op = BUILTIN_OPCODES.get(name)
        if op is None:
            # namespaced call such as system.info -> CALL
            op = OP_CALL

        if name in ("encrypt", "log"):
            # stack-based forms: value(s) already pushed
            raw = _call_operand(name, len(call.args))
        else:
            raw = _call_operand(name, len(call.args))
        prog.instructions.append(Instruction(op, raw))


def _literal_operand(value) -> bytes:
    if isinstance(value, bool):
        return bytes([2, 1, 1 if value else 0])
    if isinstance(value, int):
        return bytes([1, 8]) + struct.pack(">q", value)
    if isinstance(value, str):
        data = value.encode("utf-8")
        if len(data) > 255:
            raise ValueError("string literal too long")
        return bytes([0, len(data)]) + data
    raise TypeError(f"Unsupported literal type: {type(value)!r}")


def _call_operand(name: str, argc: int) -> bytes:
    nb = name.encode("utf-8")
    if len(nb) > 255:
        raise ValueError("function name too long")
    return bytes([len(nb)]) + nb + bytes([argc])


_TEST_KINDS = {"==": 0, "!=": 1, "<": 2, ">": 3, "<=": 4, ">=": 5}


def _binary_opcode(op: str) -> int:
    return {
        "+": OP_ADD, "-": OP_SUB, "*": OP_MUL, "/": OP_DIV,
        "&&": OP_AND, "||": OP_OR,
    }.get(op, OP_TEST)


def _binary_operand(op: str) -> bytes:
    if op in _TEST_KINDS:
        return bytes([_TEST_KINDS[op]])
    return b""


def _run_is_independent(run: List[object]) -> bool:
    """True when every pair of statements can be safely reordered."""
    def uses_of(stmt) -> Set[str]:
        out: Set[str] = set()
        _walk_uses(stmt, out)
        return out

    def defs_of(stmt) -> Set[str]:
        return {stmt.name} if isinstance(stmt, Let) else set()

    for a in range(len(run)):
        for b in range(len(run)):
            if a == b:
                continue
            if uses_of(run[a]) & defs_of(run[b]):
                return False
            if uses_of(run[b]) & defs_of(run[a]):
                return False
            if defs_of(run[a]) & defs_of(run[b]):
                return False
    return True


def _walk_uses(node, out: Set[str]) -> None:
    if isinstance(node, Let):
        _walk_uses(node.expr, out)
    elif isinstance(node, Output):
        _walk_uses(node.expr, out)
    elif isinstance(node, ExprStmt):
        _walk_uses(node.expr, out)
    elif isinstance(node, Binary):
        _walk_uses(node.left, out)
        _walk_uses(node.right, out)
    elif isinstance(node, Unary):
        _walk_uses(node.operand, out)
    elif isinstance(node, Call):
        for a in node.args:
            _walk_uses(a, out)
    elif isinstance(node, Ident):
        out.add(node.name)


def compile_source(source: str) -> bytes:
    """Convenience: JOCKY source -> IR bytes."""
    return IREmitter(parse(source)).emit()
