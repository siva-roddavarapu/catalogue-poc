# catalogue-poc

A product catalogue MVP. Customers see the owner's featured products, browse by category, search,
open a product and send an enquiry that lands in the sales inbox.

It's a proof of concept built to be **kept, not thrown away**. The three things the owner expects
to change, **the product data source, the look and feel and the email provider**, each sit behind
their own seam, so changing one doesn't mean rewriting the others.

| Layer      | Technology                                                                  | Folder                   |
| ---------- | --------------------------------------------------------------------------- | ------------------------ |
| Web client | React 18 + TypeScript + Vite + React Router                                 | `apps/web`               |
| Backend    | Node.js + TypeScript + Fastify                                              | `apps/api`               |
| Shared     | Zod schemas and TypeScript types used by both                               | `packages/shared`        |
| Local mail | [Mailpit](https://mailpit.axllent.org/): free local SMTP server + web inbox | via Docker or a download |

**More detail:** [DECISIONS.md](DECISIONS.md) (assumptions, trade-offs, what's next) ·
[AI_USAGE.md](AI_USAGE.md) (how AI was used, where it went wrong) ·
[CLAUDE.md](CLAUDE.md) (agent rules) · [docs/SPEC.md](docs/SPEC.md) (the build spec)

---

## Contents

1. [Quick start with Docker (2 commands)](#1-quick-start-with-docker-2-commands)
2. [Run without Docker](#2-run-without-docker)
3. [Check each acceptance criterion](#3-check-each-acceptance-criterion)
4. [Run the tests](#4-run-the-tests)
5. [Configuration](#5-configuration)
6. [Where to change things](#6-where-to-change-things)
7. [How it fits together](#7-how-it-fits-together)
8. [Why this stack](#8-why-this-stack)
9. [Troubleshooting](#9-troubleshooting)
10. [Tested with](#10-tested-with)

---

## 1. Quick start with Docker (2 commands)

**You need:** Docker Desktop (or Docker Engine) with Compose v2, and nothing else: no Node, no
accounts, no API keys.

```bash
cp .env.example .env
docker compose up --build
```

> On Windows **PowerShell**, the first command is `Copy-Item .env.example .env`. In **Git Bash**,
> `cp` works as shown.

The first build downloads the base images and takes a few minutes. When the logs settle, open:

| Open this                                                     | What it is                                          |
| ------------------------------------------------------------- | --------------------------------------------------- |
| **http://localhost:5173**                                     | **The website**: start here                         |
| http://localhost:8025                                         | The sales inbox (Mailpit): enquiry emails land here |
| [localhost:3000/api/health](http://localhost:3000/api/health) | The API (JSON only; it has no page at `/`)          |

Stop with `Ctrl+C`, then `docker compose down`.

**No internet, or Fake Store down?** Set `PRODUCT_SOURCE=fixture` in `.env` and restart. The API
then serves a committed snapshot of the same 20 products, with no code change.

---

## 2. Run without Docker

**You need:** Node.js **20.19 or newer** (Node 22 LTS recommended) and npm.

```bash
cp .env.example .env
npm install
npm run dev
```

`npm run dev` starts the API (port 3000) and the website (port **5173**) together, with reload on
change. Open **http://localhost:5173**.

**For enquiry emails (AC5), also start Mailpit**, using either option, in a second terminal:

- **With Docker:**
  ```bash
  docker run -d --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit:v1.34
  ```
- **Without Docker:** download the zip for your OS from
  [Mailpit releases](https://github.com/axllent/mailpit/releases/latest) (Windows:
  `mailpit-windows-amd64.zip`), unzip it and run `mailpit` (`./mailpit.exe` in Git Bash). Allow it
  through the firewall if Windows asks.

Its inbox is at http://localhost:8025. Without Mailpit everything else works. Sending an enquiry then
shows a friendly "couldn't send, please try again" message, which is the designed failure path.

---

## 3. Check each acceptance criterion

Start at **http://localhost:5173**.

| AC                   | Do this                                                                                                                  | You should see                                                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **AC1 Home**         | Open the home page.                                                                                                      | Exactly 5 featured products: the IDs in `config/merchandising.json` → `homeFeatured`, in that order.                                                                                                         |
| **AC2 Category**     | Click a category in the header, e.g. **Electronics**.                                                                    | **Top rated** (that category's curated picks), then **More in this category** (the rest). No product appears in both.                                                                                        |
| **AC3 Search**       | Type `ssd` and click **Search** (or press Enter).                                                                        | Only products whose title, description or category contains "ssd" (any case). `unicorn` shows "No products match 'unicorn'". The button is disabled while the box is blank. Clearing the box goes back home. |
| **AC4 Product page** | Click any product tile.                                                                                                  | Image, title, price, category, description and an **Enquire** button.                                                                                                                                        |
| **AC5 Enquiry**      | On a product page click **Enquire**, fill in name and email (phone and message are optional) and click **Send enquiry**. | The form is replaced by **Thank you**. At **http://localhost:8025** an email "New enquiry: _product title_" is waiting for `sales@example.com`, with Reply-To set to the customer.                           |

**Worth trying too:** submit the enquiry form empty (inline errors); open `/product/999` or
`/category/hats` (friendly not-found); send 6 enquiries within a minute (the 6th is rate-limited).

---

## 4. Run the tests

```bash
npm test            # 72 tests: API (Vitest + Fastify inject) and web (Vitest + Testing Library)
npm run typecheck   # TypeScript strict mode, every package
npm run lint        # ESLint, including a rule that only the Fake Store adapter may name its URL
```

Tests never touch the network. API tests run the real Fastify app against 8 hand-written products,
in-memory curation and an in-memory outbox. Web tests mock the single API client
(`apps/web/src/api/client.ts`).

GitHub Actions (`.github/workflows/ci.yml`) runs lint, format check, typecheck and tests, plus
`docker compose build`, on every push and pull request.

All npm scripts work in PowerShell, cmd and bash.

---

## 5. Configuration

Everything is an environment variable in `.env` (copy it from `.env.example`). The API validates
them at startup: **a bad value stops it with a message naming each problem**. No secrets are needed.

| Variable             | Default                 | Purpose                                                                                                        |
| -------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| `PORT`               | `3000`                  | API port. The dev website follows it. (Docker Compose pins the container to 3000.)                             |
| `WEB_ORIGIN`         | `http://localhost:5173` | Public URL of the website; used for the product link in enquiry emails.                                        |
| `PRODUCT_SOURCE`     | `fakestore`             | `fakestore` = live [Fake Store API](https://fakestoreapi.com), cached; `fixture` = committed offline snapshot. |
| `FAKESTORE_BASE_URL` | none                    | Required when `PRODUCT_SOURCE=fakestore`.                                                                      |
| `CACHE_TTL_SECONDS`  | `300`                   | How long the product list is cached in memory.                                                                 |
| `CURRENCY`           | `USD`                   | ISO 4217 code used to format prices (Fake Store has no currency).                                              |
| `SMTP_HOST`          | `localhost`             | Mail server. Docker Compose overrides it to `mailpit`.                                                         |
| `SMTP_PORT`          | `1025`                  | Mail server port (Mailpit's default).                                                                          |
| `SMTP_FROM`          | required                | Sender address of enquiry emails.                                                                              |
| `SALES_INBOX`        | required                | Where enquiries are sent.                                                                                      |

### Curation: the owner's "top rated" picks

`config/merchandising.json` is the owner's admin panel for the PoC (excerpt):

```json
{
  "homeFeatured": [1, 5, 9, 14, 18],
  "categoryFeatured": { "electronics": [9, 10], "jewelery": [5, 6] }
}
```

- `homeFeatured` must hold **exactly 5 unique product IDs**, or the API refuses to start.
- `categoryFeatured` maps a category slug to that category's top-rated picks, in display order.
  A category without an entry shows only "More in this category".
- An ID the data source no longer has is skipped and logged, not fatal.

Restart the API after editing it.

---

## 6. Where to change things

| To change…                          | Edit                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Featured / top-rated products       | `config/merchandising.json`                                                                                   |
| Colours, fonts, spacing, radii      | `apps/web/src/styles/theme.css`: every component uses these tokens, with no hard-coded colours anywhere else  |
| Where product data comes from       | Add a class implementing `apps/api/src/ports/ProductSource.ts`, then choose it in `apps/api/src/container.ts` |
| How email is sent (e.g. Amazon SES) | Add a class implementing `apps/api/src/ports/EmailSender.ts`, then choose it in `container.ts`                |
| Search rules                        | `CatalogueService.search` in `apps/api/src/services/catalogue.service.ts`                                     |
| Enquiry form fields and validation  | `packages/shared/src/enquiry.ts`: one schema used by both the browser and the server                          |
| Email content                       | `apps/api/src/services/enquiry.service.ts`                                                                    |
| Pages and routes                    | `apps/web/src/App.tsx` (all routes) and `apps/web/src/modules/<page>/`                                        |

---

## 7. How it fits together

```
Browser ──▶ http://localhost:5173  (Vite in dev · nginx in Docker)
              │  pages ──▶ React app
              └─ /api/* ──▶ API on :3000 ──▶ Fake Store (or the offline snapshot)
                                    └──────▶ SMTP ──▶ Mailpit inbox (:8025)
```

The browser only ever talks to **one address**. `/api` is forwarded to the API by the Vite dev
server or by nginx, so there are no cross-origin calls and no CORS setup. The website **never calls
Fake Store**; only the API does.

Inside the API (ports and adapters):

```
routes/      HTTP only: validate input with Zod → call a service → reply (one error shape)
services/    business rules: featured, category split, search, enquiry email. No HTTP, no Fake Store.
ports/       interfaces: ProductSource · MerchandisingProvider · EmailSender · Logger
adapters/    FakeStore | Fixture products · JSON-file curation · SMTP | in-memory email
container.ts the ONE place adapters are chosen, from validated config
```

Only `apps/api/src/adapters/products/FakeStoreProductSource.ts` knows Fake Store exists, and a lint
rule fails the build if its URL appears in any other source file.

```
apps/web/src
  modules/          one folder per screen: home, category, search, product, enquiry, not-found
  components/       pieces shared by several screens: Header, SearchBar, ProductTile, ...
  api/client.ts     the only place that calls fetch
  styles/theme.css  design tokens
packages/shared/src product, enquiry and error types + Zod schemas used by both apps
```

---

## 8. Why this stack

- **React web client + Node backend**, from the options the brief allows, both in TypeScript.
  **Vite + React Router rather than Next.js**, so frontend and backend stay clearly separate (the
  brief scores those boundaries), and nothing here needs server-side rendering or SEO.
- **Fastify:** small and fast, good TypeScript support, and `inject()` gives quick HTTP tests
  without opening ports.
- **Zod in a shared package:** the enquiry form uses one schema in the browser (instant feedback)
  and on the server (the authority), so the two can't drift.
- **AWS-ready, nothing deployed:** the API is a stateless container (ECS Fargate or App Runner) and
  the website is static files (S3 + CloudFront). The growth path is in [DECISIONS.md](DECISIONS.md).

---

## 9. Troubleshooting

| Symptom                                                   | Fix                                                                                                            |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `localhost:3000` shows `{"error":{"code":"NOT_FOUND",…}}` | That's the API working; it has no page at `/`. The website is **http://localhost:5173**.                       |
| `Copy-Item: command not found`                            | You're in Git Bash: use `cp .env.example .env`. (In PowerShell it's the other way round.)                      |
| API exits with `Invalid configuration: …`                 | `.env` is missing or a value is wrong. The message names the variable. Re-copy `.env.example`.                 |
| Products don't load ("temporarily unavailable")           | Fake Store is slow or unreachable. Set `PRODUCT_SOURCE=fixture` in `.env` and restart.                         |
| "We couldn't send your enquiry"                           | Mailpit isn't running. Start it (section 2), then click **Try again**: your input is kept.                     |
| `port is already allocated` / `EADDRINUSE`                | Something else uses 5173, 3000, 8025 or 1025. Stop it, or `docker compose down` if a previous run is still up. |
| "Too many requests"                                       | The rate limit: 5 enquiries per minute per visitor. Wait a minute.                                             |

---

## 10. Tested with

| Environment                    | Versions                                                   | Run mode                                  |
| ------------------------------ | ---------------------------------------------------------- | ----------------------------------------- |
| Linux (development container)  | Node 22.23.5 · npm 10.9.9 · Docker 29.10.0, Compose v5.7.1 | Docker Compose and `npm run dev`          |
| GitHub Actions `ubuntu-latest` | Node 22                                                    | CI: lint, typecheck, tests, compose build |
| Windows (owner's machine)      | Node + npm (Git Bash), no Docker                           | `npm run dev` (no Docker)                 |
