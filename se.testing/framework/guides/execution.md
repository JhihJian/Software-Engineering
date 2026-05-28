# Test Execution Guide

This file is a project-local template for running automated tests. Replace the
placeholders with commands and paths from the adopting repository before using it
as an operational runbook.

## Test Layers

| Layer | Location | Tooling | Purpose |
|---|---|---|---|
| Unit / integration tests | `<source-test-dir>` | `<project-test-runner>` | Validate internal code behavior and low-level contracts. |
| Automated API / E2E tests | `se.testing/project/` | Playwright + TypeScript | Validate user-visible behavior, API contracts, side effects, and end-to-end flows. |

The automated testing project follows [TEST_ARCHITECTURE.md](../meta/TEST_ARCHITECTURE.md)
and is organized into:

- Intention layer: `project/intentions/*.yaml`.
- Execution layer: `project/specs/api/`, `project/specs/contract/`, and `project/specs/e2e/`.
- Support layer: `project/support/clients/`, `project/support/fixtures/`, `project/support/pages/`, and `project/support/utils/`.
- Knowledge layer: `framework/docs/` and `project/docs/`.

Unit tests and automated E2E tests are independent checks. Passing one layer does
not replace running the other layer.

## Prerequisites

Install the runtime dependencies required by the adopting project, for example:

- `<language-runtime>`
- `<build-tool>`
- Node.js and npm
- Docker / Docker Compose, if E2E tests need disposable infrastructure

Install JavaScript dependencies after cloning or when dependencies change:

```bash
npm install
```

## Quick Verification Flow

Replace the commands below with the repository's real build, environment startup,
health check, and test commands:

```bash
<run-unit-or-build-command>

<start-test-environment-command>

curl <health-check-url>

API_BASE_URL=<api-base-url> npm run test:all
```

Expected health check response:

```json
{"status":"UP"}
```

If the project has no HTTP service or no E2E environment, replace this section
with the smallest repeatable verification command set for that project.

## Reports

Playwright runs should produce machine-readable and human-readable reports. Use
project-specific paths when configuring reporters.

| Artifact | Example path | Purpose |
|---|---|---|
| JSON report | `test-results/results.json` | Machine-readable pass/fail and metadata. |
| HTML report | `test-results/html-report/index.html` | Browser-readable test report. |
| Trace archive | `test-results/artifacts/**/trace.zip` | Failure replay in Playwright Trace Viewer. |
| Error context | `test-results/artifacts/**/error-context.md` | Request, response, and assertion context for failures. |

View the HTML report locally:

```bash
npx playwright show-report <html-report-dir>
```

## Common Commands

```bash
# Run all automated tests
API_BASE_URL=<api-base-url> npm run test:all

# Run API tests only
API_BASE_URL=<api-base-url> npm run test:api

# Run contract tests only
API_BASE_URL=<api-base-url> npm run test:contract

# Run E2E tests only
API_BASE_URL=<api-base-url> npm run test:e2e

# Validate test intention files
npm run test:intentions
```

## Stop The Test Environment

If the project starts disposable infrastructure for E2E tests, document the
cleanup command here:

```bash
<stop-test-environment-command>
```

Only remove volumes, databases, object storage buckets, or generated files when
the project explicitly treats them as disposable test state.

## Failure Handling

Use [framework/docs/failure-spec.md](../docs/failure-spec.md) as the
classification policy. Diagnose the failure before changing specs or assertions:

- Test data issue: update fixtures or data setup.
- Environment issue: record the instability in `project/docs/flaky-cases.md`.
- Business behavior changed: mark the intention as `needs_update`, revise it,
  and review it again.
- Assertion design issue: move the intention back to `draft`, correct it, and
  review it again.
- Implementation or schema issue: fix the product code or schema, then rerun the
  relevant test layer.

Final pass/fail status must come from executable assertions, not manual override.

