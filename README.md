<p align="center">
  <img src="public/better-twitter-logo.svg" width="128" height="128" alt="Better Twitter Logo" />
</p>

<h1 align="center">Better Twitter</h1>

<p align="center">
  <b>The Supercharged, Privacy-First Browser Extension for X (Twitter).</b><br>
  Take back control of your timeline with instant floating reactions, distraction-free feeds, offline bookmark folders, and dynamic theming.
</p>

<p align="center">
  <a href="#-features"><img src="https://img.shields.io/badge/Status-Production%20Ready-success?style=flat-square" alt="Status"></a>
  <a href="https://github.com/andronasef/better-twitter-extension/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License"></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Built%20With-Bun%20%26%20WXT-black?style=flat-square&logo=bun" alt="Bun & WXT"></a>
  <img src="https://img.shields.io/badge/Manifest-V3-purple?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Privacy-100%25%20Zero%20Telemetry-brightgreen?style=flat-square" alt="Zero Telemetry">
  <img src="https://img.shields.io/badge/Tests-30%20Suites%20Passing-emerald?style=flat-square" alt="Tests">
</p>

<p align="center">
  <a href="#-key-features">Key Features</a> •
  <a href="#-the-privacy-pledge">Privacy Pledge</a> •
  <a href="#-installation--usage">Installation</a> •
  <a href="#-architecture--tech-stack">Architecture</a> •
  <a href="#-development--testing">Development</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 💡 Why Better Twitter?

The modern web experience on X has become noisy, cluttered with algorithmic bloat, and restricted in how you express yourself and organize knowledge.

**Better Twitter** is an ultra-fast, open-source browser extension engineered from the ground up to give you superpowers:
- **Expressive Reactions**: Floating Facebook/Discord-style emoji palettes right on every tweet's Like button.
- **Pure Signal**: A clean, distraction-free feed that eliminates algorithmic clutter, promoted spam, and sidebar noise.
- **Second Brain Bookmarks**: Powerful offline bookmark organization with custom folders, instant search, and JSON export/import.
- **Zero Privacy Compromise**: Runs 100% client-side in your browser. No analytics. No telemetry. No servers.

---

## ✨ Key Features

### 1. ⚡ Floating Twemoji & Multi-Style Reactions
Hover or long-press on any tweet's Like button to reveal a floating, spring-animated reaction palette:
- **6 Rich Emoji Styles**: Choose between **Native OS**, **Apple**, **Twitter (Twemoji)**, **Google Noto**, **Facebook**, and **Animated Noto WebPs**.
- **The Plus `(+)` Button**: React with **ANY** emoji in the entire Unicode catalog. Clean native search popover with zero latency.
- **Instant Composer Integration**: Prefills X's native rich-text reply editor and supports optional **Auto-Comment** to react and comment in one single click.
- **Zero Style Leaks**: Rendered inside an isolated Shadow DOM container (`#bt-reactions-root`), completely immune to X's global CSS styles and feed DOM re-renders.

### 2. 🧼 Distraction-Free Timeline & Clutter Stripping
- **Promoted Ads Removal**: Silently cleans sponsored tweets, promoted accounts, and ad placements before they hit your eyes.
- **Sidebar & Widget Decluttering**: Selectively hide "Trends for you", "Who to follow", and sticky premium subscription banners.
- **Focus Mode**: Keep your feed focused strictly on content from the creators you actually follow.

### 3. 📑 Supercharged Bookmarks & Second Brain
- **Nested Folders**: Organize bookmarks into custom workspaces, topics, and project folders.
- **Lightning-Fast Full-Text Search**: Instant local client-side filtering by author, handle, content, or tags.
- **Offline & Portable**: Back up your bookmarks and folders at any time with one-click **JSON Export & Import**.
- **In-Stream Action Bar**: Save tweets directly into target folders from the timeline without leaving your current scroll position.

### 4. 🎨 Adaptive Dynamic Theming
- Seamlessly synchronizes with X's color schemes: **Default (Light)**, **Dim (Dark Blue)**, and **Lights Out (AMOLED Black)**.
- Precision contrast management and micro-interactions tuned to match native X component mechanics.

---

## 🔒 The Privacy Pledge

Most browser extensions monetize by silently harvesting browsing habits, scraping timeline data, or phoning home to tracking servers.

**Better Twitter takes the opposite approach:**
```
✓ Strict Permissions    : Only 'storage' requested in manifest.json (no cookies, no webRequest, no identity).
✓ 100% Client-Side     : All data stays in your browser's local storage.
✓ Zero External APIs   : No telemetry, no Google Analytics, no third-party trackers.
✓ Transparent & Open   : Every single line of code is completely open-source and auditable.
```

---

## 🚀 Installation & Usage

### Method A: Install via Packed Release (Recommended)
1. Download the latest release `.zip` from the [Releases](https://github.com/andronasef/better-twitter-extension/releases) tab.
2. Unzip the file into a folder on your computer.
3. Open your browser and navigate to the extension manager:
   - **Chrome / Brave / Arc**: `chrome://extensions`
   - **Microsoft Edge**: `edge://extensions`
4. Enable **Developer mode** (toggle in the top right or bottom left corner).
5. Click **Load unpacked** and select the unzipped `chrome-mv3` folder.
6. Open [x.com](https://x.com) and enjoy Better Twitter!

---

## 🛠️ Architecture & Tech Stack

Better Twitter is built with high-performance modern web extension tooling:

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime & Bundler** | [Bun](https://bun.sh) + [WXT](https://wxt.dev) | Next-gen Vite-powered WebExtension framework with TypeScript & HMR |
| **UI Framework** | [React 19](https://react.dev) | Declarative UI for floating palettes, modals, and settings popup |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) + Shadow DOM | Scoped utility styling isolated from host page styles |
| **Components & Icons** | [Radix UI](https://www.radix-ui.com) + [Lucide Icons](https://lucide.dev) | Accessible UI primitives and crisp icon glyphs |
| **Emoji Engine** | [`emoji-picker-react`](https://www.npmjs.com/package/emoji-picker-react) | Universal multi-style emoji catalog (Native, Apple, Twemoji, Google, Facebook) |
| **Quality Gates** | [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev) | 30 unit test suites + 7 Playwright end-to-end browser tests |

---

## 💻 Development & Testing

### Prerequisites
- [Bun](https://bun.sh) (v1.2+) installed on your machine.

### 1. Clone & Install
```bash
git clone https://github.com/andronasef/better-twitter-extension.git
cd better-twitter-extension
bun install
```

### 2. Run Development Server (with Hot Module Reload)
```bash
bun dev
```
Load the generated `.output/chrome-mv3` folder into `chrome://extensions` via **Load unpacked**. Changes will reload automatically.

### 3. Run Quality Gates & Tests
Better Twitter enforces a zero-regression test suite before every build:

```bash
# Typecheck TypeScript
bun run compile

# Run 30 Vitest unit test suites (265 tests)
bun run test

# Run Playwright E2E integration test suite
bun run test:e2e

# Run the complete standing verification pipeline
bun run verify
```

### 4. Production Build
```bash
bun run build
```
Builds the extension into `.output/chrome-mv3` and runs `scripts/audit-build.mjs` to ensure zero permission creep and clean bundles.

---

## 🗺️ Roadmap & What's Next

- [x] **Phase 1**: Architecture Foundation & Dynamic Theming Engine.
- [x] **Phase 2**: Clean Feed Clutter & Sponsored Tweet Stripper.
- [x] **Phase 3**: Offline Bookmarks Second Brain & Fast Full-Text Search.
- [x] **Phase 4**: Multi-Style Floating Reaction Palettes with Universal Picker.
- [ ] **Phase 5**: Custom Keyword & Regex Filter Rules for Timeline.
- [ ] **Phase 6**: Tweet Thread Archiver & Markdown / PDF Export.

---

## 🤝 Contributing

Contributions, feature suggestions, and pull requests are warmly welcomed!

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-new-feature`.
3. Commit your changes: `git commit -m "feat(reactions): add custom shortcut support"`.
4. Push to your fork: `git push origin feature/my-new-feature`.
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<p align="center">
  <sub>Crafted with ❤️ for a calmer, better web.</sub>
</p>
