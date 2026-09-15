---
phase: 05-chrome-web-store-packaging
plan: 01
subsystem: store-readiness
tags: [privacy-policy, cws-guide, listing-copy, single-purpose, popup-footer]

# Dependency graph
requires:
  - phase: 01-foundation-settings-popup
    provides: Popup shell and footer layout
provides:
  - Repository-root PRIVACY.md documenting zero-data collection policy
  - Field-by-field CWS submission guide (docs/CWS-SUBMISSION-GUIDE.md)
  - Single-purpose positioning and reviewer justification note
  - Discreet "Privacy" link in popup footer
affects: [05-02, 05-03]

# Actuals
actuals:
  tasks: 3
  plan: 05-01

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zero-data collection declaration: Affirming no PII, browsing history, authentication tokens, or tweet content leaves the browser (STORE-03, D-04, D-05)"
    - "Single-purpose positioning: Unified narrative framing the 4 tools as an X experience enhancer for focusing on what matters (STORE-04, D-01, D-02, D-03)"
    - "Accessible popup footer links: discreet privacy link with focus rings and hover transitions alongside existing featurebase and github actions (D-06)"

key-files:
  created:
    - PRIVACY.md
    - docs/CWS-SUBMISSION-GUIDE.md
  modified:
    - entrypoints/popup/App.tsx

key-decisions:
  - "D-01/D-02: Better Twitter positioned as 'an X experience enhancer for focusing on what matters' across 4 pillars (Clean Timeline, Custom Themes & Layouts, Local Bookmarks, Twemoji Reactions)"
  - "D-03: Pre-composed CWS Reviewer Justification Note for minimal storage permission and zero external data collection"
  - "D-04/D-05: Zero Data Collection declared on CWS dashboard; PRIVACY.md hosted in repo root"
  - "D-06/D-07: In-app Privacy footer link added; inquiries routed to Featurebase and GitHub Issues"

---

# Phase 05 Plan 01 Summary: CWS Listing & Privacy Policy

## Accomplishments
1. **Official Privacy Policy (`PRIVACY.md`):** Formally published in repo root. Guarantees zero data collection, zero network transmission, local-only storage in `chrome.storage.local`, and principle of least privilege.
2. **Comprehensive CWS Submission Guide (`docs/CWS-SUBMISSION-GUIDE.md`):** Contains exact field-by-field values for extension title, 130-char summary, full single-purpose markdown description, permission justifications, reviewer notes, and data safety questionnaire answers.
3. **Popup Footer Privacy Link (`entrypoints/popup/App.tsx`):** Added a discreet, accessible "Privacy" link next to the version indicator, linking to `PRIVACY.md` on GitHub.

## Verification
- `bunx prettier --check PRIVACY.md`: Passed.
- `bunx prettier --check docs/CWS-SUBMISSION-GUIDE.md`: Passed.
- `bun run build`: Built extension cleanly in 2.4s and passed all 5 security audit assertions.
- `bun run test`: 30 test files, 265 unit tests passing.
