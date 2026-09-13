---
phase: 01-foundation-settings-popup
plan: 02
subsystem: routing-and-interception
tags: [bridge, fetch-patch, xhr-patch, history-patch, route-watcher, observers, mutationobserver]

requires:
  - phase: 01-01
    provides: Walking skeleton, pipeline, selectors, storage
provides:
  - MAIN-world unlisted script (entrypoints/bridge.ts) patching fetch, XHR, and history
  - Isolated-world bridge client (entrypoints/x.content/bridge-client.ts)
  - Scoped web_accessible_resources in wxt.config.ts for bridge.js
  - Layered route watcher (entrypoints/x.content/route-watcher.ts) with 4 navigation sources
  - Named observer registries with page-scoped teardown (lib/observers.ts)
  - E2E route-change verification spec (e2e/route-change.spec.ts)
  - Spike notes for S1 (Navigation API visibility) and S2 (live GraphQL operation shapes)
affects: [01-03, 01-04, 01-05, phase-03, phase-04]

actuals:
  tokens: 24000
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns: [main-world-bridge-script-element-channel, per-instance-xhr-url-storage, layered-debounced-route-watcher, page-scoped-observer-lifecycle]

key-files:
  created:
    - entrypoints/bridge.ts
    - entrypoints/x.content/bridge-client.ts
    - entrypoints/x.content/route-watcher.ts
    - lib/observers.ts
    - tests/unit/observers.test.ts
    - tests/unit/route-watcher.test.ts
    - e2e/route-change.spec.ts
    - .planning/phases/01-foundation-settings-popup/spikes/S1-route-watcher.md
    - .planning/phases/01-foundation-settings-popup/spikes/S2-graphql-shapes.md
  modified:
    - wxt.config.ts
    - entrypoints/x.content/index.ts
    - entrypoints/x.content/pipeline.ts
    - entrypoints/background.ts
    - e2e/fixtures/x-home.html

key-decisions:
  - "Bridge events dispatched directly on script node (document.currentScript) rather than window.postMessage, eliminating window broadcast risks"
  - "XHR request URLs stored on XHR instance (this._btUrl) to prevent concurrency race conditions with overlapping in-flight requests"
  - "Route watcher implements a unified NavigationSignal with 4 prioritized sources (bridge, popstate, title, locationchange) debounced to 50ms"
  - "Page-scoped observers disconnected on navigation before re-running setup, leaving global observers intact"
  - "DEV-gated spike instrumentation for S1 and S2 verified stripped completely from production build"

patterns-established:
  - "MAIN-world CustomEvent communication on injected script node with keepInDom: true"
  - "Scoped observer registration: page vs global lifecycle scopes"
  - "Timeline parent observation to detect replaced virtualized timeline nodes"

requirements-completed: [FOUND-03, FOUND-05, FOUND-09]

coverage:
  - id: D1
    description: "MAIN-world bridge observing fetch, XHR, and history with CustomEvent on script node"
    requirement: FOUND-05
    verification:
      - kind: other
        ref: "node -e WAR check script & grep assertions"
        status: pass
    human_judgment: false
  - id: D2
    description: "Layered route watcher funnelling 4 navigation sources into debounced onRouteChange"
    requirement: FOUND-03
    verification:
      - kind: unit
        ref: "tests/unit/route-watcher.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Named observer registry with page-scoped teardown preventing observer leaks across navigations"
    requirement: FOUND-09
    verification:
      - kind: unit
        ref: "tests/unit/observers.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Features survive client-side navigation on replaced timeline node without reload"
    requirement: FOUND-03
    verification:
      - kind: e2e
        ref: "e2e/route-change.spec.ts#Route change: features survive client-side navigation on replaced timeline"
        status: pass
    human_judgment: false
  - id: D5
    description: "Spike S1 and S2 notes committed with methodology and PENDING LIVE RUN markers"
    requirement: FOUND-05
    verification:
      - kind: other
        ref: "node spike headers check"
        status: pass
    human_judgment: false

duration: 20 min
completed: 2026-09-13
status: complete
---

# Phase 1 Plan 02: Route Watcher & Bridge Summary

**MAIN-world network/history interception bridge, layered 4-source route watcher with debouncing, page-scoped observer registries, and Playwright SPA navigation verification.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-13T11:05:00Z
- **Completed:** 2026-09-13T11:25:00Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments

- Implemented `entrypoints/bridge.ts` as a WXT `defineUnlistedScript` running in the MAIN world, patching `window.fetch`, `XMLHttpRequest.prototype.open`/`send`, and `history.pushState`/`replaceState`.
- Communicated bridge events (`bt:graphql`, `bt:navigate`) via `CustomEvent` on `document.currentScript` directly without window broadcasting, protecting user privacy and preventing cross-extension information disclosure.
- Registered scoped `web_accessible_resources` in `wxt.config.ts` strictly limited to `*://x.com/*` and `*://twitter.com/*`.
- Built `entrypoints/x.content/route-watcher.ts` funnelling four navigation sources (`bridge`, `popstate`, `<title>` observer with bare-product-name FOUT guard, and `locationchange`) into a debounced (50ms) `onRouteChange` dispatcher.
- Created `lib/observers.ts` supporting `globalObservers` and `pageObservers` with `teardownPageScope()` to prevent memory and observer leaks across long SPA sessions.
- Enhanced `entrypoints/x.content/pipeline.ts` to observe timeline parent containers to reliably detect and re-attach when X replaces timeline DOM nodes on revisited routes.
- Added comprehensive unit tests in Vitest for observer teardown and route watcher debounce invariants (all passing).
- Added `e2e/route-change.spec.ts` in Playwright demonstrating that features survive client-side navigation on a replaced timeline node without page reload.
- Committed methodology and `PENDING LIVE RUN` notes for Spikes S1 and S2, with probes verified completely removed from production builds.

## Key Decisions & Details

- **Script Node Channel:** `entrypoints/bridge.ts` dispatches events on its own `<script>` element captured via `document.currentScript`. `bridge-client.ts` uses `injectScript('/bridge.js', { keepInDom: true, modifyScript })` to attach listeners prior to execution.
- **Per-Instance XHR Context:** Stored URL on `this._btUrl` inside `open` to guarantee request-URL pairing concurrency safety under overlapping in-flight GraphQL requests.
- **Navigation Signal Architecture:** Promoted a unified `NavigationSignal` model where each source identifies itself, allowing empirical spike tracking and diagnostic visibility.

## Task Commits

Each task was committed atomically:

1. **Task 1: MAIN-World Bridge & Client** - `1c60d64` (`feat(01-02): implement MAIN-world bridge, client, and scoped web accessible resources`)
2. **Task 2: Unit Tests (RED)** - `ebc34cb` (`test(01-02): add unit tests for named observer registry and layered route watcher`)
3. **Task 2: Implementation & Route Change E2E (GREEN)** - `fefc6f0` (`feat(01-02): implement layered route watcher, observer registries, and route change test`)
4. **Task 3: Spike Notes & Instrumentation** - `84e96a9` (`feat(01-02): add spike probes and committed spike notes S1 and S2`)

## Self-Check: PASSED

- `entrypoints/bridge.ts` exists and uses `defineUnlistedScript`.
- `entrypoints/x.content/bridge-client.ts` exports `startBridge`, `onGraphqlShape`, `onBridgeNavigate`.
- `entrypoints/x.content/route-watcher.ts` exports `startRouteWatcher`, `onRouteChange`.
- `lib/observers.ts` exports `observeElement`, `registerGlobalObserver`, `registerPageObserver`, `teardownPageScope`.
- `wxt.config.ts` contains scoped `web_accessible_resources` for `bridge.js`.
- `bun run build` verifies `[bt:spike]` probe is stripped from production bundle.
- `bun x vitest run` passes 18 tests across 4 test suites.
- `bun x playwright test` passes both `tracer.spec.ts` and `route-change.spec.ts`.
