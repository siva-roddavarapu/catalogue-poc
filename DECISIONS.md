# DECISIONS

> Status: **Phase 0 draft.** Assumptions and open questions only. The remaining sections get filled in during the build.

## Stack choice and why
_TODO (Phase 4)._ Fixed in SPEC §2 / §3.11: React 18 + Vite + React Router client, Node + Fastify API, Zod shared package, npm workspaces.

## Architecture and boundaries
_TODO (Phase 4)._ Ports and adapters (see SPEC §2).

## Assumptions

| # | Gap | Decision | Why | How to change later |
|---|---|---|---|---|
| A1 | What "top rated" means (AC1, AC2) | The owner curates it in `config/merchandising.json` (`homeFeatured`: 5 IDs, `categoryFeatured`: slug → IDs). Fake Store `rating` is not used. | The AC says "GIVEN **I have chosen** 5 products". Curation is owner data, not API data. | Replace `JsonFileMerchandising` with a CMS- or DynamoDB-backed `MerchandisingProvider`. |
| A2 | Bad curation data | Startup check: `homeFeatured` must hold exactly 5 unique IDs, or the app fails fast. IDs missing at runtime are skipped and logged as a warning; they don't cause a crash. | A config typo should fail at boot. Products disappearing upstream is normal and shouldn't take the site down. | Same rules apply in any provider. |
| A3 | A category with no curation | `topRated` is `[]`. The UI shows only "More in this category". | AC2 needs top rated **and** additional products, but uncurated categories can exist. | Add curation entries. |
| A4 | Category identity in URLs | URL-safe slug (`mens-clothing`) plus display name. The slug → upstream name mapping lives in the adapter. Unknown slug → 404. | Upstream names contain spaces and apostrophes. | Another data source supplies its own slugs. |
| A5 | Search semantics (AC3) | Trim the term. Case-insensitive substring match on title, description and category. Runs server-side over the cached list. Empty term → 400 (the UI disables the button); max 100 chars. Empty result shows "No products match '…'". | Fake Store has no search endpoint. "Only see products with text matching" is read as substring. | Push search down into a source that has an index (e.g. OpenSearch) behind the same service method. |
| A6 | Currency (AC4) | `Intl.NumberFormat` with the `CURRENCY` env var, default `USD`. | Fake Store prices carry no currency. | Put currency on `Product` once a real source provides it. |
| A7 | Product detail content (AC4) | Image, title, price, category, description, Enquire button. Rating is not shown. | Rating isn't used for anything (A1), and showing it would invite confusion with "top rated". | Add to `ProductPage`. |
| A8 | Enquiry fields (AC5) | name (2–100), email, phone (optional, 7–20 chars of digits/spaces/`+()-`), message (optional, ≤1000), hidden productId. One shared Zod schema; the server is authoritative. | "Contact details" isn't defined in the brief. | Edit the shared schema. |
| A9 | Trusting client data in the email | The server re-fetches the product by ID. Unknown product → 404. Subject: `New enquiry: <title>`. Plain text. Reply-To is the customer. CR/LF is rejected in header-bound fields. | Stops spoofed product data and header injection. | n/a |
| A10 | "Sales inbox receives an email" locally, with no paid accounts | Mailpit in Docker Compose (SMTP on :1025, UI on :8025), reached through `SmtpEmailSender`. | Free, local, and the reviewer can see it work. | `SesEmailSender` adapter: documented, not built. |
| A11 | Upstream resilience | 5 s timeout, one retry on network error, in-memory TTL cache (default 300 s, `CACHE_TTL_SECONDS`). Upstream down and cache empty → 502. `PRODUCT_SOURCE=fixture` uses the committed snapshot. | The brief expects the data source to change and the app to run for a reviewer. | Shared cache (e.g. ElastiCache) when there is more than one instance. |
| A12 | Security basics | helmet, CORS limited to `WEB_ORIGIN`, rate limit of 5/min/IP on `POST /api/enquiries`, body size limit, honeypot (silent 202), validation on every param, query and body. No auth. | The brief has no logged-in users. | Add auth when accounts exist. |
| A13 | Enquiry persistence and customer confirmation | Neither is built (deliberate cut). | Not in the ACs; time-box. | Add an `EnquiryRepository` port, plus a second `send()` call. |
| A14 | AWS compatibility | Stateless API container (ECS Fargate / App Runner), static web build (S3 + CloudFront), SES, DynamoDB/CMS. Documented only, with no IaC. | Time-box. | Add CDK/Terraform. |

## Dropped / simplified and why
Pagination, sorting and filters, cart and checkout, auth, admin UI for curation (the JSON file is the admin), i18n, analytics, SSR/SEO, deployment pipeline, enquiry persistence, customer confirmation email. Reason: no AC asks for them, and the time-box is 2–3 h. _(Expanded in Phase 4.)_

## How this grows beyond the PoC
_TODO (Phase 4)._

## Next day of work
_TODO (Phase 4)._

## Open questions
_Raised in Phase 0. Each has a proposed choice. Nothing gets built on these until they're answered._

| # | Gap found | Proposed choice |
|---|---|---|
| Q1 | **Build environment ≠ your machine.** I'm running in a Linux cloud container (Node v22.23.5, npm 10.9.9, Docker CLI 29.10.0, **Docker daemon not running**). I can't run `docker compose up` here, and I can't prove the scripts work on Windows. | I build here and keep scripts cross-platform by construction. You run the Phase 5 `docker compose up --build` and a Windows check, and the README's "tested with" versions come from your machine. |
| Q2 | **`fakestoreapi.com` is blocked** by this sandbox's network policy (CONNECT 403). That blocks three things: verifying the seed IDs (§3.11), `npm run fixture:refresh`, and any live smoke test of the adapter. | Option (a): you approve adding `fakestoreapi.com` to this environment's allowed hosts. I then verify the IDs, generate the committed fixture, and smoke-test the adapter here. Option (b): you run `npm run fixture:refresh` on your machine, and the seed stays unverified until then. **I recommend (a).** |
| Q3 | **Branch and PR target.** The brief wants `feature/catalogue-poc` → PR into `main`. | **Resolved:** `main` holds a single initial commit (a README stub). All work goes on `feature/catalogue-poc`, and the PR into `main` stays open. |
| Q4 | Where `catalogue-poc/` lives | **Resolved by owner:** a **new, dedicated repository** (`catalogue-poc`), not an existing repo. The repo root is the project root. |
| Q5 | **Product images hot-link `fakestoreapi.com`.** The image URL comes through our API, but the *browser* fetches the image from Fake Store. That's in tension with "the client must never call Fake Store directly". | Accept it and record it. "All product **data** goes through our backend" holds, and images are assets referenced by URL. The production path is a CDN/S3 image URL from the new source. An image proxy endpoint would be extra scope that no AC asks for. |
| Q6 | Product ID type and "invalid ID → 400" | `id` is a positive integer (Zod `coerce.number().int().positive()` on params). Anything else → 400. |
| Q7 | `getProduct(id)` in the Fake Store adapter | Look the product up in the cached `listProducts()` result instead of calling `/products/:id`. I believe Fake Store answers unknown IDs with 200 and an empty body, but I can't verify that here (Q2). The list is only 20 items, so the lookup uses the cache and avoids that quirk. |
| Q8 | `202 { id }` with no persistence | `id` = `crypto.randomUUID()`. It's included in the email body and the log line so an enquiry can be traced. |
| Q9 | Base URL for the product link in the email | `${WEB_ORIGIN}/product/:id`. No new env key. |
| Q10 | Web port under Docker | nginx container mapped to host **5173**. The URL and `WEB_ORIGIN` are then the same in both run modes. |
| Q11 | How the API finds `config/merchandising.json` | Resolved relative to the repo root by default, and the API Dockerfile copies `config/` in. **No new env key** (none is in the §5 list). |
| Q12 | Rules for `categoryFeatured` | Validated at startup: arrays of unique positive integers. At runtime, an ID that isn't in that category, or a slug that doesn't exist, is skipped with a warning (same policy as A2). |
| Q13 | Display name and slug for upstream `jewelery` (misspelt) | Keep the upstream spelling, title-cased: name "Jewelery", slug `jewelery`. Fixing the source's data isn't the adapter's job. |
| Q14 | What a product tile shows | Image (with alt = title), title, formatted price. The whole tile is a link to `/product/:id` (AC4). |
| Q15 | Honeypot field name | `website`: optional in the shared schema, visually hidden, `tabIndex=-1`, `autocomplete="off"`. |
| Q16 | SMTP auth | None. Mailpit needs none, and SES is a separate adapter later. No `SMTP_USER`/`SMTP_PASS` keys (they aren't in the §5 list). |
