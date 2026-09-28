# JOCKY Framework — Project Objectives & Actionability Matrix

> **Mission**: Enterprise Cyber-Forensic Operations Control Plane for heterogeneous multi-target analysis (Windows & Ubuntu), in-memory execution, kernel subversion detection, and tamper-evident telemetry.

---

## 🎯 1. Core Problem Statement Objectives

### Context & Need
Modern security solutions monitor API call sequences, behavioral heuristics, and static signatures. The **JOCKY Framework** provides an unhindered forensic control plane and programming model that bypasses heuristic choke points and provides deep forensic insight into running systems.

### 4 Key Strategic Objectives
1. **Multi-Target In-Memory Telemetry**:
   - Continuous real-time monitoring of Windows Server and Ubuntu Linux endpoints.
   - Auditing active processes, direct syscall SSN invocations, unlinked memory pages, and reflective execution runs without writing artifacts to disk.
2. **Polymorphic Go Script Lifecycle & AST Inspection**:
   - Manage versioned Go forensic routines with interactive in-browser Go Source Code, Abstract Syntax Tree (AST), and Static Single Assignment (SSA) form inspection.
   - Continuous delivery pipeline with smoke testing, peer-review guardrails, and automated rollback caches.
3. **Kernel Subversion & Driver Auditing**:
   - Tracking unhooked DLLs (`ntdll.dll`, `kernel32.dll`), BYOVD vulnerable drivers, and kernel callback hooks (`nt!PspCreateProcessNotifyRoutine`).
4. **Tamper-Evident Evidence Vault & Executive Reporting**:
   - Cryptographic SHA-256 integrity verification and AES-256-GCM sealed artifact storage.
   - Interactive hex disassembler, IOC extractor (IPs, hashes, registry keys), and automated stakeholder PDF reports.

---

## 🔘 2. Button Actionability Matrix (100% Interactive)

Every interactive surface across all 7 views and 14 modals is fully functional:

| Button / Trigger | Location | Implemented Action / Behavior | Status |
|---|---|---|---|
| **KPI Metric Cards (6 Top Cards)** | OverviewView (MetricsGrid) | Clicking any KPI card navigates directly to its respective view (`Endpoints`, `Deploy scripts`, `Results`, `Live status`, `Evidence`) | ✅ Implemented |
| **Proposed Solution Pillars (4 Cards)** | OverviewView (ProposedSolutionPillarsCard) | 1-Click quick navigation linking each pillar to its live management interface | ✅ Implemented |
| **Sidebar Collapse / Expand Toggle** | Left Sidebar / Header / `Ctrl+B` | Toggles left navigation sidebar open/close with smooth slide transition and shortcut listener | ✅ Implemented |
| **Theme Toggle (Sun/Moon)** | Top Header | Instantaneous universal light/dark theme switch across all surfaces, cards, modals, and text tokens | ✅ Implemented |
| **Notification Flyout Alerts** | Header Notifications Popover | Clicking any alert item navigates directly to the relevant workspace view (`Live status`, `Deploy scripts`, `Endpoints`) | ✅ Implemented |
| **Add Target Endpoint / New Target** | Header / OverviewView / EndpointsView | Opens `AddEndpointModal` with platform/IP validation, adds new endpoint to state with toast notification | ✅ Implemented |
| **Configure (Agent)** | EndpointsView / EndpointAgentsTable (per row) | Opens `ConfigureEndpointModal` to edit status, platform, IP, and latency with delete option | ✅ Implemented |
| **Last Script (.go) Deep-Link** | EndpointAgentsTable & EndpointsView | Jumps directly to Deploy Scripts view and automatically highlights the selected Go routine AST/SSA code | ✅ Implemented |
| **Deploy / Rollback** | DeployScriptsView | Toggles script deployment state, updates version tag, and emits toast feedback | ✅ Implemented |
| **Stage New Script (Import)** | DeployScriptsView | Opens `ImportScriptModal` allowing script staging and Go code definition input | ✅ Implemented |
| **Go Code / AST / SSA Tabs** | DeployScriptsView | Toggles live code inspector between Go source routines, AST structure, and SSA stream | ✅ Implemented |
| **5-Step Pipeline Steps** | Overview / Deploy scripts | Clicking any step navigates directly to its respective operational view with toast notification | ✅ Implemented |
| **Edit Guardrail Policy** | DeployScriptsView (Guardrails) | Opens `GuardrailPolicyModal` to configure peer review, auto smoke test, and rollback cache | ✅ Implemented |
| **Run Suite / Run now** | Header / Overview / Subviews | Simulates suite execution with progress bar, state updates, and toast alerts | ✅ Implemented |
| **Restart run** | LiveStatusView | Resets and restarts the active run telemetry timer with toast alert | ✅ Implemented |
| **Pause alerts / Resume alerts** | LiveStatusView | Toggles alert muting badge and emits state feedback toast | ✅ Implemented |
| **View stream logs** | LiveStatusView | Opens `StreamLogsModal` displaying formatted stdout terminal logs with copy button | ✅ Implemented |
| **Compare runs** | ResultsView | Opens `CompareRunsModal` displaying side-by-side performance diff matrix | ✅ Implemented |
| **Inspect → / Job Row Click** | ResultsView / RecentForensicJobsTable | Opens `InspectRunModal` previewing pass rate, duration, and findings | ✅ Implemented |
| **Inspect Forensic Record** | ResultsView / ForensicRecordsTable | Opens `ForensicRecordDetailModal` showing unhooked DLLs, driver hooks, and raw JSON (Read-Only) | ✅ Implemented |
| **Preview** | EvidenceView (per card) | Opens `EvidencePreviewModal` with syntax-highlighted forensic payloads & logs | ✅ Implemented |
| **Analyze Artifact** | EvidenceView (per card) | Opens `EvidenceAnalyzeModal` with Hex Disassembler, IOC Extractor, and Telemetry Tree | ✅ Implemented |
| **Download (Icon)** | EvidenceView (per card) | Generates and triggers client-side browser file download (`.json`/`.log`) | ✅ Implemented |
| **Inspect Full Report →** | ReportsView (per card) | Opens `ReportDetailModal` showing executive summaries, methodologies, and printable PDF deliverable | ✅ Implemented |
| **Compile New Report** | ReportsView | Opens `CreateReportModal` to generate custom reports and append to state | ✅ Implemented |
| **Configure Schedule** | ReportsView | Opens `ScheduleDeliveryModal` for frequency and webhook/channel configuration | ✅ Implemented |
| **Export Telemetry / Forensic Log** | Overview / Header / TimelineView | Generates and downloads full workspace summary JSON or timeline audit export | ✅ Implemented |
| **Multi-Target Switcher** | Header | Switches active forensic cluster (All Targets / Windows / Ubuntu) with toast alert | ✅ Implemented |

---

## 🚀 3. Verification & Execution

```bash
cd frontend
npm install
npm run build # Validates zero TypeScript errors and static prerender
npm run dev   # Runs local development server on http://localhost:3000
```
