# Spike S3: Radix Primitives in ShadowRoot against Real X Overlays

**Date of Investigation:** 2026-09-13  
**Status:** PENDING LIVE RUN  
**Requirement:** FOUND-06  

---

## Question

Do Radix UI floating primitives (`Popover`, `DropdownMenu`, `Tooltip`) survive and behave correctly inside an open Web Component `ShadowRoot` on `x.com` / `twitter.com` without style leakage, focus escape, or outside-click dismissal misfires when interacting alongside X's native overlay layers (compose modal, image lightbox, and toasts)?

---

## What Is Known

1. **Portal Placement & Styling:**
   - The Radix `Portal` primitive accepts a `container` prop defaulting to `document.body`.
   - In a Chrome extension content script injecting into an isolated `ShadowRoot`, rendering a portal into `document.body` escapes the shadow root and causes portalled elements to lose all injected Tailwind stylesheets, rendering as raw, unstyled text floating over the timeline.
   - Supplying `container={shadowRoot}` attaches the portalled overlay DOM directly into the shadow tree, where `@layer base` and Tailwind `:host` reset rules apply cleanly.

2. **Upstream Radix Shadow DOM Issues Status (Checked on 2026-09-13):**
   - **radix-ui/primitives#3353:** `OPEN` — *"Radix Dialog: Focus trap and scrolling issues within Shadow DOM"*. Reports that inside Shadow DOM, `Dialog` focus trapping breaks (Tab escapes to host document) and mouse wheel / trackpad scrolling is locked unnecessarily.
   - **radix-ui/primitives#3483:** `OPEN` — *"@radix-ui/react-dialog: Disable scroll in the shadow dom."*. Focuses on scroll locking inside shadow roots.
   - **radix-ui/primitives#2055:** `CLOSED` (completed 2026-06-08) — *"Interacting with Grammarly extension in a Dialog registers as an outside click"*. Documents that outside-interaction detection fails when events cross shadow boundaries because `event.target` retargets to the shadow host element from the document root's viewpoint.
   - **Architectural Decision:** `Dialog` and `Sheet` are intentionally excluded from `better-twitter`. Floating surfaces (`Popover`, `DropdownMenu`, `Tooltip`) avoid the heavy modal focus-trap and scroll-lock machinery of `Dialog`.

3. **Outside Interaction & Composed Path:**
   - Standard outside-interaction handlers reason about `document.activeElement` or `event.target`.
   - From outside the shadow boundary, `event.target` reports the shadow host (`bt-probe`), not the inner portalled element.
   - To prevent premature dismissal when interacting within the shadow root, pointer-down outside handlers must inspect `event.detail.originalEvent.composedPath()` to determine whether the interaction originated inside the container.

---

## Test Matrix

The test matrix evaluates the 3 shadow-safe wrappers (`BtPopover`, `BtDropdownMenu`, `BtTooltip`) across 4 native X overlay states:
1. **State A:** Normal timeline (nothing else open).
2. **State B:** X Compose Modal open (`[data-testid="tweetButtonInline"]` / floating tweet dialog).
3. **State C:** X Image Lightbox open (clicking any media attachment).
4. **State D:** X Toast notification visible (e.g. following / unfollowing or action feedback).

Evaluation dimensions:
- **Styled?**: Injected Tailwind styles preserved inside ShadowRoot (no naked unstyled text).
- **Focus Contained?**: Repeated Tab navigation moves through overlay elements without escaping into X's underlying DOM.
- **Outside-Click Dismisses?**: Clicking on timeline dismisses overlay; clicking inside shadow root does not misfire.
- **Scroll Behavior?**: Timeline scrolling is preserved or locked appropriately without breaking page interactivity.

---

## Result

PENDING LIVE RUN

| Wrapper | X Overlay State | Styled? | Focus Contained? | Outside-Click Dismisses? | Scroll Behavior | Notes |
|---|---|---|---|---|---|---|
| `BtPopover` | State A: Normal Timeline | Pending | Pending | Pending | Pending | Initial baseline |
| `BtPopover` | State B: Compose Modal Open | Pending | Pending | Pending | Pending | Coexists with X modal trap |
| `BtPopover` | State C: Media Lightbox Open | Pending | Pending | Pending | Pending | Coexists with full-viewport lightbox |
| `BtPopover` | State D: Toast Visible | Pending | Pending | Pending | Pending | Coexists with fixed toast stack |
| `BtDropdownMenu` | State A: Normal Timeline | Pending | Pending | Pending | Pending | Item selection & keyboard nav |
| `BtDropdownMenu` | State B: Compose Modal Open | Pending | Pending | Pending | Pending | Coexists with X modal trap |
| `BtDropdownMenu` | State C: Media Lightbox Open | Pending | Pending | Pending | Pending | Coexists with full-viewport lightbox |
| `BtDropdownMenu` | State D: Toast Visible | Pending | Pending | Pending | Pending | Coexists with fixed toast stack |
| `BtTooltip` | State A: Normal Timeline | Pending | Pending | Pending | Pending | Hover & focus activation |
| `BtTooltip` | State B: Compose Modal Open | Pending | Pending | Pending | Pending | Coexists with X modal trap |
| `BtTooltip` | State C: Media Lightbox Open | Pending | Pending | Pending | Pending | Coexists with full-viewport lightbox |
| `BtTooltip` | State D: Toast Visible | Pending | Pending | Pending | Pending | Coexists with fixed toast stack |

---

## Inherited Pattern

For Phase 4 (Bookmark UI / Folder Manager) and Phase 5 (Custom Reactions Palette):

1. **Mandatory Shadow Wrapper Routing:**
   - Injected UI components must **never** import directly from `radix-ui`.
   - All floating overlays must be instantiated through `components/shadow-ui/` (`BtPopover`, `BtDropdownMenu`, `BtTooltip`).
   - The root mounting point must wrap the React tree in `<ShadowRootProvider value={ui.shadow}>`.

2. **Container Delegation:**
   - The `usePortalContainer()` hook automatically binds `ui.shadow` (the `ShadowRoot`) to the Radix `Portal` container prop.
   - When rendered outside a provider (e.g. extension popup), `usePortalContainer()` returns `undefined`, falling back safely to Radix defaults without errors.

3. **Composed Path Outside-Click Discrimination:**
   - All shadow wrappers must override `onPointerDownOutside` using `composedPath()`.
   - If `path.includes(container)`, `event.preventDefault()` is invoked to prevent accidental closure caused by shadow boundary event retargeting.

4. **Focus Trap Fallback:**
   - If live testing shows focus trapping fails in any complex overlay state, avoid hand-rolled focus trap loops. Instead, favor anchored non-modal primitives (`BtPopover` with `modal={false}` or `BtDropdownMenu`) and manage explicit focus return via `onCloseAutoFocus`.
