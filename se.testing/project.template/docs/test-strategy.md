# Test Strategy

This file describes the current project's testing scope, layers, and execution entry points.

## Scope

- API tests: `.se/project/testing/specs/api/`
- Contract tests: `.se/project/testing/specs/contract/`
- Web E2E tests: `.se/project/testing/specs/e2e/`

## Execution

- Intention validation: `npm run test:intentions`
- Full test suite: define a project-specific `npm run test:all` script after integration.

## Open Questions

- Current project test targets are not configured yet.
