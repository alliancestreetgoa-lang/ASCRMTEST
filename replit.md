# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Tax & Accounting Dashboard (artifact: tax-dashboard)

**Purpose**: Full-stack UK/UAE accounting firm dashboard.

### Frontend pages (artifacts/tax-dashboard/src/pages/)
- `Dashboard.tsx` — Stats cards, upcoming deadlines table, alerts sidebar
- `Clients.tsx` — CRUD table with search/filter, add modal, delete confirm
- `ClientProfile.tsx` — Tabbed client detail (Overview, VAT, CT, Tasks, Docs)
- `Tasks.tsx` — Table view + Kanban board with status columns
- `Vat.tsx` — VAT filing tracker with add modal
- `CorporateTax.tsx` — Corporate tax tracker with add modal
- `Settings.tsx` — Tabbed: General, Tax Settings, Users CRUD, Roles & Permissions
- `Reports.tsx` — Placeholder

### Shared components (artifacts/tax-dashboard/src/components/)
- `layout/Sidebar.tsx` — Dark blue sidebar with nested Tax submenu (uses `useRouter().navigate` to avoid nested `<a>` tags)
- `layout/Topbar.tsx` — Page title, search, region filter, notifications
- `layout/AppLayout.tsx` — Wraps Sidebar + Topbar + main content
- `StatusBadge.tsx` — Colored badge for Completed/Pending/InProgress/Overdue/etc.

### Design system (index.css)
- Primary: Deep Blue `hsl(224 76% 33%)` — `#1E3A8A` equivalent
- Secondary: Teal `hsl(172 60% 25%)` — `#0F766E` equivalent
- Background: Light gray `hsl(210 40% 98%)`

### API routes (artifacts/api-server/src/routes/)
- `/api/dashboard/*` — summary, upcoming-deadlines, alerts
- `/api/clients/*` — CRUD + pagination/search
- `/api/tasks/*` — CRUD + filter by status/priority/clientId
- `/api/vat-records/*` — CRUD + filter
- `/api/corporate-tax/*` — CRUD + filter
- `/api/users/*` — CRUD

### DB schema (lib/db/src/schema/index.ts)
Tables: `clientsTable`, `tasksTable`, `vatRecordsTable`, `corporateTaxTable`, `usersTable`
