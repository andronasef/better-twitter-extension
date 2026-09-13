# API Coverage & Subtraction Record: Phase 1

This document records the API coverage decision matrix for Phase 1 ("Foundation & Settings Popup"). Full coverage of candidate platform and transport APIs is the default baseline; every capability excluded is an explicit, reasoned subtraction rather than an unintentional gap.

---

## 1. Observed X.com Transport Surface

| Capability | Decision | Reason |
|---|---|---|
| Window `fetch` interception | INTEGRATED | Patched in MAIN world to observe GraphQL response shapes without modifying requests or payloads. |
| `XMLHttpRequest` interception | INTEGRATED | Patched in MAIN world to observe legacy and fallback XHR endpoints used by X web client. |
| `history.pushState` / `replaceState` | INTEGRATED | Patched in MAIN world to detect SPA route transitions and dispatch custom route-change events. |
| Window `popstate` event | INTEGRATED | Listened in MAIN world to detect backward/forward navigation across SPA routes. |
| WebSocket & Server-Sent Events (SSE) observation | OPT-OUT | No project phase consumes live socket streams; Phases 3 and 4 operate exclusively on HTTP GraphQL response payloads. |
| Beacon (`navigator.sendBeacon`) observation | OPT-OUT | Beacons carry outgoing telemetry only; the extension has zero consumers for telemetry payloads. |
| Navigation API (`window.navigation`) as route source | OPT-OUT | Explored in Spike S1 for diagnostics, but promoted route-watcher relies purely on history and popstate for universal cross-browser stability. |
| Request modification, blocking, or replay | OPT-OUT | Deliberate architectural boundary: the MAIN bridge observes and never alters or blocks network traffic. |

---

## 2. Browser & WebExtension Platform API Surface

| Capability | Decision | Reason |
|---|---|---|
| `chrome.storage.local` | INTEGRATED | Primary persistence layer for user settings (`local:settings`), diagnostics (`local:diagnostics`), and theme probe cache (`local:xTheme`). |
| Extension action badge (`setBadgeText`, `setBadgeBackgroundColor`, `setTitle`) | INTEGRATED | Used by background service worker to display orange diagnostic dot (`•`, `#E07C00`) on selector misses. |
| Runtime messaging (`runtime.onMessage`, `runtime.sendMessage`) | INTEGRATED | Inter-context messaging between content script, background worker, and settings popup. |
| Resource URL resolution (`runtime.getURL`) | INTEGRATED | Resolves paths for bundled web-accessible resources (`bridge.js`) and bundled fonts (`public/fonts/`). |
| Synced & session storage (`storage.sync`, `storage.session`) | OPT-OUT | Local-only design with zero external servers; settings are strictly local to the device and must survive browser restarts. |
| `tabs` permission (`chrome.tabs`) | OPT-OUT | Unnecessary; `storage.onChanged` fans out across contexts automatically and avoiding `tabs` prevents broad permission warnings at install. |
| `scripting` permission (`chrome.scripting`) | OPT-OUT | Content scripts are statically declared in the manifest; dynamic script injection is avoided. |
| `downloads` permission (`chrome.downloads`) | OPT-OUT | Feature was formally cut from project scope to maintain focus on timeline personalization. |
| Declarative Net Request (`chrome.declarativeNetRequest`) | OPT-OUT | Timeline element hiding is CSS- and DOM-attribute-driven; network blocking is unnecessary and violates the read-only transport principle. |
| Notifications API (`chrome.notifications`) | OPT-OUT | No intrusive pop-up notifications; all visual feedback is contained in the extension popup and action badge. |
| Context menus (`chrome.contextMenus`) | OPT-OUT | All user controls belong in the dedicated settings popup UI. |
| Alarms API (`chrome.alarms`) | OPT-OUT | No periodic background polling; the background script is purely reactive to storage and runtime messages. |
| Optional permissions (`permissions.request`) | OPT-OUT | The extension requires only `storage`, which is requested upfront; dynamic permission widening is intentionally avoided. |
