# catalogue-poc

An MVP product catalogue: customers browse curated products, browse by category, search, and send
an enquiry that lands in the sales inbox. It is a proof of concept built to be **kept**: the product
data source, the look and feel and the email provider are each behind a seam so they can change
without a rewrite.

- **Web:** React 18 + TypeScript + Vite + React Router (`apps/web`)
- **API:** Node + TypeScript + Fastify (`apps/api`)
- **Shared:** Zod schemas and types used by both (`packages/shared`)
- **Local email:** [Mailpit](https://mailpit.axllent.org/), a free local SMTP server with a web inbox

Decisions and trade-offs: [DECISIONS.md](DECISIONS.md) · How AI was used: [AI_USAGE.md](AI_USAGE.md) ·
Agent rules: [CLAUDE.md](CLAUDE.md) · Full spec: [docs/SPEC.md](docs/SPEC.md)

## Run it (Docker, recommended): two commands

Needs only Docker (with Compose v2).

```bash
cp .env.example .env
```

```bash
docker compose up --build
```

On Windows PowerShell, use `Copy-Item .env.example .env` for the first command.

| What                     | URL                              |
| ------------------------ | -------------------------------- |
| Web app                  | http://localhost:5173            |
| API                      | http://localhost:3000/api/health |
| Sales inbox (Mailpit UI) | http://localhost:8025            |

The web container waits for the API's healthcheck before starting. The first build takes a few
minutes (it downloads the Node, nginx and Mailpit images).

**No internet, or Fake Store down?** Set `PRODUCT_SOURCE=fixture` in `.env` and restart. The API
then serves a committed snapshot of the same 20 products, with no code change.

## Run it without Docker (for development)

Needs Node **20.19+** (Vite 8 requires it) and npm.

```bash
npm install
```

```bash
cp .env.example .env
```

Start Mailpit (the only Docker piece; skip it if you don't need to test enquiries):

```bash
docker run -d --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit:v1.34
```

Then start the API and web app together, with reload on change:

```bash
npm run dev
```

The web app is at http://localhost:5173. Vite forwards `/api` to the API on `PORT`.

## How to check each acceptance criterion

| AC  | Steps                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 | Open http://localhost:5173. You see the 5 products listed in `config/merchandising.json` (`homeFeatured`), in that order.                                                                                                                         |
| AC2 | Click a category in the header (for example "Electronics"). You see **Top rated** (that category's curated IDs) and **More in this category** (the rest, no repeats).                                                                             |
| AC3 | Type `ssd` in the search box and click **Search** (or press Enter). Only matching products show. The button is disabled while the box is blank; `unicorn` shows "No products match 'unicorn'".                                                    |
| AC4 | Click any product tile. The product page shows image, title, price, category and description, plus an **Enquire** button.                                                                                                                         |
| AC5 | On a product page click **Enquire**, fill in name and email, and click **Send enquiry**. The form is replaced by **Thank you**. Open http://localhost:8025: the email "New enquiry: <product title>" is there, with Reply-To set to the customer. |

Try the error paths too: submit the empty form (inline errors); visit `/product/999` (not found);
send 6 enquiries within a minute (the 6th is rate-limited).

## Configuration

All settings are environment variables, read and validated at startup (`apps/api/src/config.ts`).
**A bad value stops the API with a message naming each problem.** `.env.example` lists every key.
No secrets are needed.

| Variable             | Default                 | What it does                                                                                 |
| -------------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| `PORT`               | `3000`                  | API port. The Vite dev proxy reads it too. (Docker Compose pins the container port to 3000.) |
| `WEB_ORIGIN`         | `http://localhost:5173` | Public URL of the web app; used for the product link in enquiry emails.                      |
| `PRODUCT_SOURCE`     | `fakestore`             | `fakestore` = live Fake Store API (cached); `fixture` = committed offline snapshot.          |
| `FAKESTORE_BASE_URL` | none                    | Required when `PRODUCT_SOURCE=fakestore`.                                                    |
| `CACHE_TTL_SECONDS`  | `300`                   | How long the product list is cached in memory.                                               |
| `CURRENCY`           | `USD`                   | ISO 4217 code used to format prices (Fake Store has no currency).                            |
| `SMTP_HOST`          | `localhost`             | SMTP server. Docker Compose overrides it to `mailpit`.                                       |
| `SMTP_PORT`          | `1025`                  | SMTP port (Mailpit's default).                                                               |
| `SMTP_FROM`          | required                | Sender address for enquiry emails.                                                           |
| `SALES_INBOX`        | required                | Where enquiries are sent.                                                                    |

**Curation** ("top rated", the owner's picks) lives in `config/merchandising.json`. `homeFeatured`
must contain exactly 5 unique product IDs, or the API refuses to start. `categoryFeatured` maps a
category slug to its picks. IDs the data source no longer has are skipped and logged, not fatal.

## Scripts (run from the repo root; all work in PowerShell, cmd and bash)

| Command                               | What it does                                                                           |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| `npm run dev`                         | API + web with reload                                                                  |
| `npm test`                            | All tests (API: Vitest + Fastify `inject`; web: Vitest + Testing Library). No network. |
| `npm run typecheck`                   | `tsc` in every workspace (strict mode)                                                 |
| `npm run lint`                        | ESLint, including a rule that only the Fake Store adapter may name its URL             |
| `npm run format` / `format:check`     | Prettier                                                                               |
| `npm run fixture:refresh -w apps/api` | Re-download the offline snapshot from Fake Store                                       |

CI (`.github/workflows/ci.yml`) runs lint, format check, typecheck and tests, plus `docker compose build`.

## Project layout

```
apps/api/src
  routes/      HTTP only: validate input -> call a service -> respond
  services/    business rules (featured, category split, search, enquiry); no HTTP, no Fake Store
  ports/       interfaces: ProductSource, MerchandisingProvider, EmailSender, Logger
  adapters/    implementations: Fake Store / fixture, JSON curation, SMTP / in-memory email
  container.ts the one place adapters are chosen, from config
apps/web/src
  modules/     one folder per screen (home, category, search, product, enquiry, not-found)
  components/  pieces shared by several screens (Header, SearchBar, ProductTile, ...)
  api/client.ts the only place that calls fetch (relative /api)
  styles/theme.css  all colours, spacing, radii and fonts (design tokens)
packages/shared/src  product, enquiry and error types plus Zod schemas used by both apps
config/merchandising.json  owner curation
```

## Why this stack

- **One React client + one Node API, as the brief asks.** Vite + React Router (not Next.js) keeps a
  hard line between frontend and backend. There's no SEO or SSR requirement that Next.js would help with.
- **Fastify:** small, fast, first-class TypeScript, and `inject()` makes HTTP tests fast with no open
  ports.
- **Zod in a shared package:** the enquiry form is validated by the same schema in the browser and on
  the server, with the server as the authority.
- **AWS-ready without building infra:** the API is a stateless container (ECS Fargate or App Runner)
  and the web app is static files (S3 + CloudFront). See DECISIONS.md.

## Tested with

| Tool    | Version                                                                     |
| ------- | --------------------------------------------------------------------------- |
| Node    | 22.23.5 (minimum 20.19)                                                     |
| npm     | 10.9.9                                                                      |
| Docker  | 29.10.0, Compose v5.7.1                                                     |
| OS      | Linux (development container); GitHub Actions `ubuntu-latest` (CI, Node 22) |
| Windows | TODO(human): versions from the Windows check                                |
