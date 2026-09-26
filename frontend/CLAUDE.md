# JOCKY Central Management Frontend — Quick Developer Reference

## Common Commands
- `npm run dev` — Start Next.js development server on localhost:3000
- `npm run build` — Compile production bundle (Turbopack)
- `npx tsc --noEmit` — Run strict TypeScript compiler verification (0 errors required)

## Codebase Conventions
- **Framework**: Next.js 16.3.3 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS & Vanilla CSS design system
- **State Management**: Centralized custom hooks in `hooks/useDashboardState.ts`
- **Data Layer**: Decoupled static datasets in `data/`
- **Components**:
  - `components/ui/` — Primitives (Card, Modal, Toast, SearchInput, StatusDot, Badge)
  - `components/layout/` — Layout scaffolding (Header, Sidebar)
  - `components/dashboard/` — Dashboard widgets (EndpointAgentsTable, RecentForensicJobsTable, MetricsGrid)
  - `components/modals/` — Interactive modal dialogs
  - `components/views/` — Modular subviews (Overview, Endpoints, Deploy scripts, Live status, Results, Evidence, Reports, Timeline)
- **Type Safety**: Keep all types strictly defined in `types/dashboard.ts` with zero `any` types.
