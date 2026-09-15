---
phase: 05
date: 2026-09-15
confidence: High
---

# Phase 5 Research: Chrome Web Store Packaging

## Executive Summary
This research document outlines the technical invariants and requirements for publishing the Better Twitter extension to the Chrome Web Store (CWS). The core objective of Phase 5 is to generate a submittable, compliant package alongside necessary graphic assets, listing copy, and privacy policy documentation. By strictly adhering to CWS MV3 requirements, we ensure automated packaging scripts can mechanically guarantee store-readiness.

## Technical Findings

### 1. Chrome Web Store Manifest & Permission Constraints (MV3)
**Manifest Requirements [VERIFIED: CWS Docs]**
- **Required Fields:** `manifest_version: 3`, `name`, `version`, `description`, `icons` (specifically 128x128).
- **Permissions:** The extension will strictly request the `storage` permission. No other API permissions are needed.
- **Host Permissions:** Must be zero. We are removing `<all_urls>` and any specific origins from `host_permissions` to pass review faster. The required domain matching is handled purely via content script injections and `web_accessible_resources` scoped strictly to `*://x.com/*` and `*://twitter.com/*`.
- **Single Purpose Policy [CITED: CWS Developer Program Policies]:** Extensions must have a single, coherent purpose.
  - *Justification Strategy:* Frame all features (clean timeline, themes, bookmarks, reactions) as pillars of a single purpose: "an X experience enhancer for focusing on what matters." This narrative must be consistent across the description, screenshots, and the reviewer justification note.

### 2. Zip Archive Packaging Invariants & Validation
**Zip Contents [VERIFIED: CWS Best Practices]**
- **Must Include:** Production manifest, compiled JS bundles (content scripts, background worker, popup), HTML/CSS assets, and `public` icons/Twemoji assets.
- **Must NOT Include:** TypeScript sources (`.ts`, `.tsx`), source maps, test files, dev probes, `.git`, `node_modules` (unbundled), or local `screenshots/` directory.
- **Limits:** CWS allows up to 50MB, but the bundle should remain well under 10MB to ensure rapid installations. 
- **Script Design (`scripts/package-cws.ts`):** 
  - Executed via `bun run package:cws`.
  - Pipeline: `tsc --noEmit` -> `vitest run` -> `wxt build` -> `node scripts/audit-build.mjs` -> WXT ZIP generation.
  - Final assertion: Unzip to a temporary directory and mechanically assert the absence of banned extensions (`.ts`, `.map`) and directories (`.git`).

### 3. Store Graphic Asset Specifications
**Asset Specs [VERIFIED: CWS Dashboard Requirements]**
- **Store Icon:** 128x128 PNG (Required).
- **Screenshots:** 1280x800 or 640x400 PNG/JPEG (Required). Aspect ratio 16:10. Minimum 1, Maximum 5.
- **Small Promo Tile:** 440x280 PNG (Required).
- **Marquee Promo Tile:** 1400x560 PNG (Optional but recommended).

### 4. Interactive HTML Screenshot Editor Architecture
**Architecture (`scripts/screenshot-editor.html`) [ASSUMED: Local HTML Tools]**
- A standalone, client-side HTML tool running locally (zero build process).
- **Canvas Rendering:** Uses HTML5 `<canvas>` API to composite:
  - Base preset dimensions (1280x800, 440x280, 1400x560).
  - Background: Dark gradient or solid color matching the extension's theme.
  - Screenshot Image: Loaded via `<input type="file">` or fetched locally, scaled down with a rounded rect clipping mask (border-radius) and drop shadow (`ctx.shadowColor`/`ctx.shadowBlur`).
  - Text Layer: Overlay headline and subtext.
- **Exporting:** Uses `canvas.toBlob()` and `URL.createObjectURL` to trigger a clean `.png` download.

### 5. Privacy Policy & Data Disclosure Form Requirements
**CWS Data Safety Form [CITED: CWS Dashboard]**
- **Zero Data Collection:** We must declare that the extension collects/transmits ZERO data.
- **Categories:** We will affirmatively state "No" for:
  - Personally identifiable information (PII).
  - Authentication information.
  - Web site content and browsing history.
- **Privacy Policy:** Must be hosted publicly. `PRIVACY.md` in the GitHub repo root satisfies this. Must state that all data remains purely within `chrome.storage.local`.
- **Limited Use Policy:** CWS requires compliance with the Limited Use policy for extensions requesting broad permissions, but since we only request `storage` and no `host_permissions` (besides scoped WARs), we remain in a highly trusted tier.

## Implementation Pitfalls & Mitigation Strategies
1. **Pitfall:** `wxt zip` including unwanted files (e.g., TS sources or `.env` files).
   - *Mitigation:* Ensure `wxt.config.ts` explicitly ignores dev files or that `scripts/package-cws.ts` validates the zip contents post-creation.
2. **Pitfall:** Reviewer rejection due to Single Purpose policy violation.
   - *Mitigation:* The "Reviewer Justification Note" must explicitly clarify how all sub-features roll up to the main purpose, and the CWS description must open with the unified value proposition.
3. **Pitfall:** Broken asset uploads due to incorrect sizes.
   - *Mitigation:* Hardcode strict canvas dimensions in `screenshot-editor.html` to guarantee 1280x800, 440x280, and 1400x560 exact outputs.

## Validation Architecture & Standing Build Invariants
The existing `scripts/audit-build.mjs` handles deep validation, ensuring:
1. Only `['storage']` permission is declared.
2. No `<all_urls>` or wildcard origins in `web_accessible_resources`.
3. Exactly one content script.
4. No CSP overrides.
5. No dynamic code execution (`eval`, `new Function`).

The new packaging script (`scripts/package-cws.ts`) will extend this by verifying the integrity of the generated Zip file (absence of `.ts`/`.map`/`.git`).
