# JOCKY — Implementation Details

> Complete inventory of what is implemented, what is verified working, every
> predefined script, every opcode/function, test results, and known limitations.
> Companion docs: [`README.md`](README.md) (how to run) ·
> [`documentation.md`](documentation.md) (language syntax).

**Status summary: all 6 implementation phases from `implementation.md` are
complete.** Code stats: ~3,800 lines Python (compiler + backend), ~3,250 lines
Go (agent), ~10,900 lines TypeScript (frontend).

---

## 1. Implementation status matrix

| Area | Component | Status | Verified how |
|---|---|---|---|
| Compiler | Lexer / parser / AST | ✅ implemented | 11/11 unit tests (`python3 compiler/tests.py`) |
| Compiler | IR emitter + jump patching | ✅ implemented | unit tests + job E2E |
| Compiler | Polymorphic engine (unique hash/compile) | ✅ implemented | `test_polymorphic_unique_hashes`, per-job SHA-256 in DB |
| Compiler | Go codegen (IR → .go) | ✅ implemented | `test_codegen_go` |
| Backend | SQLite store mirroring Supabase schema | ✅ implemented | live DB, 10 scripts + admin seeded |
| Backend | JWT auth (console + agent tokens, roles) | ✅ implemented | login/refresh/me + agent Bearer E2E |
| Backend | Job dispatch (compile→mutate→queue→claim) | ✅ implemented | live jobs claimed by agent |
| Backend | Result ingestion (evidence, SHA-256, risk) | ✅ implemented | evidence rows + risk scores in DB |
| Backend | Reports (JSON + PDF, MITRE mapping) | ✅ implemented | `GET /reports/{id}/json` & `/pdf` (valid PDF) |
| Backend | Audit trail + middleware | ✅ implemented | `GET /audit` shows register/job/result actions |
| Backend | R2 encrypted payload path | ⚠️ code present | not E2E-tested (no R2 credentials locally); falls back to inline |
| Backend | Supabase path | ⚠️ optional | falls back to SQLite when `SUPABASE_URL` empty (boto3/supabase not installed locally) |
| Agent | IR VM interpreter (28 opcodes) | ✅ implemented | 4 test packages pass; live execution |
| Agent | Forensics collectors (Linux) | ✅ implemented | live: 88 processes, 61 sockets, 42 persistence rows |
| Agent | Forensics collectors (Windows) | ⚠️ partial | builds cross-compile; registry Run keys + system probe real, process/net/logon collectors return empty (future work) |
| Agent | Crypto (AES-256-GCM, RSA-OAEP) | ✅ implemented | round-trip unit tests |
| Agent | Transport (register/poll/submit, jitter, heartbeat) | ✅ implemented | unit test + live loop |
| Agent | BYOVD driver detection | ✅ implemented | unit tests; detection-only |
| Agent | EDR callback nullification | ⛔ deliberately disabled | returns structured "disabled" report (see §7) |
| Agent | Process hollowing exploit | ⛔ deliberately not implemented | `exec_hollow` = in-process fileless execution |
| Frontend | Typed API client (`lib/api.ts`) | ✅ implemented | tsc clean, build passes |
| Frontend | Live dashboard polling (3 s) | ✅ implemented | maps agents/scripts/jobs/evidence/reports |
| Frontend | Run Suite → real job dispatch | ✅ implemented | API-level E2E identical path |
| Frontend | Production build | ✅ passing | `next build` exit 0; `tsc --noEmit` exit 0 |
| Infra | docker-compose + worker | ✅ implemented | worker command runs (`python -m services.result_ingester --worker`) |
| Infra | Cloudflare Worker edge gateway | ✅ implemented | env-bound config, agent-token forwarding (deploy-time) |
| Infra | `.env.example` (no real secrets) | ✅ redacted | credential scrubbed |
| Infra | `scripts/seed_scripts.py`, `register_agent.py` | ✅ working | both run successfully against live backend |

Legend: ✅ implemented & verified · ⚠️ present but untested/partial · ⛔ intentionally out of scope

---

## 2. JOCKY compiler (`compiler/`)

**Pipeline:** source → tokens → AST → IR instructions (with jump patching and
safe statement scheduling) → polymorphic mutation → bytes + SHA-256.

### 2.1 Features

- **Lexer**: `#` line comments, string literals with `\n \t \" \\` escapes,
  decimal integers, identifiers, keywords/builtins, longest-match operators
  (`==` before `=`).
- **Parser**: `fn` declarations with optional typed params (`pid: int`),
  `let`, `output`, `if / else / else-if`, full expression grammar with
  precedence, grouping `( … )`, calls including dotted names (`system.info`).
- **Emitter**: emits 28 opcodes; patches forward jumps after block emission;
  tracks variable use/def per statement for scheduling; **if a `main` function
  exists only it runs, otherwise every declared function runs in order**
  (function bodies are inlined at compile time).
- **Scheduling (polymorphism part 1)**: runs of pairwise-independent
  `let`/expression statements are shuffled before emission.
- **Polymorphic mutations (per compile)**: random XOR key per instruction,
  random NOP sled at program head (jump targets retargeted), balanced
  `PUSH`/`POP` dead-code inserted before the final `RET`, random tail padding
  after `RET`. **Every `POST /jobs/create` produces a brand-new SHA-256.**
- **Codegen**: `compiler/codegen.py` wraps IR bytes in generated Go source.

### 2.2 IR opcode set (28)

| Opcode | Byte | Operand encoding | Stack effect |
|---|---|---|---|
| `NOP` | 0x00 | none (1 byte) | — |
| `CALL` | 0x01 | `[name_len][name][argc]` | pops argc, pushes result |
| `COLLECT` | 0x02 | same as CALL | collector call |
| `DUMP` | 0x03 | same as CALL | dump call (`dump_memory`, `dump_registry`) |
| `ANALYZE` | 0x04 | same as CALL | `analyze_persistence` |
| `EXEC` | 0x05 | same as CALL | `exec_hollow`, `exec_direct_syscall` |
| `RET` | 0x06 | none (1 byte) | halt |
| `PUSH` | 0x07 | `[type][len][bytes]` (0=str, 1=int64 BE, 2=bool) | +1 |
| `POP` | 0x08 | — | −1 |
| `JMP` | 0x09 | `[u16 BE target index]` | — |
| `JNZ` | 0x0A | `[u16 BE]` | pops 1, branch if truthy |
| `ENCRYPT` | 0x0B | call family | pops 1, pushes sealed value |
| `LOG` | 0x0C | call family (level name) | pops argc, pushes message |
| `SYSCALL` | 0x0D | call family | pushes probe result |
| `BYOVD` | 0x0E | call family | pushes findings |
| `HOLLOW` | 0x0F | call family | pushes in-process exec note |
| `STORE` | 0x10 | `[name bytes]` | pops 1 → var |
| `LOAD` | 0x11 | `[name bytes]` | pushes var |
| `TEST` | 0x12 | `[kind]` 0== 1!= 2< 3> 4<= 5>= | pops 2, pushes bool |
| `JZ` | 0x13 | `[u16 BE]` | pops 1, branch if falsy |
| `OUTPUT` | 0x14 | `[name bytes]` | pops 1 → outputs |
| `ADD SUB MUL DIV` | 0x15–0x18 | — | pops 2, pushes result |
| `AND OR` | 0x19–0x1A | — | pops 2, pushes bool |
| `NOT` | 0x1B | — | pops 1, pushes bool |

> Note: `exec_hollow` / `exec_direct_syscall` are emitted as `EXEC`; the
> `SYSCALL` and `HOLLOW` opcodes are part of the ISA and accepted by the VM
> (dispatching on the call name).

**Byte-level encoding** (must match `agent/executor/ir_interpreter.go`):
`NOP`/`RET` are single bytes; every other instruction is
`[op][operand_len u8][xor_key u8][operand XOR key]`.
Jump targets are absolute instruction indices over the *decoded* list; the VM
halts at `RET` (trailing padding after `RET` is ignored).

### 2.3 Tests — `python3 compiler/tests.py` → **11/11 passed**

```
test_codegen_go · test_emit_and_decode · test_format_ir_listing ·
test_if_jumps_patch · test_lexer · test_mutation_preserves_semantics_shape ·
test_parser_dotted_call · test_parser_fn · test_parser_if_else ·
test_polymorphic_unique_hashes · test_seed_scripts_compile
```

---

## 3. Backend (`backend/`)

### 3.1 Modules

| Module | Responsibility |
|---|---|
| `core/config.py` | pydantic-settings (`AUTH_ENABLED`, `JWT_*`, `DATABASE_PATH`, `R2_*`, Supabase, seed admin) |
| `core/db.py` | SQLite schema mirroring `infra/supabase/schema.sql`: `users, agents, scripts, jobs, evidence, results, audit_logs` |
| `core/security.py` | PBKDF2 password hashing, JWT issue/verify (python-jose), deps `current_user` / `require_role` / `require_agent` / `agent_matches` / `check_worker_secret` |
| `core/crypto.py` | AES-256-GCM encrypt (12-byte nonce prefix), RSA-OAEP(SHA-256) wrap/unwrap, key generation |
| `core/r2_client.py` | optional boto3 R2 upload/download + presigned GET |
| `core/supabase_client.py` | optional supabase client |
| `core/seed.py` | seeds 10 predefined scripts + admin user (idempotent) |
| `services/polymorphic.py` | `mutate_source()` → (ir bytes, sha256) via compiler |
| `services/job_dispatcher.py` | compile → (optional R2 encrypt+upload) → queue; `claim_pending_job` |
| `services/result_ingester.py` | parse result → evidence rows (SHA-256) → risk score → job completed; `__main__ --worker` loop |
| `services/report_generator.py` | JSON report + MITRE technique map (`T1055, T1059, T1082, …`) + reportlab PDF + `list_reports` |
| `services/audit_logger.py` | append-only audit rows |
| `main.py` | router mounts, startup `init_db + seed_all`, audit middleware, `/health`, `/audit` |

### 3.2 API surface (see README §9 for the full table)

7 routers: `auth, agents, jobs, results, scripts, evidence, reports`
(prefixes `/auth /agents /jobs /results /scripts /evidence /reports`) plus
`/health` and `/audit`.

Scripts router (IDE support): `POST /scripts/compile` (dry-run → IR listing + AST + error
without saving), `PUT /scripts/{id}` (recompile + version bump, 403 on predefined),
`DELETE /scripts/{id}` (403 on predefined).

### 3.3 Job lifecycle

```
queued ──claim──► dispatched ──agent executes──► completed
   │                                        (or failed on IR error)
```

`POST /jobs/create` → `mutate_source()` (fresh SHA-256) → optional R2
encryption (`payloads/{job}/payload.enc`, RSA-wrapped AES key) → row with
`ir_sha256`. Agent polls `GET /jobs/pending/{agent_id}` (Bearer agent token),
executes, `POST /results/submit` → evidence rows (`type, data, sha256,
risk_score, collected_at`) → job `completed` + `risk_score` +
`findings_summary`.

### 3.4 Evidence & risk model (agent + ingester)

- Each section (process/network/persistence/…) becomes an evidence row with a
  SHA-256 over its JSON payload.
- Agent risk score (0–10, heuristic): `+2` per suspicious process,
  `+1.5` per persistence entry, `+1` per RWX memory region, `+3` per
  vulnerable driver, `+2` per privileged logon — capped at 10, rounded to 1 dp.

### 3.5 Auth

- `AUTH_ENABLED=false` (default/dev): console routes use implicit
  `dev-user` admin — frontend works without login.
- `AUTH_ENABLED=true`: `POST /auth/login` → JWT (`access_token`), attached by
  the frontend from `localStorage` (`jocky_token`).
- Agents always use `agent_token` (JWT `typ=agent`) from
  `POST /agents/register`; the poll route requires it to match the `agent_id`.

---

## 4. Go agent (`agent/`, module `tartarus-agent`)

### 4.1 Package layout

| Package | Contents |
|---|---|
| `main.go` | flags `--agent-id --c2 --privkey --poll-min --poll-max`; register → heartbeat → poll loop |
| `executor/` | `ir_interpreter.go` (decode + 28-opcode VM + risk scoring), `memory_loader.go` (fileless pinning), tests |
| `forensics/` | `types.go` + collectors with build tags (below), tests |
| `byovd/` | `driver_list.go` (17-driver CVE intel), `scanner.go` (Linux `/proc/modules`), `scanner_windows.go`, `callback_nullifier.go` (disabled), tests |
| `crypto/` | `aes.go` (AES-256-GCM), `rsa.go` (PKCS#1/PKCS#8 load, OAEP unwrap), `public.go`, `hash.go`, tests |
| `transport/` | `poll.go` (Client: register/heartbeat/poll/submit, jitter, re-register on 401, R2 payload resolve), `tls.go` (TLS ≥1.2), `upload.go` (presigned PUT), tests |
| `config/` | `AgentConfig` struct |

### 4.2 Forensic collectors → builtins

| JOCKY builtin | Linux | Windows | macOS/BSD |
|---|---|---|---|
| `collect_processes()` | `/proc` scan: pid/ppid/name/exe/RSS + suspicious (deleted/tmp/shm exe) | own-process baseline (Toolhelp32 = future) | empty (no /proc) |
| `collect_network()` | `/proc/net/{tcp,tcp6,udp,udp6}` + socket→PID via `/proc/*/fd` | empty (GetExtendedTcpTable = future) | empty |
| `dump_memory(pid)` | `/proc/*/maps` → RWX / executable-anon / deleted-file regions; `0` = full scan (≤256 pids) | empty (VirtualQueryEx = future) | empty |
| `analyze_persistence()` | cron (`/etc/cron*`, user crontabs), systemd units, XDG/`~` autostart, `rc.local`, `profile.d` + suspicious-command heuristics (`curl`, `nc -e`, `/dev/tcp/`, base64…) | registry Run/RunOnce/Policies keys | same as Linux minus /proc specifics |
| `collect_files(dir)` | walk (depth ≤4, ≤200 files), SHA-256 ≤32 MB, double-extension & SUID heuristics | same (portable) | same (portable) |
| `collect_logons()` | `/run/utmp` parse (USER_PROCESS: user/line/host/time, root ⇒ privileged) | empty (Event Log = future) | empty |
| `collect_system()` | `uname`, `/etc/os-release`, sysinfo uptime, AV presence | `RtlGetVersion`, `GetTickCount64` | `uname` + `kern.boottime` |
| `dump_registry()` | empty (non-Windows) | Run-key extraction (`HKLM/HKCU …\Run`, `RunOnce`, Policies) | empty |
| `scan_byovd()` | `/proc/modules` + `/dev`,`/lib/modules` vs 17-driver CVE table | empty (EnumDeviceDrivers = future) | empty |
| `exec_direct_syscall()` | raw `SYS_GETPID`/`SYS_GETUID` (read-only probe) | kernel32 `GetCurrentProcessId/Tid` | raw syscall |
| `exec_hollow()` | in-process fileless execution note (no hollowing exploit) | same | same |
| `encrypt(value)` | SHA-256 content seal `{alg, sha256, size}` | same | same |
| `log(msg…)` | appends to `result.logs`, returns message | same | same |
| `system.info` (dotted) | `CollectSystem()` | same | same |

### 4.3 Transport behaviour

1. `POST /agents/register` (hostname, os, arch, public RSA key) → stores
   `agent_token`.
2. Poll loop: `GET /jobs/pending/{id}` with `Authorization: Bearer` —
   404 = idle (heartbeat every 5 idle polls), 401 = auto re-register,
   jittered interval `poll-min..poll-max` seconds.
3. Payload: inline `ir` bytes, or R2 mode → `GET /jobs/{id}/payload-url`
   (presigned) → fetch `nonce||ciphertext` → RSA-OAEP unwrap AES key →
   AES-GCM decrypt → IR.
4. Execute in memory (`LoadTaskInMemory` keeps ≤8 tasks resident, never
   written to disk), then `POST /results/submit` with the JSON result as
   `message`.

### 4.4 Tests — `cd agent && go test ./...` → **5/5 packages pass**

```
ok tartarus-agent/executor    (10 tests: jumps, TEST, logging, RET-padding, truncation…)
ok tartarus-agent/crypto      (AES round-trip, RSA-OAEP unwrap, PEM parse)
ok tartarus-agent/forensics   (processes/system/network/memory/persistence/logons/syscall)
ok tartarus-agent/byovd       (scanner, intel lookup, nullifier-disabled)
ok tartarus-agent/transport   (httptest E2E register→poll→execute→submit, idle 404)
```

Cross-compile verified: `GOOS=linux`, `GOOS=windows`, `GOOS=darwin` all build.

---

## 5. Frontend (`frontend/`)

Multi-page Next.js 16 App Router console (route group `app/(dashboard)/`), fully driven by the
live backend — **no mock data remains**. Dark theme is pinned (`html.dark`): background
`#0C0E11`, cards `#14181E`, borders `#24282F`, accent teal `#12A594`/`#2DD4BF`, mint green
`#4ADE9E` (success), lavender `#A78BFA` (scripts/keywords), soft red `#E5654E`/orange
`#E07B39` (critical), warm yellow `#E3B341` (warnings). Dark is the default (no system flash);
the header light/dark toggle persists via `localStorage['jocky-theme']` and still works.

| Route | Page | Contents |
|---|---|---|
| `/` | Overview | 6 live KPI cards (agents, scripts, jobs, evidence, reports, critical findings), recent-jobs table, endpoint list, quick actions, Run suite |
| `/run` | **Run workflow** | guided 4-step flow — 1 pick endpoint → 2 pick script (searchable) → 3 review + Execute → 4 response: live polling (2s), verdict/risk/evidence/duration tiles, findings, raw result JSON, evidence list, links to job/report. Preselect via `?agent=&script=` |
| `/agents`, `/agents/[id]` | Endpoints | searchable agent table (status, OS/arch, AV, jobs, last seen) + detail page with metadata and that agent's jobs; "Register endpoint" modal shows the real `scripts/register_agent.py` command |
| `/scripts` | Scripts | script table: category, risk, target OS, version, IR SHA-256, Edit → IDE, Run → queued on first online agent |
| `/scripts/new`, `/scripts/[id]` | **JOCKY script IDE** | custom dependency-free editor: syntax highlighting (keywords, builtins, strings, `#` comments, numbers), line numbers, tab/indent handling; toolbar = Open file (upload `.jky/.txt`), New, **Compile** (dry-run `POST /scripts/compile` → IR listing + AST + SHA-256 without saving), **Save/Create** (`POST`/`PUT`, Ctrl+S), Delete; IR/AST inspector tabs; Run panel (agent picker + last-job link); builtin scripts are read-only → "Save as new" |
| `/jobs`, `/jobs/[id]` | Jobs | filterable job table + detail: lifecycle timeline, findings summary, executed IR listing, raw agent result payloads, evidence table with JSON preview/download, report + PDF links; auto-refreshes while running |
| `/evidence` | Evidence | evidence table (type, host, job, SHA-256, risk, size, collected), per-type stat chips, **real** JSON preview modal, real JSON download, export-all |
| `/reports`, `/reports/[jobId]` | Reports | report table + full report page: verdict/severity banner, risk score, timeline, evidence summary table, MITRE ATT&CK technique links, grouped findings, raw JSON, PDF download |

State: `providers/dashboard-provider.tsx` — single context polling
`/agents /scripts /jobs /evidence /evidence/summary /reports` every 3 s; mappers carry only
real fields (no invented AV/evasion/technique values); `runSuite()` queues one
`POST /jobs/create` per deployed script on the first online agent. Navigation is
`next/link` + `usePathname` (sidebar badges = live counts).

**Removed as fabricated/duplicate** (previous single-page console): the *Live status*, *Results*
and *Timeline* views (fake nodes, pass rates, audit events); fake metric cards (AV Evasion Rate
99.3 %, Kernel Callbacks 18, Tunnel Uptime 99.97 %); 10 mock `data/*` files (only
`data/navigation.ts` remains, now with hrefs); fake header alerts + target switcher; fake
`avStatus` / `technique` / `evasionStatus` / `0/72` fields in the state mappers; mock evidence
download content; 9 unused dashboard cards/tables; 14 mock modals; 5 unused UI primitives.

Verification: `tsc --noEmit` = 0 errors; `next build` = 12 routes, exit 0; every route returns
HTTP 200; E2E through the IDE path: create → dry-run compile → dispatch → completed job with
evidence, result and report.

---

## 6. Predefined JOCKY scripts (10, seeded)

| # | Name | Category | Risk | Target | What it does |
|---|---|---|---|---|---|
| 1 | Process Monitor | process | medium | both | collect process table, output it |
| 2 | Memory Dump | memory | high | both | dump memory regions, output **encrypted** (SHA-256 sealed) |
| 3 | Network Map | network | low | both | collect sockets (with PID mapping), output |
| 4 | Persistence Check | persistence | high | both | cron/systemd/autostart/rc.local scan, output |
| 5 | Registry Forensics | registry | critical | windows | extract registry Run keys, output sealed |
| 6 | User Login Audit | logons | medium | both | utmp session audit, output |
| 7 | System Info | system | low | both | host/OS/kernel/uptime/AV, output |
| 8 | File Recovery | files | medium | both | notable-file walk of `/etc` with SHA-256, output |
| 9 | Full Endpoint Audit | process | high | linux | processes + network + persistence + system, `if` branch with `log()`, 4 outputs |
| 10 | BYOVD Driver Audit | system | critical | both | vulnerable-driver scan, output |

Exact sources (these are what the backend seeds):

```jocky
# 1 — Process Monitor
fn collect_processes() {
  let procs = collect_processes()
  output procs
}

# 2 — Memory Dump
fn dump_memory() {
  let regions = dump_memory(0)
  output encrypt(regions)
}

# 3 — Network Map
fn collect_network() {
  let conns = collect_network()
  output conns
}

# 4 — Persistence Check
fn analyze_persistence() {
  let entries = analyze_persistence()
  output entries
}

# 5 — Registry Forensics
fn dump_registry() {
  let hive = dump_registry()
  output encrypt(hive)
}

# 6 — User Login Audit
fn collect_logons() {
  let sessions = collect_logons()
  output sessions
}

# 7 — System Info
fn collect_system() {
  let info = collect_system()
  output info
}

# 8 — File Recovery
fn collect_files() {
  let files = collect_files("/etc")
  output files
}

# 9 — Full Endpoint Audit
fn full_audit() {
  let procs = collect_processes()
  let net = collect_network()
  let pers = analyze_persistence()
  let sys = collect_system()
  if procs == 0 {
    log("no processes?")
  }
  output sys
  output procs
  output net
  output pers
}

# 10 — BYOVD Driver Audit
fn byovd_audit() {
  let vuln = scan_byovd()
  output vuln
}
```

---

## 7. Scope decisions (security)

This is a **forensic collection** tool. Deliberately **not** implemented:

1. **EDR callback nullification** (the BYOVD *exploit* half). The agent scans
   for known vulnerable drivers (CVE intel for 17 drivers: `dbutil_2_3.sys`,
   `rtcore64.sys`, `capcom.sys`, `winring0.sys`, …) and reports them for
   remediation. `byovd.CallbackNullifier()` returns
   `{"nullification": "disabled", "recommended_action": "block driver load…"}`.
2. **Process-hollowing exploit code.** `exec_hollow()` executes the script
   **in-process, in memory** (zero disk writes) and reports that mode.
3. `exec_direct_syscall()` only performs read-only identity probes
   (`getpid`/`getuid`), not injection syscalls.

---

## 8. Verified end-to-end results (live run on this machine)

| Step | Evidence |
|---|---|
| Job created | `POST /jobs/create` → `queued`, `ir_sha256=5a27bf0b…` |
| Agent claim | `GET /jobs/pending` 200, log `Job received … mode=user_mode` |
| Execution | log `Job … completed (41611 bytes result)` |
| Collection | `88 processes, 61 network (PID-mapped), 42 persistence, 1 system, 4 outputs` |
| Findings | `suspicious process tartarus-agent (pid 71114)` (running from `/tmp`), `42 persistence mechanism(s) detected` |
| Risk | `risk_score = 10.0` (capped) |
| Evidence | rows per section with SHA-256; `GET /evidence/summary` → `by_type` counts |
| Report | `GET /reports/{id}/json` → severity + MITRE `['T1055','T1059','T1082']`; `/pdf` → valid 3 KB PDF |
| Audit | `GET /audit` → `agent.register`, `job.create`, `job.status`, result actions |
| Latency | job create → completed ≈ 2 s (poll interval 2–5 s) |

Frontend verification: TypeScript clean, production build clean, and the UI's
`Run Suite` path (tokenless `POST /jobs/create` under `AUTH_ENABLED=false`)
reproduced the same pipeline.

---

## 9. Test & build matrix (current tree)

| Command | Result |
|---|---|
| `python3 compiler/tests.py` | **11/11 passed** |
| `cd agent && go test ./...` | **all packages ok** |
| `cd agent && go build ./...` (linux) | OK |
| `GOOS=windows go build ./...` | OK |
| `GOOS=darwin go build ./...` (amd64+arm64) | OK |
| `cd frontend && tsc --noEmit` | 0 errors |
| `cd frontend && next build` | exit 0 |
| `curl /health` | `{"status":"operational","version":"2.5.0"}` |
| `python3 -m services.result_ingester --worker` | runs (worker loop) |
| `python3 scripts/seed_scripts.py` | seeds 10 scripts |
| `python3 scripts/register_agent.py …` | registers agent, prints start command |

---

## 10. Known limitations / future work

1. **Windows collectors**: process enumeration (Toolhelp32), network table
   (`GetExtendedTcpTable`), memory regions (`VirtualQueryEx`), logon sessions
   (Event Log) are stubs — the packages compile and registry/system probes are
   real.
2. **R2 + Supabase E2E**: code paths exist and fall back gracefully, but were
   not exercised against live credentials in this environment.
3. **Result-side R2 encryption round-trip**: results are submitted inline via
   `POST /results/submit`; the worker/R2 ingest path records encrypted blobs
   opaquely (server has only the RSA-wrapped key).
4. **Frontend browser E2E**: no headless browser in the dev loop — verified
   via type-check, production build, and API-identical request paths.
5. **Cloudflare Worker** and **ML service** (`ML_SERVICE_URL`) are deployment
   artifacts; no live Worker/ML endpoint was provisioned.
6. `post-upgrade` items: mTLS between agent and backend, evidence at-rest
   encryption with per-tenant keys, signed agent binaries.
