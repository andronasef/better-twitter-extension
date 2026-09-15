# Chrome Web Store Submission Guide: Better Twitter

This guide contains copy-paste ready text, metadata fields, and declaration answers for submitting **Better Twitter** to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

---

## 1. Store Listing Metadata

### Extension Name

```text
Better Twitter - Focused & Clean X Experience
```

_(Alternative short title if character limit is tight: `Better Twitter`)_

### Summary (132 characters maximum)

```text
An X experience enhancer for focusing on what matters. Strip ads and clutter, apply reading themes, and organize local bookmarks.
```

_(Exact length: 130 characters)_

### Category

```text
Productivity
```

_(Secondary category if prompted: Workflow & Planning)_

### Privacy Policy URL

```text
https://github.com/andronasef/better-twitter-extension/blob/main/PRIVACY.md
```

### Support / Website URL

```text
https://bettertwitter.featurebase.app/
```

---

## 2. Store Description (Single-Purpose Narrative)

```markdown
X can be noisy and cluttered. Better Twitter is an experience enhancer designed to help you eliminate distractions and focus on what matters.

Everything is configurable through an intuitive popup menu that matches your theme with zero page reloads required.

✨ FOUR CORE TOOLS TO RECLAIM YOUR FEED

1. Clean Timeline
   Strip away the noise and take control of what you see:
   • Hide Promoted and ad tweets automatically as your feed loads
   • Remove the "What's Happening" / trending sidebar modules
   • Strip "Who to Follow" recommendation boxes
   • Hide vanity metrics (likes, reposts, reply counts) for a calmer reading experience
   • Default to your Following tab, hiding algorithmic suggestions

2. Custom Reading Themes & Layouts
   Read comfortably with carefully crafted color palettes and responsive layouts:
   • Dracula, Nord, and Hacker / Matrix (true black & neon green) themes
   • Custom Accent Color picker: personalize X with any hex accent
   • Minimal Theme: centers your feed and removes surrounding clutter for deep reading
   • Old Twitter Layout: classic, spacious desktop navigation inspired by the original web layout

3. Local Bookmarks Manager & Feed Resurfacing
   Never lose an insightful post in the void:
   • In-page bookmark manager injected directly into x.com/bookmarks
   • Full-text search across your saved tweets and authors
   • Organize bookmarks into custom folders and tags
   • Timeline Resurfacing: re-injects your saved gems into your timeline every N tweets so you actually read what you save

4. Quick Twemoji Reactions
   Express yourself faster without leaving your keyboard:
   • Hover or long-press the Like button to reveal a native Twemoji reaction palette
   • Selecting a reaction pre-fills X's native reply composer with your chosen emoji
   • Fully privacy-safe: the extension never posts or replies automatically—you always maintain 100% control before clicking send

---

🔒 ZERO DATA COLLECTION & LOCAL-FIRST PRIVACY

Better Twitter follows a strict zero-data architecture:
• 100% Local Storage: All settings, custom themes, and bookmark caches stay strictly within your browser's chrome.storage.local.
• Zero Outbound Network Requests: The extension never transmits your browsing activity, tweet content, tokens, or personal identifiers to any external server.
• Minimal Permissions: Only requests the storage permission. Zero host permissions.
• Open Source: Fully auditable, community-driven code under the MIT license.
```

---

## 3. Single-Purpose Policy Justification (Reviewer Note)

When submitting to the Chrome Web Store Developer Console, enter the following statement in the **Single Purpose Description** / **Notes for Reviewer** field:

```text
Better Twitter has a single, unified purpose: it is an X (formerly Twitter) web experience enhancer designed to help users eliminate visual distractions and focus on meaningful content.

All four core features directly serve this singular purpose:
1. Clean Timeline strips sponsored posts, algorithmic clutter, and vanity metrics.
2. Reading Themes & Layouts optimize visual readability and timeline ergonomics.
3. Local Bookmarks organize and resurface saved posts directly in the timeline.
4. Twemoji Reactions provide an ergonomic, user-confirmed shortcut for tweet interactions.

All features are modularly toggled by the user from a single settings popup. The extension operates with the principle of least privilege, requesting only the 'storage' API permission to save local user preferences and bookmarks within chrome.storage.local. It requires zero host permissions, executes no remote code, and transmits zero data outside the user's browser.
```

---

## 4. Permission Justifications

| Permission | Justification for CWS Reviewers                                                                                                                                                                         |
| :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `storage`  | Required solely to persist user UI toggle preferences, chosen color themes, and local bookmark categorization in the browser's `chrome.storage.local`. No data is ever transmitted to external servers. |

_Note: Better Twitter deliberately requests ZERO `host_permissions` and NO broad `<all_urls>` permission._

---

## 5. Data Safety & Privacy Form Declarations

Under the **Privacy** tab on the CWS Developer Dashboard, answer the questionnaire as follows:

1. **Do you collect or transmit any user data?**
   - **Answer:** `No` (We do not collect or transmit any user data).

2. **User Data Categorization (confirm "No" for all):**
   - Personally Identifiable Information (PII): `No`
   - Health information: `No`
   - Financial and payment information: `No`
   - Authentication information: `No`
   - Personal communications: `No`
   - Location: `No`
   - Web history: `No`
   - User activity (clicks, page views): `No`
   - Website content: `No`

3. **Chrome Web Store Limited Use Certification:**
   - Check the compliance box affirming adherence to the Chrome Web Store Developer Program Policies, including the Limited Use policy.
