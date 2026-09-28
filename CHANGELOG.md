# Project Changelog & Architectural Modifications

All notable structural, architectural, and code transformations made to the **JOCKY Central Management Frontend** repository are documented in this file.

---

## [Deep Link Script Inspection & Go Compiler Navigation] - 2026-09-26

### 🎯 Objective
Enable instant cross-view inspection of deployed Go scripts directly from the **Endpoint Agents Table** (Dashboard Overview) and the **Endpoint Route Registry** table to the **Deploy Scripts Go Routine Compiler & Inspector**.

### 📂 Refinements Implemented
1. **Interactive Script Navigation Pills**:
   - Transformed static `.go` script pills (`mem_dump.go`, `proc_hollow_scan.go`, `kernel_enum.go`, `registry_forensic.go`, `net_pcap.go`, `api_unhook.go`, `direct_syscall.go`) in [`endpoint-agents-table.tsx`](file:///d:/apps/sih%20project/jocky/frontend/components/dashboard/endpoint-agents-table.tsx) and [`endpoints-view.tsx`](file:///d:/apps/sih%20project/jocky/frontend/components/views/endpoints-view.tsx) into interactive buttons with hover styling and tooltips.
   - Handled event propagation so clicking the script pill seamlessly jumps to script inspection without triggering the parent row's modal or selection behavior.
2. **Go Script Database Expansion (`frontend/data/scripts.ts`)**:
   - Added full mock AST nodes, SSA forms, Go routines, and evasion compiler attributes for all routines displayed across the fleet (`kernel_enum.go`, `registry_forensic.go`, `net_pcap.go`, `api_unhook.go`, `direct_syscall.go`, `mem_dump.go`, `proc_hollow_scan.go`).
3. **Automated State Synchronization (`deploy-scripts-view.tsx` & `dashboard-app.tsx`)**:
   - Synced selected script state on view navigation so the Go compiler and code inspector automatically open and highlight the targeted script routine.

---

## [Clean Enterprise Typography & Elimination of AI-Like Decorative Dots and Symbols] - 2026-09-26

### 🎯 Objective
Remove artificial decorative circular dots, repetitive inline icons (e.g. `>_` terminal icons in script badges, shield icons next to status labels, circular dots preceding OS platforms and status text) across data tables to achieve a crisp, mature, human-engineered developer console aesthetic.

### 📂 Refinements Implemented
1. **Endpoint Agents Table (`endpoint-agents-table.tsx`)**:
   - Removed artificial colored circular dots preceding OS names (Windows / Ubuntu).
   - Replaced `<StatusDot>` with crisp, unified status typography (**all `Active`** statuses render in consistent GitHub Green `text-[#1a7f37] dark:text-[#3fb950]`, **all `Monitoring`** in Amber `text-[#9a6700] dark:text-[#d29922]`, and **`Idle`** in Muted Slate `text-[#656d76] dark:text-[#8b949e]`).
   - Removed `<Terminal>` (`>_`) prompt icons from the script badge pills for a clean monospace code pill.
   - Removed decorative `<ShieldCheck>` and `<ShieldAlert>` icons from the Evasion Status column, rendering clear, high-contrast text labels.
   - Fixed column alignment on the **Evasion Status** column (changed from right-aligned `text-right` / `justify-end` to consistent left-aligned `text-left` / `justify-between` across header, column filter dropdown, and data rows).
2. **Endpoints Route View (`endpoints-view.tsx`)**:
   - Cleaned out redundant `<StatusDot>` from the Target & Route column.
   - Removed bullet dots from Evasion status.
   - Removed `<Terminal>` icon from active routine badges.
3. **Recent Forensic Jobs Table (`recent-forensic-jobs-table.tsx`)**:
   - Removed repetitive `<CheckCircle2>`, `<Play>`, and `<Clock>` icons from the Status badges in table rows, relying on clean rounded pill badges.
4. **Forensic Records Table (`forensic-records-table.tsx`)**:
   - Removed `<Binary>`, `<FileCode>`, and `<CheckCircle2>` icons inside table cells to eliminate clutter and improve tabular data readability.
6. **Toolbar & Filter Toggle Buttons (`endpoint-agents-table.tsx`, `forensic-records-table.tsx`, `recent-forensic-jobs-table.tsx`, `results-view.tsx`)**:
   - Replaced artificial bright blue active state on the `Column Filters` toggle button with GitHub Dark/Light neutral active styles (`bg-[#eaeef2]` / `dark:bg-[#30363d]` with `dark:border-[#8b949e]`).
   - Cleaned selected row and card highlights to match GitHub neutral active container backgrounds.
7. **Evidence Analysis & Forensic Record Modals (`evidence-tag-modal.tsx`, `forensic-record-detail-modal.tsx`)**:
   - Removed artificial `Immutable Forensic Record (Read-Only)` and `Immutable Forensic Artifact (Read-Only)` top banners.
   - Removed decorative `<CheckCircle2>` icon inside the AV Evasion card.
   - Refined the metadata summary grids to align with GitHub theme tokens (`#d0d7de` / `#30363d` / `#161b22`).

8. **Run Inspection Modal (`inspect-run-modal.tsx`)**:
   - Replaced static/hardcoded telemetry with dynamic, script-specific diagnostic findings, pass rates, durations, and warnings tailored to the clicked routine (`mem_dump.go`, `proc_hollow_scan.go`, `kernel_enum.go`, `registry_forensic.go`, `net_pcap.go`, `api_unhook.go`).
   - Cleaned saturated color cards to use authentic GitHub neutral metrics containers (`bg-[#f6f8fa] dark:bg-[#161b22] border-[#d0d7de] dark:border-[#30363d]`).

---

## [Header Action Button Deduplication] - 2026-09-26

### 🎯 Objective
Eliminate redundant and stacked action buttons between the top navigation bar (`+ Add Target`) and the active view actions (`+ New Target` / `+ Add Endpoint`).

### 📂 Refinements Implemented
1. **Header Action Clean-up (`header.tsx`)**:
   - Removed the global `+ Add Target` button from the top header bar.
   - Preserved contextual page actions (e.g. `+ New Target` on Overview, `+ Add Endpoint` on Endpoints) within their dedicated page header views without dual-trigger button clutter.

---

## [Route Registry Proportional Table & Void Elimination] - 2026-09-26

### 🎯 Objective
Resolve unnatural horizontal whitespace gaps and misaligned column spacing in the Endpoints Route Registry view by migrating from an arbitrary 12-column grid to a native, responsive HTML `<table>` with proportional cell padding and aligned columns matching all other data tables.

### 📂 Refinements Implemented
1. **Native Table Architecture (`endpoints-view.tsx`)**:
   - Replaced fragile `grid-cols-12` divs with a clean `<table>`, `<thead>`, and `<tbody>` structure with `overflow-x-auto`.
   - Balanced column widths naturally so data elements (Agent/Host, Platform & AV, Active Routine, Health/Latency, and Action) sit snugly with consistent padding (`py-2.5 px-4` / `px-3`).
   - Removed horizontal voids between columns across large screens and widescreen displays.

---

## [Authentic GitHub Light & Dark Theming & Blue Tint Elimination] - 2026-09-26

### 🎯 Objective
Complete a 100% thorough overhaul of both **GitHub Dark** (`#0d1117`, `#161b22`, `#010409`, `#30363d`) and **GitHub Light** (`#f6f8fa`, `#ffffff`, `#d0d7de`, `#1f2328`, `#656d76`) themes across the entire web application, eliminating any residual blue/sky/slate tint artifacts (`#dce6f0`, `#e4ebf3`, `#edf2f7`, `bg-sky-800`, `bg-slate-50`, etc.).

### 📂 Refinements Implemented
1. **GitHub Light Theme Standard**:
   - Canvas background: `#f6f8fa`
   - Cards, modals, containers, dropdowns, and table surfaces: `#ffffff`
   - Structural borders and dividers: `#d0d7de`
   - Typography: Primary `#1f2328`, Muted `#656d76`
   - Primary action buttons: GitHub Green (`bg-[#1f883d] hover:bg-[#1a7f37] text-white`)
   - Secondary action pills & inputs: `bg-[#f6f8fa] hover:bg-[#eaeef2] text-[#1f2328] border-[#d0d7de]`
   - Badges: GitHub Light subtle Blue (`#ddf4ff` / `#0969da`), Green (`#dafbe1` / `#1a7f37`), Yellow (`#fff8c5` / `#9a6700`), Purple (`#fbefff` / `#8250df`), Red (`#ffebe9` / `#cf222e`).
2. **GitHub Dark Theme Standard**:
   - Canvas background: `#0d1117`
   - Cards, modals, containers, dropdowns, and table surfaces: `#161b22`
   - Sidebar & Top Navigation bar: `#010409` with `#30363d` borders
   - Typography: Primary `#e6edf3` / `#f0f6fc`, Muted `#8b949e`
   - Primary action buttons: GitHub Green (`bg-[#238636] hover:bg-[#2ea043] text-white`)
   - Secondary action pills & inputs: `bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border-[#30363d]`
   - Badges: GitHub Dark subtle Blue (`#388bfd`/15 / `#58a6ff`), Green (`#238636`/20 / `#3fb950`), Yellow (`#d29922`/15 / `#d29922`), Purple (`#bc8cff`/15 / `#d2a8ff`), Red (`#f85149`/20 / `#f85149`).
3. **Comprehensive Component Overhaul**:
   - **All 7 Views**: [`overview-view.tsx`](file:///d:/apps/sih%20project/jocky/frontend/components/views/overview-view.tsx), [`deploy-scripts-view.tsx`](file:///d:/apps/sih%20project/jocky/frontend/components/views/deploy-scripts-view.tsx), [`endpoints-view.tsx`](file:///d:/apps/sih%20project/jocky/frontend/components/views/endpoints-view.tsx), [`evidence-view.tsx`](file:///d:/apps/sih%20project/jocky/frontend/components/views/evidence-view.tsx), [`live-status-view.tsx`](file:///d:/apps/sih%20project/jocky/frontend/components/views/live-status-view.tsx), [`reports-view.tsx`](file:///d:/apps/sih%20project/jocky/frontend/components/views/reports-view.tsx), [`results-view.tsx`](file:///d:/apps/sih%20project/jocky/frontend/components/views/results-view.tsx), [`timeline-view.tsx`](file:///d:/apps/sih%20project/jocky/frontend/components/views/timeline-view.tsx), [`destination-view-shell.tsx`](file:///d:/apps/sih%20project/jocky/frontend/components/views/destination-view-shell.tsx).
   - **All 14 Modals**: Add Endpoint, Configure Endpoint, Create Report, Schedule Delivery, Report Detail, Evidence Preview, Evidence Tag, Forensic Record Detail, Guardrail Policy, Import Script, Inspect Run, Stream Logs, User Profile, Environment Config.
   - **All Dashboard Cards & Tables**: `EndpointAgentsTable`, `RecentForensicJobsTable`, `ForensicRecordsTable`, `EndpointHealthTable`, `ImplementationPipelineCard`, `ProposedSolutionPillarsCard`, `LiveExecutionCard`, `QuickActionsGrid`, `MetricsGrid`, `RecentActivityTimeline`.
   - **All UI Primitives & Nav**: `Card`, `Badge`, `Modal`, `SearchInput`, `ThemeToggle`, `Toast`, `StatusDot`, `Sidebar`, `Header`.

---

## [Custom Cyber-Forensic Logo & Standardized JOCKY Brand] - 2026-09-26

### 🎯 Objective
Replace the generator `v0` tab favicon and placeholder branding with a custom, high-fidelity **Cyber-Forensic Shield & Radar Emblem** and standardized **JOCKY** brand identity.

### 📂 Refinements Implemented
1. **Custom Vector Favicon & Logo (`public/icon.svg` & `public/placeholder-logo.svg`)**:
   - Designed a high-resolution SVG emblem featuring a deep slate/navy container, precision cyber-shield contours, concentric radar range rings, crosshairs, and glowing green telemetry node blips.
   - Removed all references to generator logos and icons.
2. **Metadata & Tab Identity (`app/layout.tsx`)**:
   - Updated browser tab title to: `JOCKY | Forensic Operations Control Plane`.
   - Linked `/icon.svg` as vector favicon, shortcut icon, and apple touch icon.
3. **Consistent Brand Nomenclature**:
   - Standardized application branding to **JOCKY** across the sidebar, header breadcrumb, code compiler suite, and JSON telemetry export tools.

---

## [Route Registry Structured Grid & Layout Density Optimization] - 2026-09-26

### 🎯 Objective
Eliminate awkward horizontal voids and sparse floating layouts in the Endpoints Route Registry list by adopting a 12-column balanced structured grid layout.

### 📂 Refinements Implemented
1. **12-Column Responsive Grid (`endpoints-view.tsx`)**:
   - Replaced loose `justify-between` flex layout with a structured 12-column grid.
   - Column breakdown: Target & Route (4 cols), Platform & Protection (3 cols), Active Routine (2 cols), Health & Latency (2 cols), and Actions (1 col).
   - Added desktop header row with clear column titles.
2. **Compact Visual Density**:
   - Reduced padding and balanced line spacing to keep entries readable, clean, and neatly aligned.

---

## [GitHub Dark Theme Implementation] - 2026-09-26

### 🎯 Objective
Replace generic blue-tinted dark mode with authentic **GitHub Dark Theme** (`dark_default`) palette for exceptional contrast, developer familiarity, and clean readability.

### 📂 Refinements Implemented
1. **GitHub Dark Color System (`globals.css`)**:
   - Main Canvas background: `#0d1117`
   - Cards, modals, containers, and table backgrounds: `#161b22`
   - Sidebar and Top Navigation bar: `#010409` with `#30363d` structural borders
   - Input controls, secondary pills, and hover states: `#21262d` and `#1f242c`
   - High-contrast text typography: Primary `#e6edf3` / `#f0f6fc`, Muted `#8b949e`, Subtle `#6e7681`
   - Primary action buttons and links: GitHub Green (`#238636` / `#2ea043`) and GitHub Blue (`#58a6ff`)
2. **Component Synchronization**:
   - Updated `Card`, `Modal`, `Sidebar`, `Header`, `EndpointAgentsTable`, `RecentForensicJobsTable`, and `ForensicRecordsTable` to uniformly use `#161b22`, `#010409`, and `#30363d` divider styles.

---

## [UI De-cluttering & Executive Branding Polish] - 2026-09-26

### 🎯 Objective
Eliminate unneeded promotional badges, repetitive evasion pills, header action duplications, and non-essential subtitles based on user feedback.

### 📂 Refinements Implemented
1. **Header & Title Deduplication**:
   - Removed hardcoded `Central Management Plane` and `JOCKY Framework` text from [`header.tsx`](file:///d:/apps/sih%20project/jocky/frontend/components/layout/header.tsx), replacing with a clean `JOCKY / {activeNav}` breadcrumb.
   - Simplified the Overview page title from `Forensic Central Management Console` to `Overview` in [`overview-view.tsx`](file:///d:/apps/sih%20project/jocky/frontend/components/views/overview-view.tsx) to eliminate redundancy.
   - Removed `● SYSTEM ACTIVE · 100% AV BYPASS ENFORCED` badge from `OverviewView`.
   - Removed `ProposedSolutionPillarsCard` from the top of the Overview dashboard.
   - Removed bottom node status bar (`Node: NTRO-OP-07 ● Online ... Tunnel: Encrypted Relay...`) from `overview-view.tsx`.
2. **Sidebar Branding & Footer**:
   - Cleaned `JOCKY` branding in `sidebar.tsx` by removing `v2.4.1` and `Central Control` subtitle.
   - Removed `Bypass 100% Active` environment status card from the sidebar footer.
3. **Shell Action Cleanup**:
   - Removed `Run now` and `Export` buttons from `destination-view-shell.tsx` to eliminate header crowding and redundant triggers.
4. **Telemetry Badge Cleanup**:
   - Removed `100% AV Evasion Verified` badge from `forensic-records-table.tsx`.
   - Removed `100% AV Bypass` text label from `live-status-view.tsx`.

---

## [Enterprise Cyber-Forensic Polish, Palette Muting & Layout Deduplication] - 2026-09-26

### 🎯 Objective
1. Eliminate all AI artifacts, generator tags, and extraneous icons (`generator: 'v0.app'`, `Sparkles` replaced with forensic icons like `Layers`, `Terminal`, `FileCode2`).
2. Implement an executive cyber-forensic color palette with soft, harmonious tones (muted slates, subtle sky accents, zero harsh neon/rainbow colors).
3. Ensure absolute zero duplicate items across all views (e.g. deduplicated recent jobs list from ResultsView so each view has a distinct operational role).

---

### 📂 Refinements Implemented
1. **Zero AI Footprints**:
   - Stripped `generator: 'v0.app'` from Next.js metadata in `layout.tsx`.
   - Replaced all non-standard icons (`Sparkles`) with domain-accurate cyber-forensic symbols (`Layers`, `FileCode2`, `ShieldCheck`).
2. **Harmonious Executive Color Palette**:
   - Softened card backgrounds, badges, and icon chips across `proposed-solution-pillars-card.tsx`, `evidence-view.tsx`, and `live-status-view.tsx`.
   - Fixed body background rule in `globals.css` so dark/light theme switching operates without CSS overrides.
3. **Cross-Page Layout Deduplication**:
   - Removed duplicate `RecentForensicJobsTable` from `ResultsView` — reserving `Overview` for operational monitoring and `Results` strictly for deep `ForensicRecordsTable` and benchmark telemetry.
   - Verified that every subview has a unique, focused scope without overlapping data tables.

---

## [High-Signal View Detail & Clean Information Architecture] - 2026-09-26

### 🎯 Objective
Elevate every secondary and subview page (Evidence Vault, Live Status, Chronological Timeline, Reports, and Route Registry) with **rich, structured forensic details and metrics without information overload or clutter**, prioritizing actionable operational intelligence.

---

### 📂 Refinements Implemented
1. **Evidence Vault (`EvidenceView`)**:
   - Upgraded artifact cards with SHA-256 integrity hashes (1-click copy), target nodes, evasion technique chips, AV clean verification (`0/72 Clean`), and AES-256-GCM cryptographic seal badges.
   - Added file format filter (`.bin`, `.json`, `.log`, `.csv`), technique filter, and live size aggregator (`22.8 MB`).
2. **Live Status Operations Center (`LiveStatusView`)**:
   - Added granular 5-stage Execution Pipeline Tracker (Survey → VAD Map → Kernel Probe → Socket Sweep → AES Seal).
   - Added Target Cluster Node overhead monitor (CPU <0.4%, RAM, and RTT latency).
3. **Chronological Audit Trail (`TimelineView`)**:
   - Added event category filtering (`Forensic Runs`, `Evidence Vault`, `Kernel & Findings`, `Deployments`, `Audit Reports`) and instant text search.
   - Enhanced event items with system node badges and evasion technique tags.
4. **Forensic Reports Hub (`ReportsView`)**:
   - Integrated category switcher, instant search, and concise stakeholder deliverables.
5. **Route Registry (`EndpointsView`)**:
   - Added multi-criteria filter bar (Platform, Status, Method, Search) with instant reset.

---

## [Universal Column-Wise Table Filtering & Header Sorting] - 2026-09-26

### 🎯 Objective
Empower analysts and operators with deep, granular **column-wise filtering and sorting** across all data tables in the JOCKY console (Endpoint Agents, Recent Forensic Jobs, Extracted Forensic Records, Run Comparison Benchmarks, and Route Registry).

---

### 📂 Refinements & Features Implemented
1. **Endpoint Agents Table (`EndpointAgentsTable`)**:
   - Column sorting on all fields (Agent ID, Hostname, Platform OS, IP, Status, Last Script, AV Present, Evasion Status) with visual `ArrowUpDown` indicators.
   - Inline column filter row with text search inputs (with instant `X` clear buttons) and categorical dropdowns (`All OS`, `All Status`, `All Scripts`, `All AV/EDR`, `All Evasion`).
   - Quick "Column Filters" toggle button with live active filter count badge.
   - Universal "Reset all filters" trigger and empty state filter recovery.
2. **Recent Forensic Jobs Table (`RecentForensicJobsTable`)**:
   - Column-specific filtering across Job ID, Script Name, Target, Type, Started, Duration, Status, and Findings.
   - Bi-directional column sorting for instant triage.
3. **Forensic Records Table (`ForensicRecordsTable`)**:
   - Full column-wise filtering for Record ID/Timestamp, Target System/OS, Evasion Technique, Process Context & PID, Collected Artifact, AV Status, and Severity.
4. **Run Results Benchmark Table (`ResultsView`)**:
   - Column filters for Script Run, AV Evasion %, Duration, Findings, and Status.
5. **Route Registry (`EndpointsView`)**:
   - Dynamic multi-column filtering by Platform, Status, Method, and URL search query.

---

## [Collapsible Sidebar, Navigation Linkage & UI Optimization] - 2026-09-26

### 🎯 Objective
1. Make every card, notification, timeline export, and button throughout the interface 100% interactive and navigable with immediate visual and toast feedback.
2. Introduce collapsible left sidebar with smooth slide animations, `Ctrl+B` (and `⌘B`) keyboard shortcut, and adaptive header branding.
3. Clean up UI redundancy (theme switch deduplicated to top header, removed obsolete search/cloud badges, removed redundant architecture modal).
4. Synchronize all documentation (`README.md`, `IMPLEMENTATION.md`, `OBJECTIVES_AND_HANDOFF.md`, `CHANGELOG.md`) with the Go framework and immutable forensic standards.

---

### 📂 Refinements & Features Implemented
1. **Interactive KPI Metrics & Pillars Grid**:
   - Converted all 6 summary KPI Metric Cards in `metrics-grid.tsx` to active clickable buttons that navigate directly to their corresponding subviews (`Endpoints`, `Deploy scripts`, `Results`, `Live status`, `Evidence`).
   - Integrated `ProposedSolutionPillarsCard` on the Overview console featuring 1-click navigation into each Problem Statement capability.
2. **Interactive Notification Alerts**:
   - Converted static notification entries in `header.tsx` into live navigation links routing directly to `Live status`, `Deploy scripts`, and `Endpoints`.
3. **Collapsible Left Sidebar**:
   - Fixed transform conflict in `sidebar.tsx` so the navigation panel slides cleanly off-screen (`-translate-x-full`).
   - Added global `Ctrl+B` / `⌘B` keyboard listener and header collapse trigger.
   - Added animated radar branding when sidebar is in collapsed state.
4. **Timeline Audit Log Export**:
   - Attached instant CSV/JSON telemetry download handler to `TimelineView`.
5. **Code Optimization & Strict Verification**:
   - Zero TypeScript compilation errors (`npx tsc --noEmit`).
   - Sub-second production bundle builds (~500ms).

---

## [Go Forensic Framework Alignment & Read-Only Immutable Forensic Tools] - 2026-09-26

### 🎯 Objective
1. Remove unwanted clutter text (`sha`, `sih 26148 ps`, `live supabase connected`, `CloudFront CDN Fronted (Port 443)`).
2. Establish strict **Read-Only / Immutable Forensic Records** guarantees so users cannot modify evidence gathered by scripts, while equipping them with rich analytical tools (Memory Dump Hex/Disassembler, IOC Extractor, JSON Telemetry Tree Inspector, and Stream Log Viewer).
3. Align all scripts, agents, and execution runtime specifications to the **Go (Golang)** language and framework.

---

### 📂 Refinements & Architecture Implemented
1. **Clean Professional Transport & Protocol Labels**:
   - Replaced all legacy `CloudFront CDN / Domain Fronting` references with clean, realistic forensic transport terminology: `Encrypted Relay (Port 443 TLS 1.3)`.
   - Removed all distracting extraneous tokens (`sha`, `sih 26148 ps`, `supabase`).
2. **Strictly Read-Only Forensic Analysis Tools**:
   - Upgraded Evidence Vault with [`EvidenceAnalyzeModal`](file:///d:/apps/sih%20project/jocky/frontend/components/modals/evidence-tag-modal.tsx):
     - **Hex & Byte Disassembler**: Interactive offset inspector for volatile binary memory dumps.
     - **Extracted IOCs & Symbols**: Memory address spaces, alloc protections (`PAGE_EXECUTE_READWRITE`), and unhooked DLL routines.
     - **JSON Telemetry Tree**: Formatted machine-readable telemetry viewer with one-click clipboard export.
   - Enforced **Immutable Forensic Record (Read-Only)** guarantees across all tables and modals ([`forensic-record-detail-modal.tsx`](file:///d:/apps/sih%20project/jocky/frontend/components/modals/forensic-record-detail-modal.tsx)).
3. **Go Language Framework Integration**:
   - Updated Script Studio and runtime datasets ([`scripts.ts`](file:///d:/apps/sih%20project/jocky/frontend/data/scripts.ts), [`forensicJobs.ts`](file:///d:/apps/sih%20project/jocky/frontend/data/forensicJobs.ts), [`endpoints.ts`](file:///d:/apps/sih%20project/jocky/frontend/data/endpoints.ts)):
     - Go source routines (`.go`) utilizing native `jocky/forensics`, `jocky/telemetry`, `jocky/win/wdk`, and `jocky/lnx/proc` packages.
     - Go AST call graphs and Go SSA intermediate execution streams.
     - Cross-platform Golang in-memory agent runtime across Windows (WDK) and Linux (eBPF, /proc).

---

## [Universal Dark / Light Theme Switcher & Full-Spectrum Palette System] - 2026-09-26

### 🎯 Objective
Introduce a dedicated left-sidebar theme switch button and implement comprehensive, high-contrast dark and light mode color transitions across every component in the interface — ensuring cards, modals, tables, badges, text elements, borders, inputs, and sidebars transform dynamically without relying solely on background changes.

---

### 📂 Refinements & Architecture Implemented
1. **Interactive Theme Switcher (`ThemeToggle`)**:
   - **Left-Sidebar Placement**: Embedded a dedicated segmented theme controller in the left navigation sidebar under the *Interface Theme* section, with complementary icon toggle in the top header.
   - **Persistent Preference**: Synchronizes with `localStorage` (`'jocky-theme'`) and toggles the root `.dark` / `.light` class on `document.documentElement` for seamless Tailwind styling.
2. **Full-Spectrum Element Color Transitions (Not Just Background)**:
   - **Root Canvas**: `#070b12` in Dark Mode ⟷ `#dce6f0` in Light Mode.
   - **Surface & Cards**: `#0f172a` slate cards with `#1e293b` hover states in Dark Mode ⟷ `#ffffff` crisp white with `#f8fafc` elevation in Light Mode.
   - **Typography & Labels**: `#f1f5f9` / `#cbd5e1` text in Dark Mode ⟷ `#0f172a` / `#475569` text in Light Mode with distinct semantic emphasis.
   - **Tables & Cells**: Dark striped borders (`border-slate-800`, `hover:bg-slate-900/60`) ⟷ Light borders (`border-slate-200`, `hover:bg-slate-50`).
   - **Form Controls & Modals**: Dark styled select dropdowns, text inputs, checkboxes, and all 16 application modals styled with corresponding dark/light variant tokens.
   - **Badges & Accents**: High-contrast cyber-forensic emeralds, ambers, skies, and violets calibrated for both modes.

---

## [Streamlined Production UX & Professional Polish] - 2026-09-26

### 🎯 Objective
Simplify and polish the primary dashboard view so it reflects the clean, uncluttered, professional interface that production investigators and analysts will see, removing redundant stacked elements while retaining full interactive capabilities.

---

### 📂 Refinements Implemented
1. **Uncluttered Overview Console**:
   - Streamlined the primary view to the core operational essentials:
     - **6 Top KPI Summary Cards**: Active Endpoints, Scripts Deployed, Forensic Jobs, AV Evasion Rate, Kernel Callbacks, Tunnel Uptime.
     - **Primary Section**: `ENDPOINT AGENTS (8)` table with live status, `.jky` last script, AV present, and evasion chips.
     - **Secondary Section**: `RECENT FORENSIC JOBS (8)` table with live timers, status indicators, and findings preview.
     - **Bottom Node Status Bar**: `Node: NTRO-OP-07 Online · Tunnel: CloudFront Port 443 TLS 1.3`.
2. **Clean Separation of Modules**:
   - Specialized views (JOCKY Script Studio with Monaco AST/IR, Evidence Vault with AES-256-GCM, Reports Builder, Architecture Map) are neatly organized in their dedicated views and modals rather than crowding the main dashboard.
3. **100% Interactivity**:
   - All rows, search filters, modals, and export buttons remain completely interactive.

---

## [Proposed Solution: 4 Foundational Pillars Integration] - 2026-09-26

### 🎯 Objective
Directly embody and visualize the 4 key pillars of the **Proposed Solution** from the SIH PPT:
1. **Centralized Investigation**: Analyse and manage multiple systems from one unified interface.
2. **Built-in Forensic Functions**: Process • Memory • File • Driver Log • Network analysis executed in volatile memory.
3. **Cross-Platform Agents**: Native agent binaries seamlessly supporting Windows (APIs, WDK) + Ubuntu (/proc, /sys, epoll) endpoints.
4. **New Forensic Programming Language**: Custom declarative DSL (`.jky`) compiling to stealth Jocky IR.

---

### 📂 Components Implemented & Integrated
- **`frontend/components/dashboard/proposed-solution-pillars-card.tsx`**:
  - Interactive 4-card matrix on the Overview dashboard highlighting each pillar with badges (`Multi-Target C2`, `Zero-Disk Footprint`, `Windows + Ubuntu`, `JOCKY DSL (.jky)`).
  - Quick-navigation linking each pillar to its live management interface.

---

## [Technical SIH PPT Alignment: Architecture & 5-Step Pipeline] - 2026-09-26

### 🎯 Objective
Align the application architecture, custom language compiler workflow, execution engine specifications, and 5-step implementation process directly with the official **SIH Technical Presentation Slide**.

---

### 📂 Components & Data Implemented / Updated

#### 1. JOCKY Custom Script & Compiler Pipeline (JOCKY → IR)
- **DSL Code Integration**: Added the exact platform-independent script sample:
  ```jocky
  collect system
  collect processes
  collect network
  collect files "/var/log"
  analyze persistence
  generate report
  ```
- **Interactive Multi-Stage Compiler Viewer**:
  - **Stage 1 (DSL Script)**: Monaco Editor simulation of the declarative token stream.
  - **Stage 2 (AST Structure)**: Tokenized program structure statements (`CollectStmt`, `AnalyzeStmt`, `ReportStmt`).
  - **Stage 3 (Jocky IR)**: Platform-independent intermediate representation (`call_builtin @jocky.collect.system()`, `%0..%4`).

#### 2. Implementation Pipeline Stepper (`ImplementationPipelineCard`)
- Interactive 5-step pipeline component on Overview and Deploy Scripts:
  - **Step 1: Script Creation** (Write JOCKY Script · Define forensic functions & targets)
  - **Step 2: Compile & Validate** (JOCKY → IR + permission checks)
  - **Step 3: Deploy to Endpoints** (Golang Execution Engine across Windows & Linux agents)
  - **Step 4: Collect Forensic Evidence** (Zero-disk dumps · AES-256-GCM encryption · SHA-256 integrity)
  - **Step 5: Generate Report** (Executive findings · Attack timeline · PDF deliverables)

#### 3. Complete Architecture Modal (`JockyArchitectureModal`)
- Modal displaying the 3-Tier System Architecture:
  - **Tier 1**: Custom Language, Lexer/Parser, AST, and Jocky IR.
  - **Tier 2**: Execution Engine, Golang Function Registry, Windows Agent (Windows APIs, Registry, Event Logs, Drivers/WDK), and Linux Agent (`/proc`, `/sys`, `/var/log`, epoll descriptors).
  - **Tier 3**: Central Management, Web Dashboard (React/TS), Backend API (FastAPI, RBAC), and Database (PostgreSQL + AES-256-GCM encrypted evidence storage).

#### 4. Technology Stack Alignment
- Technology stack bar highlighting: **React, TypeScript, Golang (Engine), Cloudflare/CloudFront CDN, PostgreSQL, FastAPI, Monaco Editor, AES-256-GCM, and WDK (Kernel)**.

---

## [Reference UI Integration: Endpoint Agents & Recent Forensic Jobs] - 2026-09-26

### 🎯 Objective
Incorporate key structural, data, and visual bits from the analyst reference UI (JOCKY v2.4.1) while preserving our sleek existing design architecture and layout integrity.

---

### 📂 Components & Data Implemented / Updated

#### 1. KPI Metrics Grid (Top Summary Cards)
- Integrated 6 core forensic KPI metrics matching the reference dashboard:
  - **Active Endpoints**: `24 / 24` (Last heartbeat 3s ago)
  - **Scripts Deployed**: `142` (Polymorphic active `.jky`)
  - **Forensic Jobs**: `7 running` (3 queued · In-memory)
  - **AV Evasion Rate**: `99.3%` (2,840 samples, 0 detections)
  - **Kernel Callbacks**: `18` (Suppressed & disarmed)
  - **Tunnel Uptime**: `99.97%` (AWS → Azure pivot via CloudFront)

#### 2. Endpoint Agents Table (`EndpointAgentsTable`)
- Replaced basic endpoint health rows with comprehensive agent telemetry:
  - **Agent ID**: `AGT-8401` through `AGT-8408`
  - **Hostname**: `NTRO-WIN-04`, `FORENSIC-LNX-11`, `NTRO-WIN-08`, etc.
  - **OS & IP**: Windows 11 / Server 2022 / Ubuntu 22.04 LTS with IP addresses (`10.42.18.91`)
  - **Status**: Live indicators (`• Active`, `• Scanning`, `• Idle`)
  - **Last Script**: `.jky` script identifier (`mem_dump.jky`, `proc_hollow_scan.jky`, `kernel_enum.jky`, `registry_forensic.jky`)
  - **AV Present**: Real-world EDR/AV installations (`CrowdStrike Falcon 7.14`, `Defender for Endpoint`, `SentinelOne EDR`, `Sophos Intercept X`)
  - **Evasion Status**: Badged verification (`Evaded` vs `Monitoring`)
  - **Interactive Filtering**: Real-time search query across Hostname/IP/AV and OS filters (All / Win / Lnx).

#### 3. Recent Forensic Jobs Table (`RecentForensicJobsTable`)
- Added real-time forensic jobs feed:
  - **Job ID & Script**: `JOB-8841` (`mem_dump.jky`), `JOB-8840` (`proc_hollow_scan.jky`), etc.
  - **Target & Type**: Target nodes with analysis classifications (Memory Analysis, Process Forensics, Kernel Analysis, Registry Forensics)
  - **Execution Timers**: Started duration & status (`Completed`, `Running`)
  - **Detailed Findings**: Granular security observations (e.g. *14 anomalous processes identified in unbacked VAD trees*, *Kernel callback tampered — PspCreateProcessNotifyRoutine patched*)
  - **Interactive Telemetry Inspection**: Clicking any job opens inspector details and logs.

---

## [Deep Forensic Records Table & Rich Audit Reports] - 2026-09-26

### 🎯 Objective
Align the data presentation directly with the core **JOCKY Problem Statement**: display forensic system records extracted by AV-evaded scripts (in-memory execution, BYOVD driver callback subversion, unhooked native syscalls) and provide rich executive forensic report deliverables.

---

### 📂 Components & Data Implemented / Updated

#### 1. Forensic Records Layer
- **`frontend/data/forensicRecords.ts`**:
  - Structured live dataset of forensic telemetry extracted by polymorphic routines:
    - Target nodes across Windows Server 2022 and Ubuntu 24.04/22.04 LTS.
    - Evasion techniques (BYOVD Callback Subversion, In-Memory Reflective Injection, Direct Syscall SSN, Polymorphic LLVM Mutation).
    - AV evasion validation (`Bypassed (0 Detections)`, `Stealth Verified`, `Heuristics Blinded`).
    - Process context, PID, memory address regions, unhooked DLL arrays (`ntoskrnl.sys`, `fltmgr.sys`, `ntdll.dll`).
- **`frontend/components/dashboard/forensic-records-table.tsx`**:
  - Searchable, filterable interactive table displaying deep forensic records with severity badges, technique chips, and one-click detailed inspections.
- **`frontend/components/modals/forensic-record-detail-modal.tsx`**:
  - Modal providing granular inspection of unhooked DLL lists, kernel callback hook targets, mitigation actions, and raw JSON clipboard export.

#### 2. Forensic Audit Reports & Deliverables
- **`frontend/data/reports.ts`**:
  - Expanded reports data with executive summaries, evasion methodologies, associated artifact hashes, and investigative next steps.
- **`frontend/components/views/reports-view.tsx`**:
  - Redesigned reports screen with cards showing 100% AV evasion badges, record counts, and a modal trigger for complete report deliverable inspection.
- **`frontend/components/modals/report-detail-modal.tsx`**:
  - Modal displaying full executive report deliverables with downloadable PDF exports, methodology steps, and remediation lists.

#### 3. Polymorphic Scripts & Forensic Evidence Updates
- **`frontend/data/scripts.ts`**: Updated script library with evasion techniques, mutation hashes, and targeted platforms.
- **`frontend/data/evidence.ts`**: Updated evidence artifacts with SHA-256 integrity hashes and AV detection scores (`0/72 (Clean)`).
- **`frontend/data/metrics.ts`**: Updated overview KPI metric cards to reflect AV Evasion Rate (`100%`), Connected Targets, and Extracted Forensic Records (`3,384`).

---

### ⚡ Verification
- **TypeScript**: `cd frontend && npx tsc --noEmit` passed with **0 errors**.
- **Next.js Production Build**: `cd frontend && npm run build` compiled successfully in **~560ms**.
