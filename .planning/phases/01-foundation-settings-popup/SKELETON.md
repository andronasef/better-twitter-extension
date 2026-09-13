# Walking Skeleton — Better Twitter!

**Phase:** 1
**Generated:** 2026-09-13

## Capability Proven End-to-End

A user loads the unpacked extension, opens the popup on x.com, clicks the "Timeline" tile, flips "Hide promoted tweets" — and promoted tweets vanish from the already-open feed with no page reload, including ones that load after the flip.

That single sentence traverses every layer this project will ever have: extension package → popup React UI → `chrome.storage.local` write → `storage.onChanged` fan-out → content-script settings dispatcher → timeline MutationObserver pipeline → `data-testid` selector resolution → extension-owned attribute → extension-owned stylesheet → visible DOM change. Nothing in Phases 2–6 introduces a layer this chain does not already touch.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Extension framework | WXT `0.21.4`, MV3, `entrypoints/` file-based | Locked by `.claude/CLAUDE.md` C-1. Generates the manifest from code, owns `web_accessible_resources`, ships `createShadowRootUi` / `storage.defineItem` / `injectScript` — the four APIs this project would otherwise hand-roll |
| UI runtime | React `19.3.0` + `@wxt-dev/module-react` `1.2.2` | Required by shadcn/Radix. `react` and `react-dom` pinned to the identical version — a mismatch is the classic "Portal is broken" red herring |
| Language | TypeScript `~5.7` — **never** 7.x (`tsgo`) | C-5. `latest` on the registry is now `7.0.2`; an unpinned install silently pulls it |
| Styling | Tailwind CSS `4.3.3`, CSS-first `@theme` in `assets/tailwind.css`, `@tailwindcss/vite` registered inside `wxt.config.ts`'s `vite()` hook | C-2 + C-3. There is no `tailwind.config.js` and no top-level `vite.config.ts` anywhere in this repository, ever |
| Component source | shadcn CLI `4.21.0`, `shadcn init -b radix`, unified `radix-ui` `1.6.7` | C-4. `-b radix` is mandatory — shadcn's default base flipped to Base UI in July 2026, so omitting the flag installs `@base-ui/react` and silently breaks the constraint |
| PostCSS | `postcss-rem-to-responsive-pixel` `7.0.5` in `postcss.config.js` | C-6. `rem` inside a shadow root resolves against x.com's `<html>` font-size, not the shadow root — without this the injected UI silently rescales when X changes its root size. Note **7.x**, not the `^6.x` CLAUDE.md records |
| Package manager | **pnpm 9.15.4** with a committed `pnpm-lock.yaml` | Forced by the environment: `npm` is aliased to `bun` in this shell (`alias npm='bun'`), so `npm install` would produce `bun.lockb` and `npm view` fails outright. pnpm is a real unaliased binary, confirmed present, and produces the committable lockfile that is the control for the six `SUS (too-new)` packages |
| Storage | WXT `storage.defineItem` over `chrome.storage.local`; three keys — `local:settings`, `local:diagnostics`, `local:xTheme` | C-10. Three keys not one: diagnostics writes are frequent and must not wake every feature's settings listener, and the theme cache changes independently of user intent |
| Cross-context fan-out | `storage.onChanged` / `item.watch()` — never `chrome.tabs.query` + `sendMessage` | Works with 0..N open tabs and needs no `tabs` permission, which would widen the Chrome Web Store permission story for zero benefit |
| Page-traffic observation | One MAIN-world unlisted script (`entrypoints/bridge.ts`) patching `fetch`, `XMLHttpRequest.open/send`, and `history.pushState/replaceState`; events re-emitted as `CustomEvent` on its own injected `<script>` node with `keepInDom: true` | `fetch`/`XHR`/`history` are per-world JS bindings — an isolated-world patch only ever intercepts the extension's own calls. One injected script, three jobs, zero extra cost |
| SPA route detection | Layered: bridge `bt:navigate` (primary) → `popstate` (back/forward) → `<title>` observer (bridge-failure net) → `wxt:locationchange` (1s poll, last resort), all funnelled into one debounced `onRouteChange(url)` | The isolated-world `history` patch documented in `research/ARCHITECTURE.md` does not work and is superseded |
| DOM targeting | One `lib/selectors.ts` holding every selector string as an ordered candidate chain, primary candidate `data-testid`-anchored | C-9. No selector string appears anywhere else in the codebase — feature code calls `resolve(name, root)` and gets a hit or `null` |
| Injected interactive UI | Shadow root via `createShadowRootUi`; every Radix `*.Portal` receives `container={ui.shadow}` (the `ShadowRoot`, never `shadowHost`) | C-8. A portal without `container` renders into `document.body`, outside the shadow root, unstyled on top of x.com |
| Manifest surface | `permissions: ["storage"]`, no `host_permissions` key at all, every `web_accessible_resources` entry scoped to `matches: ["*://x.com/*","*://twitter.com/*"]` | C-11 + STORE-01, locked on day one so later phases justify additions against it rather than accumulating them |
| Directory layout | `entrypoints/` (background, bridge, one `x.content/`, dev-only `probe.content/`, `popup/`) · `features/<feature>/` · `lib/` · `components/ui/` | One content-script entrypoint for the whole extension. Each WXT content-script entrypoint is a separate bundle with its own isolated instance — two entrypoints matching x.com means two settings listeners, two observers, and two chances to double-process a tweet |
| Distribution | Chrome / MV3 only; `wxt build` → `wxt zip`, manual Chrome Web Store upload | Firefox is a tracked v2 item (`PLAT-01`), addable later through WXT's multi-browser build without touching anything above |

## Stack Touched in Phase 1

- [x] Project scaffold — WXT + React + TypeScript + Tailwind v4 + shadcn/Radix + PostCSS, build and test runners wired (Plan 01-01)
- [x] Routing — the layered SPA route watcher, plus real MV3 entrypoint routing (popup, background, content script, MAIN-world bridge) (Plans 01-01, 01-02)
- [x] "Database" — `chrome.storage.local` via `storage.defineItem`: a real write (popup flips a toggle) **and** a real read (content script resolves settings on boot and on every change) (Plan 01-01)
- [x] UI — a real interactive element wired to the data layer: the popup's `Switch` writes `local:settings`, and an open x.com tab reacts live (Plan 01-01)
- [x] Deployment — `pnpm run build` produces a loadable unpacked MV3 package under `.output/chrome-mv3*`; the documented full-stack run is `pnpm run dev` (HMR against a live x.com tab) and the documented full-stack verification is `pnpm exec playwright test` against the built package (Plan 01-01)

## Out of Scope (Deferred to Later Slices)

Explicitly **not** in the skeleton. This list exists so later phases do not re-litigate Phase 1's minimalism.

- Any clutter toggle other than promoted tweets — "What's Happening", "Who to Follow", the "For You" tab, vanity metrics are all Phase 2 (CLEAN-02…05).
- Promoted **trends** and sidebar ad slots — Phase 2 clutter surfaces, not Phase 1 (CONTEXT D-07).
- Every theme: Dracula, Nord, Matrix, custom accent, Minimal, Old Twitter — Phase 2. Phase 1 only *reads* X's own active theme to colour the popup.
- All bookmark work: capture, folders, tags, search, resurfacing — Phases 3–4. Phase 1's MAIN-world bridge captures GraphQL operation *shapes* as spike output and persists nothing.
- The Twemoji reaction palette and any composer interaction — Phase 5.
- Chrome Web Store listing assets, screenshots, privacy policy text — Phase 6. Phase 1 locks the *permission surface* and the single-purpose sentence those will be audited against.
- Any user-visible injected UI. Phase 1 ships none: CLEAN-01 hides nodes with one stylesheet and an attribute and renders nothing, and the Radix shadow-root provider is proven by a probe `exclude: ['production']` keeps out of the shipped build.
- A full-page options surface (`entrypoints/options/`) — the popup holds every toggle; revisit only if the grid outgrows it.
- Any network request the extension originates. Zero outbound requests is a user-chosen invariant, not an accident — it is what lets STORE-03's privacy claim be unqualified.

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering any architectural decision above.

- **Phase 2 — Clean Timeline & Themes:** more feature controllers registered against the same pipeline and the same registry; the theme engine writes CSS variables into the same token layer the popup already reads.
- **Phase 3 — Bookmark Capture:** the MAIN-world bridge gets its first real consumer — the GraphQL operation shapes Phase 1 captured become the interception target, with the background-tab scrape and the extension-owned save button as layered fallbacks.
- **Phase 4 — Bookmark Folders, Search & Resurfacing:** the first user-visible shadow-root surfaces, built on Phase 1's portal provider and the patterns spike S3 settles.
- **Phase 5 — Twemoji Reactions:** an anchored shadow-root palette on the Like button, inheriting the same portal provider and the same pipeline subscription contract.
- **Phase 6 — Chrome Web Store Packaging:** audits that the permission surface and the single-purpose narrative locked here actually held across Phases 2–5.
