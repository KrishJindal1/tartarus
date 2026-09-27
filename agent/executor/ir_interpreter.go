package executor

import (
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math"
	"strings"

	"tartarus-agent/byovd"
	"tartarus-agent/forensics"
)

// Opcodes - must match compiler/ir_emitter.py.
const (
	OpNOP     = 0x00
	OpCALL    = 0x01
	OpCOLLECT = 0x02
	OpDUMP    = 0x03
	OpANALYZE = 0x04
	OpEXEC    = 0x05
	OpRET     = 0x06
	OpPUSH    = 0x07
	OpPOP     = 0x08
	OpJMP     = 0x09
	OpJNZ     = 0x0A
	OpENCRYPT = 0x0B
	OpLOG     = 0x0C
	OpSYSCALL = 0x0D
	OpBYOVD   = 0x0E
	OpHOLLOW  = 0x0F
	OpSTORE   = 0x10
	OpLOAD    = 0x11
	OpTEST    = 0x12
	OpJZ      = 0x13
	OpOUTPUT  = 0x14
	OpADD     = 0x15
	OpSUB     = 0x16
	OpMUL     = 0x17
	OpDIV     = 0x18
	OpAND     = 0x19
	OpOR      = 0x1A
	OpNOT     = 0x1B
)

// Instruction is a decoded IR instruction (operand already XOR-decoded).
type Instruction struct {
	Op      byte
	Name    string
	Argc    int
	Operand []byte
	Target  int
	Kind    byte
	PushVal any
}

// ForensicResult aggregates findings collected during execution.
type ForensicResult struct {
	Processes   []forensics.ProcessInfo     `json:"processes,omitempty"`
	Network     []forensics.NetConn         `json:"network,omitempty"`
	Memory      []forensics.MemRegion       `json:"memory,omitempty"`
	Persistence []forensics.PersistEntry    `json:"persistence,omitempty"`
	Registry    []forensics.RegistryFinding `json:"registry,omitempty"`
	Files       []forensics.FileArtifact    `json:"files,omitempty"`
	Logons      []forensics.LogonSession    `json:"logons,omitempty"`
	Byovd       []byovd.DriverFinding       `json:"byovd,omitempty"`
	System      *forensics.SystemInfo       `json:"system,omitempty"`
	Outputs     []any                       `json:"outputs,omitempty"`
	Logs        []string                    `json:"logs,omitempty"`
	RiskScore   float64                     `json:"risk_score"`
	Findings    []string                    `json:"findings"`
}

// DecodeIR parses bytecode produced by the JOCKY compiler into instructions.
// NOP/RET are single bytes; all other instructions are [op][len][key][enc].
func DecodeIR(ir []byte) ([]Instruction, error) {
	var out []Instruction
	i := 0
	for i < len(ir) {
		op := ir[i]
		i++
		switch op {
		case OpNOP:
			out = append(out, Instruction{Op: OpNOP})
			continue
		case OpRET:
			out = append(out, Instruction{Op: OpRET})
			return out, nil
		}
		if i+2 > len(ir) {
			return nil, fmt.Errorf("truncated IR instruction at byte %d", i-1)
		}
		n := int(ir[i])
		key := ir[i+1]
		if i+2+n > len(ir) {
			return nil, fmt.Errorf("truncated IR operand at byte %d", i-1)
		}
		enc := ir[i+2 : i+2+n]
		raw := make([]byte, n)
		for j := 0; j < n; j++ {
			raw[j] = enc[j] ^ key
		}
		i += 2 + n

		ins, err := decodeOperand(op, raw)
		if err != nil {
			return nil, err
		}
		out = append(out, ins)
	}
	return out, fmt.Errorf("IR missing RET terminator")
}

func decodeOperand(op byte, raw []byte) (Instruction, error) {
	ins := Instruction{Op: op, Operand: raw}
	switch op {
	case OpCALL, OpCOLLECT, OpDUMP, OpANALYZE, OpEXEC, OpENCRYPT, OpLOG,
		OpSYSCALL, OpBYOVD, OpHOLLOW:
		if len(raw) < 2 {
			return ins, fmt.Errorf("call operand too short")
		}
		nameLen := int(raw[0])
		if 1+nameLen >= len(raw) {
			return ins, fmt.Errorf("invalid call name length")
		}
		ins.Name = string(raw[1 : 1+nameLen])
		ins.Argc = int(raw[1+nameLen])
	case OpPUSH:
		if len(raw) < 2 {
			return ins, fmt.Errorf("push operand too short")
		}
		typ := raw[0]
		l := int(raw[1])
		if 2+l > len(raw) {
			return ins, fmt.Errorf("push payload truncated")
		}
		body := raw[2 : 2+l]
		switch typ {
		case 0:
			ins.PushVal = string(body)
		case 1:
			if l != 8 {
				return ins, fmt.Errorf("int push must be 8 bytes")
			}
			ins.PushVal = int64(binary.BigEndian.Uint64(body))
		case 2:
			ins.PushVal = l == 1 && body[0] == 1
		default:
			return ins, fmt.Errorf("unknown push type %d", typ)
		}
	case OpJMP, OpJZ, OpJNZ:
		if len(raw) != 2 {
			return ins, fmt.Errorf("jump target must be 2 bytes")
		}
		ins.Target = int(binary.BigEndian.Uint16(raw))
	case OpTEST:
		if len(raw) != 1 {
			return ins, fmt.Errorf("test kind must be 1 byte")
		}
		ins.Kind = raw[0]
	case OpSTORE, OpLOAD, OpOUTPUT:
		ins.Name = string(raw)
	}
	return ins, nil
}

type vmState struct {
	result *ForensicResult
	vars   map[string]any
	stack  []any
}

// ExecuteIR executes a polymorphic JOCKY-IR program and returns the
// aggregated forensic result as JSON.
func ExecuteIR(ir []byte, execMode string) ([]byte, error) {
	result, err := Execute(ir, execMode)
	if err != nil {
		return nil, err
	}
	return json.Marshal(result)
}

// Execute runs the IR program and returns the structured ForensicResult.
func Execute(ir []byte, execMode string) (*ForensicResult, error) {
	if len(ir) == 0 {
		return nil, fmt.Errorf("empty IR")
	}
	if execMode == "" {
		execMode = "user_mode"
	}
	instrs, err := DecodeIR(ir)
	if err != nil {
		return nil, err
	}

	st := &vmState{
		result: &ForensicResult{Findings: []string{}},
		vars:   make(map[string]any),
	}

	pc := 0
	for pc < len(instrs) {
		ins := instrs[pc]
		next := pc + 1

		switch ins.Op {
		case OpNOP:
			// skip
		case OpRET:
			st.result.RiskScore = scoreRisk(st.result)
			return st.result, nil
		case OpPUSH:
			st.stack = append(st.stack, ins.PushVal)
		case OpPOP:
			if _, err := st.pop(); err != nil {
				return nil, err
			}
		case OpSTORE:
			v, err := st.pop()
			if err != nil {
				return nil, err
			}
			st.vars[ins.Name] = v
		case OpLOAD:
			v, ok := st.vars[ins.Name]
			if !ok {
				v = nil
			}
			st.stack = append(st.stack, v)
		case OpOUTPUT:
			v, err := st.pop()
			if err != nil {
				return nil, err
			}
			st.result.Outputs = append(st.result.Outputs, v)
		case OpLOG:
			args, err := st.popN(ins.Argc)
			if err != nil {
				return nil, err
			}
			msg := joinArgs(args)
			st.result.Logs = append(st.result.Logs, msg)
			st.stack = append(st.stack, msg)
		case OpENCRYPT:
			args, err := st.popN(ins.Argc)
			if err != nil {
				return nil, err
			}
			sealed, err := sealValue(args)
			if err != nil {
				return nil, err
			}
			st.stack = append(st.stack, sealed)
		case OpJMP:
			next = ins.Target
		case OpJZ:
			v, err := st.pop()
			if err != nil {
				return nil, err
			}
			if !truthy(v) {
				next = ins.Target
			}
		case OpJNZ:
			v, err := st.pop()
			if err != nil {
				return nil, err
			}
			if truthy(v) {
				next = ins.Target
			}
		case OpTEST:
			b, err := st.pop()
			if err != nil {
				return nil, err
			}
			a, err := st.pop()
			if err != nil {
				return nil, err
			}
			st.stack = append(st.stack, compare(a, b, ins.Kind))
		case OpADD, OpSUB, OpMUL, OpDIV, OpAND, OpOR:
			b, err := st.pop()
			if err != nil {
				return nil, err
			}
			a, err := st.pop()
			if err != nil {
				return nil, err
			}
			v, err := arithmetic(ins.Op, a, b)
			if err != nil {
				return nil, err
			}
			st.stack = append(st.stack, v)
		case OpNOT:
			v, err := st.pop()
			if err != nil {
				return nil, err
			}
			st.stack = append(st.stack, !truthy(v))
		case OpCALL, OpCOLLECT, OpDUMP, OpANALYZE, OpEXEC, OpSYSCALL, OpBYOVD, OpHOLLOW:
			args, err := st.popN(ins.Argc)
			if err != nil {
				return nil, err
			}
			if execMode != "user_mode" && execMode != "kernel_mode" {
				return nil, fmt.Errorf("unsupported execution mode: %s", execMode)
			}
			out, err := dispatch(ins, args)
			if err != nil {
				return nil, err
			}
			st.applySection(ins.Name, out)
			st.stack = append(st.stack, out)
		default:
			return nil, fmt.Errorf("unsupported IR opcode: 0x%02x", ins.Op)
		}
		pc = next
	}
	// Fell off the end without RET - treat as complete.
	st.result.RiskScore = scoreRisk(st.result)
	return st.result, nil
}

// applySection mirrors discovered data into the aggregate result sections.
func (st *vmState) applySection(name string, out any) {
	switch name {
	case "collect_processes", "system.info.processes":
		if v, ok := out.([]forensics.ProcessInfo); ok {
			st.result.Processes = v
		}
	case "collect_network":
		if v, ok := out.([]forensics.NetConn); ok {
			st.result.Network = v
		}
	case "collect_logons":
		if v, ok := out.([]forensics.LogonSession); ok {
			st.result.Logons = v
		}
	case "collect_files":
		if v, ok := out.([]forensics.FileArtifact); ok {
			st.result.Files = v
		}
	case "collect_system", "system.info":
		if v, ok := out.(forensics.SystemInfo); ok {
			st.result.System = &v
		}
	case "dump_memory":
		if v, ok := out.([]forensics.MemRegion); ok {
			st.result.Memory = v
		}
	case "dump_registry":
		if v, ok := out.([]forensics.RegistryFinding); ok {
			st.result.Registry = v
		}
	case "analyze_persistence":
		if v, ok := out.([]forensics.PersistEntry); ok {
			st.result.Persistence = v
		}
	case "scan_byovd":
		if v, ok := out.([]byovd.DriverFinding); ok {
			st.result.Byovd = v
		}
	}
	if findings, ok := out.([]string); ok {
		st.result.Findings = append(st.result.Findings, findings...)
	}
}

func dispatch(ins Instruction, args []any) (any, error) {
	name := ins.Name
	if strings.Contains(name, ".") {
		// Namespaced call, e.g. system.info
		switch name {
		case "system.info":
			return forensics.CollectSystem(), nil
		default:
			return nil, fmt.Errorf("unknown JOCKY namespace call: %s", name)
		}
	}

	switch ins.Op {
	case OpBYOVD:
		return byovd.ScanLoadedDrivers(), nil
	case OpSYSCALL:
		return forensics.DirectSyscallProbe(), nil
	case OpHOLLOW:
		// Scripts are interpreted directly in this process memory (fileless);
		// no secondary payload or process hollowing is performed.
		return map[string]any{
			"mode":     "in-process",
			"note":     "JOCKY scripts execute in-memory inside the agent process (zero disk writes)",
			"executed": name,
		}, nil
	}

	switch name {
	case "collect_processes":
		return forensics.CollectProcesses(), nil
	case "collect_network":
		return forensics.CollectNetwork(), nil
	case "collect_logons":
		return forensics.CollectLogons(), nil
	case "collect_system":
		return forensics.CollectSystem(), nil
	case "collect_files":
		dir := "/"
		if len(args) > 0 {
			if s, ok := args[0].(string); ok && s != "" {
				dir = s
			}
		}
		return forensics.CollectFiles(dir), nil
	case "dump_memory":
		pid := 0
		if len(args) > 0 {
			pid = toInt(args[0])
		}
		return forensics.DumpMemoryRegions(pid), nil
	case "dump_registry":
		return forensics.DumpRegistry(), nil
	case "analyze_persistence":
		return forensics.AnalyzePersistence(), nil
	case "scan_byovd":
		return byovd.ScanLoadedDrivers(), nil
	case "exec_direct_syscall":
		return forensics.DirectSyscallProbe(), nil
	case "exec_hollow":
		return map[string]any{
			"mode": "in-process",
			"note": "JOCKY scripts execute in-memory inside the agent process (zero disk writes)",
		}, nil
	default:
		return nil, fmt.Errorf("unknown JOCKY function: %s", name)
	}
}

// ------------------------------------------------------------- stack helpers

func (st *vmState) pop() (any, error) {
	if len(st.stack) == 0 {
		return nil, fmt.Errorf("stack underflow")
	}
	v := st.stack[len(st.stack)-1]
	st.stack = st.stack[:len(st.stack)-1]
	return v, nil
}

func (st *vmState) popN(n int) ([]any, error) {
	if n < 0 || len(st.stack) < n {
		return nil, fmt.Errorf("stack underflow popping %d args", n)
	}
	top := len(st.stack)
	args := append([]any{}, st.stack[top-n:]...)
	st.stack = st.stack[:top-n]
	// args are in push order already (left-to-right)
	return args, nil
}

func truthy(v any) bool {
	switch t := v.(type) {
	case nil:
		return false
	case bool:
		return t
	case string:
		return t != ""
	case int:
		return t != 0
	case int64:
		return t != 0
	case float64:
		return t != 0
	case []any:
		return len(t) > 0
	default:
		// non-empty structs / slices via reflection-lite checks
		b, err := json.Marshal(v)
		if err == nil {
			s := string(b)
			return s != "null" && s != "[]" && s != "{}" && s != `""` && s != "0" && s != "false"
		}
		return true
	}
}

func toInt(v any) int {
	switch t := v.(type) {
	case int:
		return t
	case int64:
		return int(t)
	case float64:
		return int(t)
	case string:
		var n int
		fmt.Sscanf(t, "%d", &n)
		return n
	}
	return 0
}

func toFloat(v any) (float64, bool) {
	switch t := v.(type) {
	case int:
		return float64(t), true
	case int64:
		return float64(t), true
	case float64:
		return t, true
	}
	return 0, false
}

func compare(a, b any, kind byte) bool {
	// numeric comparison when both numeric
	if fa, okA := toFloat(a); okA {
		if fb, okB := toFloat(b); okB {
			switch kind {
			case 0:
				return fa == fb
			case 1:
				return fa != fb
			case 2:
				return fa < fb
			case 3:
				return fa > fb
			case 4:
				return fa <= fb
			case 5:
				return fa >= fb
			}
		}
	}
	sa := fmt.Sprintf("%v", a)
	sb := fmt.Sprintf("%v", b)
	switch kind {
	case 0:
		return sa == sb
	case 1:
		return sa != sb
	case 2:
		return sa < sb
	case 3:
		return sa > sb
	case 4:
		return sa <= sb
	case 5:
		return sa >= sb
	}
	return false
}

func arithmetic(op byte, a, b any) (any, error) {
	if op == OpAND {
		return truthy(a) && truthy(b), nil
	}
	if op == OpOR {
		return truthy(a) || truthy(b), nil
	}
	// string concatenation for ADD
	if s, ok := a.(string); ok {
		if t, ok2 := b.(string); ok2 && op == OpADD {
			return s + t, nil
		}
	}
	fa, okA := toFloat(a)
	fb, okB := toFloat(b)
	if !okA || !okB {
		return nil, fmt.Errorf("arithmetic on non-numeric operands")
	}
	switch op {
	case OpADD:
		return fa + fb, nil
	case OpSUB:
		return fa - fb, nil
	case OpMUL:
		return fa * fb, nil
	case OpDIV:
		if fb == 0 {
			return nil, fmt.Errorf("division by zero")
		}
		return fa / fb, nil
	}
	return nil, fmt.Errorf("bad arithmetic op")
}

func joinArgs(args []any) string {
	parts := make([]string, 0, len(args))
	for _, a := range args {
		parts = append(parts, fmt.Sprintf("%v", a))
	}
	return strings.Join(parts, " ")
}

// sealValue produces an integrity-sealed representation of a value.
// With no transport key configured this is a SHA-256 content seal.
func sealValue(args []any) (any, error) {
	if len(args) == 0 {
		return nil, fmt.Errorf("encrypt() requires a value")
	}
	blob, err := json.Marshal(args[0])
	if err != nil {
		return nil, err
	}
	h := sha256.Sum256(blob)
	sum := hex.EncodeToString(h[:])
	return map[string]any{
		"sealed": true,
		"alg":    "sha256",
		"sha256": sum,
		"size":   len(blob),
	}, nil
}

// scoreRisk applies the heuristic risk model (0-10).
func scoreRisk(r *ForensicResult) float64 {
	score := 0.0
	for _, p := range r.Processes {
		if p.IsSuspicious {
			score += 2.0
			r.Findings = append(r.Findings, fmt.Sprintf("suspicious process %s (pid %d)", p.Name, p.PID))
		}
	}
	score += float64(len(r.Persistence)) * 1.5
	if len(r.Persistence) > 0 {
		r.Findings = append(r.Findings, fmt.Sprintf("%d persistence mechanism(s) detected", len(r.Persistence)))
	}
	for _, m := range r.Memory {
		if strings.Contains(strings.ToLower(m.Permissions), "rwx") {
			score += 1.0
			r.Findings = append(r.Findings, fmt.Sprintf("RWX region at %s (pid %d)", m.BaseAddress, m.PID))
		}
	}
	score += float64(len(r.Byovd)) * 3.0
	if len(r.Byovd) > 0 {
		r.Findings = append(r.Findings, fmt.Sprintf("%d vulnerable driver(s) loaded", len(r.Byovd)))
	}
	for _, l := range r.Logons {
		if l.IsPrivilege {
			score += 2.0
		}
	}
	if score > 10.0 {
		score = 10.0
	}
	return math.Round(score*10) / 10
}
