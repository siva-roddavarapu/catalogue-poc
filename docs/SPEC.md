# SPEC — Catalogue PoC

> This is the working spec / agent prompt used for the build, saved verbatim at Phase 0.
> Source brief: "Code Challenge – AI-Native Engineer" (PDF). Section 1 summarises it; Sections 2–8 are our fixed plan.

ROLE

You are my pair-programming assistant on a take-home challenge. I own every decision and every line; you propose, I review and approve. Work to the standard of an experienced full-stack engineer (React/TypeScript/Node, AWS). We are building a proof of concept that must not be thrown away: it is the first slice of a production codebase. A reviewer will read every line, run it locally, and question every decision in a follow-up interview, and I must be able to explain all of it. Keep the code simple enough to defend, and explain any non-obvious choice in one or two sentences when you make it.

OPERATING RULES (read before writing any code)

- No silent assumptions. The source of truth is the brief summarised in Section 1. Anything not stated there is a gap. For every gap you must either (a) use the decision already fixed in Section 3 of this prompt, or (b) stop, write the gap and your proposed choice into DECISIONS.md under "Open questions", and tell me before you build on it. Never invent a requirement and never quietly drop one.
- Plan first, then build. Phase 0 produces a plan and the assumptions log only. Wait for my "approved" before Phase 1.
- Small vertical slices. One acceptance criterion at a time: backend → frontend → tests → commit. Do not scaffold features that no acceptance criterion asks for.
- Time-box: 2–3 hours of human time. Prefer a small, well-reasoned solution over breadth. If something must be cut, cut it explicitly and record why.
- Verify, don't claim. After each slice, run the tests, the type-check and the linter, and paste the real output. If something fails, fix it before moving on. Never write "should work".
- Flag your own uncertainty. If you are unsure an API, library flag or version exists or behaves as you think, say so and check it (docs or a quick script) instead of guessing.
- No secrets in git. Every config value goes through env vars, with a committed .env.example.

## 1. THE BRIEF (verbatim requirements — do not reinterpret)

Scenario. An entrepreneur wants an MVP product catalogue. Customers search and browse the catalogue and submit an enquiry for products they want. Product metadata is not important yet, so the Fake Store API (https://fakestoreapi.com) is acceptable. They have been burned by throwaway prototypes: the product data source, look and feel, and email provider are all expected to change.

Technical constraints

- One client + one backend. Client: React web app (TypeScript). Backend: Node.js (TypeScript). State the choice and why in the README.
- The client must never call Fake Store directly; all product data goes through our backend.
- Any infrastructure must be AWS-compatible.
- A reviewer runs it locally in under 10 minutes, ideally in one or two commands (e.g. docker compose up).
- No committed secrets; use .env.example.
- No dependency on paid services or accounts the reviewer would need to create.

Acceptance criteria

- AC1 Home: GIVEN I have chosen 5 products to be "top rated", WHEN I view the home page, THEN I see those 5 featured products.
- AC2 Category: GIVEN products are organised into categories, WHEN I click a category link, THEN I see top-rated products for that category AND additional products in that category.
- AC3 Search: GIVEN I have entered a search term in the search bar, WHEN I click the search button, THEN I only see products with text matching that term.
- AC4 Product page: WHEN I click a product tile, THEN I see the product details page.
- AC5 Enquiry: GIVEN I am viewing a product AND click Enquire AND complete the form with my contact details, WHEN I submit, THEN the sales inbox receives an email AND the customer sees a "Thank you" message.

Required deliverables

- Git repo; work on a feature branch (feature/catalogue-poc); open a PR into main and leave it open. The PR description is assessed.
- Full source including tests.
- README.md: setup, run, configuration.
- DECISIONS.md: assumptions where criteria were unclear; requirements dropped/simplified and why; how the design grows beyond the PoC; what you'd do with another day.
- AI_USAGE.md: tools and models; agent instruction files (commit CLAUDE.md / AGENTS.md); the plan/spec; 3–5 key prompts; where the AI got it wrong and how it was caught.
- Time spent: actual time split across planning, building, testing, reviewing.

Assessment areas: solution design (clear boundaries between frontend, backend and the product data source), decision-making, implementation quality (error handling, validation, security basics), testing (critical path), AI engineering practice.

## 2. ARCHITECTURE (fixed)

```
catalogue-poc/
├─ apps/
│  ├─ api/            Node 20+ + TypeScript + Fastify (port 3000)
│  └─ web/            React 18 + TypeScript + Vite + React Router (port 5173) — NOT Next.js
├─ packages/
│  └─ shared/         Zod schemas + inferred types shared by api and web
├─ config/
│  └─ merchandising.json   curated "top rated" product IDs (see 3.1)
├─ docker-compose.yml      api + web + mailpit
├─ .env.example
├─ CLAUDE.md               agent instructions for this repo
├─ README.md  DECISIONS.md  AI_USAGE.md
└─ docs/SPEC.md            this file
```

Backend file layout — apps/api/ (use exactly this)

```
apps/api/
├─ src/
│  ├─ server.ts                 starts the app on PORT
│  ├─ app.ts                    builds the Fastify app: plugins, routes, error handler
│  ├─ config.ts                 reads env, validates with Zod, fails fast
│  ├─ container.ts              the ONE place adapters are chosen
│  ├─ routes/                   HTTP only: parse request -> call service -> respond
│  │  ├─ health.routes.ts
│  │  ├─ products.routes.ts     featured, search, product by id
│  │  ├─ categories.routes.ts   category list, category products
│  │  └─ enquiries.routes.ts
│  ├─ services/                 business rules; no HTTP, no Fake Store knowledge
│  │  ├─ catalogue.service.ts
│  │  └─ enquiry.service.ts
│  ├─ ports/                    interfaces only
│  │  ├─ ProductSource.ts
│  │  ├─ MerchandisingProvider.ts
│  │  └─ EmailSender.ts
│  ├─ adapters/
│  │  ├─ products/
│  │  │  ├─ FakeStoreProductSource.ts   ONLY file that knows fakestoreapi.com
│  │  │  ├─ FixtureProductSource.ts
│  │  │  └─ categorySlug.ts
│  │  ├─ merchandising/JsonFileMerchandising.ts
│  │  └─ email/
│  │     ├─ SmtpEmailSender.ts
│  │     └─ InMemoryEmailSender.ts
│  ├─ lib/
│  │  ├─ cache.ts
│  │  ├─ errors.ts
│  │  └─ errorHandler.ts
│  └─ fixtures/products.json    real snapshot, produced by `npm run fixture:refresh`
├─ scripts/refresh-fixture.ts
├─ test/
│  ├─ helpers/buildTestApp.ts
│  ├─ helpers/testProducts.ts   8 hand-written test products (tests never hit the network)
│  ├─ catalogue.service.test.ts
│  ├─ products.routes.test.ts
│  ├─ categories.routes.test.ts
│  ├─ enquiries.routes.test.ts
│  └─ FakeStoreProductSource.test.ts
├─ Dockerfile  package.json  tsconfig.json  vitest.config.ts
```

Frontend file layout — apps/web/ (use exactly this)

```
apps/web/
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx                   ALL routes declared here by hand (React Router); file names do not create routes
│  ├─ modules/                  one folder per feature/screen
│  │  ├─ home/HomePage.tsx + HomePage.module.css
│  │  ├─ category/CategoryPage.tsx + CategoryPage.module.css
│  │  ├─ search/SearchPage.tsx + SearchPage.module.css
│  │  ├─ product/ProductPage.tsx + ProductPage.module.css
│  │  ├─ enquiry/EnquiryPage.tsx + EnquiryForm.tsx + EnquiryPage.module.css
│  │  └─ not-found/NotFoundPage.tsx
│  ├─ components/               ONLY pieces shared by 2+ modules
│  │  ├─ Header/Header.tsx (+ .module.css)
│  │  ├─ SearchBar/SearchBar.tsx
│  │  ├─ ProductTile/ProductTile.tsx
│  │  ├─ ProductGrid/ProductGrid.tsx
│  │  └─ StatusMessage/StatusMessage.tsx
│  ├─ api/client.ts             the ONLY place that calls fetch('/api/...')
│  ├─ hooks/useApi.ts
│  ├─ lib/formatPrice.ts
│  └─ styles/theme.css, global.css
├─ test/
│  ├─ setup.ts  handlers.ts (MSW)
│  ├─ HomePage.test.tsx
│  ├─ SearchFlow.test.tsx
│  └─ EnquiryForm.test.tsx
├─ index.html  nginx.conf  Dockerfile  package.json  tsconfig.json  vite.config.ts
```

Files are named after what they are (HomePage.tsx, never a generic Page.tsx). Rule: a piece used by one module lives inside that module; only pieces shared by several modules go in components/.

Shared — packages/shared/

```
packages/shared/src/  product.ts  enquiry.ts  api.ts  index.ts
```

npm workspaces. ESLint + Prettier. strict: true TypeScript everywhere.

Backend boundaries (this is what the reviewer scores most)

Ports-and-adapters. Routes depend on services; services depend on interfaces; adapters are chosen in one composition root (src/container.ts) from env vars.

| Port (interface) | PoC adapter | Fixture / test adapter | Why it exists |
|---|---|---|---|
| ProductSource — listProducts(), getProduct(id), listCategories() | FakeStoreProductSource (HTTP, timeout, in-memory TTL cache) | FixtureProductSource (reads committed JSON snapshot) | Data source will change |
| MerchandisingProvider — getHomeFeatured(), getCategoryFeatured(categorySlug) | JsonFileMerchandising | in-memory | "I have chosen" products — curation is owner data, not API data |
| EmailSender — send(message) | SmtpEmailSender (nodemailer → Mailpit locally) | InMemoryEmailSender | Email provider will change (e.g. SES later) |

Rules:

- Our own domain types live in packages/shared. The Fake Store response shape is mapped to our Product type inside the adapter only; nothing outside the adapter knows Fake Store exists.
- Search, featured selection and category assembly happen in services, not in routes or the frontend.
- Config is parsed and validated with Zod at startup; the app fails fast with a clear message on bad config.

REST API (fixed contract, prefix /api)

| Method | Path | Returns |
|---|---|---|
| GET | /api/health | { status: "ok" } |
| GET | /api/categories | Category[] — { slug, name } |
| GET | /api/products/featured | Product[] — exactly the 5 curated home products |
| GET | /api/categories/:slug/products | { category, topRated: Product[], others: Product[] } |
| GET | /api/products/search?q= | Product[] |
| GET | /api/products/:id | Product or 404 |
| POST | /api/enquiries | 202 { id } on success |

Errors use one shape: { error: { code, message, details? } }. Upstream failure → 502 with a safe message; never leak stack traces.

Frontend

- Routes: /, /category/:slug, /search?q=, /product/:id, /product/:id/enquire → thank-you state on the same page after success.
- A single apiClient module is the only place that calls fetch; it uses a relative /api base (Vite dev proxy and nginx in Docker forward to the API).
- Header on every page: category links (from /api/categories) + search input + Search button (form submit, so Enter also works).
- Every data view handles loading, empty and error states.
- Look and feel will change: all colours, spacing, radii and fonts come from CSS custom properties in one theme.css (design tokens). Components use tokens only — no hard-coded colours. Plain CSS Modules; no UI kit.
- Accessible basics: semantic HTML, labelled form inputs, alt on images, visible focus.

## 3. GAP DECISIONS (fixed — record each one in DECISIONS.md with its rationale)

The brief leaves these open. Use exactly these decisions; do not invent others.

3.1 "Top rated" means curated, not computed. The AC says "I have chosen 5 products". So config/merchandising.json holds homeFeatured: [5 product IDs] and categoryFeatured: { [slug]: [IDs] }. Fake Store's rating field is not used to choose them.

- Startup validation: homeFeatured must contain exactly 5 unique IDs. IDs that no longer exist at runtime are skipped and logged (warning), not a crash.
- Category page: topRated = curated IDs for that category that belong to it, in configured order; others = the remaining products of that category, with no duplicates. If no curation exists for a category, topRated is empty and the UI shows only the "More in this category" section — record this.
- Seed the JSON with real Fake Store IDs: check the live /products response, don't guess IDs.

3.2 Categories. Fake Store categories are strings with spaces and apostrophes (e.g. men's clothing). Expose a URL-safe slug (mens-clothing) and a display name; map slug → upstream name in the adapter. Unknown slug → 404.

3.3 Search semantics. Trim the term; case-insensitive substring match against title, description and category. Empty or whitespace-only term → return 400 from the API, and the UI disables the Search button/shows a hint. Max length 100 characters. Search runs server-side over the cached product list (Fake Store has no search endpoint). Results show a "No products match '…'" empty state.

3.4 Product detail. Shows image, title, price (format with Intl.NumberFormat, currency from CURRENCY env, default USD — Fake Store gives no currency, record this), category, description, and an Enquire button. Rating is not shown.

3.5 Enquiry form fields. name (required, 2–100), email (required, valid), phone (optional, 7–20 chars of digits/spaces/+()-), message (optional, ≤1000), plus the productId (hidden). The same Zod schema from packages/shared validates in the browser and on the server; the server is authoritative.

- Server re-fetches the product by ID, so the email contains the real title/price, not client-sent values. Unknown product → 404.
- Email to SALES_INBOX (env) with subject New enquiry: <product title>, plain-text body with customer details and product link. Reply-To = customer email. Escape/strip user input; reject CR/LF in header-bound fields.
- On success, the UI replaces the form with: "Thank you" + a sentence that sales will be in touch. On failure, keep the user's input and show a retry-able error.
- No customer confirmation email and no database persistence of enquiries in the PoC — record both as deliberate cuts.

3.6 "Sales inbox receives an email" locally, with no paid accounts. Docker Compose runs Mailpit (free, local SMTP + web inbox at http://localhost:8025). This is the reviewer's way to see AC5 pass. Production path (SES adapter) is documented, not built.

3.7 Resilience. Fake Store calls: 5 s timeout, one retry on network error, in-memory cache (TTL 5 min, env-configurable). If upstream is down and the cache is empty → 502. PRODUCT_SOURCE=fixture switches to the committed snapshot so the app and tests work offline — this also demonstrates that the data source is swappable.

3.8 Security basics. @fastify/helmet, CORS restricted to the web origin, @fastify/rate-limit on POST /api/enquiries (e.g. 5/min per IP), request body size limit, a hidden honeypot field on the enquiry form (silently 202 if filled), input validation on every route (params, query, body). No auth — the brief has no logged-in users; record this.

3.9 Out of scope (record as dropped): pagination, sorting/filters, cart/checkout, auth, admin UI for curation, i18n, analytics, SSR/SEO, deployment pipeline. The curated JSON file is the "admin" for the PoC.

3.10 AWS compatibility. Containerised stateless API (fits ECS Fargate / App Runner), static web build (fits S3 + CloudFront), EmailSender → SES adapter, MerchandisingProvider → DynamoDB/CMS later. Document only; do not write Terraform/CDK in the time-box.

3.11 Decisions agreed in Phase 0 review (approved by me — do not re-open):

- Frontend is Vite + React Router, not Next.js. The brief asks for one client + one Node backend, and clear FE/BE boundaries are scored; Next.js would blur them and adds nothing the brief needs (no SSR/SEO).
- Folder naming: screens live in src/modules/<feature>/, as laid out above.
- Seed curation in config/merchandising.json: home homeFeatured: [1, 5, 9, 14, 18]; each category's categoryFeatured = its first 2 products. Expected Fake Store layout is IDs 1–4 men's clothing, 5–8 jewelery, 9–14 electronics, 15–20 women's clothing — verify against the live API on first run and correct the seed if it differs.
- Test data: API tests use 8 hand-written products in test/helpers/testProducts.ts and never touch the network. The real offline snapshot comes from npm run fixture:refresh, run once on my machine.
- Windows: my machine is Windows. Every npm script must work in PowerShell/cmd as well as bash (no export, no rm -rf, no &&-dependent shell tricks inside scripts; use node scripts or cross-platform tools).
- Reviewer environment: the README states the Node, npm and Docker versions it was tested with.

If you hit a gap not covered above, follow Operating Rule 1.

## 4. TESTING (critical path, not coverage theatre)

API (Vitest + Fastify inject, using fixture/in-memory adapters — no network):

- Featured returns exactly the 5 curated products in order; missing IDs are skipped.
- Category: topRated and others are disjoint and both belong to the category; unknown slug → 404.
- Search: case-insensitive, matches title/description/category, returns only matches, rejects empty term.
- Product by ID: found / 404 / invalid ID → 400.
- Enquiry: valid → 202 and InMemoryEmailSender received one message to SALES_INBOX with the server-side product title; invalid body → 400 with field errors; honeypot → 202 and no email; unknown product → 404.
- FakeStoreProductSource mapping test with a mocked fetch (shape mapping, slug mapping, timeout → error).

Web (Vitest + React Testing Library + MSW):

- Home renders 5 product tiles.
- Search: type term, click Search → navigates and shows only results.
- Enquiry: client-side validation errors shown; successful submit shows "Thank you"; server error keeps input.

One root command runs everything: npm test. Also npm run typecheck and npm run lint. Add a GitHub Actions workflow running these three on the PR.

## 5. RUNNING LOCALLY (the README must make this true)

- `cp .env.example .env && docker compose up --build` → web at http://localhost:5173 (or 8080), API at :3000, Mailpit at :8025.
- Non-Docker path: `npm install && npm run dev` (runs api + web concurrently; tell the reviewer to start Mailpit with one docker run line).
- Healthchecks in compose so web waits for api.
- .env.example keys: PORT, WEB_ORIGIN, PRODUCT_SOURCE (fakestore|fixture), FAKESTORE_BASE_URL, CACHE_TTL_SECONDS, SMTP_HOST, SMTP_PORT, SMTP_FROM, SALES_INBOX, CURRENCY.

## 6. EXECUTION PLAN

- Phase 0 — Plan (no code). Output: the folder tree, interface signatures, the list of gap decisions you will record, and any new gaps you found. Create CLAUDE.md (repo conventions: TS strict, ports/adapters, no direct Fake Store calls outside the adapter, tests required per slice, conventional commits). Stop and wait for approval.
- Phase 1 — Skeleton. Workspaces, shared package, Fastify app with health route, config validation, composition root, Vite app with router + theme tokens + apiClient, docker-compose with Mailpit. Commit.
- Phase 2 — AC slices, in order: AC4 product page → AC1 home → AC2 category → AC3 search → AC5 enquiry. Each slice: service + route + tests → UI + tests → run all checks → commit (feat(ac1): …).
- Phase 3 — Hardening. Error states, rate limiting, helmet, honeypot, CI workflow.
- Phase 4 — Docs. README, DECISIONS.md, AI_USAGE.md, PR description. Then do a self-review pass: re-read the diff as the reviewer, list anything you would challenge, and fix it or record it.
- Phase 5 — Verify end-to-end from a clean clone: docker compose up --build, click through AC1–AC5, confirm the email appears in Mailpit. Report the actual result.

## 7. DOCUMENT TEMPLATES

- DECISIONS.md — sections: Stack choice and why · Architecture and boundaries · Assumptions (one row per gap: Gap → Decision → Why → How to change later) · Dropped / simplified and why · How this grows beyond the PoC (swap data source, swap email to SES, swap theme, add persistence/CMS for curation, deploy to AWS) · Next day of work · Open questions.
- AI_USAGE.md — sections: Tools and models · Agent instruction files (link CLAUDE.md) · Spec (link docs/SPEC.md) · 3–5 key prompts and what they changed · Where the AI was wrong and how it was caught (fill in with real incidents during the build — leave placeholders marked TODO(human) rather than inventing any) · Time spent (planning / building / testing / reviewing — TODO(human) for actual figures).
- PR description — Summary · How to run · How to verify each AC (step-by-step, including Mailpit) · Key decisions (link DECISIONS.md) · What's not done · Testing summary · Time spent.

## 8. DEFINITION OF DONE

- [ ] AC1–AC5 each demonstrable in the browser, and each has at least one automated test.
- [ ] No file in apps/web references fakestoreapi.com; no file outside FakeStoreProductSource does either (grep and paste the result).
- [ ] Swapping PRODUCT_SOURCE=fixture works with no code change.
- [ ] npm test, npm run typecheck and npm run lint pass; output pasted.
- [ ] docker compose up --build from a clean clone works in under 10 minutes; email visible in Mailpit.
- [ ] No secrets committed; .env.example complete.
- [ ] README, DECISIONS.md, AI_USAGE.md, CLAUDE.md, docs/SPEC.md present; PR open from feature/catalogue-poc into main.
