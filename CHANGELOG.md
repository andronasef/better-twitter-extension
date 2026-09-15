# Changelog

All notable changes to Better Twitter! are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] — 2026-09-15

### Fixed

- **Bookmark sync no longer stops early.** Every page request was being sent on
  three delivery channels at once, so each page was fetched up to three times.
  The duplicate responses raced each other: one would advance the pagination
  cursor, then another would see its own cursor already recorded, decide the
  timeline had ended, and stop sync — typically after about 60 bookmarks. Page
  fetches are now deduplicated, so a sync runs to the end of your bookmarks.
- A page that returned a new cursor but no readable tweets no longer ends the
  sync on its own; only a missing or repeated cursor does.

### Added

- **Auto-sync every 7 days.** Bookmarks re-sync on their own about once a week.
  Because syncing needs an open Bookmarks page on X, the sync starts quietly the
  next time you open Bookmarks after it comes due — no tabs are opened for you
  and nothing runs in the background without you. If a sync is waiting, the
  popup says so and you can start it yourself at any time. The feature can be
  turned off with the "Auto-sync every 7 days" switch in the popup's Settings.
  This adds the `alarms` permission, which only lets the extension wake itself
  on a timer.
- **Rate & share prompt.** An unobtrusive card appears after you have had the
  extension installed for a week, asking if you would like to rate or share it.
  Dismissing it snoozes it for several days, and it stops asking after three
  dismissals or once you have rated or shared.
- Developer-only tools panel in the popup, stripped entirely from release builds.

## [0.1.0] — 2026-09-14

Initial public release.

### Added

- Ad and promoted-content removal on the X timeline.
- Local bookmark folders with search, tagging, import/export, and timeline
  resurfacing.
- Facebook-style Twemoji reactions that prefill a one-emoji reply for you to
  send.
- Community themes — Dracula, Nord, and Matrix — plus Minimal and Old Twitter
  layouts.
- Landing page, privacy policy, and uninstall feedback form.

[0.1.1]: https://github.com/andronasef/better-twitter-extension/releases/tag/v0.1.1
[0.1.0]: https://github.com/andronasef/better-twitter-extension/releases/tag/v0.1.0
