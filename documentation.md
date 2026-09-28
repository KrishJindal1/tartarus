# JOCKY Language — Syntax Reference

> Complete reference for the **JOCKY forensic DSL**: lexical structure,
> grammar, statements, expressions, built-in functions, semantics, compilation
> to polymorphic IR, and worked examples.
>
> Source of truth: `compiler/grammar.py`, `compiler/lexer.py`,
> `compiler/parser.py`, `compiler/ir_emitter.py`, and the runtime in
> `agent/executor/ir_interpreter.go`.

---

## 1. Overview

JOCKY is a small, domain-specific language for describing **forensic
collection tasks**. A JOCKY program is compiled to a compact, polymorphic
instruction stream (IR) that is executed **in memory** by the endpoint agent —
no intermediate files are written.

```jocky
# Minimal program
fn collect_system() {
  let info = collect_system()
  output info
}
```

Everything a script can do is one of:

- call a **built-in forensic function** (`collect_*`, `dump_*`,
  `analyze_persistence`, `scan_byovd`, …),
- bind results with **`let`**,
- emit results with **`output`**,
- emit diagnostics with **`log(...)`**,
- branch with **`if / else`**,
- compute with ordinary **arithmetic / comparison / logic operators**.

---

## 2. Lexical structure

### 2.1 Comments

```jocky
# everything from '#' to end of line is ignored
let x = 1   # trailing comment
```

### 2.2 Identifiers

```
identifier := [A-Za-z_][A-Za-z0-9_]*
```

### 2.3 Integer literals

```
number := [0-9]+
```

Decimal integers only (no floats, no exponents, no hex). Negative numbers are
written with the unary minus: `-1`.

### 2.4 String literals

Double quotes with escapes `\n`, `\t`, `\"`, `\\` (an unrecognised escape
passes the character through literally):

```jocky
let msg = "line one\nline two"
log("found \"suspicious\" process")
```

### 2.5 Keywords (reserved)

```
fn  let  output  if  else  return  true  false
scan  collect  dump  analyze  exec  for  in  use  import  target  encrypt  log
```

- **Active in the grammar:** `fn`, `let`, `output`, `if`, `else`,
  `true`, `false`, and `encrypt` / `log` (usable as call names).
- **Reserved (not yet in the grammar):** `return`, `scan`, `collect`, `dump`,
  `analyze`, `exec`, `for`, `in`, `use`, `import`, `target` — writing them as
  statements is a syntax error today.

### 2.6 Built-in names (pre-classified tokens)

```
collect_processes  collect_network  collect_files  collect_logons  collect_system
dump_memory  dump_registry  analyze_persistence  scan_byovd
exec_hollow  exec_direct_syscall  encrypt  log
```

A built-in name may also be used as your own function name (the seeded
scripts do exactly this: `fn collect_processes() { … }` is legal).

### 2.7 Type names (documentation-level)

```
Process  Network  Memory  File  Registry  Driver  System  Logon
```

Annotations after `:` in parameters are accepted and skipped by the parser
(they document intent: `pid: int`, `path: str`).

### 2.8 Operators & punctuation

| Class | Tokens |
|---|---|
| Comparison | `==` `!=` `<` `>` `<=` `>=` |
| Arithmetic | `+` `-` `*` `/` |
| Logic | `&&` `\|\|` `!` |
| Assignment | `=` (only in `let name = expr`) |
| Grouping | `( )` `{ }` `[ ]` |
| Misc | `.` `,` `;` `:` |

`[ ]` is tokenised but array literals are **not** part of the current grammar.
Semicolons are **optional**: they are accepted after `let`, `output`, and
expression statements.

---

## 3. Grammar (EBNF)

```ebnf
program     := stmt*

stmt        := fnDecl | letStmt | outputStmt | ifStmt | exprStmt

fnDecl      := 'fn' IDENT '(' params? ')' '{' stmt* '}'
params      := param (',' param)*
param       := IDENT (':' IDENT)?          (* annotation accepted, not enforced *)

letStmt     := 'let' IDENT '=' expr ';'? 

outputStmt  := 'output' expr ';'?

ifStmt      := 'if' expr '{' stmt* '}'
               ('else' ( ifStmt | '{' stmt* '}' ))?

exprStmt    := expr ';'?

expr        := or
or          := and ( '||' and )*
and         := equality ( '&&' equality )*
equality    := comparison ( ('==' | '!=') comparison )*
comparison  := term ( ('<' | '>' | '<=' | '>=') term )*
term        := factor ( ('+' | '-') factor )*
factor      := unary ( ('*' | '/') unary )*
unary       := ('!' | '-') unary | primary
primary     := NUMBER
             | STRING
             | 'true' | 'false'
             | '(' expr ')'
             | call
call        := name '(' args? ')'          (* name = IDENT | BUILTIN | IDENT '.' IDENT *)
args        := expr (',' expr)*
```

### Operator precedence (lowest → highest)

| Level | Operators | Associativity |
|---|---|---|
| 1 | `\|\|` | left |
| 2 | `&&` | left |
| 3 | `==` `!=` | left |
| 4 | `<` `>` `<=` `>=` | left |
| 5 | `+` `-` | left |
| 6 | `*` `/` | left |
| 7 | `!` `-` (unary) | right |
| 8 | `( )`, literals, calls | — |

---

## 4. Statements

### 4.1 Function declaration — `fn`

```jocky
fn audit() {
  let procs = collect_processes()
  output procs
}
```

- Optional typed parameters: `fn check(pid: int) { … }`
  (annotations are parsed and ignored; **arguments are not bound at runtime** —
  call the collectors without parameters, as all predefined scripts do).
- **Execution order:**
  1. top-level statements of the file run first,
  2. then, if a function named **`main`** exists, **only `main`** runs,
     otherwise **every declared function runs in declaration order**.
- Function bodies are inlined at compile time (no call stack).

### 4.2 Variable binding — `let`

```jocky
let conns = collect_network()     # bind a collection result
let count = 10                    # bind a literal
let label = "audit run"           # bind a string
```

- One `let` per name per scope is the intended style; re-binding with `let`
  re-assigns the flat runtime variable.
- Undeclared reads evaluate to `null` (falsy).

### 4.3 Emitting results — `output`

```jocky
output procs                      # append value to the job's outputs
output encrypt(regions)           # append a SHA-256-sealed representation
```

Each `output` appends one item to the result's `outputs[]` array, which the
backend turns into evidence rows.

### 4.4 Diagnostics — `log(...)`

```jocky
log("no processes?")
log("collected", count)           # multiple arguments are space-joined
```

`log` is a **call** (it takes parentheses). Messages are appended to
`result.logs` and echo the message value (so `let m = log("x")` works).

### 4.5 Conditional — `if / else`

```jocky
if procs == 0 {
  log("no processes?")
} else {
  log("process table captured")
}

if risk > 5 {
  output procs
} else if risk > 2 {              # else-if: nested if directly after else
  log("medium risk")
}
```

- Condition is any expression; evaluated for **truthiness** (§6.2).
- Braces are mandatory; `else if` chains are supported (a nested `if`
  immediately after `else`).

### 4.6 Expression statements

Any expression may stand alone; its value is discarded:

```jocky
collect_system()
```

(Typically you bind or `output` results instead.)

---

## 5. Built-in functions

All built-ins compile to a dedicated IR opcode and are executed by the agent's
collectors (see `details.md` §4.2 for per-OS support).

### 5.1 Collection

| Function | Returns | IR opcode | Description |
|---|---|---|---|
| `collect_processes()` | process list | `COLLECT` | pid/ppid/name/exe/RSS + anomaly flags (`/proc` on Linux) |
| `collect_network()` | socket list | `COLLECT` | TCP/UDP listeners & connections with owning PID |
| `collect_files(path)` | file artifacts | `COLLECT` | walk `path` (string arg; default `/`), SHA-256 + double-extension/SUID heuristics |
| `collect_logons()` | session list | `COLLECT` | login sessions (utmp on Linux; root ⇒ privileged) |
| `collect_system()` | system info | `COLLECT` | hostname, OS, kernel, arch, uptime, AV presence |

### 5.2 Dumps & analysis

| Function | Returns | IR opcode | Description |
|---|---|---|---|
| `dump_memory(pid)` | memory regions | `DUMP` | notable regions (RWX, exec-anon, deleted-file). `0` = scan all processes (capped) |
| `dump_registry()` | registry findings | `DUMP` | auto-run keys (Windows only; empty elsewhere) |
| `analyze_persistence()` | persistence entries | `ANALYZE` | cron/systemd/autostart/rc.local/profile.d (+ suspicious-command heuristics) |
| `scan_byovd()` | driver findings | `BYOVD` | loaded drivers matched against a 17-entry CVE table (**detection only**) |

### 5.3 Execution & utilities

| Function | Returns | IR opcode | Description |
|---|---|---|---|
| `exec_direct_syscall()` | probe map | `EXEC` | read-only raw-syscall identity probe (pid/uid) |
| `exec_hollow()` | mode map | `EXEC` | reports in-process fileless execution (no hollowing exploit) |
| `encrypt(value)` | sealed value | `ENCRYPT` | integrity seal: `{sealed, alg:"sha256", sha256, size}` |
| `log(args…)` | message string | `LOG` | append to `result.logs` |

### 5.4 Namespaced call

| Call | Returns | Description |
|---|---|---|
| `system.info()` | system info | alias of `collect_system()` (dotted-call form) |

### 5.5 Calling conventions

- Arguments are evaluated left-to-right and pushed before the call.
- Every built-in returns exactly **one value** (lists/maps are single values).
- Unknown function names are a **compile-time error**
  (`unknown JOCKY function`).

---

## 6. Expressions & runtime semantics

### 6.1 Arithmetic, comparison, logic

```jocky
let sum  = 2 + 3 * 4        # 14 (precedence)
let risk = sum > 10          # true (boolean)
let ok   = risk && !(1 == 2) # logical
```

- `+` also concatenates when **both** sides are strings.
- `+ - * /` require numeric operands (float64 internally); `/` by zero is a
  runtime error that fails the job.
- Comparisons: numeric when both sides are numeric, otherwise
  lexicographic string comparison of the rendered values.
- `&&`, `||`, `!` work on truthiness and return booleans.

### 6.2 Truthiness

| Value | Falsy when |
|---|---|
| `null` / missing variable | always |
| `false` | — |
| `""` (empty string) | empty |
| `0` | zero |
| lists `{}`-like renders | `[]`, `{}`, `null`, `""`, `0`, `false` |

Anything else is truthy (including non-empty strings/lists and objects).

### 6.3 Execution modes

Jobs carry an `exec_mode` (`user_mode` or `kernel_mode`). The VM accepts these
two; any other value fails the job. Collectors run identically in both modes
in this build (the mode is recorded for audit).

### 6.4 Risk scoring (computed by the agent after execution)

```
+2.0  per suspicious process (exe deleted / lives in /tmp or /dev/shm)
+1.5  per persistence entry
+1.0  per RWX memory region
+3.0  per vulnerable driver (BYOVD match)
+2.0  per privileged logon
      … capped at 10.0, rounded to 1 decimal
```

Findings strings are attached alongside (e.g.
`suspicious process X (pid N)`, `42 persistence mechanism(s) detected`).

---

## 7. Compilation to polymorphic IR

### 7.1 Pipeline

```
source ─► lexer ─► parser (AST) ─► IR emitter ─► polymorphic engine ─► bytes + sha256
```

1. **Emission** — each statement becomes instructions; forward jumps for
   `if/else` are patched after their target index is known; safe `let` /
   expression statements are **shuffled** when independent.
2. **Mutations (unique per compile)**:
   - random XOR key per instruction,
   - random NOP sled at the head (jump targets retargeted),
   - balanced `PUSH/POP` dead code just before the final `RET`,
   - random padding after `RET` (ignored by the VM).

   ⇒ *every job gets a brand-new IR SHA-256 even for the same source.*

### 7.2 Byte encoding

| Instruction | Bytes |
|---|---|
| `NOP` (0x00), `RET` (0x06) | 1 byte |
| everything else | `[opcode][operand_len u8][xor_key u8][operand XOR key]` |

Operand layouts:

```
call-family (CALL/COLLECT/DUMP/ANALYZE/EXEC/ENCRYPT/LOG/SYSCALL/BYOVD/HOLLOW):
    [name_len u8][name bytes][argc u8]
PUSH:
    [type u8][len u8][bytes]     type: 0 = str, 1 = int64 (big-endian), 2 = bool
STORE / LOAD / OUTPUT:
    [name bytes]
JMP / JZ / JNZ:
    [target u16 big-endian]      absolute index into the decoded instruction list
TEST:
    [kind u8]                    0 ==  1 !=  2 <  3 >  4 <=  5 >=
ADD..NOT, NOP, RET:
    (no operand)
```

### 7.3 Example

Source:

```jocky
fn main() {
  let a = 2 + 3
  output a
}
```

becomes (conceptually) the decoded instruction list:

```
0: PUSH 2
1: PUSH 3
2: ADD
3: STORE a
4: LOAD a
5: OUTPUT
6: RET
```

wrapped in per-instruction XOR keys, preceded by a NOP sled and followed by
dead code + padding — with every jump target shifted to match.

### 7.4 Compiling from the CLI

```bash
python3 - <<'PY'
import sys; sys.path.insert(0, '.')
from compiler.polymorphic_engine import generate_unique_ir
ir, sha = generate_unique_ir('''
fn main() {
  let info = collect_system()
  output info
}
''')
print(len(ir), 'bytes', sha)
PY
```

Or simply `POST /jobs/create` — the backend compiles and mutates per job.

---

## 8. Complete worked examples

### 8.1 Simple collector

```jocky
# System inventory
fn collect_system() {
  let info = collect_system()
  output info
}
```

### 8.2 Branching + logging

```jocky
fn full_audit() {
  let procs = collect_processes()
  let net   = collect_network()
  let pers  = analyze_persistence()
  let sys   = collect_system()

  if procs == 0 {
    log("no processes?")
  }

  output sys
  output procs
  output net
  output pers
}
```

### 8.3 Sealed (integrity-hashed) output

```jocky
fn dump_memory() {
  let regions = dump_memory(0)     # 0 = all processes (capped)
  output encrypt(regions)          # emits {alg, sha256, size} instead of raw dump
}
```

### 8.4 File triage

```jocky
fn triage() {
  let hits = collect_files("/etc")  # string argument
  output hits
  if hits == 0 {
    log("no notable files")
  }
}
```

### 8.5 Kernel/driver audit (detection only)

```jocky
fn byovd_audit() {
  let vuln = scan_byovd()
  output vuln
}
```

### 8.6 Custom script via API

```bash
curl -X POST http://127.0.0.1:8000/scripts/ \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "My Audit",
    "category": "process",
    "risk_level": "medium",
    "os_target": "linux",
    "jocky_source": "fn main() {\n  let p = collect_processes()\n  output p\n}"
  }'
```

Then dispatch it: `POST /jobs/create` with the returned `id` as `script_id`.

---

## 9. Errors

| Stage | Example message | Meaning |
|---|---|---|
| Lex | `Unterminated string at position N` | missing closing `"` |
| Lex | `Unexpected character 'x' at line L` | character not in the grammar |
| Parse | `Unexpected token …` | grammar violation (e.g. `for` loop — reserved) |
| Parse | `Unexpected keyword 'if' in expression` | keyword used where an expression is expected |
| Compile | `unknown JOCKY function: foo` | call to a name that is not a built-in |
| Runtime | `stack underflow` | unbalanced expression (compiler bug indicator) |
| Runtime | `division by zero` | `/` with zero divisor |
| Runtime | `unsupported execution mode: X` | job `exec_mode` not `user_mode`/`kernel_mode` |

A runtime failure marks the job **failed** and records the error in
`findings_summary`.

---

## 10. Quick cheat sheet

```jocky
# comment
fn name(arg: int) {                # function (main runs alone if present)
  let v = collect_processes()      # bind
  let s = "text"                   # string
  let n = 2 + 3 * 4                # arithmetic
  let b = n > 10 && s != ""        # logic / comparison

  if b {
    output encrypt(v)              # sealed emit
    log("branch taken", n)         # diagnostic (space-joined)
  } else if n == 0 {
    log("zero")
  } else {
    output v                       # plain emit
  }

  let sys = system.info()          # dotted call
  output sys
}
```

**Built-ins at a glance:**
`collect_processes` · `collect_network` · `collect_files(path)` ·
`collect_logons` · `collect_system` · `dump_memory(pid)` · `dump_registry` ·
`analyze_persistence` · `scan_byovd` · `exec_direct_syscall` · `exec_hollow` ·
`encrypt(value)` · `log(…)` · `system.info()`
