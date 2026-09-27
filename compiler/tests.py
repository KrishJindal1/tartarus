"""
JOCKY compiler test suite. Run:  python3 -m compiler.tests
(or python3 compiler/tests.py from the repo root)
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from compiler.lexer import Lexer, TokenType
from compiler.parser import parse, Call, FnDecl, Let, Output, If
from compiler.ir_emitter import (
    IREmitter, decode_instructions, format_ir, OP_RET, OP_JZ, OP_JMP,
)
from compiler.polymorphic_engine import generate_unique_ir, mutate_ir, sha256_hex
from compiler.codegen import CodeGenerator


def test_lexer():
    src = '# comment\nlet x = 42\noutput "hello world"'
    toks = Lexer(src).tokenize()
    types = [t.type for t in toks]
    assert TokenType.KEYWORD in types
    assert TokenType.NUMBER in types
    assert TokenType.STRING in types
    assert toks[-1].type is TokenType.EOF
    print("ok  test_lexer")


def test_parser_fn():
    src = """
    fn collect_all() {
        let procs = collect_processes()
        output procs
    }
    """
    prog = parse(src)
    assert len(prog.functions) == 1
    fn = prog.functions[0]
    assert fn.name == "collect_all"
    assert isinstance(fn.body[0], Let)
    assert isinstance(fn.body[1], Output)
    print("ok  test_parser_fn")


def test_parser_if_else():
    src = """
    fn check() {
        let info = collect_system()
        if info == 1 {
            log("x")
        } else {
            log("y")
        }
    }
    """
    prog = parse(src)
    assert isinstance(prog.functions[0].body[1], If)
    assert prog.functions[0].body[1].else_body is not None
    print("ok  test_parser_if_else")


def test_parser_dotted_call():
    prog = parse("system.info()")
    assert isinstance(prog.stmts[0].expr, Call)
    assert prog.stmts[0].expr.name == "system.info"
    print("ok  test_parser_dotted_call")


def test_emit_and_decode():
    src = """
    fn main() {
        let procs = collect_processes()
        let net = collect_network()
        output procs
        output net
    }
    """
    prog = IREmitter(parse(src)).emit_program()
    data = prog.to_bytes()
    instrs = decode_instructions(data)
    assert instrs[-1].op == OP_RET
    names = [i.name for i in instrs]
    assert "COLLECT" in names and "STORE" in names and "OUTPUT" in names
    print("ok  test_emit_and_decode")


def test_if_jumps_patch():
    src = """
    fn f() {
        let a = 1
        if a == 1 {
            log("yes")
        } else {
            log("no")
        }
    }
    """
    data = IREmitter(parse(src)).emit()
    instrs = decode_instructions(data)
    jumps = [i for i in instrs if i.op in (OP_JZ, OP_JMP)]
    assert len(jumps) == 2
    assert all(len(j.operand) == 2 for j in jumps)
    print("ok  test_if_jumps_patch")


def test_polymorphic_unique_hashes():
    src = "fn s() { let x = collect_system()\n output x }"
    hashes = {sha256_hex(generate_unique_ir(src)[0]) for _ in range(8)}
    assert len(hashes) == 8, f"expected 8 unique hashes, got {len(hashes)}"
    print("ok  test_polymorphic_unique_hashes")


def test_mutation_preserves_semantics_shape():
    src = "fn s() { let x = collect_system()\n output x }"
    ir, _ = generate_unique_ir(src)
    ir2 = mutate_ir(ir)
    # both must decode to instruction lists ending in RET
    a, b = decode_instructions(ir), decode_instructions(ir2)
    assert a[-1].op == OP_RET and b[-1].op == OP_RET
    print("ok  test_mutation_preserves_semantics_shape")


def test_format_ir_listing():
    data = IREmitter("system.info()").emit()
    listing = format_ir(data)
    assert "CALL" in listing and "system.info" in listing
    print("ok  test_format_ir_listing")


def test_codegen_go():
    data = IREmitter("collect_processes()").emit()
    go = CodeGenerator(data).generate()
    assert "func ScriptIR() []byte" in go
    assert "0x01" in go
    print("ok  test_codegen_go")


def test_seed_scripts_compile():
    # The 8 predefined scripts' JOCKY sources must all compile.
    seeds = [
        'fn collect_processes() {\n  let procs = collect_processes()\n  output procs\n}',
        'fn dump_memory(pid: int) {\n  let regions = dump_memory(0)\n  output encrypt(regions)\n}',
        'fn collect_network() {\n  let conns = collect_network()\n  output conns\n}',
        'fn analyze_persistence() {\n  let entries = analyze_persistence()\n  output entries\n}',
        'fn dump_registry() {\n  let hive = dump_registry()\n  output encrypt(hive)\n}',
        'fn collect_logons() {\n  let sessions = collect_logons()\n  output sessions\n}',
        'fn collect_system() {\n  let info = collect_system()\n  output info\n}',
        'fn collect_files(path: str) {\n  let files = collect_files("/etc")\n  output files\n}',
    ]
    for src in seeds:
        ir, _ = generate_unique_ir(src)
        assert len(ir) > 0
    print("ok  test_seed_scripts_compile  (%d scripts)" % len(seeds))


def main():
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failed = 0
    for t in tests:
        try:
            t()
        except Exception as exc:
            failed += 1
            print(f"FAIL {t.__name__}: {exc.__class__.__name__}: {exc}")
    print(f"\n{len(tests) - failed}/{len(tests)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
