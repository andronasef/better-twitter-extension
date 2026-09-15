# Privacy Policy for Better Twitter

**Effective Date:** September 15, 2026  
**Last Updated:** September 15, 2026

Better Twitter ("the Extension") is an open-source browser extension designed to enhance your experience on X (formerly Twitter) by giving you control over timeline clutter, visual themes, local bookmarks, and emoji reactions.

We believe that your browsing data and preferences belong solely to you. This Privacy Policy explains our strict zero-data-collection architecture.

---

## 1. Zero Data Collection & Transmission

**Better Twitter does not collect, transmit, store, sell, or share any personal data, browsing history, or user activity.**

Specifically:

- **No Personally Identifiable Information (PII):** We do not collect names, email addresses, usernames, IP addresses, or account credentials.
- **No Browsing Activity or History:** We do not track the URLs you visit, the profiles you view, or your activity outside or inside X.
- **No Tweet or Content Harvesting:** Your tweets, bookmarks, likes, and messages remain completely private to your session.
- **No Analytics or Telemetry:** There are no trackers, third-party analytics SDKs, advertising beacons, or telemetry scripts bundled in the extension.
- **No External Servers:** Better Twitter operates entirely offline within your local browser context. The extension makes **zero outbound network requests**.

---

## 2. Local Browser Storage Only

Any data required for Better Twitter to function is saved exclusively on your local machine using the standard Chrome WebExtension API (`chrome.storage.local`):

- **User Preferences & Settings:** Toggles for timeline modules (e.g., hiding ads, sidebar trends, vanity metrics), chosen color themes, and custom accent colors.
- **Saved Bookmarks:** Any bookmarks you save or organize within the extension remain strictly inside your browser's local sandbox and are never sent to external servers or cloud services.
- **Twemoji Reaction Preferences:** Your custom reaction emoji selection.

When you uninstall Better Twitter or clear your browser extension data, all stored local data is immediately and permanently erased from your device.

---

## 3. Minimal Permissions

Better Twitter follows the principle of least privilege:

- **`storage`:** Used solely to persist your local user preferences and local bookmark cache across browser sessions.
- **Zero Host Permissions:** The extension requests no broad host permissions (such as `<all_urls>`). Content scripts are scoped exclusively to `*://x.com/*` and `*://twitter.com/*` to apply UI enhancements directly in your browser.

---

## 4. External Links & Support

The extension contains optional links to external community pages:

- **Feature Requests & Bug Reports:** [Featurebase](https://bettertwitter.featurebase.app/)
- **Source Code & Issue Tracking:** [GitHub Repository](https://github.com/andronasef/better-twitter-extension)

If you choose to visit these external sites or submit feedback, their respective privacy policies apply.

---

## 5. Changes to This Policy

If this Privacy Policy is updated, changes will be published in this repository (`PRIVACY.md`) along with an updated effective date. Because we collect no contact information, we encourage users to review the repository for any updates.

---

## 6. Contact & Inquiries

For questions or inquiries regarding this Privacy Policy:

- Open an issue on our [GitHub Issues page](https://github.com/andronasef/better-twitter-extension/issues).
- Submit feedback via [Featurebase](https://bettertwitter.featurebase.app/).
