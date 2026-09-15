---
phase: 05-chrome-web-store-packaging
plan: 03
subsystem: packaging
tags: [cws-packaging, zip-validation, pipeline, security-audit, invariants]

# Dependency graph
requires:
  - phase: 05-chrome-web-store-packaging
    provides: CWS submission guide and screenshot editor
provides:
  - Automated release packaging script (scripts/package-cws.ts)
  - npm script package:cws via Bun
  - End-to-end pre-submission pipeline: compile -> test -> build -> audit -> zip -> verify
  - Strict zip archive invariant checks (.ts, .map, .git, permissions, version, size)
affects: []

# Actuals
actuals:
  tasks: 2
  plan: 05-03

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Automated release pipeline: single-command verification that guarantees store compliance before developer upload"
    - "Archive inspection: tar-based extraction and verification of manifest and file listings inside the production zip (STORE-01, STORE-02, STORE-05)"
    - "Strict manifest invariant assertions: ensures storage-only permissions, zero host permissions, version locking, and under 10MB total package size (D-11, D-12, D-13)"

key-files:
  created:
    - scripts/package-cws.ts
  modified:
    - package.json

key-decisions:
  - "D-11: bun run package:cws added to package.json executing scripts/package-cws.ts"
  - "D-12: Zero banned files (.ts, .map, .git) and zero host permissions asserted on .output/better-twitter-0.1.0-chrome.zip"
  - "D-13: Store version locked at 0.1.0 for initial release"

---

# Phase 05 Plan 03 Summary: Packaging & Submission Automation

## Accomplishments
1. **Release Packaging Automation (`scripts/package-cws.ts`):** Created an end-to-end pipeline script that runs:
   - TypeScript compilation (`bun run compile`)
   - Vitest unit test suite (`bun run test` - 265 tests passing)
   - Extension build (`bun run build` - 5/5 security assertions passing)
   - Chrome MV3 zip generation (`bunx wxt zip`)
2. **Zip Archive Invariant Verification:** Mechanically inspects `.output/better-twitter-0.1.0-chrome.zip`:
   - Validates total size (2.67 MB, well below the 10MB threshold)
   - Asserts absence of TypeScript sources, sourcemaps, git metadata, and tests
   - Confirms manifest permissions are strictly `['storage']` with zero `host_permissions`
   - Confirms version matches `package.json` (`0.1.0`)
3. **`package:cws` Script:** Registered in `package.json` for reproducible one-command packaging.

## Verification
- `bun run compile`: Passed cleanly (0 type errors).
- `bun run package:cws`: Passed end-to-end with all 8 checks confirmed green.
- Artifact generated: `.output/better-twitter-0.1.0-chrome.zip` (2.67 MB).
