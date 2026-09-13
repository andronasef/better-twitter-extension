import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

/**
 * Classic 2015 desktop mini profile dashboard card (THEME-06, D-15, UI-SPEC § 5).
 *
 * Renders the banner, rounded-square avatar, display name/handle, and a 3-column
 * TWEETS / FOLLOWING / FOLLOWERS stats grid, matching the classic Old Twitter left-column
 * profile widget. Mounted non-destructively (as a sibling, never replacing X's own DOM) by
 * features/layout-engine's `layoutEngine.enableOldTwitter()`.
 *
 * Live user data (real avatar/banner/handle/counts) is a future enhancement — this component
 * currently renders placeholder content matching the exact dimensions/typography contract so
 * the layout is visually correct immediately; wiring it to X's real profile data is out of
 * scope for THEME-06 (layout engine), tracked as a known follow-up.
 */
export interface MiniProfileCardProps {
  displayName?: string;
  handle?: string;
  bannerUrl?: string | null;
  avatarUrl?: string | null;
  tweetsCount?: string;
  followingCount?: string;
  followersCount?: string;
}

export function MiniProfileCard({
  displayName = 'Your Name',
  handle = '@handle',
  bannerUrl = null,
  avatarUrl = null,
  tweetsCount = '0',
  followingCount = '0',
  followersCount = '0',
}: MiniProfileCardProps) {
  return (
    <div
      data-bt-mini-profile-card=""
      style={{
        width: '290px',
        border: '1px solid #E1E8ED',
        borderRadius: '5px',
        background: '#FFFFFF',
        overflow: 'hidden',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
      }}
    >
      {/* Header Banner: 95px tall, classic cyan fallback if no banner image (UI-SPEC § 5.5) */}
      <div
        data-bt-mini-profile-banner=""
        style={{
          height: '95px',
          backgroundColor: '#0084B4',
          backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div style={{ padding: '0 12px 12px' }}>
        {/* Avatar: 72x72px, overlapping the banner, 4px rounded-square radius */}
        <div
          data-bt-mini-profile-avatar=""
          style={{
            width: '72px',
            height: '72px',
            marginTop: '-30px',
            marginLeft: '0px',
            borderRadius: '4px',
            border: '3px solid #FFFFFF',
            backgroundColor: '#CCD6DD',
            backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxSizing: 'border-box',
          }}
        />

        {/* User Info: display name (18px/700) + handle (13px/400) */}
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#14171A', lineHeight: 1.2 }}>
            {displayName}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 400, color: '#657786', lineHeight: 1.4 }}>
            {handle}
          </div>
        </div>

        {/* Stats Grid: 3 equal columns (TWEETS / FOLLOWING / FOLLOWERS) */}
        <div
          data-bt-mini-profile-stats=""
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            marginTop: '12px',
            borderTop: '1px solid #E1E8ED',
            paddingTop: '8px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#657786',
              }}
            >
              TWEETS
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1DA1F2' }}>
              {tweetsCount}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#657786',
              }}
            >
              FOLLOWING
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1DA1F2' }}>
              {followingCount}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#657786',
              }}
            >
              FOLLOWERS
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1DA1F2' }}>
              {followersCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const HOST_ATTR = 'data-bt-mini-profile-card-host';

let root: Root | null = null;
let hostEl: HTMLDivElement | null = null;

/**
 * Mounts the MiniProfileCard as a non-destructive sibling insert into `targetEl` (never
 * replacing or reparenting any of X's own DOM nodes). If `beforeEl` is a direct child of
 * `targetEl`, the card is inserted immediately before it; otherwise it is prepended.
 * Idempotent: unmounts any previously-mounted instance first.
 */
export function mountMiniProfileCard(targetEl: Element, beforeEl?: Element | null): void {
  if (typeof document === 'undefined' || !targetEl) return;
  unmountMiniProfileCard();

  hostEl = document.createElement('div');
  hostEl.setAttribute(HOST_ATTR, 'true');

  if (beforeEl && beforeEl.parentElement === targetEl) {
    targetEl.insertBefore(hostEl, beforeEl);
  } else {
    targetEl.insertBefore(hostEl, targetEl.firstChild);
  }

  root = createRoot(hostEl);
  root.render(<MiniProfileCard />);
}

/**
 * Cleanly unmounts the MiniProfileCard and removes its host element. Safe to call even if
 * nothing is currently mounted.
 */
export function unmountMiniProfileCard(): void {
  if (root) {
    root.unmount();
    root = null;
  }
  if (hostEl) {
    hostEl.remove();
    hostEl = null;
  }
}
