# JOCKEY Framework — Forensic Analysis & Telemetry Platform

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.12-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)
![Go](https://img.shields.io/badge/Go-Agent-brightgreen.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.3.3-black.svg)
![React](https://img.shields.io/badge/React-19-cyan.svg)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg)

> **SIH Problem Statement 26148 (NTRO)** — a cross-platform forensic analysis framework
> (**JOCKEY**, a.k.a. *Tartarus*) built on a custom **JOCKEY DSL**, **polymorphic IR
> compilation**, **in-memory (fileless) execution**, and **BYOVD detection** for
> Windows/Linux endpoints, controlled from a single web console.

---

## 📖 Table of Contents

1. [What this repo contains](#1-what-this-repo-contains)
2. [Architecture](#2-architecture)
3. [Prerequisites](#3-prerequisites)
4. [Quick Start (local, 3 terminals)](#4-quick-start-local-3-terminals)
5. [End-to-end walkthrough](#5-end-to-end-walkthrough)
6. [Docker](#6-docker)
7. [Environment variables](#7-environment-variables)
8. [Testing](#8-testing)
9. [API quick reference](#9-api-quick-reference)
10. [Cross-compiling the agent](#10-cross-compiling-the-agent)
11. [Documentation files](#11-documentation-files)
12. [Security scope & limitations](#12-security-scope--limitations)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. What this repo contains

```
jockey/
├── compiler/            # JOCKEY DSL → polymorphic IR compiler (Python)
│   ├── grammar.py       #   keywords, types, builtins, operators
│   ├── lexer.py         #   tokenizer
│   ├── parser.py        #   AST (fn/let/if/output/expressions)
│   ├── ir_emitter.py    #   IR opcodes, jump patching, statement scheduling
│   ├── polymorphic_engine.py  # per-compile mutation (unique SHA-256 per job)
│   ├── codegen.py       #   Go source generation embedding IR
│   └── tests.py         #   11/11 test suite
├── backend/             # FastAPI control plane (import root = backend/)
│   ├── main.py          #   app, router mount, audit middleware, /health
│   ├── core/            #   config, SQLite db, security (JWT), crypto, seed
│   ├── services/        #   dispatch, ingest, polymorphic, reports, audit
│   └── routers/         #   auth, agents, jobs, results, scripts, evidence, reports
├── agent/               # Go endpoint agent (module: tartarus-agent)
│   ├── main.go          #   register → poll → execute → submit loop
│   ├── executor/        #   IR VM interpreter (28 opcodes) + tests
│   ├── forensics/       #   collectors (process/net/memory/persistence/…)
│   ├── byovd/           #   vulnerable-driver detection scanner
│   ├── crypto/          #   AES-256-GCM, RSA-OAEP
│   └── transport/       #   hardened TLS client, poll loop + tests
├── frontend/            # Next.js 16 + React 19 + TypeScript console
│   ├── lib/api.ts       #   typed backend client
│   ├── hooks/useDashboardState.ts  # live polling dashboard state
│   └── components/      #   views: Overview, Endpoints, Scripts, Results, Evidence…
├── scripts/             # seed_scripts.py, register_agent.py CLIs
├── infra/
│   ├── supabase/schema.sql   # reference schema (SQLite mirrors it locally)
│   └── cloudflare/worker.js  # optional edge gateway (token check → R2)
├── docker-compose.yml   # backend + result-ingestion worker
├── .env.example         # all environment variables (no secrets)
├── implementation.md    # original spec
├── details.md           # what is implemented & working (full inventory)
└── documentation.md     # JOCKEY language syntax reference
```

---

## 2. Architecture

```
 JOCKEY script (.jky source)
        │
        ▼
 ┌──────────────────────────────┐   compiler/  (Python)
 │ lexer → parser → AST         │
 │ IR emitter (opcodes, jumps)  │──► polymorphic mutation: XOR keys,
 │ polymorphic engine           │    NOP sled, dead code, unique SHA-256
 └──────────────┬───────────────┘
                │ POST /jobs/create
                ▼
 ┌──────────────────────────────┐   backend/  (FastAPI + SQLite)
 │ job queue (queued → claimed) │◄──── agent GET /jobs/pending/{id}
 │ evidence + risk scoring      │◄──── agent POST /results/submit
 │ reports (JSON/PDF, MITRE)    │      /evidence, /reports
 └──────────────┬───────────────┘
                │ polled every 2–5 s (jittered), Bearer agent token
                ▼
 ┌──────────────────────────────┐   agent/  (Go)
 │ IR VM: decode XOR operands,  │
 │ execute opcodes in memory    │──► forensics collectors (no disk writes)
 │ (fileless)                   │──► BYOVD driver detection
 └──────────────┬───────────────┘
                ▲
                │ GET /agents, /jobs, /evidence, /reports (3 s poll)
 ┌──────────────┴───────────────┐   frontend/  (Next.js)
 │ dashboard: endpoints, jobs,  │
 │ scripts, evidence, reports,  │
 │ "Run Suite" → jobs/create    │
 └──────────────────────────────┘
```

---

## 3. Prerequisites

| Tool      | Version       | Notes                                        |
|-----------|---------------|----------------------------------------------|
| Python    | 3.10+ (3.12)  | backend + compiler                           |
| Go        | 1.22+         | this repo's `go.mod` says `go 1.27` — builds auto-fetch the toolchain (`GOTOOLCHAIN`) |
| Node.js   | 18+ (20/24 ✓) | frontend                                     |
| openssl   | any           | (optional) generate agent keys               |

Python deps are listed in `backend/requirements.txt` (fastapi, uvicorn,
pydantic-settings, python-jose, passlib, cryptography, reportlab, httpx …).
`boto3` / `supabase` are **optional** — the backend falls back to SQLite and
inline payload delivery when they are absent.

---

## 4. Quick Start (local, 3 terminals)

### 4.1 Backend (port 8000)

```bash
cd backend
pip install -r requirements.txt          # once
uvicorn main:app --host 127.0.0.1 --port 8000
```

On startup the backend automatically:
- creates `backend/jockey.db` (SQLite, mirrors `infra/supabase/schema.sql`),
- seeds **10 predefined JOCKY scripts**,
- seeds the console admin: **`admin@jockey.local` / `Jockey#Admin1`**.

Verify: `curl http://127.0.0.1:8000/health` → `{"status":"operational","version":"2.5.0"}`

> Auth is **off by default** (`AUTH_ENABLED=false`) for development — console
> endpoints work without a token (implicit dev admin). Set `AUTH_ENABLED=true`
> in production to enforce JWT login on every console route.

### 4.2 Frontend (port 3000)

```bash
cd frontend
npm install                          # once
npm run dev                          # http://localhost:3000
```

The dashboard polls the backend every 3 s. API base URL defaults to
`http://127.0.0.1:8000` (override with `NEXT_PUBLIC_API_BASE_URL`).

### 4.3 Agent (endpoint collector)

```bash
# one-time: build + generate the agent's RSA key
cd agent
GOTOOLCHAIN=auto go build -o /tmp/tartarus-agent .
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out /tmp/agent_private.pem

# register the agent with the backend (prints the exact start command)
cd ..
python3 scripts/register_agent.py --hostname LAB-01 --os linux \
    --key-output /tmp/agent_private.pem --backend http://127.0.0.1:8000

# start it (use the agent_id printed above)
/tmp/tartarus-agent --agent-id <AGENT_ID> \
    --c2 http://127.0.0.1:8000 \
    --privkey /tmp/agent_private.pem \
    --poll-min 2 --poll-max 5
```

Expected agent log:

```
[TARTARUS-AGENT] Registration successful
[TARTARUS-AGENT] Agent is ready
[TARTARUS-AGENT] Job received: <uuid> (mode=user_mode, sha=…)
[TARTARUS-AGENT] Job <uuid> completed (41611 bytes result)
```

> Alternative: `python3 scripts/seed_scripts.py` re-seeds the scripts at any time
> (idempotent).

---

## 5. End-to-end walkthrough

1. **Open** <http://localhost:3000> — *Overview* shows the live agent as
   `Healthy`, real KPI metrics, and the jobs table.
2. Click **Run Suite** (or command palette → *run-suite*). This issues
   `POST /jobs/create` **for every deployed script** against the first online
   agent (10 jobs for the seeded scripts).
3. The agent claims jobs (`GET /jobs/pending/{agent_id}`), executes the
   polymorphic IR **in memory**, and submits results
   (`POST /results/submit`) within seconds.
4. Watch the jobs table flip `Queued → Running → Completed`; findings appear,
   e.g. `42 persistence mechanism(s) detected`.
5. **Evidence** view lists per-job artifacts (type, SHA-256, target, size);
   **Reports** view lists per-job reports with risk scores.
6. Fetch a report from the API:
   ```bash
   curl http://127.0.0.1:8000/reports/<job_id>/json
   curl -o report.pdf http://127.0.0.1:8000/reports/<job_id>/pdf
   ```

Manual equivalents:

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@jockey.local","password":"Jockey#Admin1"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')

curl -s http://127.0.0.1:8000/scripts/ -H "Authorization: Bearer $TOKEN"
curl -s -X POST http://127.0.0.1:8000/jobs/create \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"agent_id":"<AGENT_ID>","script_id":"<SCRIPT_ID>","exec_mode":"user_mode"}'
curl -s http://127.0.0.1:8000/jobs/ | python3 -m json.tool
curl -s http://127.0.0.1:8000/evidence/summary -H "Authorization: Bearer $TOKEN"
```

---

## 6. Docker

```bash
cp .env.example .env        # fill in any secrets you use
docker compose up --build
```

- `backend` → uvicorn on `:8000` (with `--reload`)
- `backend-worker` → `python -m services.result_ingester --worker`
  (polls for R2-delivered results and ingests them)

The frontend is typically run outside compose (`npm run dev`) in development.

---

## 7. Environment variables

All variables are documented in [`.env.example`](.env.example) — **no real
secrets are stored there**. Highlights:

| Variable | Default | Purpose |
|---|---|---|
| `AUTH_ENABLED` | `false` | `true` enforces JWT on console routes |
| `JWT_SECRET` | dev value | set a random ≥32-char secret in production |
| `DATABASE_PATH` | `jockey.db` | SQLite file (used when `SUPABASE_URL` empty) |
| `SUPABASE_URL` / keys | empty | optional cloud DB (SQLite is the local store) |
| `R2_*` | empty | optional encrypted payload delivery; inline when empty |
| `WORKER_SECRET` | empty | shared secret for the Cloudflare Worker |
| `NEXT_PUBLIC_API_BASE_URL` | `http://127.0.0.1:8000` | frontend → backend |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | `admin@jockey.local` / `Jockey#Admin1` | bootstrap console user |

---

## 8. Testing

```bash
# Compiler (lexer/parser/IR/polymorphism/codegen) — 11 tests
python3 compiler/tests.py

# Go agent (IR VM, forensics, crypto, transport) — 4 packages
cd agent && GOTOOLCHAIN=auto go test ./...

# Frontend types
cd frontend && node node_modules/typescript/bin/tsc --noEmit

# Production frontend build
cd frontend && node node_modules/next/dist/bin/next build

# Backend health after start
curl -s http://127.0.0.1:8000/health
```

All of the above pass on the current tree (see `details.md` for results).

---

## 9. API quick reference

| Method | Path | Purpose |
|---|---|---|
| GET  | `/health` | liveness + version |
| GET  | `/audit` | audit trail |
| POST | `/auth/login` | console JWT |
| GET  | `/auth/me` | current user |
| GET  | `/agents/` | list agents |
| POST | `/agents/register` | agent registration → `agent_token` |
| PATCH| `/agents/{id}/heartbeat` | agent heartbeat |
| PATCH| `/agents/{id}/status` | status update |
| POST | `/agents/verify-token` | validate an agent JWT (worker) |
| GET  | `/scripts/` | list seeded/user scripts |
| POST | `/scripts/` | create script (compiles IR) |
| GET  | `/scripts/{id}` | script + IR listing + AST summary |
| POST | `/jobs/create` | compile → polymorphic IR → queue |
| GET  | `/jobs/pending/{agent_id}` | agent claim (Bearer agent token) |
| GET  | `/jobs/` , `/jobs/{id}` | job status + findings |
| PATCH| `/jobs/{id}/status` | status transition |
| GET  | `/jobs/{id}/payload-url` | presigned R2 payload URL |
| POST | `/results/submit` | agent result submission |
| POST | `/results/ingest/{job_id}` | worker ingestion |
| GET  | `/results/?job_id=` | raw results |
| GET  | `/evidence/` , `/evidence/summary` | evidence rows + stats |
| GET  | `/evidence/{job_id}` | evidence per job |
| GET  | `/reports/` | report summaries |
| GET  | `/reports/{job_id}/json` | full report (MITRE mapping) |
| GET  | `/reports/{job_id}/pdf` | PDF report (reportlab) |

Interactive docs: <http://127.0.0.1:8000/docs>

---

## 10. Cross-compiling the agent

```bash
cd agent
GOOS=linux   GOARCH=amd64 GOTOOLCHAIN=auto go build -o tartarus-linux .
GOOS=windows GOARCH=amd64 GOTOOLCHAIN=auto go build -o tartarus-win.exe .
GOOS=darwin  GOARCH=arm64 GOTOOLCHAIN=auto go build -o tartarus-mac .
```

Linux collectors are fully implemented (`/proc`, `/proc/net`, utmp …);
Windows builds include registry Run-key persistence collection and a
`RtlGetVersion` system probe (other Windows collectors return empty and are
documented as future work in `details.md`).

---

## 11. Documentation files

| File | Contents |
|---|---|
| [`README.md`](README.md) | this file — install, run, test, operate |
| [`details.md`](details.md) | full inventory: what is implemented, verified, tested, scripts, opcodes, limitations |
| [`documentation.md`](documentation.md) | **JOCKEY language syntax reference** (lexical structure, grammar, builtins, examples, IR encoding) |
| [`implementation.md`](implementation.md) | original SIH specification / task list |

---

## 12. Security scope & limitations

- The agent implements **forensic collection**, **BYOVD vulnerable-driver
  *detection*** and integrity sealing. It deliberately **does not** implement
  EDR callback nullification or process-hollowing exploit code —
  `agent/byovd/callback_nullifier.go` returns a structured "disabled" report,
  and `exec_hollow` executes scripts in-process (fileless) instead.
- Payload delivery is inline (IR in the poll response) unless R2 is configured;
  then payloads are AES-256-GCM encrypted with an RSA-OAEP wrapped key.
- Results are submitted over the control channel; enable TLS termination in
  production and set `AUTH_ENABLED=true` + a strong `JWT_SECRET`.

---

## 13. Troubleshooting

| Symptom | Fix |
|---|---|
| `go build` fails with `go.mod requires go >= 1.27` | use `GOTOOLCHAIN=auto` (or `GOTOOLCHAIN=go1.27.1`) — the toolchain auto-downloads |
| `connection refused` in agent log | backend not running: start `uvicorn` on `:8000`; the agent retries automatically |
| Agent `401` on poll | token expired — restart the agent (it re-registers automatically on 401) |
| No agents in dashboard | start the agent, then check `GET /agents/` shows `status: online` |
| Frontend shows mock/empty data | ensure backend is on `127.0.0.1:8000`; check browser console/network for CORS (CORS allows `localhost:3000`) |
| Job stuck `queued` | no online agent for that `agent_id` — check agent log & `/agents/` |
| Port already in use | `fuser -k 8000/tcp` / `fuser -k 3000/tcp` (avoid `pkill -f` with literal patterns — it can match your own shell) |
| Re-seed scripts/users | `python3 scripts/seed_scripts.py` (idempotent) |

---

## License

MIT — see repository license header. Intended for authorized forensic / incident-response use only.
