# AI usage

> Status: live log, kept up to date during the build. Final write-up in Phase 4.

## Tools and models

- Claude Code (cloud session) as the pair programmer. The human reviewed and approved every phase.
- _TODO(human): confirm the exact model and version shown in your Claude Code session._

## Agent instruction files

- [`CLAUDE.md`](CLAUDE.md): repo rules the agent follows on every turn.

## Spec

- [`docs/SPEC.md`](docs/SPEC.md): the full plan/spec prompt, saved verbatim at Phase 0.

## Key prompts and what they changed

_TODO (Phase 4): pick 3–5._ Candidates so far:

1. The Phase 0 spec prompt (docs/SPEC.md). It fixed the architecture and forced a plan-then-approve loop.
2. "See what's feasible, don't overcomplicate, I'll be interviewed on this repo." This led to simplifications S1–S7 in DECISIONS.md.

## Where the AI was wrong and how it was caught

Real incidents only, logged as they happened.

| #   | What the AI got wrong                                                                                                                                                                          | How it was caught                                                                                   | Fix                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | In Phase 0 it proposed building inside an existing, unrelated repo. The brief implies a dedicated project.                                                                                     | The human pushed back ("we should do it in a new repo").                                            | Moved the work to a new repo, `catalogue-poc`.                      |
| 2   | It would have installed the latest `react-router` (v8, which requires React 19) and `typescript` (v7, unsupported by typescript-eslint), conflicting with the spec's React 18 and the linter.  | It checked `npm view … peerDependencies` before writing package.json, instead of relying on memory. | Pinned react-router 7.18.x and TypeScript 5.9.x.                    |
| 3   | The Dockerfiles didn't copy the root `tsconfig.base.json` that each app's tsconfig extends. The web image build failed ("Tsconfig not found"), and the API image would have failed at runtime. | Running `docker build` in Phase 1 rather than assuming the files were right.                        | Added `tsconfig.base.json` to the first `COPY` in both Dockerfiles. |
| 4   | Its Phase 0 note said Fake Store "probably" returns 200 with an empty body for unknown IDs, and that it couldn't verify this.                                                                  | It verified once network access allowed: `GET /products/999` → `HTTP 200`, 0 bytes.                 | Kept the "look up in the cached list" design (DECISIONS A12).       |

_TODO(human): add any incidents you caught in review that aren't listed here._

## Time spent

_TODO(human): actual figures._ Planning: \_\_ · Building: \_\_ · Testing: \_\_ · Reviewing: \_\_
