# AI usage

How AI was used to build this repo, including where it went wrong. Incidents were logged as they happened, not reconstructed afterwards.

## Tools and models

- **Claude Code** (a cloud session) as the pair programmer: it planned, wrote code and tests, and ran the checks, Docker and a headless browser.
- **GitHub** (via the Claude GitHub App) for the repo, CI runs and the PR.
- _TODO(human): the exact model and version shown in your Claude Code session._

### How we worked

1. **Spec first.** The full brief and fixed decisions went in as one prompt ([docs/SPEC.md](docs/SPEC.md)). Phase 0 produced only a plan and a gap log. No code until the human said "approved".
2. **Gaps are written down, not assumed.** Every gap became a row in DECISIONS.md, either a fixed decision or an open question proposed to the human (17 raised, all resolved).
3. **One acceptance criterion per slice:** service + route + API tests → UI + UI tests → test, typecheck, lint → commit → stop and report. The human said "go" before each next slice.
4. **Evidence over claims.** Each report pasted real command output, and each AC was also checked in the running app (API calls and a headless browser), not just in unit tests. AC5 was verified in Docker Compose by reading the email back out of Mailpit's API.

## Agent instruction files

- [`CLAUDE.md`](CLAUDE.md): repo rules the agent follows on every turn.

## Spec

- [`docs/SPEC.md`](docs/SPEC.md): the full plan/spec prompt, saved verbatim at Phase 0.

## Key prompts and what they changed

Quoted as typed.

1. **The spec prompt** ([docs/SPEC.md](docs/SPEC.md)): role, operating rules ("no silent assumptions", "verify, don't claim"), fixed architecture, gap decisions and phases.
   **What it changed:** it set the working contract. The AI had to plan before coding, log every gap and stop after every slice. Ports-and-adapters and the folder layout were fixed up front rather than invented on the fly.
2. **"we should do it in a new repo, not in the existing repos, didnt you read the rquiremnt properly"**
   **What it changed:** the AI had proposed building inside an existing, unrelated repo. The work moved to a dedicated `catalogue-poc` repo with a clean `main` (incident 1).
3. **"before going ahead, see whats feasable, dont amke it over complicated by integrating multiple things, becuase post review i will have interview based on this repo onlu"**
   **What it changed:** the AI reviewed the spec against "can the owner defend every line?" and proposed cuts. The approved ones are S1–S7 in DECISIONS.md: no MSW, no generic cache, no retry, no CORS (nothing is cross-origin), no honeypot, no API build step.
4. **"did they ask us to deploye too ?"** then **"then why docker ?"**
   **What it changed:** it clarified scope. There's no deployment or IaC (DECISIONS A16), and Docker Compose was kept only because the brief asks for a one-command local run and AC5 needs a local inbox (Mailpit).
5. **"approved, but what happend with the decisions that went wrong, what changes have you done ?"**
   **What it changed:** after this, every report listed what went wrong and the exact fix, and every incident was logged in the table below in the same turn.

## Where the AI was wrong and how it was caught

Real incidents only, logged as they happened.

| #   | What the AI got wrong                                                                                                                                                                                                                                                                                                                   | How it was caught                                                                                                                                                                                                         | Fix                                                                                                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | In Phase 0 it proposed building inside an existing, unrelated repo. The brief implies a dedicated project.                                                                                                                                                                                                                              | The human pushed back ("we should do it in a new repo").                                                                                                                                                                  | Moved the work to a new repo, `catalogue-poc`.                                                                                                              |
| 2   | It would have installed the latest `react-router` (v8, which requires React 19) and `typescript` (v7, unsupported by typescript-eslint), conflicting with the spec's React 18 and the linter.                                                                                                                                           | It checked `npm view … peerDependencies` before writing package.json, instead of relying on memory.                                                                                                                       | Pinned react-router 7.18.x and TypeScript 5.9.x.                                                                                                            |
| 3   | The Dockerfiles didn't copy the root `tsconfig.base.json` that each app's tsconfig extends. The web image build failed ("Tsconfig not found"), and the API image would have failed at runtime.                                                                                                                                          | Running `docker build` in Phase 1 rather than assuming the files were right.                                                                                                                                              | Added `tsconfig.base.json` to the first `COPY` in both Dockerfiles.                                                                                         |
| 4   | Its Phase 0 note said Fake Store "probably" returns 200 with an empty body for unknown IDs, and that it couldn't verify this.                                                                                                                                                                                                           | It verified once network access allowed: `GET /products/999` → `HTTP 200`, 0 bytes.                                                                                                                                       | Kept the "look up in the cached list" design (DECISIONS A12).                                                                                               |
| 5   | Phase 0 said the Docker daemon wasn't running and fakestoreapi.com was blocked. Both were stale by Phase 1, and the plan had pushed Docker verification onto the human.                                                                                                                                                                 | It re-checked instead of trusting its own earlier note (`dockerd`, `curl`).                                                                                                                                               | Started the daemon and verified Compose in the sandbox; Q1/Q2 removed.                                                                                      |
| 6   | Running Prettier over the repo would have reformatted `docs/SPEC.md`, which must stay verbatim.                                                                                                                                                                                                                                         | `prettier --check` listed SPEC.md among the files to change.                                                                                                                                                              | Added `docs/SPEC.md` to `.prettierignore`.                                                                                                                  |
| 7   | A web test wrote `beforeEach(() => getProduct.mockReset())`. `mockReset()` returns the mock, and Vitest runs a function returned from `beforeEach` as a cleanup hook, so it called the rejecting mock after the test and failed it.                                                                                                     | The test failed. It first guessed wrong (that `mockRejectedValue` rejects eagerly), disproved that with a probe test, then narrowed the cause down by comparing with a passing test.                                      | Braces in `beforeEach`, with a comment explaining why.                                                                                                      |
| 8   | During AC3 it wrote `SearchBar.tsx` into a directory it hadn't created (the shell `cat >` failed), then ran the checks in the same command.                                                                                                                                                                                             | The checks failed right away: TypeScript reported `Cannot find module '../SearchBar/SearchBar'` and 3 web test files failed. It didn't claim success.                                                                     | Created the directory and re-ran the full check suite.                                                                                                      |
| 9   | During AC5 its multi-file edit script stopped halfway: Prettier had reformatted a line in `buildTestApp.ts` since it last read the file, so a text match failed. Earlier files in the script were edited; that one wasn't.                                                                                                              | Its own guard (`assert old in s`) aborted the script, and the test run in the same command failed (8 tests, TypeScript errors).                                                                                           | Confirmed with `grep` which edits had applied, and rewrote the helper file in full instead of patching it.                                                  |
| 10  | Its first `EnquiryForm` used a clever render-prop helper with a hand-written props type. That broke the typecheck (CSS-module class names are `string \| undefined` under strict settings) and would have been hard to defend line by line.                                                                                             | `npm run typecheck` failed; reviewed against the owner's "keep it defensible" instruction.                                                                                                                                | Replaced it with plain JSX: one `fieldProps()` helper and the four fields written out.                                                                      |
| 11  | Its own code and docs had six problems that tests didn't catch. (a) The Vite dev proxy hard-coded port 3000 although `PORT` is configurable. (b) `apiClient.health` was dead code. (c) A line in `container.ts` looked like a silent fallback to fixture data. (d)–(f) DECISIONS.md rows A4, A5 and A9 described the code inaccurately. | The Phase 4 self-review: re-reading the diff as the reviewer, plus greps for dead client functions and banned references.                                                                                                 | (a) Proxy reads `PORT` from the root `.env`, verified with `PORT=3100`. (b) Removed. (c) Comment explains it only narrows the type. (d)–(f) Rows corrected. |
| 12  | Search had two bugs that every test missed. (a) Clearing the box on the results page left the old results on screen, and Enter did nothing. (b) After a search the cursor left the box, because the header remounted the input (`key={currentTerm}`), so Backspace did nothing.                                                         | **The human, testing locally**: "clearing is not working". The AI reproduced it in a browser before changing anything, found (b) while checking its own fix, and asked the human how clearing should behave (a spec gap). | Clearing on the results page goes home (DECISIONS A21). The input now follows the URL without remounting. Three new UI tests, re-checked in a browser.      |

Incident 12 was found by the owner while testing locally on Windows; the automated tests had passed.

**Pattern worth noting:** most incidents were caught by _running_ things (typecheck, tests, `docker build`, a probe script), not by reading. That's why the workflow insists on pasted output.

## Time spent

**About 3 h 30 in total**, over the 2–3 h time-box.

| Planning | Building | Testing | Reviewing |
| -------- | -------- | ------- | --------- |
| 30 min   | 1 h 45   | 30 min  | 45 min    |

Building includes setting up the dedicated GitHub repo and account access.
