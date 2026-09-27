package executor

import (
	"encoding/binary"
	"testing"
)

// ---- encoding helpers mirroring compiler/ir_emitter.py ----

func enc(op byte, raw []byte) []byte {
	key := byte(0x5A)
	out := []byte{op, byte(len(raw)), key}
	for _, b := range raw {
		out = append(out, b^key)
	}
	return out
}

func callFamily(op byte, name string, argc int) []byte {
	raw := append([]byte{byte(len(name))}, name...)
	raw = append(raw, byte(argc))
	return enc(op, raw)
}

func call(name string, argc int) []byte { return callFamily(OpCALL, name, 0) }

func pushInt(n int64) []byte {
	raw := make([]byte, 10)
	raw[0] = 1
	raw[1] = 8
	binary.BigEndian.PutUint64(raw[2:], uint64(n))
	return enc(OpPUSH, raw)
}

func pushStr(s string) []byte {
	raw := append([]byte{0, byte(len(s))}, s...)
	return enc(OpPUSH, raw)
}

func pushBool(b bool) []byte {
	v := byte(0)
	if b {
		v = 1
	}
	return enc(OpPUSH, []byte{2, 1, v})
}

func store(name string) []byte { return enc(OpSTORE, []byte(name)) }
func load(name string) []byte  { return enc(OpLOAD, []byte(name)) }
func output() []byte           { return enc(OpOUTPUT, nil) }
func add() []byte              { return enc(OpADD, nil) }
func sub() []byte              { return enc(OpSUB, nil) }
func mul() []byte              { return enc(OpMUL, nil) }

func jmp(target int) []byte {
	raw := make([]byte, 2)
	binary.BigEndian.PutUint16(raw, uint16(target))
	return enc(OpJMP, raw)
}

func jz(target int) []byte {
	raw := make([]byte, 2)
	binary.BigEndian.PutUint16(raw, uint16(target))
	return enc(OpJZ, raw)
}

func jnz(target int) []byte {
	raw := make([]byte, 2)
	binary.BigEndian.PutUint16(raw, uint16(target))
	return enc(OpJNZ, raw)
}

func testOp(kind byte) []byte { return enc(OpTEST, []byte{kind}) }
func ret() []byte             { return []byte{OpRET} }
func nop() []byte             { return []byte{OpNOP} }

// ---- tests ----

func TestExecuteSystemInfo(t *testing.T) {
	ir := append(nop(), call("system.info", 0)...)
	ir = append(ir, ret()...)

	result, err := Execute(ir, "user_mode")
	if err != nil {
		t.Fatalf("Execute failed: %v", err)
	}
	if result.System == nil {
		t.Fatalf("expected system info, got nil")
	}
	if result.System.Hostname == "" {
		t.Fatalf("expected hostname")
	}
	t.Logf("system: %+v", result.System)
}

func TestArithmeticStoreOutput(t *testing.T) {
	// (2 + 3) * 4 == 20
	ir := append(pushInt(2), pushInt(3)...)
	ir = append(ir, add()...)
	ir = append(ir, store("x")...)
	ir = append(ir, load("x")...)
	ir = append(ir, pushInt(4)...)
	ir = append(ir, mul()...)
	ir = append(ir, output()...)
	ir = append(ir, ret()...)

	result, err := Execute(ir, "user_mode")
	if err != nil {
		t.Fatalf("Execute failed: %v", err)
	}
	if len(result.Outputs) != 1 {
		t.Fatalf("expected 1 output, got %d", len(result.Outputs))
	}
	if result.Outputs[0] != float64(20) && result.Outputs[0] != int64(20) {
		// arithmetic returns float64
		if v, ok := result.Outputs[0].(float64); !ok || v != 20 {
			t.Fatalf("expected 20, got %#v", result.Outputs[0])
		}
	}
}

func TestJumpForwardSkipsBlock(t *testing.T) {
	// JMP over a push; then output whatever is on stack
	// [0] JMP -> skip [pushInt(999)] ; target index counts decoded instructions
	prog := [][]byte{jmp(3), pushInt(999), pushInt(7), pushInt(7)}
	// decoded: 0:JMP 1:PUSH999 2:PUSH7 3:PUSH7
	var ir []byte
	for _, p := range prog {
		ir = append(ir, p...)
	}
	ir = append(ir, output()...)
	ir = append(ir, ret()...)

	result, err := Execute(ir, "user_mode")
	if err != nil {
		t.Fatalf("Execute failed: %v", err)
	}
	if len(result.Outputs) != 1 {
		t.Fatalf("expected 1 output, got %d", len(result.Outputs))
	}
	if v, ok := result.Outputs[0].(int64); !ok || v != 7 {
		t.Fatalf("expected 7 (skipped 999), got %#v", result.Outputs[0])
	}
}

func TestConditionalJZTaken(t *testing.T) {
	// push false; JZ -> target where push 42; else push 9
	// indices: 0 PUSH(false) 1 JZ(4) 2 PUSH(9) 3 JMP(5) 4 PUSH(42) 5 OUTPUT 6 RET
	ir := append(pushBool(false), jz(4)...)
	ir = append(ir, pushInt(9)...)
	ir = append(ir, jmp(5)...)
	ir = append(ir, pushInt(42)...)
	ir = append(ir, output()...)
	ir = append(ir, ret()...)

	result, err := Execute(ir, "user_mode")
	if err != nil {
		t.Fatalf("Execute failed: %v", err)
	}
	if len(result.Outputs) != 1 {
		t.Fatalf("expected 1 output, got %d", len(result.Outputs))
	}
	if v, ok := result.Outputs[0].(int64); !ok || v != 42 {
		t.Fatalf("expected JZ to take branch (42), got %#v", result.Outputs[0])
	}
}

func TestConditionalJNZNotTaken(t *testing.T) {
	// push false; JNZ -> would skip push 9; since false, fall through to push 9
	// 0 PUSH(false) 1 JNZ(4) 2 PUSH(9) 3 JMP(5) 4 PUSH(42) 5 OUTPUT 6 RET
	ir := append(pushBool(false), jnz(4)...)
	ir = append(ir, pushInt(9)...)
	ir = append(ir, jmp(5)...)
	ir = append(ir, pushInt(42)...)
	ir = append(ir, output()...)
	ir = append(ir, ret()...)

	result, err := Execute(ir, "user_mode")
	if err != nil {
		t.Fatalf("Execute failed: %v", err)
	}
	if v, ok := result.Outputs[0].(int64); !ok || v != 9 {
		t.Fatalf("expected fall-through (9), got %#v", result.Outputs[0])
	}
}

func TestTESTComparison(t *testing.T) {
	// 5 > 3 -> true -> JNZ taken
	ir := append(pushInt(5), pushInt(3)...)
	ir = append(ir, testOp(3)...) // kind 3 = '>'
	ir = append(ir, jnz(5)...)
	ir = append(ir, pushInt(0)...) // skipped
	ir = append(ir, jmp(6)...)
	ir = append(ir, pushInt(1)...)
	ir = append(ir, output()...)
	ir = append(ir, ret()...)

	result, err := Execute(ir, "user_mode")
	if err != nil {
		t.Fatalf("Execute failed: %v", err)
	}
	if v, ok := result.Outputs[0].(int64); !ok || v != 1 {
		t.Fatalf("expected comparison branch (1), got %#v", result.Outputs[0])
	}
}

func TestCollectProcesses(t *testing.T) {
	ir := append(call("collect_processes", 0), ret()...)
	result, err := Execute(ir, "user_mode")
	if err != nil {
		t.Fatalf("Execute failed: %v", err)
	}
	if len(result.Processes) == 0 {
		t.Fatalf("expected processes")
	}
	t.Logf("collected %d processes", len(result.Processes))
}

func TestDecodeRejectsTruncated(t *testing.T) {
	if _, err := DecodeIR([]byte{OpCALL, 10, 0x5A}); err == nil {
		t.Fatalf("expected error for truncated IR")
	}
}

func TestDecodeStopsAtRet(t *testing.T) {
	ir := append(pushInt(1), ret()...)
	ir = append(ir, 0xFF, 0xFF, 0xFF) // trailing garbage after RET must be ignored
	result, err := Execute(ir, "user_mode")
	if err != nil {
		t.Fatalf("Execute failed: %v", err)
	}
	if len(result.Outputs) != 0 {
		t.Fatalf("expected no outputs")
	}
}

func TestLogAndFindings(t *testing.T) {
	ir := append(pushStr("hello"), callFamily(OpLOG, "info", 1)...)
	// LOG with argc 0; then collect_processes to add findings risk, then RET
	ir = append(ir, call("collect_processes", 0)...)
	ir = append(ir, ret()...)

	result, err := Execute(ir, "user_mode")
	if err != nil {
		t.Fatalf("Execute failed: %v", err)
	}
	if len(result.Logs) == 0 {
		t.Fatalf("expected logs")
	}
}
