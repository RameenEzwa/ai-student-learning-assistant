# AI Student Learning Assistant

A multi-role educational platform where students get AI tutoring and quizzes, admins manage users, and clients (school administrators) track student performance.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/student-assistant run dev` — run the frontend (port 23889)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Demo Credentials

| Role    | Email                  | Password     |
|---------|------------------------|--------------|
| Admin   | admin@school.edu       | admin123     |
| Student | alice@school.edu       | student123   |
| Client  | client@school.edu      | client123    |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Recharts, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB tables: users, chat_messages, quizzes, quiz_results
- `artifacts/api-server/src/routes/` — auth, users, chat, quizzes, progress
- `artifacts/student-assistant/src/` — React frontend, pages/, components/

## Architecture decisions

- Simple token-based auth: base64 encoded userId:email:timestamp stored in localStorage, decoded server-side
- Password hashing: SHA-256 with a fixed salt (simple for demo; swap for bcrypt in production)
- AI responses: rule-based keyword matching (swap for real LLM integration)
- Role-based routing: login redirects to /dashboard (student), /admin (admin), /client (client)

## Product

- **Login page** — email + password, role-based redirect
- **Student dashboard** — AI chat assistant, quiz browser with live quiz-taking, activity history
- **Admin dashboard** — user stats cards, user management table with create/delete
- **Client dashboard** — student progress overview, quiz reports, performance line chart

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run codegen after changing `lib/api-spec/openapi.yaml`
- DB schema push: `pnpm --filter @workspace/db run push`
- Token auth is intentionally simple — not production-ready

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
