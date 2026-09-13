# Single-Purpose Narrative & Permission Ledger

## Single Purpose Statement

Better Twitter is a personalization layer giving a user control over how their own X/Twitter timeline looks and behaves in their own browser.

Every feature, permission, and architectural boundary exists solely to serve this single purpose. Five feature areas coexist in this extension (clean timeline, bookmark manager, reaction palette, reply filters, navigation customizer) — and maintaining strict single-purpose compliance across Chrome Web Store policy is what makes Phase 6 a routine audit rather than an emergency rewrite.

---

## Phase 1 Manifest Permission Ledger

| Manifest Entry | Type | Scope | Justification Against Single Purpose |
|---|---|---|---|
| `storage` | Permission | Local extension storage | Stores user personalization preferences and local selector miss diagnostics on-device so user settings persist across browser restarts without remote data transmission. |
| `web_accessible_resources` | Resource Scope | `bridge.js` scoped strictly to `*://x.com/*` and `*://twitter.com/*` | Injects the MAIN-world observer bridge into the timeline page to detect route changes and GraphQL payload shapes so the UI can adapt timeline display. |
| `host_permissions` | Host Permission | *(None declared)* | No host permissions are requested; all content script interactions are manifest-scoped to x.com and twitter.com. |

---

## Standing Rule for All Subsequent Phases

> **CRITICAL STANDING RULE (Enforced across Phases 2 through 6):**  
> Any new permission, host permission, or web-accessible resource scope introduced by any phase must be added to this ledger with its own one-clause justification against the single-purpose narrative in the **exact same commit** that introduces it.
>
> Adding permissions ad-hoc across development phases without updating this ledger will fail the standing build audit and block phase completion. Wildcard origin patterns (`<all_urls>`, `*://*/*`) are strictly prohibited project-wide.
