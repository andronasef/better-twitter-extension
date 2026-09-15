# Phase 5: Chrome Web Store Packaging - Context

**Gathered:** 2026-09-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 delivers a submittable, policy-clean Chrome Web Store package, compliant store listing copy framing the extension around a single coherent purpose, a published privacy policy guaranteeing local-only storage, an interactive HTML screenshot generator with real extension captures, and an automated pre-submission packaging validation pipeline.
</domain>

<decisions>
## Implementation Decisions

### Single-Purpose Narrative & Listing Copy (STORE-04)
- **D-01:** **Core Positioning:** Better Twitter is positioned as *"an X experience enhancer for focusing on what matters"*. All 4 feature modules (ad/clutter stripper, themes/layouts, local bookmarks, twemoji reactions) are framed as unified tools helping users eliminate noise and focus on meaningful content.
- **D-02:** **Store Description Structure:** Written in a Problem/Solution narrative (*"X can be noisy and cluttered. Better Twitter gives you 4 focused tools to take back control of your feed..."*) detailing 4 pillars:
  1. Clean Timeline (strip ads, vanity metrics, and algorithmic clutter)
  2. Custom Reading Themes & Layouts (Dracula, Nord, Matrix, Minimal centered feed, Old Twitter layout)
  3. Local Bookmarks (searchable in-page manager and feed resurfacing)
  4. Quick Twemoji Reactions (one-click prefilled reply composer)
- **D-03:** **Reviewer Justification Note:** Pre-composed text for the Chrome Web Store Developer Console explaining the single-purpose web enhancer framing, justifying the minimal `storage` permission, and guaranteeing zero remote network data collection.

### Privacy Policy & Data Disclosures (STORE-03)
- **D-04:** **Policy Hosting:** The official privacy policy is published in the repository root as `PRIVACY.md` (accessible via permanent GitHub URL).
- **D-05:** **CWS Data Disclosure Declaration:** Formally declare "Zero Data Collected" on the CWS Developer Dashboard questionnaire, affirming that no PII, browsing history, authentication tokens, or tweet data leaves the client browser.
- **D-06:** **In-App Privacy Link:** Add a discreet "Privacy" link in the extension popup footer (`entrypoints/popup/App.tsx`) opening `PRIVACY.md` in a new tab.
- **D-07:** **Support & Feedback Routing:** Privacy inquiries and feature feedback route to Featurebase (`https://bettertwitter.featurebase.app/`) and GitHub Issues.

### Store Screenshots & Visual Assets (STORE-05)
- **D-08:** **Source Screenshots:** Consume the user's real screenshots stored in `screenshots/`:
  - `clean look.jpg` (Clean timeline / themes)
  - `bookmark manager.jpg` (In-page bookmark hub)
  - `bookmarks in the timeline.jpg` (Timeline resurfacing)
  - `msedge_nj3EScsfp8.jpg` (Reaction palette / popup)
- **D-09:** **Interactive HTML Screenshot Editor:** Create `scripts/screenshot-editor.html` — a browser-based tool loading the raw screenshots, offering customizable headlines/subtext, dark/accent gradients, elegant rounded shadow device frames, and direct 1280x800 PNG export via HTML Canvas.
- **D-10:** **Asset Dimension Presets:** Provide one-click canvas dimension presets in the editor for:
  - 1280x800 (CWS Store Screenshots)
  - 440x280 (Small Promo Tile)
  - 1400x560 (Marquee Promo Banner)

### Packaging & Submission Automation (STORE-01, STORE-02, STORE-05)
- **D-11:** **Release Packaging Script:** Add `bun run package:cws` (`scripts/package-cws.ts`) that executes `tsc --noEmit`, `vitest run`, `wxt build`, `audit-build.mjs`, generates the `.zip` archive via WXT, and performs strict zip verification.
- **D-12:** **Zip Integrity Invariants:** Automated verification ensuring the generated `.zip`:
  - Contains NO TypeScript source files (`.ts`, `.tsx`) or sourcemaps
  - Contains NO test files, dev probes, or git artifacts
  - Manifest specifies exactly `["storage"]` permissions and no `host_permissions`
  - Version matches `package.json` exactly
  - Total package size remains well under store limits (< 10MB)
- **D-13:** **Store Version:** Retain version `0.1.0` for the initial public submission to Chrome Web Store.
- **D-14:** **Submission Guide:** Generate `docs/CWS-SUBMISSION-GUIDE.md` containing field-by-field copy-paste ready text for the CWS Developer Console (Title, Summary, Description, Category, Single Purpose justification, Permission justifications, and Data Safety disclosures).

### the agent's Discretion
- Visual styling of the screenshot editor interface (clean, dark-themed UI matching the Better Twitter aesthetic).
- Exact copy phrasing for the problem/solution narrative in the store listing and submission guide.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Standards & Architecture
- `.planning/PROJECT.md` — Project definition, core values, constraints, and locked decisions
- `.planning/REQUIREMENTS.md` — Full requirements traceability (STORE-01 through STORE-05)
- `.planning/ROADMAP.md` § Phase 5 — Phase goal, success criteria, and scope notes

### Platform Policies & Security
- `scripts/audit-build.mjs` — Standing 5 security invariants (minimal permissions, zero remote code, scoped web accessible resources)
- `wxt.config.ts` — MV3 manifest configuration and build pipeline
- Chrome Web Store Single Purpose Policy & Developer Program Policies
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/audit-build.mjs` — Validates permissions and code safety; can be invoked by `package-cws.ts`.
- `public/icon/*.png` — Pre-generated store icons (16, 32, 48, 96, 128px) in place and ready for manifest verification.
- `entrypoints/popup/App.tsx` — Popup shell footer with existing Featurebase link where privacy link will be added.
- `screenshots/` — High-res user screenshots ready to be loaded into the screenshot editor.

### Established Patterns
- Zero external host permissions; zero remote code; local-only storage via `chrome.storage.local`.
- Bun script runner and TypeScript execution (`bun scripts/...`).
- Strict automated build gate assertions.

### Integration Points
- `package.json`: Add `package:cws` script.
- `entrypoints/popup/App.tsx`: Footer privacy link.
- `scripts/screenshot-editor.html`: Standalone local HTML tool.
- `docs/CWS-SUBMISSION-GUIDE.md`: Developer reference document.
- `PRIVACY.md`: Repository root policy.
</code_context>

<specifics>
## Specific Ideas
- The user specifically requested using their real screenshots from the `screenshots/` folder.
- The user requested an HTML editor where they can combine text + screenshots and export them directly.
- The user established the single-purpose core tagline: *"Better Twitter is an X experience enhancer for focusing on what matters"*.
- The user designated `https://bettertwitter.featurebase.app/` for feedback and support routing.
</specifics>

<deferred>
## Deferred Ideas
None — discussion stayed strictly within Phase 5 scope.
</deferred>

---

*Phase: 05-chrome-web-store-packaging*
*Context gathered: 2026-09-15*
