# Feature Research

**Domain:** Browser extensions that enhance/customize the X (Twitter) web experience
**Researched:** 2026-09-13
**Confidence:** MEDIUM (cross-checked across multiple independent extension listings, changelogs, GitHub READMEs, and community reporting; a few narrow claims are single-source and flagged LOW)

## Feature Landscape

### Table Stakes (Users Expect These)

Features nearly every surviving extension in this space ships, and whose absence reads as "half-finished" rather than "minimal."

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hide promoted/ad tweets | The single most common reason people install these extensions at all; every ad-focused extension (Hide X.com Ads, Block Twitter Promoted, Twitter X Ad Blocker, Poper Blocker) and every full suite (Control Panel for Twitter, Minimal Theme, Old Twitter Layout) does this | MEDIUM | DOM-filtering only — scan feed for promoted-post markers (`data-testid="placementTracking"` and similar) and remove the tweet's containing cell before paint. No extension does network-level ad blocking; X serves ads as regular timeline items so `declarativeNetRequest` cannot target them. Breaks whenever X changes the promoted-marker structure — needs a fallback detector, not a single selector. |
| Default to chronological/"Following" timeline, hide "For You" tab | Second-most universal feature; present in Control Panel for Twitter, Old Twitter Layout (OldTwitter), Minimal Theme, and every "detox" style extension found | LOW | CSS `display:none` on the tab plus a redirect/click-simulate to force "Following" as default on load. Low complexity, high perceived value. |
| Hide "Who to follow" / "Follow some topics" / trends sidebar | Consistently the #2 and #3 most-requested clutter items across every extension category reviewed (Control Panel for Twitter, Minimal Theme, Minimal X, Old Twitter Layout, Refined Twitter) | LOW | Simple container hiding via stable `data-testid`/`aria-label` selectors. Users expect granular toggles per-module, not one "hide sidebar" switch. |
| Hide engagement-bait modules ("X Premium" upsells, "Subscribe" nags, Grok promos) | Table stakes in every current (2026) minimal/clutter extension (Minimal Theme, Minimal X, Control Panel for Twitter) — these modules proliferated post-2023 and are now as disliked as ads | LOW | Same DOM-hiding pattern as ads; treat as its own toggle category since it changes more often than the core ad markup. |
| Media download button with highest-resolution output | Every downloader extension reviewed (X Media Downloader, X/Twitter Content Backup Tool, Plucker XBD, Media Harvest, Twitter Media Downloader Pro) leads with "original quality" as the headline feature | LOW–MEDIUM | Images: rewrite `pbs.twimg.com` URL to `?format=jpg&name=orig` (or legacy `:orig` suffix) — trivial string transform. Video: must read the tweet's `video_info.variants` array (2–4 MP4s at different bitrates) and pick the highest-bitrate entry — requires intercepting/replaying X's own API response or GraphQL call, not just DOM scraping. |
| Sane download filenames (author + date, not a random hash) | Explicitly called out as a feature in multiple current downloader listings (custom filename patterns using username/tweet-id/date) | LOW | String templating once you have tweet metadata already fetched for the download. |
| Custom accent color | Present in nearly every X/Twitter theming extension found (Custom Theme X, Twitter Custom Color, X/Twitter Customizer, X Theme Customizer) — the most common single theming feature in the category | LOW | X already themes itself with CSS custom properties (`--color-accent` equivalents); override via injected `:root` variables, no `!important` war needed if you target the same variables X uses. |
| Preset dark/alternate palettes | Every theming extension found ships 4–6 presets beyond Light/Dim/Lights Out (Midnight, AMOLED, Ocean, Forest, Sunset style names) | LOW | Same mechanism as accent color, just bundled variable sets. Naming presets after community palettes (Dracula, Nord) was not found shipped by name in this category specifically — validated pattern (preset palette selection) but a distinctive naming/branding choice (LOW confidence on prior art for the exact names). |
| Hide vanity metrics (view/like/reply counts) | Explicit feature in Minimal Theme, Minimal X, and Control Panel for Twitter's "hide all metrics" toggle | LOW | Pure CSS hide on count spans; no logic needed. |
| Granular per-feature toggles, not one master switch | Control Panel for Twitter's entire value proposition and its ~4.7-star rating rest on the depth/granularity of individual toggles rather than an all-or-nothing mode | LOW (per toggle) / MEDIUM (settings architecture as a whole) | This is a settings-UX requirement more than a single feature — see Settings UX section below. |

### Differentiators (Competitive Advantage)

Features that are rare, absent everywhere, or done poorly by existing tools — genuine room to be better.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Batch / thread media download | Media Harvest — one of the most-used single-purpose downloaders — explicitly does **not** support batch download, thread crawling, or file compression; this is a confirmed, named gap in the current landscape, not a solved problem | MEDIUM–HIGH | Requires walking a thread's tweet list (scroll + collect) or a profile's media tab, deduping already-seen media, and either sequential `chrome.downloads` calls or a zip step. Rate-limit-friendly pacing matters — X blocks extensions that hit its endpoints too fast (Media Harvest users report periodic X-side blocks). |
| Local bookmark folders + tags + full-text search, entirely offline | X's native bookmarks are a single flat, unsearchable list with no folders and no tags. Paid third-party tools (Dewey, Tweetsmash) solve this but require creating an account, syncing your bookmarks to *their* server, and (for Dewey) AI auto-tagging that runs bookmark content through a hosted model. A fully local implementation is a real differentiator against the entire "send your bookmarks to our cloud" category | MEDIUM | Local-only removes the biggest objection to Dewey/Tweetsmash for privacy-conscious users, but you give up their cross-device sync and true full-text semantic search. IndexedDB or `chrome.storage.local` + a simple inverted-index/substring search is enough for personal-scale bookmark volumes (hundreds–low thousands). |
| Timeline resurfacing of saved bookmarks | Nobody in the X/Twitter extension space does this — it's a pattern borrowed from Readwise's Daily Review, not native to any Twitter tool found. Genuine differentiator with a well-understood, well-loved reference implementation | MEDIUM–HIGH | Readwise's model: resurface **stochastically** for never-reviewed items, then **decay by recall probability** (a spaced-repetition curve) for reviewed ones, with user-tunable weighting per source. For a bookmarks-resurfacing feature, translate this to: (1) never-resurfaced bookmarks get randomly injected first, (2) previously-resurfaced-and-dismissed bookmarks get a cooldown that lengthens each time they're shown (simple exponential backoff approximates Readwise's half-life decay without needing the full SRS math), (3) let the user mute/pin specific bookmarks or folders from resurfacing. **What makes it feel good vs. annoying, per Readwise's own design and user commentary:** low volume (digest-sized, e.g. one card every N tweets, not every other tweet), an unmistakable visual marker so it never gets confused with a live post ("📌 Resurfaced" header — already planned), a fast/obvious dismiss or "don't show again" action, and respecting the user's own engagement (dismissing repeatedly should suppress that item, not just delay it). Getting the cadence wrong (too frequent) is the single most likely way this feature gets disabled by users in week one. |
| Twemoji reaction menu that **prefills** a 1-emoji reply for the user to send | X shipped native emoji-style reactions on tweets starting ~April 2024, but as of the most recent reporting found, broad rollout beyond limited markets (e.g., Turkey) had not reached general availability by 2026 — the feature gap this project targets is real and still open. The one third-party competitor found ("Emoji reactions in Twitter") renders reactions **client-side only, visible to other users of the same extension** — it does not post anything to X at all, so its reactions are invisible to the wider conversation | MEDIUM | **The project's current design (prefill the reply composer, human presses send) is the right call and materially de-risks this feature.** Research on auto-posting extensions found permanent suspensions with failed appeals — but that risk attaches to *software initiating the post*. Prefilling a composer is not automation: X sees a normal human-initiated reply, one per deliberate action, at human cadence. This lands in the gap between the two existing approaches — the competitor's reactions are real-but-invisible, X's native ones aren't broadly available, and a prefilled reply is publicly visible without inheriting automation-detection risk. The tradeoff is one extra click versus an auto-post design; that click is what buys the safety, and it also removes the need for an undo/delete mechanism entirely (nothing is published until the user commits). |
| Old-Twitter-layout emulation bundled alongside modern theming | OldTwitter (dimdenGD) proves there's sustained demand for this (translate-in-place, star-vs-heart reversion, classic link colors, hotkeys) but ships it as a *replacement client*, which is maximally fragile — full-rewrite risk every time X changes its frontend | MEDIUM | Cherry-pick the layout/visual cues (rounded avatars off, classic color links, star icon, narrower centered column) as CSS/DOM toggles layered on the real X app rather than rebuilding the app, which is both lower complexity and far less fragile than OldTwitter's approach. |
| Settings UX with search + icon-grid categories at Control-Panel-for-Twitter depth | Control Panel for Twitter is the reference implementation for "many toggles, still usable" — see Settings UX section. Most competitors (single-purpose ad blockers, single-purpose downloaders) never need this because they have 1–3 settings; a five-feature-area extension needs it and few competitors demonstrate it well at this breadth | MEDIUM | This is UX/IA work, not novel engineering, but it's a genuine differentiator because most multi-feature X extensions found either dump everything in one long scrolling options page or split into confusing separate popups. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Anything that **posts on the user's behalf** — auto-reply, auto-like, auto-follow, or an emoji reaction that publishes without a human pressing send | Feels like a natural extension of "make X better," and an auto-posting reaction saves one click over a prefilled one | X explicitly analyzes interaction graphs, posting cadence, and account metadata for automation; users report **permanent suspensions with failed appeals** from exactly this category of extension/script. This is the most severe possible consequence in the whole feature space, and it is not proportional to volume — software-initiated posting is the trigger, not the rate. Chrome Web Store review also scrutinizes automated-posting behavior | **Prefill, never post** — the project's current reaction design. The extension composes the emoji reply and hands it to the user; the user presses send. Publicly visible, zero automation surface, and no undo/delete mechanism needed because nothing is published until the human commits. Never queue, schedule, or bulk-trigger any action |
| Cloud sync / account system for bookmarks or settings | Users will ask for "use it on my other computer"; Dewey and Tweetsmash both built their entire business on this | Directly contradicts the project's own no-backend, local-only, no-data-to-leak decision; also the #1 privacy objection users have to Dewey/Tweetsmash-style tools (sending bookmark content to a third-party server) | Local-only with manual export/import (JSON file) if cross-device portability is ever wanted — no server, no accounts |
| AI-powered auto-tagging/categorization of bookmarks | Dewey's headline feature; feels "smart" and reduces manual tagging effort | Requires either a hosted LLM call per bookmark (network dependency + cost + contradicts local-only/no-backend decision) or an on-device model (real complexity, real bundle-size cost, and MV3 service-worker constraints make even lightweight on-device inference awkward) | Manual tags + folders with fast search is sufficient at personal-use bookmark volumes; defer AI categorization indefinitely rather than compromise the local-only constraint |
| Full alternative-client rewrite of the timeline (OldTwitter/Better-TweetDeck style) | Tempting because it gives total control over layout and removes X's own bugs | Maximal fragility: OldTwitter and Better TweetDeck both show that rebuilding X's UI on top of X's data means every X frontend rewrite is an existential threat, not a routine patch. Better TweetDeck died outright in 2023 for exactly this reason | Layer toggles/CSS/DOM patches on top of the real, current X app (`data-testid`-anchored) so a redesign degrades individual toggles instead of killing the whole extension |
| Broad host permissions (`<all_urls>`) or any remote code loading | Seems simpler than maintaining a narrow permission list, and some background-tab scraping strategies feel like they'd "need" broader access | Chrome Web Store review scrutinizes exactly this most heavily; broad host_permissions and remote code are the top causes of manual review flags and takedowns, independent of what the extension actually does | Scope host_permissions to `*://x.com/*` and `*://twitter.com/*` only (already the project's plan); keep `downloads`/`storage` as the only extra permissions and justify each in the listing |
| True `.gif` file reconstruction on download | Users sometimes ask for "the actual gif file," not an mp4 | X hasn't served real animated GIF files since ~2014 — every "GIF" on the platform is already a silent, looping MP4 under the hood; reconstructing a true GIF requires client-side re-encoding (large file size, real CPU cost, extra dependency) for a format users mostly want for the *behavior* (silent autoplay loop), not the container | Download the native MP4 as-is; if a real `.gif` is wanted, point users to a one-time external converter rather than bundling encoding logic |
| Keyword-stuffed listing / near-duplicate re-publishing under multiple names | Tempting distribution/ASO hack once the first listing exists | Explicit, actively-enforced Chrome Web Store Spam & Placement policy violation; appeals are one-shot and further appeals for the same violation are auto-rejected | One honest, accurately-described listing; let the feature breadth (five areas, one popup) be the differentiator instead of listing tricks |

## Feature Dependencies

```
[Bookmark capture (layered: DOM scrape + API intercept + save button)]
    └──requires──> [Local bookmark folders/tags/search]
                       └──requires──> [Timeline resurfacing]

[Tweet action-row injection layer]
    ├──enables──> [Media downloader button]
    └──enables──> [Emoji reaction menu on Like/Reply]

[Ad/clutter DOM-hiding layer]
    └──shares infrastructure with──> [Minimal theme] (both hide the same modules: trends, who-to-follow, promoted)

[Theme engine (CSS variable injection)]
    ├──enables──> [Custom accent color]
    ├──enables──> [Community/preset palettes]
    └──enhances──> [Minimal theme, Old Twitter layout] (both are theme-engine consumers, not separate systems)

[Settings popup icon-grid + search]
    └──requires──> [All five feature areas exposing a consistent toggle/schema shape]

[Emoji reaction: prefill-only] ──deliberately avoids──> [X automation detection + CWS automated-posting scrutiny]
[Old Twitter layout] ──overlaps DOM regions with──> [Minimal theme] (must define CSS/toggle precedence when both touch nav/layout width)
```

### Dependency Notes

- **Timeline resurfacing requires local bookmark folders, which requires bookmark capture:** there is nothing to resurface until bookmarks exist and are queryable, and resurfacing quality (avoiding repeats, respecting dismissals) needs the same storage layer bookmarks already use. Plan these three as one vertical slice, capture → storage/search → resurfacing, not three independent phases.
- **Media downloader and emoji reactions both live in the tweet action row:** build one shared "inject into action row" utility once (with the required-reading's DOM-injection cautions in mind — X's React re-renders can wipe injected nodes) rather than two separate injection mechanisms. This also avoids visual collisions (two extensions' worth of new icons crammed into one row).
- **Theme engine is shared infrastructure, not three features:** custom accent color, preset palettes, minimal theme, and old-Twitter-layout should all read from and write to the same CSS-variable/toggle system. Building "minimal theme" and "old Twitter layout" as separate hardcoded stylesheets (rather than as presets on top of one engine) will cause exactly the kind of conflicting-selector bugs Control Panel for Twitter users report after X redesigns.
- **The emoji reaction's prefill-only design is what keeps it out of the anti-feature column:** this is a design constraint to preserve, not a blocking dependency. The moment the extension itself presses send — even "just once, with an undo" — the feature crosses into the automated-posting category that causes permanent suspensions. Keep the boundary at: extension composes, human sends.
- **Old Twitter layout and Minimal theme both reach into layout width and left-nav structure:** decide toggle precedence (e.g., Old Twitter layout as a mode that supersedes Minimal theme's layout toggles when both are on) before implementing either, to avoid an unsupported combined state.

## MVP Definition

Per `PROJECT.md`, this project deliberately ships all five feature areas in one release rather than sequencing an MVP — "the value is the complete control panel, not an MVP." The table below reframes that decision as *within-feature* essentials vs. deferrable depth, which is still useful for phase-ordering inside the single release.

### Launch With (v1)

- [ ] Ad/promoted removal + For You/Who-to-follow/trends/engagement-bait hiding — table stakes, and the DOM-hiding infrastructure it needs is reused by the theme engine
- [ ] Media download button with `name=orig` image transform and highest-bitrate video variant selection — table stakes, low-to-medium complexity, high daily-use value
- [ ] Bookmark capture (layered strategies) + local folders/tags/search — foundational; resurfacing cannot exist without it
- [ ] Theme engine with accent color + at least the planned preset palettes (Dracula, Nord, Matrix) + Minimal theme + Old Twitter layout as presets on the same engine
- [ ] Settings popup icon-grid, following the Control Panel for Twitter reference pattern (see Settings UX below)

### Add After Validation (v1.x, within the same release per project scope)

- [ ] Timeline resurfacing — depends on bookmarks existing first; tune resurfacing cadence conservatively at launch (better to under-resurface than to trigger immediate feature-disable)
- [ ] Batch/thread media download — real differentiator, but higher complexity and higher X-side rate-limit risk than single-item download; land single-item download first, batch second
- [ ] Twemoji reaction menu that prefills a 1-emoji reply — the prefill design removes the automation risk, so this no longer needs to ship last for risk reasons; sequence it after the shared action-row injection layer exists (it reuses the same injection utility as the download button)

### Future Consideration (v2+)

- [ ] Manual export/import of bookmarks/settings (JSON) — nice-to-have portability without violating the no-backend decision
- [ ] Additional community palettes beyond the initial three
- [ ] Additional keyboard shortcuts / hotkey layer (seen as a differentiator in Old Twitter Layout and Refined Twitter, but orthogonal to the five core feature areas)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Ad/promoted + clutter hiding | HIGH | MEDIUM | P1 |
| Media download (single item, highest quality) | HIGH | LOW–MEDIUM | P1 |
| Bookmark capture + local folders/tags/search | HIGH | MEDIUM–HIGH (layered capture is the hard part) | P1 |
| Theme engine + accent color + presets | MEDIUM–HIGH | LOW–MEDIUM | P1 |
| Settings popup (icon-grid + search) | HIGH (multiplies value of everything else) | MEDIUM | P1 |
| Timeline resurfacing | MEDIUM–HIGH (delighter once tuned) | MEDIUM–HIGH | P2 |
| Batch/thread media download | MEDIUM | MEDIUM–HIGH | P2 |
| Twemoji reaction menu (prefills reply, user sends) | MEDIUM–HIGH (novel; publicly visible, unlike the one competitor) | MEDIUM | P2 (sequence after shared action-row injection exists) |
| Old Twitter layout as theme preset | MEDIUM | MEDIUM | P2 |
| Export/import of local data | LOW–MEDIUM | LOW | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible (within this project's single-release scope, still v1 — just later in build order)
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Control Panel for Twitter | Minimal Theme / Minimal X | Old Twitter Layout (OldTwitter) | Dewey / Tweetsmash (bookmarks) | Our Approach |
|---------|---------------------------|----------------------------|----------------------------------|----------------------------------|--------------|
| Ad/promoted hiding | Yes, plus deep timeline-behavior controls | Yes | Yes (full ad/tracking removal) | N/A | Yes, as one category among five, sharing the theme engine's DOM-hiding layer |
| Hide For You / Who to follow / trends | Yes, granular | Yes | Yes (chronological default) | N/A | Yes, table stakes |
| Media download | No | No | Yes (basic) | N/A | Yes, with `name=orig` + highest-bitrate video + batch/thread (the confirmed market gap) |
| Bookmark folders/tags/search | No | No | No | Yes, but cloud-synced and (Dewey) AI-tagged | Yes, local-only — the privacy-preserving alternative to the cloud tools |
| Resurfacing / spaced review | No | No | No | No (Tweetsmash has email digests, not in-feed resurfacing) | Yes — no direct X/Twitter competitor found; adapted from Readwise's Daily Review model |
| Theming (accent/palettes) | Limited (typography/density only) | Some (layout width) | Custom CSS support, colors | N/A | Yes — accent color + curated palettes (Dracula/Nord/Matrix) as first-class engine, not an afterthought |
| Emoji reactions on tweets | No | No | No | N/A | Yes — Twemoji menu that prefills a 1-emoji reply the user sends: publicly visible (unlike the one client-side-only competitor) with no automation risk |
| Settings depth/organization | Best-in-class reference (icon-grid-equivalent depth) | Simple (few toggles) | Full options page, less categorized | Web-app settings, not extension-popup | Icon-grid + footer, syncing to X's own Light/Dim/Lights Out theme |

## Sources

- [Control Panel for Twitter — Chrome Web Store](https://chromewebstore.google.com/detail/control-panel-for-twitter/kpmjjdhbcfebfjgdnpjagcndoelnidfj) — MEDIUM
- [Control Panel for Twitter — GitHub (insin)](https://github.com/insin/control-panel-for-twitter) — MEDIUM
- [Control Panel for Twitter reviews — chrome-stats.com](https://chrome-stats.com/d/kpmjjdhbcfebfjgdnpjagcndoelnidfj/reviews) — MEDIUM
- [Hide X.com Ads — Chrome Web Store](https://chromewebstore.google.com/detail/hide-xcom-ads/bapmhjebfdbdpjjfafnkfidijkjlkakf) — MEDIUM
- [Minimal Theme for Twitter / X — Chrome Web Store / GitHub (typefully)](https://github.com/typefully/minimal-twitter) — MEDIUM
- [Minimal X — Chrome Web Store](https://chromewebstore.google.com/detail/minimal-x/bpneckmaohifnjgbdmmanchmdombmill) — MEDIUM
- [X Media Downloader, X/Twitter Content Backup Tool, Plucker XBD, Twitter Media Downloader Pro — Chrome Web Store / Firefox Add-ons listings](https://chromewebstore.google.com/detail/twitter-media-downloader/dbkcfmmamhmdaiikkpgiigicgobnjnnj) — MEDIUM
- [Media Harvest — Chrome Web Store](https://chromewebstore.google.com/detail/media-harvest-x-twitter-m/hpcgabhdlnapolkkjpejieegfpehfdok) — MEDIUM
- [Twitter image size suffixes / pbs.twimg.com URL information](https://wiert.me/2025/02/18/twitter-image-size-suffixes-reloaded-pbs-twimg-com-url-information/) — MEDIUM
- [Twitter Video Quality Guide: 1080p, 720p, Bitrate and File Size](https://twittergifdownloader.app/blog/twitter-video-quality-guide/) — MEDIUM
- [Twitter GIF vs Video: How to Tell What You Downloaded](https://twittergifdownloader.app/blog/twitter-gif-vs-video/) — MEDIUM
- [Old Twitter Layout (2026) — Chrome Web Store](https://chromewebstore.google.com/detail/old-twitter-layout-2026/jgejdcdoeeabklepnkdbglgccjpdgpmf) — MEDIUM
- [OldTwitter — GitHub (dimdenGD)](https://github.com/dimdenGD/OldTwitter) — MEDIUM
- [Better TweetDeck — GitHub (eramdam)](https://github.com/eramdam/BetterTweetDeck) — MEDIUM
- [OldTweetDeck — GitHub (dimdenGD)](https://github.com/dimdenGD/OldTweetDeck) — MEDIUM
- [XKit Rewritten — GitHub](https://github.com/AprilSylph/XKit-Rewritten) — MEDIUM
- [Dewey — getdewey.co](https://getdewey.co/) — MEDIUM
- [Tweetsmash — tweetsmash.com](https://www.tweetsmash.com/) — MEDIUM
- [Readwise Daily Review documentation](https://docs.readwise.io/readwise/docs/faqs/reviewing-highlights) — MEDIUM
- [Adding Intention to Spaced Repetition — Readwise blog](https://blog.readwise.io/adding-intention-to-spaced-repetition/) — MEDIUM
- [X/Twitter Automation Rules 2026: What's Allowed vs. What Gets You Banned](https://opentweet.io/blog/twitter-automation-rules-2026) — MEDIUM
- [Emoji reactions in twitter — Chrome Web Store](https://chromewebstore.google.com/detail/emoji-reactions-in-twitte/jedmengpgnmdpkaakfehjodcabafnlfi) — MEDIUM
- [Twitter Continues to Work on Emoji-Style Reactions on Tweets — Social Media Today](https://www.socialmediatoday.com/news/twitter-continues-to-work-on-emoji-style-reactions-on-tweets/601019/) — MEDIUM
- [Twitter Tests Emoji Reactions to Boost Engagement (2025)](https://digilogy.co/news/twitter-emoji-reactions-test-update-2025/) — MEDIUM
- [Custom Theme X — GitHub (mmcakir)](https://github.com/mmcakir/custom-theme-x) — MEDIUM
- [Refined Twitter — GitHub (sindresorhus, cstigler, nealrs)](https://github.com/sindresorhus/refined-twitter) — MEDIUM
- [Chrome Web Store Spam Policy FAQ](https://developer.chrome.com/docs/webstore/program-policies/spam-faq/) — MEDIUM
- [Troubleshooting Chrome Web Store violations](https://developer.chrome.com/docs/webstore/troubleshooting) — MEDIUM
- [5 Browser Extension Patterns That Will Get You Banned From the Chrome Store](https://tryhoverify.com/blog/5-browser-extension-patterns-that-will-get-you-banned-from-the-chrome-store/) — MEDIUM
- [Scrape Twitter/X in 2026: Selectors, API & Code Examples](https://alterlab.io/blog/how-to-scrape-twitter-x-complete-guide-for-2026) — MEDIUM

---
*Feature research for: Browser extensions that enhance/customize the X (Twitter) web experience*
*Researched: 2026-09-13*
