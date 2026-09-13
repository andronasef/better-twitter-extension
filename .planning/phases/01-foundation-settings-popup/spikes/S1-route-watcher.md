# Spike S1: Route Watcher & Navigation API Visibility

**Question:** Does the isolated world see the Navigation API `navigate` event for page-initiated navigations on x.com, and which navigation source wins across client-side transitions?

## Background & Knowns

- **Isolated-world history patch:** Definitively does not see page-initiated navigations (`window.history.pushState` wrapper is per-world and not shared).
- **`wxt:locationchange`:** A 1-second interval poll; viable only as a last-resort safety net, not as the primary driver due to noticeable feature-reapplication lag.
- **`popstate`:** Fires in the isolated world (DOM events are cross-world), but covers browser Back and Forward only; `pushState` transitions do not fire it.
- **`<title>` observer:** Proven effective on x.com, but subject to asynchronous DOM updates and Flash of Uninitialized Title (FOUT) where bare product names ("X", "Twitter") render transiently.
- **MAIN-world bridge:** Intercepts native `history.pushState` / `history.replaceState` directly in page context and emits `bt:navigate` events across the custom event channel.

## Procedure

1. Load the extension development build (`bun run build` or `bun run dev`) in a Chrome/Edge profile signed in to x.com.
2. Open DevTools console on an active x.com tab.
3. Perform the following sequential navigation steps:
   - Click **Home**
   - Click a **User Profile** (e.g. your own profile or any user handle)
   - Click a **Tweet Detail**
   - Click the browser **Back** button
4. For each action, observe console output prefixed with `[bt:spike]` to record:
   - Whether `Navigation API navigate event` logged
   - Which source was reported as winning (`bridge`, `popstate`, `title`, `locationchange`)
5. Update the table below and replace the `PENDING LIVE RUN` marker.

## Result

PENDING LIVE RUN

| Navigation Action | Navigation-API logged? | Winning Source | Notes |
|-------------------|------------------------|----------------|-------|
| Click Home | PENDING | PENDING | Initial landing or feed tab switch |
| Click Profile | PENDING | PENDING | SPA client-side route transition |
| Click Tweet Detail | PENDING | PENDING | Permalinks navigation (`/status/...`) |
| Browser Back Button | PENDING | PENDING | History popstate traversal |

## Consequence

- If the Navigation API is visible in the isolated world, future refactoring could simplify the watcher by using the native event directly as an additional zero-overhead signal.
- If the Navigation API is absent or blocked across worlds (as expected in isolated worlds for page-initiated transitions), the promoted 4-source layered design (`bridge` primary + `popstate` + `<title>` + `locationchange`) remains the verified architecture.
- In all cases, the debounced funnel guarantees exactly one handler invocation per unique route transition.

## Data & Privacy Constraints

- **Zero Persistence:** No URLs containing query tokens, session identifiers, or personal data are stored or transmitted.
- **Validity:** Per research findings, x.com client routing patterns change frequently; observations recorded here reflect live behavior tested on or after 2026-09-13.
