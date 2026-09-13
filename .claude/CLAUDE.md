<!-- GSD:project-start source:PROJECT.md -->

## Project

**Better Twitter!**

A Chrome extension (Manifest V3) that hands control of the X/Twitter web experience back to the person using it: it strips ads and promoted content, adds local bookmark folders with search and timeline resurfacing, offers Facebook-style Twemoji reactions that prefill a 1-emoji reply for the user to send, and layers on community themes (Dracula, Nord, Matrix) plus a minimal and old-Twitter layout.

Built by and for the author as a fun side project, with a public Chrome Web Store listing as the distribution target.

**Core Value:** Every annoyance the author has with X is fixed by a toggle in one popup — and toggling it feels native, not bolted on.

### Constraints

- **Tech stack**: WXT (wxt.dev) + React 18 + TypeScript + Tailwind CSS + Radix UI (shadcn/ui) — WXT gives MV3 generation, auto-imports, and HMR; Radix gives accessible primitives without hand-rolling menus and toggles
- **Icons**: Lucide React for settings chrome, Twemoji for reactions — Twemoji matches X's own emoji rendering so reactions look native
- **Storage**: WXT storage API over `chrome.storage.local` — no backend, no network calls beyond X itself
- **Platform**: Chrome / Manifest V3 only
- **Distribution**: Chrome Web Store — permissions and listing must survive review
- **DOM targeting**: `data-testid` selectors wherever X provides one; structural combinators permitted only in `lib/selectors.ts` where X exposes no testid for that target (and registered with miss-reporting FOUND-04 so failures degrade loudly); class names prohibited. Selector values grounded empirically against live x.com, not unverified research constants. (D-16)

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **WXT** | `0.21.4` | Extension framework: MV3 manifest generation, file-based `entrypoints/`, HMR, auto-imports, storage API, publish/zip pipeline | The de facto modern framework for browser extensions in 2026 (successor to Plasmo/CRXJS in mindshare). Generates the manifest from code instead of hand-writing `manifest.json`, gives first-class Shadow-DOM/iframe content-script UI helpers purpose-built for exactly this project's problem (injecting React UI into a third-party page), and has a documented, versioned storage layer. Confirmed current version via npm registry. |
| **React** | `^19.3.0` (project constraint says "18+" — 19 satisfies it and is what `create-wxt`'s `react` template and `@wxt-dev/module-react` install today) | UI library for all injected surfaces and the popup | Required by shadcn/ui and Radix; React 19's `ReactDOM.createRoot` is what WXT's own `createShadowRootUi`/`createIntegratedUi` examples use directly. No reason to pin to 18 unless a specific dependency demands it — none in this stack do. |
| **TypeScript** | `^5.7` (NOT `7.x` yet — see below) | Type safety across background/content/popup contexts | WXT is TypeScript-first (config, manifest, storage items are all typed). **Do not jump to TypeScript 7.0** (GA July 2026, the Go-native "tsgo" rewrite) yet — it is brand-new, and WXT's Vite pipeline, `vite-plugin-*` tooling, and the broader ecosystem (ESLint typed-linting, ts-node-based scripts) are still stabilizing against it as of this research. Use TS 5.7.x; revisit TS7 once WXT's own `peerDependencies` widen to it. |
| **Vite** | Bundled/managed by WXT (do not install or configure a separate `vite.config.ts`) | Build tool underneath WXT | WXT wraps Vite; a top-level `vite.config.ts` in a WXT project causes silent config conflicts. All Vite customization goes through the `vite: () => ({...})` field in `wxt.config.ts`. |
| **Tailwind CSS** | `^4.3` (v4, CSS-first config) | Utility CSS for every injected surface and the popup | v4 is current and is what shadcn/ui's CLI and templates target today (`@tailwindcss/vite` plugin, `@import "tailwindcss"`, `@theme` in CSS instead of `tailwind.config.js`). This matters more than usual here: v4's CSS-native `@theme`/`@layer` model composes far more predictably with a **single injected `<style>` sheet inside a Shadow Root** than v3's JS-config + separate PostCSS pipeline did — there is one CSS file to inject, not a config object to reconcile with a runtime theme. |
| **shadcn/ui** | CLI `shadcn@4.x` (the package is now published as `shadcn`, not `shadcn-ui` — that name is deprecated) | Copy-in accessible component source (Button, DropdownMenu, Popover, Dialog, Tooltip, Switch, Toast/Sonner, etc.) | Not a runtime dependency — it's a code generator that writes component source into your repo, which is exactly right for an extension: no version drift at runtime, and you can hand-patch components for Shadow-DOM portal behavior (see Integration Risk section) without fighting an upstream package. |
| **Radix UI** (via shadcn) | `radix-ui` unified package `^1.6` (NOT individual `@radix-ui/react-*` packages) | Unstyled accessible primitives shadcn's components wrap | As of the Feb 2026 shadcn "Unified Radix UI Package" change, the `new-york` style imports `{ Dialog as DialogPrimitive } from "radix-ui"` instead of `@radix-ui/react-dialog`. Run `shadcn init --base radix` (the v4 CLI supports `--base radix|base|aria`) to get this. One dependency instead of a dozen `@radix-ui/react-*` entries — meaningfully smaller bundle for a content script that ships to every tab. |
| **Lucide React** | `^1.45` (now a stable 1.x line, not the long-running 0.x it was known for) | Icon set for popup/settings chrome | Matches shadcn/ui's default icon choice; tree-shakeable per-icon imports keep the content-script bundle small. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@wxt-dev/module-react` | `^1.2` | Registers the React Vite plugin + JSX/refresh support inside WXT automatically | Always — add to `modules: ['@wxt-dev/module-react']` in `wxt.config.ts` instead of manually wiring `@vitejs/plugin-react`. |
| `@tailwindcss/vite` | `^4.3` | Tailwind's official Vite plugin (v4's CSS-first pipeline) | Always. Register inside `wxt.config.ts`'s `vite()` hook — **not** a top-level `vite.config.ts`. |
| `@twemoji/api` | `^17.0` (this is the actively maintained jdecked fork's package, published under the `@twemoji` npm scope) | Parses text/renders `<img>` tags for emoji reactions, offline-bundled | See dedicated Twemoji section below — do **not** use the abandoned `twemoji` package from the `twitter` org. |
| `@twemoji/parser` | `^17.0` | Lightweight entity-detection only (no rendering) if you just need to detect emoji in text without the full parse/replace API | Use instead of `@twemoji/api` if you're building your own reaction-picker UI and only need "is this string an emoji, and which codepoint" rather than DOM string-replacement. For this project's reaction picker (rendering a fixed emoji palette, not parsing arbitrary tweet text), `@twemoji/parser` + your own `<img>` mapping is actually the better fit — you control exactly which ~10-20 reaction glyphs get bundled rather than pulling in the full parse-and-replace machinery. |
| `nanoid` | `^5.x` | ID generation for bookmark records, folder/tag IDs, storage migrations (WXT's own storage docs use this exact pattern for a v1→v2 migration) | Any place you need a stable local ID that isn't the tweet ID itself (folders, tags). |
| `postcss-rem-to-responsive-pixel` | `^6.x` | Rewrites Tailwind's `rem`-based utilities to `px` at build time | **Required**, not optional — see Integration Risk section. `rem` inside a Shadow Root still resolves against the *host page's* `<html>` font-size, not the shadow root, so if X ever changes its root font-size your entire injected UI silently rescales. |
| `@webext-core/isolated-element` | `^3.0` (this is WXT's internal dependency for `createShadowRootUi` — you don't install it directly, but pin awareness of its version) | Implements the actual shadow-root wrapper WXT's `createShadowRootUi` uses | Know its version when debugging: v3 (current) simplified the DOM structure and requires `:host` (not just `:root`) in your reset CSS — this is a real breaking change from WXT ≤0.12 tutorials still circulating online. |
| `vitest` | `^5.x` (bundled well by `wxt/testing/vitest-plugin`) | Unit tests for pure logic (storage migrations, selector-resolution helpers, reaction-undo timer logic) | See Testing section. |
| `@playwright/test` | latest | E2E tests that load the actual built, unpacked extension in real Chromium | See Testing section — this is the *only* way to meaningfully test content-script behavior end-to-end; Vitest cannot exercise a real page + Shadow DOM + MutationObserver interplay. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `wxt` CLI (`wxt dev`, `wxt build`, `wxt zip`, `wxt submit`) | Dev server w/ HMR, production build, Chrome Web Store zip, automated store submission | `wxt zip` produces the store-ready archive from `.output/chrome-mv3-*`; `wxt submit --chrome-zip ...` can push to the Chrome Web Store API directly once you have a refresh token — useful once this ships publicly per PROJECT.md's CWS distribution goal. |
| `@wxt-dev/auto-icons` | Generates all required icon sizes (16/32/48/128 + action icons) from one source PNG/SVG | Optional but removes a whole category of "forgot an icon size, CWS rejected the zip" failures. |
| ESLint + `typescript-eslint` | Linting across background/content/popup contexts, which have different global scopes (`chrome.*` vs DOM vs neither) | Configure per-entrypoint overrides so content-script files get DOM globals and background files get service-worker globals; WXT auto-import types (`wxt/browser`) need `.wxt/types` in your `tsconfig.json` `include`. |

## Installation

# Scaffold (creates the WXT project with the React template)

# Core framework deps (WXT + React module are added by the template; shown for clarity)

# Styling

# Icons + emoji

# Supporting

# Dev dependencies

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| WXT | Plasmo | Plasmo pioneered this space but has had slower MV3/Manifest churn responsiveness and a more opinionated (harder to eject from) build; WXT's plain Vite config escape hatch is a better fit for a project that needs custom PostCSS (rem→px) and Shadow-DOM-specific tuning. |
| WXT | Raw `@crxjs/vite-plugin` + hand-written manifest | Only if you specifically want zero framework abstraction over the manifest. Costs you WXT's storage API, content-script-UI helpers (`createShadowRootUi` etc.), and the publish pipeline — all of which this project needs. |
| Tailwind v4 | Tailwind v3 | Only if a specific plugin you need hasn't shipped a v4-compatible version yet. Check first — the whole shadcn/Radix ecosystem has moved to v4 as of the Feb/Mar 2026 changelogs referenced above, so staying on v3 means fighting upstream examples that no longer match your config shape. |
| `radix-ui` unified package | Individual `@radix-ui/react-dialog`, `@radix-ui/react-popover`, etc. | Only if you're on an older shadcn `new-york` install predating Feb 2026 and haven't run `npx shadcn@latest migrate radix` yet. |
| `@twemoji/parser` (detection only) + your own glyph map | `@twemoji/api` (full parse-and-DOM-replace) | Use `@twemoji/api` if you later add emoji rendering to arbitrary tweet/reply text (not just your fixed reaction palette) — it handles arbitrary Unicode text replacement, which the parser alone doesn't. |
| WXT `storage.defineItem` | Raw `chrome.storage.local` | Only inside code paths WXT can't reach (there are none here) or when writing a background-only micro-optimization where you want to batch multiple raw `chrome.storage.local.set()` calls yourself for a documented performance reason. Default to `defineItem` everywhere else. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| `twemoji` (the `twitter/twemoji` GitHub org / plain `twemoji` npm package) | Twitter/X archived the repo; the maintainers explicitly say **"twitter/twemoji is deprecated. Use jdecked/twemoji instead."** It hasn't shipped new Unicode emoji revisions since 2023. | `@twemoji/api` or `@twemoji/parser` (jdecked fork, actively maintained, current through Unicode 17). |
| Hotlinking Twemoji SVG/PNG assets from `cdn.jsdelivr.net/gh/jdecked/twemoji@.../assets/...` at runtime | Content scripts run inside x.com's execution context; a page CSP with a restrictive `img-src` (X does set one) can block a live cross-origin fetch initiated *by the page's own CSP evaluation of an `<img>` tag your content script inserts*, and it's a runtime network dependency for a feature that should work offline/instantly. | Bundle the exact emoji glyphs you use (your reaction palette is a small, fixed set — not the full Unicode range) into `public/twemoji/*.svg`, reference them via `browser.runtime.getURL('twemoji/1f44d.svg')`, and declare them in `web_accessible_resources` scoped to `matches: ["*://x.com/*", "*://twitter.com/*"]`. Content-script-injected DOM is generally exempt from the *script*-related parts of page CSP, but don't rely on CSP nuances for a feature this core — bundling removes the question entirely and works offline. |
| A top-level `vite.config.ts` alongside WXT | WXT manages its own Vite instance; a sibling `vite.config.ts` causes config to silently not apply, or double-apply plugins, and is a very common "why isn't Tailwind working" report in WXT's own GitHub discussions. | Put all Vite config inside `wxt.config.ts`'s `vite: () => ({ plugins: [...] })`. |
| `tailwind.config.js`/`.ts` for v4 | v4 moved to CSS-first config (`@theme` in your CSS file). A leftover `tailwind.config.js` from a v3 tutorial is either ignored or causes confusing partial-application of theme tokens. | Configure `@theme { --color-... }` etc. directly in the CSS file you import into each content-script UI. Leave `components.json`'s `tailwind.config` field blank for v4 (per shadcn's own docs). |
| Radix `Dialog`/`Popover`/`DropdownMenu` used with **default** (unset) `Portal` `container` inside any Shadow-Root UI | Defaults to `document.body` — **outside** the Shadow Root — so the portaled content renders unstyled (none of your injected Tailwind `<style>` reaches it) and visually breaks or floats stark-white on top of x.com. This is the single most common real-world failure mode reported for Radix-in-extension setups. | Always pass `container={ui.shadow}` (the actual `ShadowRoot`, not the host element) to every `*.Portal` you render from inside a `createShadowRootUi` mount. See Integration Risk section for the exact pattern. |
| TypeScript 7.0 (`tsgo`, GA July 2026) today | Brand new as of this research (2-3 months old); the surrounding tool ecosystem (typed ESLint rules, some Vite plugin type-checking integrations) is still catching up. Early adopter risk on a project with no deadline pressure isn't worth it yet. | TypeScript `^5.7`. Revisit once WXT's own `package.json` and `@vitejs/plugin-react` widen `peerDependencies` to include TS7. |

## Stack Patterns by Variant

- Use `createShadowRootUi` with `position: 'inline'`, anchored to the relevant `[data-testid="like"]`/`[data-testid="reply"]` button, `isolateEvents: true` (or an explicit list like `['keydown', 'pointerdown']`) so X's own global click/keydown listeners on `document` don't intercept your menu's interactions or trigger X's own UI to close/react.
- Because Radix `Popover`/`DropdownMenu` are built for exactly this (anchor + collision-aware floating content), and Shadow DOM gives full CSS isolation from X's `css-1dbjc4n`-style utility soup with zero risk of your Tailwind classes colliding with X's atomic CSS class names (X literally does not know your class names exist, and vice versa).
- Also use `createShadowRootUi`, but with `position: 'inline'`, `anchor` targeting the tweet-cell container you're inserting before/after, and `append: 'before'`/`'after'` (not `'replace'` — never replace X's own DOM nodes, only insert siblings, so X's own virtualization/React reconciliation doesn't get confused and rip your node out along with the one it thinks it owns).
- Because you want the card to *look* native (styled to resemble a tweet card) but you explicitly do not want to depend on X's own CSS classes to achieve that — you own the exact visual design fully inside your Tailwind-styled Shadow Root, immune to X's frequent unannounced class-name churn.
- Use `createIframeUi` instead of `createShadowRootUi`, pointing at an extension-owned HTML page (`entrypoints/bookmarks-ui.html` or similar), declared in `web_accessible_resources`.
- Because this surface is a genuinely separate, complex SPA (folders, tags, search, potentially drag-and-drop) — giving it its own `iframe` document means: (1) zero Radix-portal-in-shadow-root gymnastics, since `document.body` *is* the iframe's own body; (2) complete isolation from X's global event listeners, `MutationObserver`s, and React root re-renders, which is valuable on a route this UI-dense; (3) your own independent scroll container, which avoids X's own scroll-hijacking/virtualization interfering with a long scrollable bookmark list. The cost — an extra document/context and needing `postMessage` or shared `chrome.storage` (not window messaging) for any host-page communication — is trivial here since this UI doesn't need to read live tweet DOM, only your own stored bookmark records. `chrome.*` APIs (including `wxt/utils/storage`) work fine directly inside a web-accessible-resource iframe page since it's still an extension-origin document.
- Use `createIntegratedUi` instead, which injects your DOM directly into the page (no Shadow Root), so it inherits X's cascade.
- Accept the tradeoff: your component is now subject to every X CSS rule and every future X class-name change; only reach for this if `createShadowRootUi` truly cannot achieve the visual result you need. For this project's five feature areas, no surface currently requires this — default to Shadow Root everywhere else.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `wxt@0.21.x` | `@webext-core/isolated-element@3.x` (internal) | If you find WXT tutorial code with `<html><head>...` wrapper elements inside the shadow root or CSS keyed only to `:root`, it's written against isolated-element v1/v2 (WXT ≤0.12). Current WXT's shadow root has a flatter DOM and requires `:host` (in addition to `:root`) in reset CSS. |
| `tailwindcss@4.x` | `@tailwindcss/vite@4.x` | Must match major versions; v3-era `tailwindcss` + `@tailwindcss/vite` (a v4-only package) is not a valid pairing. |
| `shadcn@4.x` CLI, `new-york` style | `radix-ui@^1.6` (unified package) | Only true for components installed/regenerated after the Feb 2026 change. If starting fresh, `shadcn init --base radix` gets you here immediately with no migration step needed. |
| React `19.x` | `radix-ui@^1.6`, `react-dom@19.x` | Keep `react` and `react-dom` versions identical (peer-dep mismatch is the single most common "why is my Portal broken" red herring in React 19 + Radix setups). |
| `@twemoji/api` / `@twemoji/parser@17.x` | Unicode 17 emoji set | If X itself is still rendering an older Twemoji asset version for some emoji, a handful of very-recently-added glyphs may render as your bundled asset instead of matching X pixel-for-pixel — cosmetically negligible for a reaction palette of common emoji (👍❤️😂😮😢🔥 etc., all long-stable Unicode). |

## Integration Risk: Tailwind + Radix + Shadow DOM (the load-bearing section)

### Problem 1 — Getting Tailwind's CSS into the Shadow Root at all

### Problem 2 — Radix Portals escaping the Shadow Root

### Problem 3 — Known Radix behavioral bugs specifically inside Shadow DOM

- Focus trap / scroll-lock issues inside Shadow DOM (radix-ui/primitives#3353, #3483)
- Outside-click / outside-interaction detection misfiring when a shadow-rooted overlay is involved (radix-ui/primitives#2055) — directly relevant here since your reaction menu and any Radix `Popover`/`DropdownMenu` you build both rely on outside-click-to-dismiss.
- For the two highest-traffic surfaces (hover reaction menu, download-format dropdown), prefer Radix's lower-level primitives (`Popover`, `DropdownMenu`) over `Dialog` — dialogs' full focus-trap + scroll-lock behavior is where most of the open issues concentrate; simple anchored popovers are less affected.
- Test dismiss-on-outside-click manually for every Radix overlay you ship inside a Shadow Root as part of your own QA pass — don't assume upstream Radix test coverage extends to this case, since it explicitly does not (all three linked issues are open, not "wontfix" but not yet fixed either).
- If a specific overlay's outside-click detection misbehaves, override it directly: Radix's `Popover.Content`/`DropdownMenu.Content` both accept `onInteractOutside`/`onPointerDownOutside`, which you can use to compare `event.composedPath()` (which correctly traverses shadow boundaries) against your shadow root's children, rather than relying on Radix's internal default (which checks `document.activeElement`/`event.target`, both unreliable across a shadow boundary).

### Problem 4 — `rem` units silently rescale with the host page

## WXT Storage vs Raw `chrome.storage.local`

## Twemoji in 2026

- Do not hotlink `cdn.jsdelivr.net/.../assets/svg/*.svg` at runtime. Download the ~15-25 SVGs your reaction palette actually uses from the `jdecked/twemoji` `assets/svg/` directory at build time (a small `scripts/fetch-twemoji.ts` one-time script, or just vendor them directly into the repo — they're a few KB each and rarely change), and ship them under `public/twemoji/`.
- Declare them in `web_accessible_resources`, scoped to the extension's own matches (not `<all_urls>`):
- Reference them via `browser.runtime.getURL('/twemoji/1f44d.svg')` in an `<img>` tag inside your Shadow Root. This works fully offline, has zero runtime network dependency, and sidesteps any CSP nuance entirely (content-script-injected resources loaded from your own extension origin are not something you need to negotiate with x.com's CSP — but bundling makes the question moot regardless of the exact CSP behavior in any given Chrome version).

## `chrome.downloads` from the MV3 Background Service Worker

- Requires the `"downloads"` permission (already scoped in this project's PROJECT.md constraints) declared in `manifest.permissions`. No `host_permissions` entry is needed purely to call `chrome.downloads.download()` against a cross-origin media URL (e.g., `video.twimg.com/...` or `pbs.twimg.com/...`) — the download happens at the browser/network layer, not through the page's or your content script's CORS context, so downloading X's media CDN URLs works without adding `video.twimg.com`/`pbs.twimg.com` to `host_permissions`.
- **Filename control:** pass `filename` in `DownloadOptions` as a *relative* path (subdirectories allowed, e.g. `better-twitter/2026-09-13-username-video.mp4`); absolute paths, empty paths, and `..` segments are rejected outright by the API. Use `conflictAction: 'uniquify'` (default-safe, auto-appends a counter) rather than `'overwrite'` for a personal-archival tool where silently clobbering an earlier download of the same tweet's media would be a bad surprise.
- For dynamic, content-derived filenames (author handle + tweet ID + original extension, sniffed from the media URL's path), build the string in the background service worker before calling `download()` — don't rely on `onDeterminingFilename` unless you need to override *other* extensions' filename suggestions too; for a single-extension flow, just pass the fully-formed `filename` directly.
- Cross-origin URL handling: passing the direct `video.twimg.com`/`pbs.twimg.com` URL straight into `download()` is the right approach — no need to `fetch()` the media into a blob in the content script first (which would require the content script to have read access to a cross-origin resource that X's own CSP/CORS may not grant anyway). Let the background service worker hand the raw CDN URL to `chrome.downloads.download({ url, filename, conflictAction: 'uniquify' })` directly; the browser performs the fetch itself, including the necessary cookies for the CDN hostname if any are needed.
- Route the download call through the background service worker (not the content script) — content scripts do not have direct access to `chrome.downloads` in MV3; message it via `browser.runtime.sendMessage` from the content script's download-button click handler to a background `onMessage` listener that calls `downloads.download()`.

## Testing / Tooling Pipeline

- **Unit tests:** Vitest, wired via `wxt/testing/vitest-plugin`'s `WxtVitest()` plugin in `vitest.config.ts`. This auto-polyfills `browser.*`/`chrome.*` with an in-memory fake (`wxt/testing/fake-browser`), so storage-migration logic, selector-resolution utilities, and the reaction-undo timer can be tested with zero real browser involved. Call `fakeBrowser.reset()` in `beforeEach` for test isolation.
- **What Vitest cannot cover:** anything involving a real Shadow DOM mounted into a real page, real `MutationObserver` reactions to X's virtualized DOM, or real Radix portal/focus behavior. Don't try to fake this with `jsdom` — it doesn't implement enough of the real DOM's shadow/portal/focus semantics to catch the exact bugs called out in the Integration Risk section above.
- **E2E / content-script exercising:** Playwright, loading the real unpacked build. WXT's own guidance points directly at Playwright's official Chrome-extension testing docs, launching a persistent context with `--load-extension=<path to>/.output/chrome-mv3` (built via `wxt build`). This is the only realistic way to validate that a reaction menu actually anchors correctly to a live (or fixture-recorded) x.com DOM, that outside-click dismissal works, and that timeline-injected cards survive X's virtualization/scroll recycling.
- **Build/zip/store pipeline:** `wxt build` (production build to `.output/chrome-mv3-<version>/`) → `wxt zip` (produces the store-ready archive) → `wxt submit --chrome-zip .output/<name>-<version>-chrome.zip` once you have Chrome Web Store API credentials configured, for scripted/CI submission. For a solo side project, manual upload of the `wxt zip` output through the CWS developer dashboard is entirely reasonable to start; automate via `wxt submit` only once iteration speed on store updates actually matters.

## Sources

- `/wxt-dev/wxt`, `/websites/wxt_dev_guide`, `/llmstxt/wxt_dev_llms_txt`, `/wxt-dev/examples` (Context7) — `wxt.config.ts`/manifest shape, `entrypoints/` conventions, `createShadowRootUi`/`createIntegratedUi`/`createIframeUi` APIs and options, `storage.defineItem` versioning/migrations, Vitest/Playwright testing setup, `wxt zip`/`wxt submit` publishing, React module wiring, official `react-shadcn` example's Tailwind v4 wiring — HIGH confidence (official docs, current).
- `/websites/ui_shadcn` (Context7) — shadcn CLI v4 (`init --base radix`), Feb 2026 unified `radix-ui` package migration, Tailwind v4 `components.json` shape — HIGH confidence (official docs, dated changelog entries from Feb/Mar 2026).
- `/radix-ui/primitives` (Context7) — `Portal`/`Dialog.Portal`/`Select.Portal`/`Tooltip.Portal` `container` prop signatures — HIGH confidence (official source-linked docs).
- npm registry (`registry.npmjs.org/*/latest`, queried directly) — exact current versions for `wxt` (0.21.4), `tailwindcss` (4.3.3), `shadcn` (4.21.0), `react` (19.3.0), `lucide-react` (1.45.0), `@twemoji/api` (17.0.3), `@twemoji/parser` (17.0.2), `vitest` (5.0.0), `@webext-core/isolated-element` (3.0.0), `radix-ui` (1.6.7), `@wxt-dev/module-react` (1.2.2), `typescript` (7.0.2) — HIGH confidence (primary registry data, checked same day as this research).
- WebSearch: `twitter/twemoji` deprecation notice and `jdecked/twemoji` fork status (GitHub issue #1453 on `twitter/twemoji`) — HIGH confidence (direct maintainer statement).
- WebSearch: TypeScript 7.0 GA / Go-native compiler release (InfoQ, Microsoft DevBlogs, July 2026) — MEDIUM-HIGH confidence (multiple independent tech-press sources agree on GA date and version; used to justify staying on TS 5.7 rather than adopting cutting-edge). 
- WebSearch: `chrome.storage.local` quota (10 MB default, `unlimitedStorage` behavior and its documented slowdown past ~50 MB) — MEDIUM confidence (aggregated from Chrome docs + third-party MV3 dev guides, not a single canonical source, but consistent across sources).
- WebFetch: `developer.chrome.com/docs/extensions/reference/api/downloads` — `chrome.downloads.download()` filename/conflictAction/permission semantics — HIGH confidence (official Chrome docs).
- WebSearch: Radix + Shadow DOM open GitHub issues (`radix-ui/primitives#3353`, `#3483`, `#2055`) — MEDIUM confidence (real, currently-open issues confirming the failure mode exists; can't guarantee they remain unresolved by the time this project reaches implementation — re-check issue status when this becomes load-bearing).
- WebSearch: WXT + Tailwind v4 + Shadow DOM community write-ups (`zenn.dev` guide, `wxt-dev/wxt` GitHub Discussion #1318, `imtiger/wxt-react-shadcn-tailwindcss-chrome-extension` example repo) — MEDIUM confidence (community sources, but consistent with and corroborated by WXT's own official FAQ entry on the `rem`-to-`px` PostCSS fix).

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
