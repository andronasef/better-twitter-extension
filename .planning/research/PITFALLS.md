# Pitfalls Research

**Domain:** Chrome MV3 extension that modifies x.com DOM, posts replies on the user's behalf, downloads media, and scrapes bookmarks — distributed via Chrome Web Store
**Researched:** 2026-09-13
**Confidence:** MEDIUM-HIGH (Chrome Web Store policy and MV3 platform behavior verified against official Chrome for Developers docs and Chromium issue tracker = HIGH; X automation-rules wording corroborated across multiple independent secondary sources quoting help.x.com but not fetched directly from the primary page = MEDIUM; GraphQL/doc_id churn and scraping cadence claims are community-observed, not officially documented = MEDIUM)

## Critical Pitfalls

### Pitfall 1: `data-testid` selectors still rot — just slower than class names

**What goes wrong:**
Teams treat `[data-testid="..."]` as a permanent contract because it's meant for Cypress/Playwright E2E tests, not DOM styling. It's far more stable than `css-1dbjc4n`-style atomic classes, but it is still an internal X implementation detail with no public stability guarantee. X has renamed, removed, or restructured `data-testid` values before (e.g., action-bar buttons gaining/losing wrapper divs, `tweet` vs `cellInnerDiv` nesting changing, reply/like/bookmark testids shifting when a feature is redesigned). A/B tests are the sharper problem: X ships variant experiences to a percentage of accounts (new tweet composer, edited action row order, grid vs list bookmarks view) so the selector can be *correct in your account and broken in a beta cohort's account simultaneously* — you cannot reproduce the failure on your own machine.

**Why it happens:**
Developers verify against their own logged-in session and assume that's representative of all users. X.com is a single build serving feature-flagged variants per account/experiment bucket, not a single fixed markup tree.

**How to avoid:**
- Centralize every selector in one lookup module (never inline `document.querySelector` calls scattered across files) so a break is a one-file fix, not a grep-and-pray hunt.
- For every "find this element" operation, define a **fallback chain**: primary `data-testid`, then a secondary attribute-based selector (`role`, `aria-label` substring match, `lang` attribute on text nodes), then a structural heuristic scoped to a small subtree — never a bare class-name selector as the *only* path.
- Wrap every selector query in a helper that increments a miss counter and degrades to "feature disabled for this element" rather than throwing. One failed query must never crash the content script or block other features from running.
- Ship a lightweight, versioned "selector map" that can be hot-patched independent of a full extension release (e.g., fetched from an extension-owned static JSON on install/update, not executed as remote code — see Pitfall 5). This turns a selector break from "wait days for CWS review" into "push a data update."
- Canary your own selector health: on each matched injection point, tag the DOM node so you can visually audit (via a debug flag) whether the expected feature attached.

**Warning signs:**
- Silent feature disappearance reports from a subset of users while others see it working (classic A/B split signature).
- Console errors are absent (because you correctly avoided throwing) but a GitHub issue says "the download button just isn't there anymore."
- Selector-miss telemetry (local counter, not remote — see Pitfall 5 on data collection) spikes after an X deploy, visible as a new pattern of "0 matches" on a previously-reliable selector.

**Phase to address:**
Foundation phase (content-script injection framework), before any feature that queries the DOM is built. This is infrastructure, not a feature — build the selector-resolution/fallback/telemetry layer first and have every subsequent phase consume it.

---

### Pitfall 2: MutationObserver callbacks tank scroll performance on X's virtualized feed

**What goes wrong:**
X's timeline is a virtualized, infinitely-recycling list (React Virtuoso-style windowing): DOM nodes are constantly created, destroyed, and reused as the user scrolls, which fires MutationObserver callbacks continuously during scroll — exactly when the browser needs every spare millisecond for compositing. Naive implementations (a) observe the whole `document.body` subtree instead of a scoped container, (b) do a full `document.querySelectorAll` re-scan on every mutation batch instead of inspecting only the added nodes, (c) read layout properties (`offsetHeight`, `getBoundingClientRect`) inside the mutation callback before the browser has settled the frame, forcing synchronous layout thrashing, and (d) never disconnect/reconnect observers or remove per-node listeners as virtualization recycles the tweet DOM nodes, so listener count and closures accumulate for the life of the tab.

**Why it happens:**
MutationObserver is the only practical way to react to a SPA that renders without page navigation, and the naive "observe body, subtree: true, then re-query everything" pattern is the first thing that works in a five-minute prototype — it just doesn't survive an infinite-scroll feed at 60fps.

**How to avoid:**
- Scope the observer to the smallest stable ancestor container (the timeline's scroll region), not `document.body`.
- In the callback, iterate only `mutation.addedNodes` (and use `childList` without `subtree` where possible, or a targeted `subtree: true` only on the timeline container) — never re-run `querySelectorAll` over the whole document on every mutation.
- Batch DOM reads and writes: collect all needed measurements first, then apply all mutations, or defer non-urgent work to `requestIdleCallback`/`requestAnimationFrame` rather than doing work synchronously inside the observer callback.
- Debounce/coalesce bursts: MutationObserver already batches synchronous DOM changes into one callback per microtask, but a fast scroll still produces many callbacks per second — add your own throttle (e.g., process at most once per animation frame) if per-node work is nontrivial.
- Use `WeakMap`/`WeakSet` keyed on DOM nodes (not arrays or `Map` with element keys) to track "already processed" state so recycled/removed nodes don't leak references and don't get double-processed when React reuses the underlying node for a different tweet.
- Prefer `IntersectionObserver` for "is this tweet visible" style checks (resurfacing injection point, lazy media download button, etc.) instead of computing bounding rects manually inside the mutation callback — it's designed for exactly this and is scroll-performance-friendly by construction.
- When a tweet node is removed from the DOM (virtualization recycling), explicitly detach any listeners/observers attached to it; don't rely on garbage collection alone if you attached `addEventListener` without `{ signal }`/`AbortController` cleanup.

**What "good" looks like, measurably:**
- Scroll stays at or near 60fps (16.7ms/frame budget) on the timeline with the extension enabled; use Chrome DevTools Performance panel "Rendering" > frame timeline, not just subjective smoothness.
- No Long Tasks (>50ms) attributable to the extension's content script during continuous scroll — check the Performance panel's "Long Tasks" markers and confirm the call stack isn't your MutationObserver callback or its layout reads.
- Heap snapshot comparison before/after 10 minutes of continuous scrolling shows detached DOM node count and listener count roughly flat, not monotonically growing (use DevTools Memory > Heap Snapshot, filter "Detached").
- `performance.mark`/`measure` around the mutation callback shows sub-millisecond median handling time per batch on a mid-tier laptop.

**Phase to address:**
Foundation phase for the observer/selector infrastructure; explicitly re-verify at the phase that adds Timeline Resurfacing (injecting synthetic nodes every N tweets) since that phase adds the most write-heavy DOM mutation and is the most likely to regress scroll performance.

---

### Pitfall 3: Treating "instant emoji reply" as the same risk class as bot automation — and getting it wrong in both directions

**What goes wrong:**
Two failure modes exist and they're opposite. First, underestimating risk: if the reaction feature is implemented as scripted, non-user-initiated calls against X's internal GraphQL endpoints (rather than a single click dispatching one request per gesture), it falls under X's explicit prohibition on "non-API-based forms of automation such as scripting the website," which the rules state "may result in permanent account suspension" — this is a stricter, less forgiving category than API misuse because there's no app-level review process to appeal to, only account-level enforcement. Second, overestimating risk into a worse UX: some projects respond to this fear by adding confirmation dialogs, batching, or queuing "for safety," which actually looks *more* automated to anti-abuse heuristics (uniform timing, programmatic dispatch of multiple actions in a burst) than a single, deliberate, human-paced click ever would.

**Why it happens:**
Developers conflate "using X's public API for automation" (which has a documented, if narrow, permitted-use path) with "scripting the live website UI on the user's own logged-in session" (which is explicitly called out as the *higher*-risk category, independent of API terms). They also don't distinguish rate-limit throttling (recoverable, temporary) from platform-manipulation account actions (suspension, often unappealable for a personal/free-tier account).

**How to avoid:**
- Every reply must originate from a synchronous user gesture (click/keypress handler) with a 1:1 mapping — one click, one reply, one network request. No programmatic loops, no "reply to all," no scheduling, no replaying queued reactions after a tab was backgrounded.
- Never trigger a reply from a MutationObserver callback, a `setTimeout`, an `alarm`, or any code path not directly inside a trusted event handler for the specific gesture the user performed at that instant.
- Rate-limit defensively even though it's a single-user action: enforce a client-side cooldown between consecutive reactions (e.g., a few seconds) so a double-click or rapid hover-triggering bug can't fire a burst that looks like scripted engagement.
- Do not batch, retry-loop, or auto-resend a failed reply silently — surface the failure to the user and let them decide to retry, preserving the "one human click, one action" shape end to end.
- Keep the feature strictly to what's declared in scope: a single emoji reply per explicit gesture, never liking, following, DMing, or reposting programmatically — those are the specific categories X's automation rules call out as bulk/indiscriminate and suspension-triggering even at low volume if patterned (e.g., keyword-triggered auto-replies).
- Document this constraint in the codebase (a "why" comment at the call site) so a future contributor doesn't "improve" it into a batched or scheduled flow.

**Warning signs:**
- Any code path that can produce a network POST to the reply endpoint without a `trusted: true` DOM event in the call stack.
- A queue, retry loop, or `setInterval`/`chrome.alarms` handler anywhere near the reply-posting code.
- Reaction requests firing with suspiciously uniform inter-request timing in your own manual testing (a sign the trigger is not truly gesture-bound).

**Phase to address:**
Reactions/undo phase — this is the phase's core architectural constraint, not a late add-on. Any phase plan for this feature should include an explicit acceptance check: "reply request only fires inside the click handler, with no async gap that could be exploited for batching."

---

### Pitfall 4: The undo toast lies — the reply "deleted" but the delete silently failed

**What goes wrong:**
A 5-second undo toast implies a hard guarantee ("this post no longer exists") but is commonly implemented as fire-and-forget: the UI optimistically shows the toast, the user clicks Undo, a delete request fires, and the code assumes success without checking the response. Specific ways this breaks: (a) the reply's ID is captured from an optimistic/local response before X's server has confirmed the post exists, so the delete request targets an ID that either doesn't match the real server-assigned ID or races against the create request still being in flight; (b) the delete network call fails (network blip, rate limit, session hiccup) and the code doesn't distinguish "delete succeeded" from "delete request was sent," dismissing the toast either way; (c) the toast's timer and the click handler both resolve in an order that lets the timeout auto-dismiss and clear the reply-ID reference right as the user clicks Undo, so Undo does nothing; (d) the user navigates away, or the tab/service worker is suspended (see Pitfall 6) before the 5 seconds elapse, silently orphaning the undo capability.

**Why it happens:**
Undo UX is designed around the common case (network works, timing is generous) and the failure path — where it matters most, because a public post is now live — is the path least tested. Optimistic-UI patterns compound this by making the "it worked" signal purely local/UI state rather than server-confirmed state.

**How to avoid:**
- Never construct the undo action from a client-generated or optimistic tweet/reply ID. Wait for the actual server response to the create-reply call and extract the authoritative reply ID from it before enabling the Undo affordance — if the create call hasn't resolved yet, the Undo button should read "posting…" not be clickable.
- Make delete verification explicit: after issuing the delete request, check the actual HTTP status/response body for confirmation, not just "the fetch didn't throw." Treat network errors, non-2xx responses, and ambiguous responses (e.g., a 404 that could mean "already deleted" or "never existed") as distinct outcomes with distinct user-facing messages.
- On delete failure, do not silently dismiss the toast as if undo succeeded. Show an explicit failure state ("Couldn't remove the reply — [Retry] [View post]") so the user knows a live post exists and can act on it manually.
- Persist the pending-undo state (reply ID, expiry timestamp) somewhere that survives a service worker restart if any part of the undo logic lives in the background — see Pitfall 6; in-memory-only state in an MV3 service worker can vanish mid-countdown.
- Guard against the race between the auto-dismiss timer and a simultaneous Undo click: disable the timer (or make it idempotent/cancelable) the instant Undo is clicked, and make the delete call idempotent-safe (calling delete twice on an already-deleted post should not surface as an error to the user).
- Consider extending or pausing the undo window while the tab is hidden/backgrounded rather than letting a real-time timer expire silently off-screen, since the "created a public post I didn't mean to" cost is asymmetric and worth erring generous.

**Warning signs:**
- No test coverage for "delete request returns an error" or "delete request times out" — only the happy path is exercised.
- The reply ID used for delete is read from the same object used to render the optimistic UI update, rather than from the server's create-response payload.
- The toast dismiss and the Undo click handler both mutate the same "pending" flag without a check for "already resolved."

**Phase to address:**
Reactions/undo phase, specifically as a distinct acceptance criterion from "reaction posts": undo must be verified end-to-end including simulated network failure during the delete call, not just the success path.

---

### Pitfall 5: A "kitchen sink" extension trips the Chrome Web Store single-purpose policy

**What goes wrong:**
The Chrome Web Store's Program Policies state: *"An extension must have a single purpose that is narrow and easy to understand. Don't create an extension that requires users to accept bundles of unrelated functionality... If two pieces of functionality are clearly separate, they should be put into two different extensions."* This extension bundles ad-stripping, theming, a media downloader, an emoji-reaction poster, and a bookmark manager with local scraping — five feature areas that, read literally against the policy, look like exactly the "bundle of unrelated functionality" pattern reviewers are told to flag, even though from the user's perspective they cohere under "customize my X experience." Reviewers (and Google's automated pre-review scanning) look at the combination of *broad host permissions* + *many unrelated-looking permissions* (downloads, storage, potentially clipboard or notifications) + *a feature list that reads like five different apps* as a strong single-purpose-violation signal, independent of how well-intentioned the bundling is.

**Why it happens:**
Developers frame "single purpose" as "the feature I most care about" without also framing it in listing copy and permission usage as one coherent narrative. A permission that's technically needed for feature #4 but not justified anywhere in the visible description or store listing is a policy red flag on its own, separate from the single-purpose question.

**How to avoid:**
- Write and commit to a single, literal purpose statement before building further: something like "A personalization layer for X/Twitter that gives users control over their own client-side viewing and interaction experience" — then hold every feature to "does this serve that one narrative" (all five listed features plausibly do, if framed as *personalization/control*, not as five separate tools).
- Make the store listing description explicitly walk through why each permission and each feature belongs to that one narrative — reviewers and the automated policy scanner both weight the coherence of the *stated* purpose against the *requested* permissions and *described* features.
- Keep permissions minimal and justified per-feature in the listing: `downloads` only for the media button, `storage` only for local bookmark data — do not request permissions "for later" that aren't wired to a shipped, described feature at submission time.
- Avoid scope creep before v1 ships: if a future idea doesn't fit the one-sentence purpose, it's a separate extension or a v2 decision, not something to fold in now "since we're already asking for permissions."
- If in doubt, err toward splitting: Google's own guidance is that unrelated functionality should ship as separate extensions rather than risk a single-purpose rejection blocking the whole submission.

**Warning signs:**
- You cannot describe the extension in one sentence without using "and" to join unrelated verbs ("strips ads AND downloads videos AND manages bookmarks AND posts replies").
- The permissions list in `manifest.json` grows without a corresponding, visible feature and justification in the store listing draft.
- Internal team conversation defends a feature with "well, it's a personal project, so scope doesn't matter" — that reasoning doesn't survive contact with the reviewer.

**Phase to address:**
Store packaging/submission phase for the listing copy and permission audit, but the *decision* (one coherent purpose narrative) should be locked in the foundation phase so later feature phases don't each add permissions ad hoc without reference to it.

---

### Pitfall 6: Remote code / `unsafe-eval` and undisclosed data collection are instant-rejection triggers, and they sneak in via dependencies

**What goes wrong:**
MV3's code-integrity policy requires that "the full functionality of an extension must be easily discernible from its submitted code" — explicitly prohibiting `<script>` tags pointing at non-packaged resources, `eval()` or equivalent on strings fetched remotely, and building any "interpreter" that executes remotely-fetched commands even as data. This is easy to violate *accidentally*: a third-party analytics/crash-reporting SDK that fetches and evaluates a remote config, a bundler configuration that leaves `eval`-based source maps or HMR client code in the production build, or a "remote feature flags" pattern (fetch JSON, then `new Function()` on part of it) all trip this — and Chrome's automated review (the "Blue Argon" rejection code) flags it even when the developer didn't consciously add such logic. Separately, the store requires *prominent, pre-install disclosure* of what user data is collected and how it's used, plus a hosted, accurate privacy policy for any extension "that handles personal or sensitive user data" — silently reading bookmark content, tweet content, or account identifiers into `chrome.storage.local` without disclosure, even for a purely local, no-backend design, is treated as undisclosed collection if the listing doesn't describe it.

**Why it happens:**
Build tooling (bundlers, dev-mode conveniences, third-party SDKs) can introduce eval-like patterns invisibly; and "we don't have a server, so there's nothing to disclose" is a common but incorrect assumption — local storage is still "collection" in Chrome's policy sense if it captures user content or activity.

**How to avoid:**
- Audit the production build output (not just source) for `eval(`, `new Function(`, and remotely-sourced `<script src="http...">` before every submission — WXT/Vite production builds should not include eval-based HMR, but verify explicitly since MV3 CSP forbids `unsafe-eval` at the manifest level too and Chrome will reject builds that need it.
- Do not use any "remote config" or "remote feature flag" pattern that executes fetched content as code; static JSON consumed as data (not executed) is fine, executing it is not (this also intersects with Pitfall 1's "hot-patchable selector map" — keep that map pure data, never `eval`'d).
- Since the project is explicitly local-only with no backend (per project constraints), write a privacy policy and Limited-Use disclosure anyway, stating plainly: what's stored (bookmarks, settings, cached tweet content/media URLs), where (chrome.storage.local, on-device only), and that nothing is transmitted off-device — this satisfies the disclosure requirement even at zero data transmission, and having it pre-written avoids a scramble during review.
- Declare and justify every permission (`storage`, `downloads`, host permissions for `x.com`/`twitter.com` only) in both the manifest and the listing; avoid `<all_urls>` or wildcard host permissions entirely — narrow, matching host permissions are explicitly what reviewers want to see.

**Warning signs:**
- A dependency changelog mentions "remote config," "dynamic feature flags," or "over-the-air updates" for a client-side library — treat as a red flag requiring source inspection before adopting.
- `grep -r "eval(\|new Function("` across the production build output returns any hits outside of vendored, unreachable dead code.
- The privacy policy doesn't exist yet at the time of first submission draft — this should be finished before, not during, the CWS submission phase.

**Phase to address:**
Store packaging/submission phase for the final audit and privacy policy publication; the "no remote code, no eval" constraint should be a standing rule enforced by lint/CI from the foundation phase onward so it's never a late surprise.

---

### Pitfall 7: A near-identical "media downloader" extension was already removed from the Chrome Web Store for this exact feature

**What goes wrong:**
An X/Twitter media-downloader extension with the same core feature this project plans (a one-click download icon injected into every post with video/images on x.com) was removed from the Chrome Web Store for a policy violation tied to Google's prohibition on "products or services that encourage, facilitate, or enable the unauthorized access, download, or streaming of copyrighted content or media." A downloader that grabs the highest-resolution media a user is already viewing is arguably meaningfully different from a piracy tool, but the *feature surface* (an extension whose primary/one of its primary functions is downloading third-party-hosted media the user doesn't own) is exactly what this policy area scrutinizes, and Google's enforcement has historically not distinguished carefully between "personal-use convenience" and "facilitates unauthorized redistribution" framing at review time.

**Why it happens:**
Reviewers (and automated scanning) key on the *mechanism* (bulk or one-click download of hosted media you don't own) more than the *stated intent* (personal archival). A listing that doesn't explicitly frame the feature as "save media you have the rights to view, for personal offline use" and instead reads like a generic "download any tweet's video" pitch reads identically to a since-removed extension that did the same thing.

**How to avoid:**
- Frame the feature narrowly in the listing and UI copy: "save media from posts already visible to your account, for personal use" — avoid language implying bulk/bypass capability (no "download entire threads," no "bypass download restrictions," no marketing language suggesting circumvention of X's own tools).
- Keep the mechanism to what a logged-in user's browser already legitimately has access to render (the media URL the page already loaded), not a workaround for content the user's account can't otherwise view.
- Expect scrutiny regardless of framing — budget time in the roadmap for a possible rejection-and-resubmit cycle specifically for this feature, and have a fallback plan (e.g., shipping the downloader as an optional, clearly-scoped feature that can be pulled from a resubmission if it's the specific rejection reason) so one feature's review risk doesn't block the entire extension indefinitely.
- Monitor the Chrome Web Store Program Policies page for updates to this specific clause before each submission — this is an actively enforced and evolving area, not a static rule.

**Warning signs:**
- Listing copy drafts use words like "download any," "grab all," "bypass," or "no restrictions" near the media feature description.
- The feature works on media the user's own account cannot actually view in the browser (would indicate a scope beyond "save what I'm already seeing").

**Phase to address:**
Media downloader feature phase for the implementation scope (view-scoped, not bulk), and store packaging/submission phase for listing-copy review with this specific precedent in mind. Treat this as the single highest-risk feature for review rejection and plan submission-order/timeline accordingly.

---

### Pitfall 8: The MV3 service worker dies mid-scrape and takes your in-memory progress with it

**What goes wrong:**
Chrome terminates an extension's service worker after roughly 30 seconds of inactivity (no pending events), and also kills it if a single event handler blocks for more than 5 minutes or a fetch takes longer than 30 seconds to resolve. Any background-tab bookmark scrape, GraphQL-interception buffer, or pagination cursor held only in a JS variable (not persisted) is destroyed the instant the worker is evicted — which can happen *between* pagination requests if there's any gap in activity, mid-scrape, with no error and no warning. `setTimeout`/`setInterval` scheduled from the service worker are not reliable either: the timer reference dies with the worker, so a "wait 2 seconds then fetch the next page" pattern silently never fires if the worker was evicted in that gap.

**Why it happens:**
MV2's persistent background page made "just keep it in memory" a working pattern for years; MV3 fundamentally changes this contract, and the failure is invisible in casual testing because a developer's dev-tools-open, actively-used tab keeps the worker alive far more than a real background scrape scenario would.

**How to avoid:**
- Treat the service worker as stateless between any two asynchronous steps. Persist scrape progress (pagination cursor, partial results, retry count) to `chrome.storage.local` (or `session` storage for sensitive/short-lived state) after every step, and resume from persisted state rather than assuming continuity.
- Register all event listeners synchronously at the top level of the service worker script (not inside a callback or after an `await`) — listeners registered late can be missed if the worker was already spinning down.
- Replace `setTimeout`/`setInterval` for anything that must survive worker eviction with `chrome.alarms` (minimum interval 30 seconds as of Chrome 120; older versions require 1 minute) — a scrape's pacing/backoff logic should be alarm-driven, not timer-driven, if any individual step might take longer than the worker's idle window.
- Keep individual fetches under the ~30-second threshold and individual event-handler executions well under 5 minutes; a multi-page scrape must be structured as many short steps (each triggered by a fresh alarm or message) rather than one long-running loop awaiting many sequential fetches in a single handler invocation.
- Test this failure mode explicitly: use `chrome://serviceworker-internals` or the extension's service worker DevTools to manually terminate the worker mid-scrape and verify the scrape resumes correctly from persisted state on the next trigger, rather than silently losing progress.

**Warning signs:**
- Scrape progress variables declared with `let`/`const` at module scope with no corresponding `chrome.storage` write.
- Any `setTimeout` or `setInterval` call inside the background service worker file.
- Bookmark counts that are inconsistent between runs with no error logged — a classic silent-worker-death symptom.

**Phase to address:**
Bookmark capture/background-scrape phase — this is the phase's core architectural constraint. Design the scrape state machine around "resumable from storage after arbitrary termination" from the first implementation, not retrofitted after intermittent bug reports.

---

### Pitfall 9: GraphQL query-id churn and guest-token rotation quietly break the API-interception bookmark strategy

**What goes wrong:**
X's internal GraphQL API uses opaque, undocumented `doc_id`/query-id values per operation (fetch bookmarks, load timeline, etc.) that X rotates periodically as part of its anti-scraping posture, alongside guest tokens that expire on their own cycle — community-tracked cadence is on the order of every few weeks, though it is not officially documented and can change without notice. A hardcoded or infrequently-refreshed query ID silently starts returning errors or empty results rather than an obvious "your code is broken" signal, which is worse than a hard crash because it can look like "the user just has no bookmarks" or "the request rate-limited" instead of "the endpoint contract changed."

**Why it happens:**
These identifiers are treated as stable constants because they don't change often in day-to-day development, and there's no versioned, documented contract to detect drift against — the only signal is response shape/content, which is exactly what the interception logic is trying to parse.

**How to avoid:**
- Never hardcode a query ID as a build-time constant with no refresh path. Extract the current query ID(s) at runtime by observing X's own outgoing requests (the layered capture strategy already planned in this project — intercepting X's own bookmark API responses — should also capture the query ID X itself is using *right now*, rather than embedding a value discovered once during development).
- Build explicit "this contract broke" detection: if an intercepted/constructed GraphQL call returns a shape that doesn't match the expected schema (missing expected keys, unexpected error codes), treat it as "this capture method is currently broken" and fail over to the next layered strategy (DOM scrape of the bookmarks page, or the extension-owned save button) rather than surfacing an empty or wrong result to the user.
- Because this project already plans layered capture strategies with fallback (per PROJECT.md), make sure each layer independently detects its own failure rather than assuming success — a strategy that "succeeds" by returning zero results indistinguishable from "no bookmarks" is not actually a working fallback signal.
- Avoid re-deriving/hardcoding query IDs by reverse-engineering X's client bundle as a separate, brittle build step; prefer observing IDs from the live page's own network activity via `chrome.webRequest`/`chrome.declarativeNetRequest` inspection or a content-script-side interception of `fetch`/`XHR`, since that inherently tracks whatever X is currently using.

**Warning signs:**
- Bookmark count silently drops to zero or a fixed small number after weeks of correct operation with no error surfaced.
- Intercepted response bodies start returning error codes or a different JSON shape than the parser expects, and the parser doesn't distinguish "no data" from "unexpected shape."
- A query ID appears in source as a literal string constant rather than something extracted from live traffic.

**Phase to address:**
Bookmark capture phase — specifically the GraphQL-interception layer's design should build in schema-mismatch detection and automatic fallback to the next capture strategy from day one, not as a later hardening pass.

---

### Pitfall 10: Background-tab throttling and logged-out edge cases quietly starve or corrupt a bookmarks scrape

**What goes wrong:**
Chrome throttles background/inactive tabs aggressively: `requestAnimationFrame` doesn't fire at all in a backgrounded tab, and `setTimeout`/`setInterval` are budget-throttled (and further capped to once-per-minute after ~5 minutes of inactivity) unless the tab is playing audible audio or holding a real-time connection. A background-tab DOM-scrape strategy (per PROJECT.md's layered approach) that relies on timers to paginate/scroll will slow to a crawl or stall entirely once the tab has been backgrounded for a few minutes — independent of the service-worker lifecycle issue in Pitfall 8, this is a *content-script-in-a-background-tab* throttling problem. Separately, if the user isn't logged in (session expired, logged out in another tab, cookie cleared), any scrape or reaction-posting attempt against x.com will get redirected to a login wall or return 401/403 responses that a naive parser may misinterpret as "zero bookmarks" or "endpoint broken" rather than "not authenticated."

**Why it happens:**
Development and testing almost always happen in a foregrounded, actively-used tab, which is exempt from the throttling that a real background scrape (running while the user works in another tab) will actually experience. Auth-state checks are often skipped because "I'm always logged in while developing."

**How to avoid:**
- Don't rely on `setTimeout`/`setInterval` timing for pacing a background-tab scrape's scroll/pagination steps; where the background tab itself must drive scrolling, use `chrome.alarms` (from the service worker orchestrating it) to wake the process on an interval that survives throttling, or restructure the scrape to be event-driven off network responses rather than timer-driven scrolling.
- Explicitly check authentication state before and during a scrape (e.g., presence of expected account-scoped DOM elements, or a 401/403/redirect-to-login response) and stop with a clear "not logged in" state rather than silently recording zero results.
- Consider whether a background-tab-based scrape is necessary at all versus scraping only while the user is actively on `x.com/bookmarks` in a foreground tab (removing the throttling problem entirely for that layer, and reserving background-tab scraping only as a specifically-tested fallback).
- Test the actual throttled scenario: open the scrape target in a background tab, switch away, and leave it backgrounded for 10+ minutes while observing whether progress continues, rather than testing only with the tab focused.

**Warning signs:**
- Scrape progress that works fine when manually watched (tab focused) but silently under-performs or stalls when left running in the background — the classic throttling-masked-by-testing-habits symptom.
- Bookmark results silently at zero when a manual visit to x.com shows the user is logged out — indicates missing auth-state detection.

**Phase to address:**
Bookmark capture phase, alongside Pitfall 8 and 9 — all three (service worker termination, GraphQL churn, tab throttling/auth) are facets of the same "background scrape reliability" problem and should be covered by one resumable, failure-aware scrape design rather than three separate patches.

---

### Pitfall 11: `chrome.storage.local`'s 10MB default quota and unbounded media-URL caching collide

**What goes wrong:**
`chrome.storage.local` defaults to a 10MB quota (5MB on Chrome 113 and earlier) unless the `unlimitedStorage` permission is requested, and any write that would exceed the quota fails immediately (`runtime.lastError` or a rejected promise) — it does not silently truncate or partially succeed. A bookmark cache that stores full tweet text, author metadata, and media URLs (potentially many per bookmark, across thousands of bookmarks over a long-term user) grows without bound if there's no eviction strategy, and can hit the quota wall well before the user notices — at which point *every subsequent write* fails, not just the one that crossed the threshold, which can corrupt the save-in-progress flow (e.g., a new bookmark fails to save, but the UI doesn't clearly say why). Additionally, chrome.storage enforces a per-item size limit (historically byte-limited per key) that a single large monolithic "all bookmarks" object can exceed even before the total quota is reached — pushing you to shard data across multiple keys, which is easy to get wrong (partial writes across shards leaving inconsistent state on a mid-write failure).

**Why it happens:**
10MB feels large during early development with a handful of test bookmarks, and unbounded caches are the simplest thing to build first — pruning/eviction is the kind of "do it later" work that's easy to deprioritize until real users' data volume exposes it.

**How to avoid:**
- Request the `unlimitedStorage` permission from the start given the intended scale (potentially thousands of bookmarks with media metadata over a long-lived install) — this is a low-scrutiny, well-understood permission that removes the 10MB ceiling, though it does not remove OS-level disk quota entirely (very large datasets can still hit the browser's global storage limit).
- Store large or numerous values sharded across multiple keys rather than one giant object, with a safe per-chunk size margin (well under the per-item limit) to leave room for key-name overhead and JSON escaping.
- Design an explicit eviction/pruning policy even with `unlimitedStorage`: cap cached media-URL/metadata retention (e.g., don't cache full-resolution media blobs at all, only URLs; expire cached tweet-content snapshots for bookmarks older than N days if the live data can be re-fetched; let the user manually clear the cache from settings).
- Handle write failures explicitly and distinctly from other errors: check `chrome.runtime.lastError`/promise rejection on every `storage.local.set` call related to bookmark data, and surface a clear "storage full — please clear old cached data" message rather than a generic save failure.
- Periodically audit actual storage usage via `chrome.storage.local.getBytesInUse()` and expose it in the settings UI so both the developer (during testing) and the user (in production) can see growth trends before hitting a wall.

**Warning signs:**
- No calls to `getBytesInUse()` anywhere in the codebase — a sign storage growth isn't being monitored at all.
- Bookmark save failures that only reproduce after heavy, long-term use and not in fresh test profiles.
- A single storage key holding the entire bookmarks collection as one JSON blob rather than sharded/paginated keys.

**Phase to address:**
Bookmark capture/storage phase for the sharding and quota-monitoring design; revisit at the Timeline Resurfacing phase since resurfacing likely reads the same growing dataset repeatedly and its performance is coupled to how that data is stored/sharded.

---

### Pitfall 12: Shadow DOM correctly isolates styles but breaks Radix portals, focus trapping, and z-index expectations

**What goes wrong:**
Rendering the injected UI (settings popup, reaction menu, resurfaced-bookmark card, undo toast) inside a Shadow DOM is the right call to prevent X's page CSS from leaking in and vice versa, but Radix UI primitives (Dialog, DropdownMenu, Popover — all built on portals) default to portaling their content to `document.body`, *outside* the shadow root, which immediately loses the shadow-scoped styles (the portaled content renders unstyled or picks up X's page styles instead). Even when the portal target is correctly redirected into the shadow root, two further breakages are well-documented in Radix's own issue tracker: focus trapping inside a Dialog/Popover doesn't reliably contain Tab-key navigation across the shadow boundary (focus can escape to X's own page content), and scroll-locking (used by Dialog to prevent background scroll while a modal is open) doesn't work correctly inside a shadow root, so the timeline keeps scrolling behind an open menu. Layered on top of this, X's own app uses a complex, deeply-nested stacking-context structure (fixed headers, sticky compose boxes, modal overlays, toast notifications) with its own z-index scale — injected UI that isn't deliberately given a stacking context isolated from the page can end up rendered behind X's own overlays despite a "correct-looking" high z-index value, because z-index only compares within the same stacking context.

**Why it happens:**
Radix/shadcn's defaults are designed for a normal single-document app, not a content-script-injected shadow root; the failure modes only surface once a specific Radix component (Dialog, DropdownMenu, Popover, Toast) is actually used inside a shadow-rooted extension UI, which is a less common integration pattern with thinner documentation than mainstream Radix usage.

**How to avoid:**
- Explicitly set every Radix portal-based component's container prop to a node inside your shadow root (not the default `document.body`) — for shadcn-based components this typically means wrapping the app in your own `Portal`/`Theme`-equivalent provider that supplies the shadow root as the portal target, consistently, everywhere a Dialog/DropdownMenu/Popover/Toast is used.
- Wrap portaled content in whatever top-level theme/style-provider component your design system needs (shadcn's `Theme` or equivalent) *inside* the redirected portal target too — portaled content rendered outside the original component tree loses access to context/theme providers unless they're re-applied at the portal boundary.
- Test focus trapping and scroll-lock specifically inside the shadow root, not just visually: tab through an open Dialog/Popover and confirm focus never escapes to X's own page elements; open a modal and confirm the underlying timeline doesn't scroll. Don't assume Radix's built-in behavior "just works" across the shadow boundary the same way it does in normal DOM.
- Establish your own dedicated top-level stacking context for all injected UI (a single fixed-position, high-z-index shadow-root host element attached directly to `document.body`, isolated with `isolation: isolate` or an explicit new stacking-context trigger) so your z-index values are compared against each other, not against X's arbitrary and changing internal scale — don't try to "out-z-index" X's stacking contexts by guessing ever-higher numbers.
- Budget explicit QA time against real X pages with active overlays open (compose modal, image lightbox, notification toasts) to catch stacking conflicts, since these only appear when your UI and X's UI are both visible simultaneously — a common gap in isolated component testing.

**Warning signs:**
- A Radix Dialog/Menu renders with zero styling or with X's own fonts/colors bleeding through — indicates the portal escaped the shadow root.
- Tab key moves focus into X's compose box or nav while your popover/dialog is open — indicates broken focus trapping across the shadow boundary.
- Your injected toast/menu appears behind X's own modal or sticky header in some but not all cases — indicates a stacking-context conflict, not a raw z-index problem (raising the z-index further won't fix it).

**Phase to address:**
UI shell / settings-popup phase (first phase that introduces Radix components in a shadow root) — establish the shadow-root portal-provider pattern once, correctly, before building the reaction menu, resurfaced-bookmark card, or undo toast on top of it, since all of them will inherit whichever pattern is set first.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Hardcoding a GraphQL `doc_id`/query-id as a constant | Faster to ship the first working scrape | Silent breakage every few weeks with no error signal | Never for shipped code — acceptable only as a throwaway spike/prototype |
| Single monolithic `chrome.storage.local` key for all bookmarks | Simpler read/write code | Hits per-item size limits and makes partial-failure recovery impossible | Only for early prototyping with a handful of test bookmarks |
| Observing `document.body` with MutationObserver instead of a scoped container | "just works" everywhere immediately | Scroll jank and CPU burn on the infinite feed | Never in shipped code; fine for a five-minute spike to confirm an element exists |
| In-memory-only scrape progress in the service worker | Simpler code, no persistence layer to design | Progress silently lost on worker eviction, appears as "sometimes bookmarks are missing" | Never — MV3 service worker lifetime cannot be assumed long enough for this to be safe even briefly |
| Skipping the privacy policy/Limited-Use disclosure because "we're local-only, nothing to disclose" | Saves writing time before first submission | Blocks or delays Chrome Web Store approval; must be done anyway | Never — write it before first submission regardless of local-only architecture |
| Defaulting Radix portals to `document.body` instead of the shadow root | Components work "out of the box" in isolated dev testing | Broken styling/focus/scroll-lock the moment it's tested inside the real content-script shadow root | Never for the shipped extension UI |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|------------------|-------------------|
| X's internal GraphQL API (bookmarks, timeline) | Treating undocumented `doc_id`/endpoint shapes as a stable contract | Extract query IDs from X's own live traffic at runtime; detect schema drift and fail over to the next capture strategy rather than trusting a hardcoded value |
| `chrome.storage.local` | Assuming a failed write throws where you're watching for it | Explicitly check `chrome.runtime.lastError`/promise rejection on every write touching bookmark/media data, especially bulk writes during a scrape |
| `chrome.alarms` | Assuming sub-30-second scheduling granularity still works as in MV2 timers | Design all background pacing around the 30-second (Chrome 120+) or 1-minute (older) minimum alarm interval |
| Radix UI + Shadow DOM | Leaving portal-based components (Dialog/DropdownMenu/Popover/Toast) at their default `document.body` portal target | Redirect every portal's container to a node inside the shadow root, with theme/style providers re-applied at that boundary |
| X's reply/delete endpoints | Constructing the undo-delete call from an optimistic/local reply ID | Wait for the server-confirmed create-response ID before enabling Undo; verify delete response status before declaring undo successful |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Unscoped MutationObserver on `document.body` with full-document re-queries per mutation | Scroll stutter, high CPU during scroll, slow tab | Scope observer to timeline container; process only `addedNodes`; avoid `querySelectorAll` re-scans | Becomes visible almost immediately on any feed with more than a screenful of tweets; severe on long scroll sessions |
| Listener/observer leaks on recycled virtualized tweet nodes | Growing memory over a session, eventual slowdown/crash on long browsing sessions | `WeakMap`/`WeakSet` for per-node state; explicit cleanup on node removal; `AbortController`-scoped listeners | Noticeable after tens of minutes to a few hours of continuous scrolling in one session |
| Layout reads (`getBoundingClientRect`, `offsetHeight`) inside mutation callbacks | Long Tasks in DevTools Performance panel, janky frames | Batch reads before writes; defer to `requestAnimationFrame`/`requestIdleCallback`; prefer `IntersectionObserver` for visibility checks | Breaks first at high scroll velocity (fast flick-scrolling), less visible at slow scroll speeds |
| Unbounded `chrome.storage.local` growth from cached media URLs/tweet snapshots | Storage-full write failures, sluggish popup load as stored dataset grows | Shard keys, prune old cached snapshots, request `unlimitedStorage`, monitor `getBytesInUse()` | Breaks once cumulative bookmark + cached metadata volume approaches the (default or requested) quota ceiling |
| Background-tab timer-driven scrape pacing | Scrape appears to "hang" only when the tab isn't focused | Use `chrome.alarms` or event-driven (response-triggered) pacing instead of `setTimeout`/`setInterval` for anything expected to run backgrounded | Breaks specifically once the tab has been backgrounded for more than a few minutes (throttling escalates over time) |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Broad host permissions (`<all_urls>` or wildcard beyond x.com/twitter.com) | Chrome Web Store rejection; unnecessary attack surface; user distrust | Request only `*://x.com/*` and `*://twitter.com/*`, nothing broader |
| Executing any fetched/remote content as code (`eval`, `new Function`, dynamic `<script src>`) | Automatic MV3 policy rejection ("Blue Argon"); real supply-chain risk if a dependency does this transparently | Audit production build output for eval-like patterns before every submission; treat any "remote config that executes" library as disqualifying |
| Silently caching tweet content/media/account data without disclosure | Chrome Web Store "undisclosed data collection" violation even with zero network transmission | Publish a plain privacy policy describing exactly what's stored locally and confirm nothing leaves the device |
| Firing reply/delete requests from any non-user-gesture code path (timers, observers, alarms) | Account-level suspension risk under X's non-API-automation rules, independent of any Chrome policy | Keep the entire reply/delete call chain inside a single synchronous user-gesture handler, no async gap that could be exploited or misfire |
| Reading the user's session cookies/tokens for GraphQL requests from a content script without funneling through a background/service-worker boundary | CORS/credential leakage risk and fragile request construction | Delegate authenticated fetches to the background service worker (host-permission-scoped, `credentials: include`), not raw content-script fetches |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| A feature silently disappears when its selector breaks | User assumes the extension is broken/abandoned, uninstalls | Detect selector-miss conditions and show a visible "this feature needs an update" state instead of silent nothing |
| Undo toast auto-dismisses without confirming the delete succeeded | User believes an unwanted public post was removed when it wasn't | Show explicit success/failure state for the delete action, not just a timer-based dismiss |
| Reaction feature feels "automated" (delayed, batched, or queued) rather than instant | Erodes the "feels native" design goal and increases anti-automation detection risk simultaneously | Single-click, single-request, immediate feedback — no queue, no delay, no batching |
| Bookmark cache silently stops growing once storage is near-full, with no visible signal | User thinks their bookmarks aren't being saved and loses trust in the core feature | Surface storage usage and failures in settings; prune proactively before hitting the wall, not reactively after |
| Injected UI (menus, toasts) rendered behind X's own overlays in some states | Confusing, looks like a rendering bug, erodes trust in a "feels native" experience | Dedicated top-level stacking context for all injected UI, tested against every major X overlay state |

## "Looks Done But Isn't" Checklist

- [ ] **Selector fallback:** Often missing a real fallback chain — verify by disabling the primary `data-testid` in a local test build and confirming the feature degrades gracefully rather than throwing or silently vanishing.
- [ ] **Undo toast:** Often missing failure-path handling — verify by simulating a failed/timed-out delete request and confirming the UI shows an explicit failure state, not a silent dismiss.
- [ ] **Background scrape:** Often missing resumability — verify by manually terminating the service worker mid-scrape (via `chrome://serviceworker-internals` or DevTools) and confirming it resumes correctly rather than losing progress.
- [ ] **Bookmark storage:** Often missing eviction/quota handling — verify by seeding a large synthetic dataset near the quota limit and confirming writes fail gracefully with a clear message, not a silent/generic error.
- [ ] **Shadow DOM UI:** Often missing portal redirection — verify every Radix Dialog/DropdownMenu/Popover/Toast actually renders inside the shadow root (inspect the live DOM tree, don't just trust it visually looks right) and that focus/scroll-lock behave correctly.
- [ ] **Reply automation boundary:** Often missing a hard architectural check — verify no code path can trigger a reply/delete network call outside a synchronous user-gesture handler (audit the call stack, not just the intent).
- [ ] **Chrome Web Store listing:** Often missing permission-to-feature justification — verify every requested permission is visibly explained in the listing copy, not just present in the manifest.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|------------------|
| Selector breaks after an X redesign/A/B rollout | LOW | Ship an updated selector map (data-only, no code change needed if the fallback-chain infrastructure exists); if a full code change is needed, expedited review still takes review-queue time — this is why the fallback-chain investment up front matters |
| A submitted feature (e.g., media downloader) is rejected on Chrome Web Store review | MEDIUM | Pull the specific offending feature into a flag-gated, disabled-by-default state, resubmit the rest, and treat the flagged feature as a separate follow-up submission once framing/scope is adjusted |
| Undo toast is found to leave orphaned public replies in some failure cases | MEDIUM | Ship a hotfix that adds explicit failure-state UI and a manual "delete this reply" affordance as a stopgap while the deeper race-condition fix is developed |
| GraphQL query-id churn breaks the bookmark-interception layer | LOW (if layered fallback exists) / HIGH (if it was the only strategy) | Fall back to the DOM-scrape or extension-owned save-button capture layer automatically; this is exactly why the project's layered-strategy design matters — recovery cost is only low if the fallback layers were actually built and tested, not just planned |
| `chrome.storage.local` quota exhausted in production for existing users | MEDIUM | Ship a migration that prunes/archives oldest cached data on update, requests `unlimitedStorage` if not already present, and surfaces a one-time "cache cleaned up" notice to affected users |
| Radix portal/focus issues discovered late (post-launch bug reports) | MEDIUM | Centralize the portal-target fix in one shared provider component so the fix propagates to every affected component at once, rather than patching each Dialog/Menu instance separately |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Selector staleness / A/B rollout breakage | Foundation (content-script + selector infrastructure) | Disable primary selectors in a test build; confirm graceful degradation, not silent failure or crash |
| MutationObserver scroll performance | Foundation, re-verified at Timeline Resurfacing | DevTools Performance panel: no extension-attributable Long Tasks during continuous scroll; flat heap growth over a 10+ minute scroll session |
| Automated-interaction risk (reply posting) | Reactions/undo phase | Code review confirms no reply/delete call path exists outside a synchronous user-gesture handler; no timers/queues near reply logic |
| Undo semantics / honesty | Reactions/undo phase | Explicit test of simulated delete failure; confirm UI never claims success without server-confirmed deletion |
| Single-purpose CWS policy fit | Foundation (purpose narrative), enforced at Store packaging phase | Listing draft reviewed against the one-sentence purpose statement before submission |
| Remote code / undisclosed data collection | Standing rule from Foundation; final audit at Store packaging phase | Production build grepped for eval-like patterns; privacy policy published and linked before submission |
| Media downloader CWS rejection precedent | Media downloader feature phase (scope) + Store packaging phase (listing copy) | Feature scoped to view-visible media only; listing copy free of bulk/bypass language |
| MV3 service worker termination mid-scrape | Bookmark capture phase | Manually terminate service worker mid-scrape via DevTools; confirm resumption from persisted state |
| GraphQL query-id/doc_id churn | Bookmark capture phase | Schema-mismatch detection triggers automatic fallback to next capture layer in a simulated-broken-endpoint test |
| Background-tab throttling / logged-out state | Bookmark capture phase | Run a scrape backgrounded for 10+ minutes and logged out; confirm explicit stalled/not-authenticated states, not silent zero-result success |
| Storage growth / quota exhaustion | Bookmark capture/storage phase, re-verified at Timeline Resurfacing | Seed a large synthetic dataset near quota; confirm graceful failure messaging and pruning behavior |
| Shadow DOM + Radix portal/focus/z-index breakage | UI shell / settings-popup phase (first Radix-in-shadow-root usage) | Inspect live DOM to confirm portals render inside the shadow root; manual focus-trap and scroll-lock test against real X overlay states |

## Sources

- [Troubleshooting Chrome Web Store violations](https://developer.chrome.com/docs/webstore/troubleshooting) — official, HIGH confidence
- [Additional Requirements for Manifest V3 (Chrome Web Store Program Policies)](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements) — official, HIGH confidence
- [Deal with remote hosted code violations](https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code) — official, HIGH confidence
- [Chrome Web Store - Program Policies](https://developer.chrome.com/docs/webstore/program-policies/policies) — official, HIGH confidence (single-purpose, spam/messages-on-behalf-of-user, and data-disclosure clauses quoted directly)
- [Updated Privacy Policy & Secure Handling Requirements](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq) — official, HIGH confidence
- [Limited Use | Chrome Web Store - Program Policies](https://developer.chrome.com/docs/webstore/program-policies/limited-use) — official, HIGH confidence
- [The extension service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle) — official, HIGH confidence
- [Manifest v3 service worker stops when computer awakens from 30+ second sleep (Chromium issue tracker)](https://issues.chromium.org/issues/40273015) — official issue tracker, HIGH confidence
- [chrome.storage API reference](https://developer.chrome.com/docs/extensions/reference/api/storage) — official, HIGH confidence
- [Storage quotas and eviction criteria (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — official, HIGH confidence
- [Detect DOM changes with mutation observers (Chrome for Developers blog)](https://developer.chrome.com/blog/detect-dom-changes-with-mutation-observers) — official, HIGH confidence
- [Turn Off the Lights extension triggers infinite mutation observer loops (Bugzilla)](https://bugzilla.mozilla.org/show_bug.cgi?id=1449584) — official bug tracker, real-world case, HIGH confidence
- [Background tabs in Chrome 57 (throttling)](https://developer.chrome.com/blog/background_tabs) — official, HIGH confidence
- [Heavy throttling of chained JS timers beginning in Chrome 88](https://developer.chrome.com/blog/timer-throttling-in-chrome-88) — official, HIGH confidence
- [Radix Dialog: Focus trap and scrolling issues within Shadow DOM (GitHub issue)](https://github.com/radix-ui/primitives/issues/3353) — official repo issue, HIGH confidence
- [Dialog/Menu overlay accessibility broken in Shadow DOM (GitHub issue)](https://github.com/radix-ui/primitives/issues/1772) — official repo issue, HIGH confidence
- [@radix-ui/react-dialog: Disable scroll in the shadow dom (GitHub issue)](https://github.com/radix-ui/primitives/issues/3483) — official repo issue, HIGH confidence
- [X's automation development rules (help.x.com)](https://help.x.com/en/rules-and-policies/x-automation) — official source; content corroborated via multiple secondary summaries quoting it directly (page itself returned 403 to automated fetch), MEDIUM confidence on exact wording
- [Developer Guidelines - X](https://docs.x.com/developer-guidelines) — official, referenced via secondary summaries, MEDIUM confidence
- ["X Video Downloader — Save X & Twitter Media" removal record (chrome-stats.com)](https://chrome-stats.com/d/akmdionenlnfcipmdhbhcnkighafmdha) — third-party store-tracking aggregator documenting an actual removal, MEDIUM confidence (real-world precedent, not an official Google statement of cause)
- Community/aggregated sources on GraphQL `doc_id`/guest-token rotation cadence and scraping maintenance burden (multiple 2025-2026 scraping-guide blog posts, cross-corroborated but not officially documented by X) — MEDIUM confidence, directionally reliable but exact rotation cadence is not authoritative
- [X (Twitter) API Rate Limits documentation](https://docs.x.com/x-api/fundamentals/rate-limits) — official for the public API; the internal GraphQL web-client rate-limit behavior is not officially documented and was assessed via community sources only, MEDIUM confidence for the GraphQL-specific claims

---
*Pitfalls research for: Chrome MV3 extension modifying x.com (ads/theme stripping, reply automation, media download, bookmark scraping), Chrome Web Store distribution*
*Researched: 2026-09-13*
