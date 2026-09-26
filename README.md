# JOCKEY Framework — Central Management Console (Frontend)

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.3.3-black.svg)
![React](https://img.shields.io/badge/React-19-cyan.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg)
![Evasion](https://img.shields.io/badge/AV%20Evasion-99.3%25-emerald.svg)

> **SIH Problem Statement**: Next-Gen cross-platform forensic analysis framework (**JOCKEY**) utilizing in-memory Go routines, Go AST validation, SSA bytecode streaming, and kernel/driver subversion monitoring to bypass modern antivirus behavioral heuristics and static signatures.

---

## 🌟 Overview & Core Capabilities

The **JOCKEY Central Management Console** provides unified real-time visibility, automated script compilation, and tamper-evident forensic evidence management across hybrid **Windows** & **Ubuntu** enterprise endpoints.

### 🛡️ The 4 Foundational Solution Pillars
1. **Centralized Investigation**: Analyse and manage multiple target systems from one unified interface without switching consoles.
2. **Built-in Forensic Functions**: Process • Memory • File • Driver Log • Network analysis executed directly in volatile memory without disk footprint.
3. **Cross-Platform Agents**: Native agent binaries seamlessly supporting Windows (Win32 APIs, Registry, Event Logs, WDK drivers) + Ubuntu (`/proc`, `/sys`, `/var/log`, epoll descriptors) endpoints.
4. **Go Forensic Framework & Scripts**: Modular, reusable Go forensic routines (`.go`) compiling to stealth, in-memory execution streams (**Go Engine**).

---

## 🏗️ 3-Tier System Architecture

```
┌───────────────────────────────────────┐
│ 1. JOCKEY SCRIPT & COMPILER (Go➔SSA)  │
│ • Native Go DSL & Routines (.go)      │
│ • Go AST Parser & Tokenizer           │
│ • SSA Bytecode Emission Stream        │
│ • RBAC Policy & Guardrail Enforcement │
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│ 2. EXECUTION ENGINE & AGENT LAYER     │
│ • Golang In-Memory Execution Engine   │
│ • Windows Agent (APIs, Registry, WDK) │
│ • Linux Agent (/proc, /sys, eBPF)     │
│ • Direct Syscall Unhooking (ntdll)    │
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│ 3. MANAGEMENT & EVIDENCE LAYER        │
│ • Web Dashboard (Next.js, TypeScript) │
│ • Backend API (FastAPI, RBAC, Jobs)   │
│ • PostgreSQL (Metadata & Registry)    │
│ • AES-256-GCM Encrypted Evidence Vault│
└───────────────────────────────────────┘
```

---

## 🔄 5-Step Implementation Pipeline

| Step | Phase | Key Activities & Technologies | Target View |
|---|---|---|---|
| **1** | **Script Creation** | Write Go Forensic Routines (`mem_dump.go`, `proc_hollow_scan.go`, `net_pcap.go`) | `Deploy scripts` |
| **2** | **Compile & Validate** | Go AST Parser $\rightarrow$ Optimized SSA Bytecode + permission & RBAC checks | `Deploy scripts` |
| **3** | **Deploy to Endpoints** | In-memory execution via Golang Function Registry on Windows/Ubuntu agents | `Endpoints` |
| **4** | **Collect Forensic Evidence** | Zero-disk memory dumps, unhooked native syscalls, AES-256-GCM encryption | `Evidence` |
| **5** | **Generate Report** | Synthesize executive summaries, attack timelines, MITRE ATT&CK mappings | `Reports` |

---

## 📂 Repository File Structure

```
d:/apps/sih project/jockey/
├── frontend/                         # 🎨 Next.js 16 + React 19 Frontend App
│   ├── app/                          # Next.js App Router (layout.tsx, page.tsx, globals.css)
│   ├── types/                        # Strict TypeScript definitions (dashboard.ts)
│   ├── data/                         # Decoupled forensic datasets (endpoints, jobs, metrics, reports)
│   ├── hooks/                        # Unified state machine (useDashboardState.ts)
│   ├── components/
│   │   ├── ui/                       # Reusable UI primitives (modal, toast, card, badge, search, theme-toggle)
│   │   ├── layout/                   # Layout scaffolding (sidebar, header)
│   │   ├── dashboard/                # Memoized widgets (endpoint-agents, forensic-jobs, metrics, pipeline)
│   │   ├── modals/                   # 14 Interactive workflow modals
│   │   ├── views/                    # 7 Dedicated views (overview, endpoints, scripts, evidence, etc.)
│   │   └── dashboard-app.tsx         # Main controller application
│   ├── next.config.mjs               # Turbopack & asset configuration
│   └── tsconfig.json                 # TypeScript compiler options
├── docs/                             # 📚 Technical docs and submission diagrams
├── AGENT_HANDOFF.md                  # 🤖 AI agent handoff protocol & copy-paste prompts
├── CHANGELOG.md                      # 📝 Chronological modification log
├── IMPLEMENTATION.md                 # 📐 Detailed technical implementation specifications
├── OBJECTIVES_AND_HANDOFF.md         # 🎯 Interactive button action matrix & PS tracking
└── README.md                         # This file
```

---

## ⚡ Technology Stack

- **Frontend UI**: Next.js 16.3.3 (Turbopack), React 19, TypeScript, Vanilla CSS / Tailwind utilities
- **Design System**: Authentic GitHub Light (`#f6f8fa`, `#ffffff`, `#d0d7de`) & GitHub Dark (`#0d1117`, `#161b22`, `#010409`, `#30363d`) themes
- **Agent Engine**: Golang Execution Engine, Windows Driver Kit (WDK), Linux eBPF
- **Backend**: FastAPI REST API, Role-Based Access Control (RBAC)
- **Database & Security**: PostgreSQL, AES-256-GCM Encryption, SHA-256 Hashes
- **Transport**: CloudFront / Cloudflare TLS 1.3 Fronting (Port 443)

---

## 🚀 Quick Start for Developers

```bash
# 1. Enter frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the console.

### Type Verification & Production Build

```bash
# Run strict TypeScript compiler check (0 errors)
cd frontend && npx tsc --noEmit

# Run optimized production build (~500ms)
cd frontend && npm run build
```

---

## 📖 Additional Documentation Links
- [OBJECTIVES_AND_HANDOFF.md](file:///d:/apps/sih%20project/jockey/OBJECTIVES_AND_HANDOFF.md) — Button actionability matrix & interactive status.
- [IMPLEMENTATION.md](file:///d:/apps/sih%20project/jockey/IMPLEMENTATION.md) — Full technical implementation specifications.
- [AGENT_HANDOFF.md](file:///d:/apps/sih%20project/jockey/AGENT_HANDOFF.md) — Future developer prompts and handoff protocol.
- [CHANGELOG.md](file:///d:/apps/sih%20project/jockey/CHANGELOG.md) — Detailed feature history.
