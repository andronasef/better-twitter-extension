# Phase 5: Chrome Web Store Packaging - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-15
**Phase:** 05-chrome-web-store-packaging
**Areas discussed:** Single-Purpose Narrative & Listing Copy, Privacy Policy & Data Disclosure, Store Screenshots & Promotional Assets, Packaging & Submission Automation

---

## Single-Purpose Narrative & Listing Copy

| Option | Description | Selected |
|--------|-------------|----------|
| Personalized, distraction-free reader | Frames decluttering, themes, bookmarks, and reactions as personal feed viewer | |
| Custom interface and reading control panel | Technical focus on tailoring X web client appearance | |
| Distraction-free timeline & bookmark organizer | Highlights clean feed and local bookmarking | |
| Twitter Enhancer (User write-in) | "better twitter, is x experince enhancer for foucsing on whats matter" | ✓ |

**User's choice:** "better twitter, is x experince enhancer for foucsing on whats matter"
**Notes:** The core tagline and framing unifies all features under eliminating noise and focusing on meaningful content.

| Option | Description | Selected |
|--------|-------------|----------|
| Four bulleted Pillars | 1. Clean Timeline, 2. Themes/Layouts, 3. Bookmarks, 4. Reactions | |
| Problem/Solution style | "X can be noisy and cluttered. Better Twitter gives you 4 focused tools to take back control of your feed..." | ✓ |
| Feature Checklist | Technical overview of each toggleable module | |

**User's choice:** Problem/Solution narrative.
**Notes:** Relatable framing highlighting the pain points of default X and how Better Twitter provides 4 focused solutions.

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit Reviewer Justification Note | Explains web client enhancer framing, justifies storage permission, states zero data collected | ✓ |
| Minimal Justification Note | Brief note stating extension enhances x.com | |
| Step-by-step Test Account Guide | Detailed verification steps | |

**User's choice:** Explicit Reviewer Justification Note ready for the CWS developer console.

---

## Privacy Policy & Data Disclosure

| Option | Description | Selected |
|--------|-------------|----------|
| Public GitHub repository document (`PRIVACY.md`) | Public, version-controlled, zero hosting overhead, permanent URL | ✓ |
| Dedicated GitHub Pages static HTML page | HTML page on github.io | |
| Standalone external markdown link | Gist or pastebin | |

**User's choice:** Public GitHub repository document (`PRIVACY.md` / GitHub URL).

| Option | Description | Selected |
|--------|-------------|----------|
| Zero Data Collected declaration | Explicitly declare zero user data collected, stored remotely, or transmitted | ✓ |
| Strictly Local Technical Preferences | Document local settings stored strictly in chrome.storage.local | |

**User's choice:** "Zero Data Collected" declaration for CWS questionnaire.

| Option | Description | Selected |
|--------|-------------|----------|
| Discreet "Privacy" link in popup footer | Adds link alongside version/github links | ✓ |
| Keep popup clean | Privacy link only on CWS and README | |
| Dedicated modal | In-app modal | |

**User's choice:** Discreet "Privacy" link in popup footer opening `PRIVACY.md`.

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Issues only | Directs inquiries to GitHub | |
| Featurebase (User write-in) | "the feature board link i added" (https://bettertwitter.featurebase.app/) | ✓ |

**User's choice:** Support and feedback route to Featurebase (`https://bettertwitter.featurebase.app/`).

---

## Store Screenshots & Promotional Assets

| Option | Description | Selected |
|--------|-------------|----------|
| Automated Playwright generation script | Automated capture of timeline and popup | |
| Clean browser-only screenshots | Full window captures without borders | |
| User real screenshots + HTML editor (User write-in) | "i have the screen shots and i want you to use them, they are in screenshots folder... in html editor that i can export the screenshots from" | ✓ |

**User's choice:** Real screenshots in `screenshots/` loaded into an interactive HTML editor (`scripts/screenshot-editor.html`).

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone HTML/Canvas generator tool | Interactive browser tool with live editing and direct PNG export | ✓ |
| Headless Playwright exporter | Automated script | |
| Both tool and script | Combined | |

**User's choice:** Standalone HTML/Canvas generator tool (`scripts/screenshot-editor.html`).

| Option | Description | Selected |
|--------|-------------|----------|
| Modern Framed Mockup with Clean Header | Headline + subtext, dark/accent gradient, rounded shadow frame | ✓ |
| Split-screen side-by-side | Headline on left, screenshot on right | |
| Full-bleed with floating pill | Edge-to-edge screenshot with title pill | |

**User's choice:** Modern Framed Mockup with Clean Header and dark/accent gradient.

| Option | Description | Selected |
|--------|-------------|----------|
| Presets for 1280x800, 440x280, and 1400x560 | Supports store screenshots, small promo tile, and marquee tile | ✓ |
| 1280x800 only | Mandatory screenshots only | |

**User's choice:** Presets for all CWS graphic assets (1280x800, 440x280, 1400x560).

---

## Packaging & Submission Automation

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated `package:cws` script | Runs checks, builds, zips, and verifies zip structure | ✓ |
| Standard `wxt zip` with manual checklist | Minimal build command | |
| Full release script | Includes version bump and tag | |

**User's choice:** Dedicated `package:cws` script (`scripts/package-cws.ts`).

| Option | Description | Selected |
|--------|-------------|----------|
| Strict automated zip inspection | Verifies no source/sourcemaps/git, correct manifest, and size limits | ✓ |
| Basic size check | File existence and size only | |
| Strict inspection plus Playwright smoke test | Automated test | |

**User's choice:** Strict automated zip inspection invariants.

| Option | Description | Selected |
|--------|-------------|----------|
| Version `1.0.0` | Initial release semver | |
| Version `0.1.0` | Maintain pre-release version | ✓ |
| Version `0.9.0` | Release candidate | |

**User's choice:** Keep `0.1.0` for initial store review submission.

| Option | Description | Selected |
|--------|-------------|----------|
| Comprehensive `docs/CWS-SUBMISSION-GUIDE.md` | Complete field-by-field copy-paste guide for CWS Developer Console | ✓ |
| Minimal checklist | Zip upload and privacy policy link only | |

**User's choice:** Comprehensive `docs/CWS-SUBMISSION-GUIDE.md` with ready-to-paste text for every field.

---

## the agent's Discretion
- Styling details of `scripts/screenshot-editor.html`.
- Specific problem/solution phrasing refinements in listing copy.

## Deferred Ideas
None.
