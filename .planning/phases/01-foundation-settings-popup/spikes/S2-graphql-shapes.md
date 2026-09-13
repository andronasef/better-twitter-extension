# Spike S2: GraphQL Operation Shapes & Wire Envelopes

**Question:** What do X's live GraphQL network operations look like on the wire (operation names, query doc IDs, URL shapes, and top-level response envelopes) across `fetch` and `XMLHttpRequest`?

## Background & Knowns

- **URL Pattern:** Observed endpoints match `/i/api/graphql/<docId>/<OperationName>`.
- **Query Parameterization:** `variables` arrives as URL-encoded JSON query parameters on GET requests, or JSON-encoded request bodies on POST requests.
- **Reference Operations:** Prior implementations noted operation names including `HomeLatestTimeline`, `TweetDetail`, `UserByScreenName`, and `AboutAccountQuery`.
- **Dual Transport:** X utilizes both `window.fetch` and `XMLHttpRequest` concurrently across different cohorts and feature areas.

## Open Unknowns

1. Response envelope schema: Nesting structure of `data` → `instructions` → `entries` across current cohorts.
2. Active operation names for bookmark lists and home timeline queries in the current production deployment.
3. Response body availability and timing when intercepted via non-blocking response cloning and XHR event hooks.

## Procedure

1. Load the extension development build in a Chrome/Edge profile signed in to x.com.
2. Open DevTools console on an active x.com tab.
3. Visit the following views in sequence:
   - **Home** (`/home`)
   - **Bookmarks** (`/i/bookmarks`)
   - A **Tweet Detail** page (`/<user>/status/<id>`)
   - A **User Profile** page (`/<user>`)
4. Check console output for `[bt:spike] GraphQL shape:` records emitted by the bridge.
5. Record distinct operations below and replace `PENDING LIVE RUN`.

## Result

PENDING LIVE RUN

| Method | Operation Name | Doc ID (truncated) | Top-Level Response Keys | Entry Count | Transport |
|--------|----------------|--------------------|-------------------------|-------------|-----------|
| PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |

## Consumed by

- **Phase 3 (Bookmark Capture):** Directly depends on the exact operation name, endpoint URL, and response envelope for bookmark queries (e.g. `Bookmarks`, `BookmarkFolderQuery`) to extract and capture bookmarked tweet IDs from intercepted network responses without issuing redundant network requests.
- **Phase 4 (Bookmark Folders, Search & Resurfacing):** Consumes the captured envelope shapes to synthesize and splice custom collection entries seamlessly into timeline feeds.

## Data & Privacy Constraints

- **Shape Only:** Emitted payloads contain structural metadata only (`method`, `urlPath`, `operationName`, `docId`, `topLevelResponseKeys`, `entryCount`).
- **No Data Retention:** No response bodies, request bodies, tweet text, usernames, cookies, `authorization` headers, `x-csrf-token`, or bearer tokens are logged, stored in `chrome.storage`, or transmitted.
- **Validity Window:** Per `01-RESEARCH.md`, GraphQL operation names and doc IDs on x.com carry a 7-day freshness guarantee; observations recorded here must date from live runs on or after 2026-09-13.
