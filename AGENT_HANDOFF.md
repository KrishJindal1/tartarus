# JOCKEY Central Management Frontend — Agent & Developer Handoff Guide

> **Important**: This document provides architectural context, current state, and guidelines for team leads, developers, and AI agents reviewing or extending this codebase.

---

## 🎯 1. Problem Statement & Domain Purpose

### Context
Modern security solutions monitor API call sequences, behavioral heuristics, and standard compiler signatures. The **JOCKEY Framework** is a central management interface and programming framework designed for multi-target forensic analysis and telemetry management.

### Scope of this Repository
This repository is dedicated to the **Frontend Central Management Interface**:
- **Central Management Dashboard**: Monitoring multi-system analysis runs across Windows and Ubuntu targets.
- **Script Deployment & Library**: Managing versioned analysis scripts, Go AST inspection, execution policies, and deployment rollbacks.
- **Endpoint Registry & Telemetry**: Tracking live target endpoints, latency, health status, and connection channels with column-level filtering.
- **Evidence & Forensic Reports**: Browsing captured system trace artifacts, SHA-256 hashes, error payloads, and generating stakeholder reports.
- **Audit Trails**: Providing a tamper-evident, chronological log of all deployment and analysis events.

---

## 📊 2. Current Implementation State

### ✅ What Has Been Completed
1. **Frontend Architecture**: Modular Next.js 16.3.3 + React 19 + TypeScript architecture inside `frontend/`.
2. **Authentic GitHub Theming**: 100% comprehensive GitHub Light (`#f6f8fa`, `#ffffff`, `#d0d7de`) and GitHub Dark (`#0d1117`, `#161b22`, `#010409`, `#30363d`) themes with zero residual blue tints.
3. **Column-Wise Filtering & Sorting**: Interactive column-level search and sorting across all data tables (`EndpointAgentsTable`, `RecentForensicJobsTable`, `ForensicRecordsTable`, `EndpointsView`).
4. **Interactive Modal System**: 14 specialized modal dialogs for endpoint configuration, script staging, guardrail policies, report generation, telemetry streams, run comparisons, and evidence disassembler.
5. **Script Deep-Linking**: Interactive `.go` routine pills linking directly from fleet tables to Go AST/SSA code compiler inspection.
6. **Clean Enterprise Typography**: Complete removal of artificial AI-style decorative dots and inline symbol noise with unified status color mapping.
7. **Production Build Certified**: Strict TypeScript validation (`npx tsc --noEmit` and `npm run build` pass with 0 errors).

---

## 📋 3. Future Backend Integration Roadmap

When connecting this frontend to live production backend infrastructure:

1. **FastAPI WebSocket Client**:
   - Bind `StreamLogsModal` and `LiveStatusView` to a real WebSocket endpoint (e.g. `wss://api.jockey-forensics.internal/v1/stream`).
2. **PostgreSQL / Backend Auth Session**:
   - Connect `useDashboardState` hooks to authenticated REST endpoints for live persistence of custom scripts and endpoint registrations.
3. **PDF Generation Service**:
   - Link `ReportDetailModal` to a server-side headless Chromium PDF generation service for executive report exports.

---

## 🚀 Quick Verification Commands

```bash
cd frontend
npm install
npm run build # Validates production build (0 errors)
npm run dev   # Starts local dev server on http://localhost:3000
```
