# CLAUDE.md — agent instructions for this repo

The full spec is `docs/SPEC.md`. It wins over anything here. This file is the short version an agent must follow on every turn.

## Working rules

- **The human owns every decision.** Propose, then wait. Phase 0 ends with a plan; nothing is built before "approved".
- **No silent assumptions.** Anything not in the brief (SPEC §1) or the fixed decisions (SPEC §3) is a gap: write it under "Open questions" in `DECISIONS.md` with a proposed choice and ask before building on it. Never invent or quietly drop a requirement.
- **Small vertical slices, in order:** AC4 → AC1 → AC2 → AC3 → AC5. Each slice = service + route + API tests → UI + UI tests → `npm test`, `npm run typecheck`, `npm run lint` → commit. **Stop after each slice** and report.
- **Don't scaffold** anything no acceptance criterion or SPEC section asks for.
- **Verify, don't claim.** Paste real command output. Never write "should work". If unsure a library flag/API exists, check it.
- **Time-box 2–3 h human time.** Cut explicitly and record the cut in `DECISIONS.md`.
- **No secrets in git.** All config via env vars; keep `.env.example` complete.

## Architecture boundaries (scored most)

- npm workspaces: `apps/api` (Fastify, Node 20+), `apps/web` (React 18 + Vite + React Router, not Next.js), `packages/shared` (Zod schemas + inferred types).
- **Ports and adapters in the API.** `routes/` = HTTP only (parse → call service → respond). `services/` = business rules, no HTTP, no Fake Store knowledge. `ports/` = interfaces only. `adapters/` implement ports. **`src/container.ts` is the one place adapters are chosen**, from validated env (`src/config.ts`, Zod, fail fast).
- **`adapters/products/FakeStoreProductSource.ts` is the only file that may mention `fakestoreapi.com`** or the Fake Store response shape. The web app never calls Fake Store; all product data goes through `/api`.
- Search, featured selection and category assembly live in services — not routes, not the frontend.
- Domain types live in `packages/shared`. The same Zod enquiry schema validates in browser and server; the server is authoritative.
- One error shape: `{ error: { code, message, details? } }`. Upstream failure → 502 with a safe message. Never leak stack traces.

## Frontend rules

- All routes declared by hand in `src/App.tsx`. Screens live in `src/modules/<feature>/`, files named after what they are (`HomePage.tsx`, never `Page.tsx`).
- **Modules rule:** a piece used by one module lives in that module; only pieces shared by 2+ modules go in `src/components/`.
- `src/api/client.ts` is the only place that calls `fetch`, with a relative `/api` base.
- Styling: plain CSS Modules; every colour/spacing/radius/font is a CSS custom property from `src/styles/theme.css`. No hard-coded colours, no UI kit.
- Every data view handles loading, empty and error states. Semantic HTML, labelled inputs, image `alt`, visible focus.

## Code conventions

- TypeScript `strict: true` everywhere. ESLint + Prettier.
- Tests required per slice. API tests use Vitest + Fastify `inject` with in-memory/fixture adapters and the 8 products in `apps/api/test/helpers/testProducts.ts` — **tests never hit the network**. Web tests use Vitest + React Testing Library, mocking `src/api/client.ts` with `vi.mock` (owner-approved simplification S1 in `DECISIONS.md`, replacing MSW).
- **Windows-safe npm scripts:** must run in PowerShell/cmd and bash. No `export`, no `rm -rf`, no `&&`-chained shell tricks, no inline `VAR=x cmd`. Use node scripts or cross-platform tools.
- Conventional commits: `feat(ac4): …`, `fix(api): …`, `test(web): …`, `docs: …`, `chore: …`.
- Explain any non-obvious choice in one or two sentences, in code comments or `DECISIONS.md`.
