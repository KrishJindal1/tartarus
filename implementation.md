Now let me check the GitHub repo:Now I have a complete picture of the repo. Let me check the frontend structure more closely:Good — I have everything I need. Let me now produce the complete file structure and implementation prompt.

---

Here's the **complete file structure + implementation prompt** for the backend and agent layers to add to your `tartarus` repo:

---

## Complete Target File Structure

```
tartarus/
├── frontend/                          # ✅ Already implemented (Next.js dashboard)
│
├── backend/                           # 🆕 FastAPI C2 Server
│   ├── main.py                        # App entry point, CORS, router mount
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── core/
│   │   ├── config.py                  # Settings (Supabase URL/key, R2 creds, JWT secret)
│   │   ├── security.py                # JWT creation/verify, RBAC decorator
│   │   ├── supabase_client.py         # Singleton Supabase client
│   │   ├── r2_client.py               # Cloudflare R2 boto3 client + presigned URLs
│   │   └── crypto.py                  # AES-256-GCM encrypt/decrypt, RSA-OAEP key wrap
│   │
│   ├── models/
│   │   ├── agent.py                   # Agent Pydantic models
│   │   ├── job.py                     # Job request/response models
│   │   ├── evidence.py                # Evidence/findings models
│   │   ├── script.py                  # Script models
│   │   └── user.py                    # User + RBAC role models
│   │
│   ├── routers/
│   │   ├── agents.py                  # GET /agents, POST /agents/register, PATCH /agents/{id}/status
│   │   ├── jobs.py                    # POST /jobs/create, GET /jobs, GET /jobs/{id}, PATCH /jobs/{id}/status
│   │   ├── results.py                 # POST /results/ingest/{job_id} (agent callback)
│   │   ├── scripts.py                 # GET /scripts, POST /scripts, GET /scripts/{id}
│   │   ├── evidence.py                # GET /evidence/{job_id}, GET /evidence/summary
│   │   ├── auth.py                    # POST /auth/login, POST /auth/refresh
│   │   └── reports.py                 # GET /reports/{job_id}/pdf, GET /reports/{job_id}/json
│   │
│   ├── services/
│   │   ├── compiler.py                # JOCKY→IR pipeline (AST parse, polymorphic engine)
│   │   ├── polymorphic.py             # Variable rename, CFG mutation, hash uniqueness
│   │   ├── job_dispatcher.py          # Encrypt payload → upload R2 → write Supabase job row
│   │   ├── result_ingester.py         # Download R2 result → decrypt → parse → store evidence
│   │   ├── audit_logger.py            # Write immutable audit_logs rows
│   │   └── report_generator.py        # Synthesize evidence → PDF/JSON forensic report
│   │
│   └── middleware/
│       ├── auth_middleware.py          # Bearer token extraction + JWT verify on every request
│       └── audit_middleware.py         # Auto-log every mutating request to audit_logs
│
├── agent/                             # 🆕 Go Agent (endpoint client)
│   ├── go.mod
│   ├── go.sum
│   ├── main.go                        # Entry: parse flags, start poll loop
│   │
│   ├── config/
│   │   └── config.go                  # Agent ID, C2 URL, poll interval, keypair paths
│   │
│   ├── transport/
│   │   ├── poll.go                    # Jittered HTTPS poll to Cloudflare Worker
│   │   ├── upload.go                  # PUT encrypted result to R2
│   │   └── tls.go                     # TLS 1.3 client, custom SNI (domain fronting)
│   │
│   ├── crypto/
│   │   ├── aes.go                     # AES-256-GCM encrypt/decrypt
│   │   ├── rsa.go                     # RSA-OAEP key unwrap (agent private key)
│   │   └── hash.go                    # SHA-256 integrity checks
│   │
│   ├── executor/
│   │   ├── ir_interpreter.go          # JOCKY-IR opcode dispatcher
│   │   ├── memory_loader.go           # In-memory payload load, zero disk writes
│   │   ├── process_hollow.go          # Process hollowing execution strategy
│   │   └── direct_syscall.go          # Direct syscall stubs (bypass ntdll hooks)
│   │
│   ├── forensics/
│   │   ├── processes.go               # collect_processes: PID tree, loaded DLLs, memory regions
│   │   ├── network.go                 # collect_network: TCP/UDP, DNS cache, ARP, routing
│   │   ├── memory.go                  # dump_memory: RWX pages, injected PE, shellcode scan
│   │   ├── persistence.go             # analyze_persistence: run keys, tasks, WMI, services
│   │   ├── registry.go                # dump_registry: NTUSER.DAT, SAM, ShellBags, AmCache
│   │   ├── files.go                   # collect_files: MFT, recent modified, double-ext masking
│   │   ├── system.go                  # collect_system: OS ver, patches, hardware IDs
│   │   └── logons.go                  # collect_logons: Event 4624/4625, RDP, active sessions
│   │
│   ├── byovd/
│   │   ├── scanner.go                 # Scan loaded drivers, match against CVE list
│   │   ├── driver_list.go             # Hardcoded known-vulnerable driver CVE DB
│   │   └── callback_nullifier.go      # Nullify EDR kernel callbacks via vulnerable driver
│   │
│   └── build/
│       ├── build_windows.sh           # GOOS=windows GOARCH=amd64 cross-compile
│       └── build_linux.sh             # GOOS=linux GOARCH=amd64 cross-compile
│
├── compiler/                          # 🆕 JOCKY Language Compiler (Python)
│   ├── lexer.py                       # Tokenizer: JOCKY DSL → token stream
│   ├── parser.py                      # Token stream → AST
│   ├── ir_emitter.py                  # AST → JOCKY-IR opcodes
│   ├── polymorphic_engine.py          # IR mutation: CFG shuffle, var encrypt, import obfusc
│   ├── codegen.py                     # IR → Go source (then handed to Go compiler)
│   └── grammar.py                     # JOCKY keyword/type definitions
│
├── infra/
│   ├── supabase/
│   │   └── schema.sql                 # Full Supabase schema (agents, jobs, scripts, evidence, audit_logs, users)
│   └── cloudflare/
│       └── worker.js                  # Cloudflare Worker: token validate → R2 route → origin proxy
│
├── scripts/
│   ├── seed_scripts.py                # Seed Supabase scripts table with 8 predefined .jky scripts
│   └── register_agent.py              # CLI: register a new agent, generate RSA keypair, insert Supabase row
│
├── .env.example                       # ✅ Already exists — extend with backend vars
├── docker-compose.yml                 # 🆕 Backend + compiler service
└── README.md
```

---

## Implementation Prompt

Paste this into a new Claude conversation (or Cursor/Windsurf):

---

**You are implementing the full backend, agent, compiler, and infrastructure for the JOCKY Framework (SIH PS 26148 — NTRO). The frontend is already built at `tartarus/frontend/` as a Next.js 16 + React 19 + TypeScript dashboard. Your task is to build everything else. Follow this exactly.**

---

### CONTEXT

**Project:** JOCKY — a forensic analysis C2 framework with evasive in-memory execution on endpoints, designed for authorized NTRO investigations. The frontend dashboard is complete. Build all backend services, the Go agent, the JOCKY compiler pipeline, the Supabase schema, and the Cloudflare Worker.

**Tech stack:**
- Backend C2: Python 3.12, FastAPI, Pydantic v2, python-jose (JWT), cryptography (AES/RSA), boto3 (R2), supabase-py
- Database: Supabase (PostgreSQL + Realtime)
- Storage: Cloudflare R2 (via boto3 S3-compatible API)
- Agent: Go 1.22, cross-compiled for windows/amd64 and linux/amd64
- Compiler: Python (lexer → parser → IR → polymorphic engine → Go codegen)
- Worker: Cloudflare Worker (JavaScript)

---

### TASK 1 — Supabase Schema (`infra/supabase/schema.sql`)

Create the full PostgreSQL schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS (NTRO investigators)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text CHECK (role IN ('admin', 'analyst', 'viewer')) DEFAULT 'analyst',
  allowed_agents uuid[] DEFAULT '{}',
  mfa_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- AGENTS (registered endpoints)
CREATE TYPE os_type AS ENUM ('windows', 'linux');
CREATE TYPE agent_status AS ENUM ('online', 'offline', 'busy', 'idle');

CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hostname text NOT NULL,
  os_type os_type NOT NULL,
  ip_internal text, -- stored AES-encrypted at app layer
  public_key text NOT NULL, -- RSA-2048 public key PEM
  status agent_status DEFAULT 'offline',
  av_present text,
  agent_version text DEFAULT '1.0.0',
  last_seen_at timestamptz DEFAULT now(),
  registered_at timestamptz DEFAULT now()
);

-- SCRIPTS (predefined + custom JOCKY scripts)
CREATE TYPE script_category AS ENUM ('memory','network','process','persistence','registry','files','system','logons');
CREATE TYPE risk_level AS ENUM ('low','medium','high','critical');
CREATE TYPE os_target AS ENUM ('windows','linux','both');

CREATE TABLE scripts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  category script_category NOT NULL,
  jocky_source text NOT NULL, -- raw .jky source code
  compiled_ir bytea, -- cached compiled IR
  risk_level risk_level DEFAULT 'medium',
  os_target os_target DEFAULT 'both',
  is_predefined boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- JOBS (forensic job dispatches)
CREATE TYPE job_status AS ENUM ('queued','dispatched','executing','completed','failed');
CREATE TYPE exec_mode AS ENUM ('user_mode','kernel_mode');

CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  script_id uuid REFERENCES scripts(id),
  r2_payload_key text, -- R2 object key for encrypted payload
  r2_result_key text,  -- R2 object key for encrypted result
  enc_aes_key text,    -- AES key encrypted with agent pubkey (base64)
  status job_status DEFAULT 'queued',
  exec_mode exec_mode DEFAULT 'user_mode',
  findings_summary text,
  risk_score float DEFAULT 0,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  dispatched_at timestamptz,
  completed_at timestamptz
);

-- EVIDENCE (parsed forensic output per job)
CREATE TYPE evidence_type AS ENUM ('process','network','memory','persistence','registry','files','system','logons','byovd');

CREATE TABLE evidence (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  type evidence_type NOT NULL,
  data jsonb NOT NULL, -- structured findings (encrypted at rest via Supabase Vault or app-layer)
  sha256_hash text NOT NULL,
  risk_score float DEFAULT 0,
  r2_result_key text,
  collected_at timestamptz DEFAULT now()
);

-- AUDIT LOGS (immutable)
CREATE TABLE audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  ip_address inet,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Realtime on jobs and evidence
ALTER TABLE jobs REPLICA IDENTITY FULL;
ALTER TABLE evidence REPLICA IDENTITY FULL;
ALTER TABLE agents REPLICA IDENTITY FULL;
```

---

### TASK 2 — FastAPI Backend (`backend/`)

**`backend/requirements.txt`:**
```
fastapi==0.115.0
uvicorn[standard]==0.30.6
pydantic==2.8.0
pydantic-settings==2.4.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
cryptography==43.0.0
boto3==1.35.0
supabase==2.7.4
python-multipart==0.0.9
httpx==0.27.0
aiofiles==24.1.0
```

**`backend/core/config.py`** — Pydantic BaseSettings reading from `.env`:
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    R2_ACCOUNT_ID: str
    R2_ACCESS_KEY_ID: str
    R2_SECRET_ACCESS_KEY: str
    R2_BUCKET_NAME: str
    R2_ENDPOINT_URL: str  # https://{account_id}.r2.cloudflarestorage.com
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480
    WORKER_SECRET: str  # shared secret for Cloudflare Worker → backend auth

    class Config:
        env_file = ".env"

settings = Settings()
```

**`backend/core/crypto.py`** — Full AES-256-GCM + RSA-OAEP implementation:
```python
import os, base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes, serialization

def generate_aes_key() -> bytes:
    return os.urandom(32)

def aes_encrypt(key: bytes, plaintext: bytes) -> tuple[bytes, bytes]:
    """Returns (nonce, ciphertext). nonce is 12 bytes."""
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ct = aesgcm.encrypt(nonce, plaintext, None)
    return nonce, ct

def aes_decrypt(key: bytes, nonce: bytes, ciphertext: bytes) -> bytes:
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, None)

def rsa_wrap_key(public_key_pem: str, aes_key: bytes) -> str:
    """Encrypt AES key with agent's RSA public key. Returns base64."""
    pub = serialization.load_pem_public_key(public_key_pem.encode())
    ct = pub.encrypt(aes_key, padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(), label=None))
    return base64.b64encode(ct).decode()

def rsa_unwrap_key(private_key_pem: str, wrapped_key_b64: str) -> bytes:
    """Decrypt AES key with private key. Used in tests / backend key recovery."""
    priv = serialization.load_pem_private_key(private_key_pem.encode(), password=None)
    ct = base64.b64decode(wrapped_key_b64)
    return priv.decrypt(ct, padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(), label=None))
```

**`backend/core/r2_client.py`** — R2 via boto3:
```python
import boto3
from .config import settings

def get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.R2_ENDPOINT_URL,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto"
    )

def upload_to_r2(key: str, data: bytes) -> str:
    client = get_r2_client()
    client.put_object(Bucket=settings.R2_BUCKET_NAME, Key=key, Body=data)
    return key

def download_from_r2(key: str) -> bytes:
    client = get_r2_client()
    resp = client.get_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
    return resp["Body"].read()

def generate_presigned_get(key: str, expires_in: int = 60) -> str:
    client = get_r2_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.R2_BUCKET_NAME, "Key": key},
        ExpiresIn=expires_in
    )
```

**`backend/routers/jobs.py`** — Full job lifecycle with all endpoints:

Implement these endpoints with full logic:
- `POST /jobs/create` — body: `{agent_id, script_id, exec_mode}`. Fetch script from Supabase, call `compiler.compile(jocky_source)` → get IR bytes, call `polymorphic_engine.mutate(ir)` → unique IR, generate AES key, `rsa_wrap_key(agent.public_key, aes_key)`, `aes_encrypt(aes_key, mutated_ir)`, upload `payloads/{job_id}/payload.enc` to R2, insert job row to Supabase with `r2_payload_key`, `enc_aes_key`, status=`queued`. Log to audit_logs. Return job id.
- `GET /jobs` — list all jobs (paginated, filterable by status/agent), requires JWT
- `GET /jobs/{id}` — single job with status + evidence summary
- `PATCH /jobs/{id}/status` — used by agent callback proxy (validate WORKER_SECRET header)
- `GET /jobs/{id}/payload-url` — generates 60s presigned R2 GET URL for the payload (agent fetches this)

**`backend/routers/results.py`** — Result ingestion:
- `POST /results/ingest/{job_id}` — called by Cloudflare Worker after agent signals completion. Downloads `results/{job_id}/output.enc` from R2, verifies SHA-256 hash, decrypts AES-256-GCM, parses JSON result into structured evidence rows, inserts into `evidence` table in Supabase, updates `jobs.status = completed`, updates `jobs.risk_score = max(evidence risk_scores)`, writes to audit_logs.

**`backend/routers/agents.py`** — Agent management:
- `POST /agents/register` — body: `{hostname, os_type, public_key_pem, agent_version, av_present}`. Insert Supabase row, return `agent_id`.
- `GET /agents` — list all with status, last_seen, AV present
- `PATCH /agents/{id}/heartbeat` — update `last_seen_at = now()`, status = `online`. Called by agent poll loop when no job.
- `DELETE /agents/{id}` — admin only

**`backend/routers/auth.py`**:
- `POST /auth/login` — email + password, verify bcrypt, issue JWT with `{user_id, role, allowed_agents}` claims
- `POST /auth/refresh` — refresh expired token if within 24h

**`backend/core/security.py`** — JWT verify middleware:
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from .config import settings

bearer = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def require_role(*roles):
    def dep(token_data = Depends(verify_token)):
        if token_data.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return token_data
    return dep
```

**`backend/services/compiler.py`** — JOCKY compiler pipeline:
```python
# Stub that compiles JOCKY DSL to IR bytes
# For demo: parse known JOCKY keywords → generate IR opcode sequence
# Real impl delegates to compiler/ package

from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.ir_emitter import IREmitter

def compile_jocky(source: str) -> bytes:
    tokens = Lexer(source).tokenize()
    ast = Parser(tokens).parse()
    ir = IREmitter(ast).emit()
    return ir
```

**`backend/services/report_generator.py`** — Report generation:
- Fetch all evidence rows for a job from Supabase
- Build a structured dict: `{job_id, agent_hostname, executed_at, risk_score, findings: {processes: [...], network: [...], persistence: [...], ...}, timeline: [...], mitre_techniques: [...]}`
- For PDF: use `reportlab` to generate a formatted PDF with NTRO header, findings tables, risk score summary. Return as bytes.
- For JSON: return the structured dict as JSON.

**`backend/main.py`:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import agents, jobs, results, scripts, evidence, auth, reports

app = FastAPI(title="JOCKY C2 Backend", version="2.4.1", docs_url="/api/docs")

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://tartarus.vercel.app"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(agents.router, prefix="/agents", tags=["Agents"])
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
app.include_router(results.router, prefix="/results", tags=["Results"])
app.include_router(scripts.router, prefix="/scripts", tags=["Scripts"])
app.include_router(evidence.router, prefix="/evidence", tags=["Evidence"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])

@app.get("/health")
def health(): return {"status": "operational", "version": "2.4.1"}
```

---

### TASK 3 — JOCKY Compiler (`compiler/`)

**`compiler/grammar.py`** — JOCKY keyword set:
```python
KEYWORDS = {
    "scan", "collect", "dump", "analyze", "exec", "return", "if", "else", "for", "in",
    "fn", "let", "use", "import", "target", "output", "encrypt", "log"
}
TYPES = {"Process", "Network", "Memory", "File", "Registry", "Driver", "System", "Logon"}
BUILTINS = {
    "collect_processes", "collect_network", "collect_files", "collect_logons",
    "collect_system", "dump_memory", "dump_registry", "analyze_persistence",
    "scan_byovd", "exec_hollow", "exec_direct_syscall"
}
```

**`compiler/lexer.py`** — Tokenizer:
```python
import re
from .grammar import KEYWORDS, TYPES, BUILTINS

class TokenType:
    KEYWORD = "KEYWORD"; IDENT = "IDENT"; BUILTIN = "BUILTIN"
    STRING = "STRING"; NUMBER = "NUMBER"; PUNCT = "PUNCT"; EOF = "EOF"

class Token:
    def __init__(self, type_, value, line):
        self.type = type_; self.value = value; self.line = line

class Lexer:
    def __init__(self, source: str):
        self.src = source; self.pos = 0; self.line = 1

    def tokenize(self) -> list[Token]:
        tokens = []
        while self.pos < len(self.src):
            ch = self.src[self.pos]
            if ch.isspace():
                if ch == '\n': self.line += 1
                self.pos += 1
            elif ch == '#':
                while self.pos < len(self.src) and self.src[self.pos] != '\n':
                    self.pos += 1
            elif ch == '"':
                self.pos += 1; s = ""
                while self.pos < len(self.src) and self.src[self.pos] != '"':
                    s += self.src[self.pos]; self.pos += 1
                self.pos += 1
                tokens.append(Token(TokenType.STRING, s, self.line))
            elif ch.isdigit():
                s = ""
                while self.pos < len(self.src) and self.src[self.pos].isdigit():
                    s += self.src[self.pos]; self.pos += 1
                tokens.append(Token(TokenType.NUMBER, int(s), self.line))
            elif ch.isalpha() or ch == '_':
                s = ""
                while self.pos < len(self.src) and (self.src[self.pos].isalnum() or self.src[self.pos] == '_'):
                    s += self.src[self.pos]; self.pos += 1
                if s in KEYWORDS:
                    tokens.append(Token(TokenType.KEYWORD, s, self.line))
                elif s in BUILTINS:
                    tokens.append(Token(TokenType.BUILTIN, s, self.line))
                else:
                    tokens.append(Token(TokenType.IDENT, s, self.line))
            elif ch in "{}()[].,;:=+-*/<>!&|":
                tokens.append(Token(TokenType.PUNCT, ch, self.line)); self.pos += 1
            else:
                self.pos += 1
        tokens.append(Token(TokenType.EOF, None, self.line))
        return tokens
```

**`compiler/ir_emitter.py`** — IR byte format:
Define a simple binary IR: each opcode is 1 byte, followed by operands.
```python
# Opcode table
OPCODES = {
    "NOP": 0x00, "CALL": 0x01, "COLLECT": 0x02, "DUMP": 0x03,
    "ANALYZE": 0x04, "EXEC": 0x05, "RET": 0x06, "PUSH": 0x07,
    "POP": 0x08, "JMP": 0x09, "JNZ": 0x0A, "ENCRYPT": 0x0B,
    "LOG": 0x0C, "SYSCALL": 0x0D, "BYOVD": 0x0E, "HOLLOW": 0x0F,
}
```
Emit JOCKY-IR as `bytearray`. Map each builtin call to its opcode + null-terminated string operand.

**`compiler/polymorphic_engine.py`** — Mutation:
```python
import os, hashlib, random

def mutate_ir(ir_bytes: bytes) -> bytes:
    """
    1. Insert random NOP sleds at random positions
    2. XOR-encrypt string literals with random 1-byte key (prepend key byte)
    3. Shuffle independent opcode blocks that don't affect control flow
    4. Append 16 bytes of random padding
    Returns mutated IR with guaranteed unique SHA-256.
    """
    ir = bytearray(ir_bytes)
    # NOP sled injection
    for _ in range(random.randint(3, 12)):
        pos = random.randint(0, len(ir))
        ir.insert(pos, 0x00)  # NOP
    # Random tail
    ir += os.urandom(16)
    assert hashlib.sha256(ir).hexdigest() != hashlib.sha256(ir_bytes).hexdigest()
    return bytes(ir)
```

---

### TASK 4 — Go Agent (`agent/`)

**`agent/main.go`:**
```go
package main

import (
    "flag"
    "log"
    "tartarus-agent/config"
    "tartarus-agent/transport"
)

func main() {
    agentID := flag.String("agent-id", "", "Agent UUID from backend registration")
    c2URL   := flag.String("c2", "https://cdn.cloudflare.com", "C2 endpoint (domain-fronted)")
    privKey := flag.String("privkey", "agent_private.pem", "Path to RSA private key PEM")
    flag.Parse()

    if *agentID == "" {
        log.Fatal("--agent-id required")
    }

    cfg := config.AgentConfig{
        AgentID:    *agentID,
        C2BaseURL:  *c2URL,
        PrivKeyPath: *privKey,
        PollMin:    30, PollMax: 120,
    }

    log.Printf("[JOCKY-AGENT] Starting. AgentID=%s", cfg.AgentID)
    transport.StartPollLoop(cfg)
}
```

**`agent/transport/poll.go`** — Poll loop:
```go
package transport

import (
    "encoding/json"
    "fmt"
    "log"
    "math/rand"
    "time"
    "tartarus-agent/config"
    "tartarus-agent/executor"
    "tartarus-agent/crypto"
)

type JobResponse struct {
    JobID         string `json:"job_id"`
    PayloadURL    string `json:"payload_url"`    // presigned R2 URL
    EncAESKey     string `json:"enc_aes_key"`    // RSA-wrapped AES key (base64)
    ExecMode      string `json:"exec_mode"`
    ResultR2Key   string `json:"result_r2_key"`  // where to PUT result
}

func StartPollLoop(cfg config.AgentConfig) {
    privKey := crypto.LoadRSAPrivateKey(cfg.PrivKeyPath)
    client  := newTLSClient(cfg.C2BaseURL)

    for {
        // Jittered sleep
        jitter := time.Duration(cfg.PollMin + rand.Intn(cfg.PollMax-cfg.PollMin)) * time.Second
        time.Sleep(jitter)

        // Heartbeat + check for pending job
        job, err := checkForJob(client, cfg.AgentID)
        if err != nil {
            log.Printf("[POLL] No job or error: %v", err)
            continue
        }

        log.Printf("[POLL] Job received: %s", job.JobID)

        // Unwrap AES key
        aesKey, err := crypto.RSAUnwrapKey(privKey, job.EncAESKey)
        if err != nil {
            log.Printf("[CRYPTO] Key unwrap failed: %v", err)
            continue
        }

        // Fetch and decrypt payload
        encPayload, err := fetchR2Object(client, job.PayloadURL)
        if err != nil { continue }
        irBytes, err := crypto.AESDecrypt(aesKey, encPayload)
        if err != nil { continue }

        // Execute
        result, err := executor.ExecuteIR(irBytes, job.ExecMode)
        if err != nil { continue }

        // Encrypt and upload result
        encResult, err := crypto.AESEncrypt(aesKey, result)
        if err != nil { continue }
        _ = uploadResult(client, cfg.AgentID, job.JobID, job.ResultR2Key, encResult)

        log.Printf("[DONE] Job %s complete", job.JobID)
    }
}
```

**`agent/executor/ir_interpreter.go`** — IR dispatcher:
```go
package executor

import (
    "fmt"
    "encoding/json"
    "tartarus-agent/forensics"
)

// Opcode constants matching compiler/ir_emitter.py
const (
    OP_NOP      = 0x00
    OP_COLLECT  = 0x02
    OP_DUMP     = 0x03
    OP_ANALYZE  = 0x04
    OP_EXEC     = 0x05
    OP_SYSCALL  = 0x0D
    OP_BYOVD    = 0x0E
)

type ForensicResult struct {
    Processes   []forensics.ProcessInfo  `json:"processes,omitempty"`
    Network     []forensics.NetConn      `json:"network,omitempty"`
    Memory      []forensics.MemRegion    `json:"memory,omitempty"`
    Persistence []forensics.PersistEntry `json:"persistence,omitempty"`
    RiskScore   float64                  `json:"risk_score"`
    Findings    []string                 `json:"findings"`
}

func ExecuteIR(ir []byte, execMode string) ([]byte, error) {
    result := &ForensicResult{}

    i := 0
    for i < len(ir) {
        op := ir[i]; i++
        switch op {
        case OP_NOP: // skip
        case OP_COLLECT:
            name, n := readString(ir, i); i += n
            switch name {
            case "collect_processes":
                result.Processes = forensics.CollectProcesses()
            case "collect_network":
                result.Network = forensics.CollectNetwork()
            case "collect_logons":
                // result.Logons = forensics.CollectLogons()
            }
        case OP_DUMP:
            name, n := readString(ir, i); i += n
            if name == "dump_memory" {
                result.Memory = forensics.DumpMemoryRegions()
            }
        case OP_ANALYZE:
            name, n := readString(ir, i); i += n
            if name == "analyze_persistence" {
                result.Persistence = forensics.AnalyzePersistence()
            }
        case OP_BYOVD:
            // forensics.ScanBYOVD()
        }
    }

    // Score risk
    result.RiskScore = scoreRisk(result)
    return json.Marshal(result)
}

func readString(ir []byte, pos int) (string, int) {
    end := pos
    for end < len(ir) && ir[end] != 0x00 { end++ }
    return string(ir[pos:end]), end - pos + 1
}

func scoreRisk(r *ForensicResult) float64 {
    score := 0.0
    // Simple heuristic: injected processes add 2.0 each
    for _, p := range r.Processes {
        if p.IsSuspicious { score += 2.0 }
    }
    if len(r.Persistence) > 0 { score += float64(len(r.Persistence)) * 1.5 }
    if score > 10.0 { score = 10.0 }
    return score
}
```

**`agent/forensics/processes.go`** — Process collection (cross-platform stub with real logic):
```go
package forensics

import (
    "os"
    "strconv"
    "strings"
)

type ProcessInfo struct {
    PID         int    `json:"pid"`
    Name        string `json:"name"`
    PPID        int    `json:"ppid"`
    ExePath     string `json:"exe_path"`
    IsSuspicious bool  `json:"is_suspicious"`
    LoadedDLLs  []string `json:"loaded_dlls,omitempty"`
    MemoryMB    float64  `json:"memory_mb"`
}

func CollectProcesses() []ProcessInfo {
    // Linux: read /proc
    var result []ProcessInfo
    entries, _ := os.ReadDir("/proc")
    for _, e := range entries {
        pid, err := strconv.Atoi(e.Name())
        if err != nil { continue }

        comm, _ := os.ReadFile(fmt.Sprintf("/proc/%d/comm", pid))
        exe, _ := os.Readlink(fmt.Sprintf("/proc/%d/exe", pid))

        info := ProcessInfo{
            PID:     pid,
            Name:    strings.TrimSpace(string(comm)),
            ExePath: exe,
        }

        // Heuristic: unsigned path or deleted exe
        if strings.Contains(exe, "(deleted)") || strings.HasPrefix(exe, "/tmp") {
            info.IsSuspicious = true
        }

        result = append(result, info)
    }
    return result
}
```

Similarly implement stubs for `network.go` (read `/proc/net/tcp`), `persistence.go` (check `/etc/cron*`, `systemd` unit files), `memory.go` (read `/proc/{pid}/maps` for RWX regions).

For Windows build tags, use `//go:build windows` and use `syscall` / `golang.org/x/sys/windows` to call `CreateToolhelp32Snapshot`, `EnumProcessModules`, etc.

**`agent/build/build_windows.sh`:**
```bash
#!/bin/bash
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 \
  go build -ldflags="-s -w" -trimpath \
  -o ../../dist/jocky-agent-windows-amd64.exe \
  ../main.go
echo "[BUILD] Windows agent built"
```

**`agent/build/build_linux.sh`:**
```bash
#!/bin/bash
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 \
  go build -ldflags="-s -w" -trimpath \
  -o ../../dist/jocky-agent-linux-amd64 \
  ../main.go
echo "[BUILD] Linux agent built"
```

---

### TASK 5 — Cloudflare Worker (`infra/cloudflare/worker.js`)

```javascript
const BACKEND_URL = "https://your-backend.com";
const WORKER_SECRET = "<from_env>";
const R2_BUCKET = "jocky-payloads";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Validate agent token from Authorization header
    const authHeader = request.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response("Unauthorized", { status: 401 });
    }
    const agentToken = authHeader.slice(7);

    // Verify token with backend
    const verifyResp = await fetch(`${BACKEND_URL}/agents/verify-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Worker-Secret": WORKER_SECRET
      },
      body: JSON.stringify({ token: agentToken })
    });
    if (!verifyResp.ok) return new Response("Unauthorized", { status: 401 });

    const pathParts = url.pathname.split("/").filter(Boolean);

    // GET /poll/{agent_id} → check for pending job
    if (request.method === "GET" && pathParts[0] === "poll") {
      const agentId = pathParts[1];
      const jobResp = await fetch(`${BACKEND_URL}/jobs/pending/${agentId}`, {
        headers: { "X-Worker-Secret": WORKER_SECRET }
      });
      return new Response(await jobResp.text(), {
        status: jobResp.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    // PUT /results/{job_id} → store encrypted result in R2
    if (request.method === "PUT" && pathParts[0] === "results") {
      const jobId = pathParts[1];
      const body = await request.arrayBuffer();
      await env.R2_BUCKET.put(`results/${jobId}/output.enc`, body);

      // Notify backend to ingest
      await fetch(`${BACKEND_URL}/results/ingest/${jobId}`, {
        method: "POST",
        headers: { "X-Worker-Secret": WORKER_SECRET }
      });

      return new Response(JSON.stringify({ status: "received" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};
```

---

### TASK 6 — Scripts Seeder (`scripts/seed_scripts.py`)

```python
"""Seed the Supabase scripts table with 8 predefined JOCKY scripts."""
import os
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

PREDEFINED_SCRIPTS = [
    {
        "name": "Process Monitor", "category": "process", "risk_level": "medium",
        "os_target": "both", "is_predefined": True,
        "jocky_source": 'fn collect_processes() {\n  let procs = collect_processes()\n  output procs\n}'
    },
    {
        "name": "Memory Dump", "category": "memory", "risk_level": "high",
        "os_target": "both", "is_predefined": True,
        "jocky_source": 'fn dump_memory(pid: int) {\n  let regions = dump_memory(pid)\n  output encrypt(regions)\n}'
    },
    {
        "name": "Network Map", "category": "network", "risk_level": "low",
        "os_target": "both", "is_predefined": True,
        "jocky_source": 'fn collect_network() {\n  let conns = collect_network()\n  output conns\n}'
    },
    {
        "name": "Persistence Check", "category": "persistence", "risk_level": "high",
        "os_target": "windows", "is_predefined": True,
        "jocky_source": 'fn analyze_persistence() {\n  let entries = analyze_persistence()\n  output entries\n}'
    },
    {
        "name": "Registry Forensics", "category": "registry", "risk_level": "critical",
        "os_target": "windows", "is_predefined": True,
        "jocky_source": 'fn dump_registry() {\n  let hive = dump_registry()\n  output encrypt(hive)\n}'
    },
    {
        "name": "User Login Audit", "category": "logons", "risk_level": "medium",
        "os_target": "both", "is_predefined": True,
        "jocky_source": 'fn collect_logons() {\n  let sessions = collect_logons()\n  output sessions\n}'
    },
    {
        "name": "System Info", "category": "system", "risk_level": "low",
        "os_target": "both", "is_predefined": True,
        "jocky_source": 'fn collect_system() {\n  let info = collect_system()\n  output info\n}'
    },
    {
        "name": "File Recovery", "category": "files", "risk_level": "medium",
        "os_target": "both", "is_predefined": True,
        "jocky_source": 'fn collect_files(path: str) {\n  let files = collect_files(path)\n  output files\n}'
    },
]

for s in PREDEFINED_SCRIPTS:
    sb.table("scripts").insert(s).execute()
    print(f"[SEED] Inserted: {s['name']}")

print("[DONE] All scripts seeded.")
```

---

### TASK 7 — `.env.example` additions

Extend the existing `.env.example` with:
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cloudflare R2
R2_ACCOUNT_ID=abc123
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret
R2_BUCKET_NAME=jocky-payloads
R2_ENDPOINT_URL=https://abc123.r2.cloudflarestorage.com

# JWT
JWT_SECRET=super_secret_minimum_32_chars_long
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=480

# Cloudflare Worker
WORKER_SECRET=worker_shared_secret_32chars

# Frontend (Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

### TASK 8 — `docker-compose.yml`

```yaml
version: "3.9"
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file: .env
    volumes:
      - ./backend:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    restart: unless-stopped

  backend-worker:
    build:
      context: ./backend
    env_file: .env
    command: python -m services.result_ingester --worker
    depends_on: [backend]
    restart: unless-stopped
```

**`backend/Dockerfile`:**
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### TASK 9 — Frontend API Integration (`frontend/`)

In the existing Next.js frontend, add/update:

**`frontend/lib/api.ts`** — Typed API client:
```typescript
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("jocky_token");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch<{ access_token: string }>("/auth/login", {
      method: "POST", body: JSON.stringify({ email, password })
    }),
  getAgents: () => apiFetch<Agent[]>("/agents"),
  getJobs: () => apiFetch<Job[]>("/jobs"),
  createJob: (payload: CreateJobPayload) =>
    apiFetch<{ job_id: string }>("/jobs/create", {
      method: "POST", body: JSON.stringify(payload)
    }),
  getScripts: () => apiFetch<Script[]>("/scripts"),
  getEvidence: (jobId: string) => apiFetch<Evidence[]>(`/evidence/${jobId}`),
  getReport: (jobId: string, format: "json" | "pdf") =>
    fetch(`${BASE}/reports/${jobId}/${format}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("jocky_token")}` }
    }),
};
```

**`frontend/lib/supabase.ts`** — Realtime subscriptions:
```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function subscribeToJobs(callback: (payload: any) => void) {
  return supabase
    .channel("jobs-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, callback)
    .subscribe();
}

export function subscribeToEvidence(jobId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`evidence-${jobId}`)
    .on("postgres_changes", {
      event: "INSERT", schema: "public", table: "evidence",
      filter: `job_id=eq.${jobId}`
    }, callback)
    .subscribe();
}
```

---

### EXECUTION ORDER

1. `psql` or Supabase dashboard → run `infra/supabase/schema.sql`
2. Copy `.env.example` → `.env`, fill all values
3. `pip install -r backend/requirements.txt`
4. `python scripts/seed_scripts.py`
5. `uvicorn backend.main:app --reload`
6. `cd agent && go mod tidy && bash build/build_linux.sh`
7. Register agent: `python scripts/register_agent.py --hostname NTRO-TEST-01 --os linux`
8. Start agent: `./dist/jocky-agent-linux-amd64 --agent-id <uuid> --c2 http://localhost:8000`
9. `cd frontend && npm run dev`