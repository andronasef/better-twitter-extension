import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

/**
 * Classic 2015 desktop mini profile dashboard card (THEME-06, D-15, UI-SPEC § 5).
 *
 * Renders the banner, rounded-square avatar, display name/handle, and a 3-column
 * TWEETS / FOLLOWING / FOLLOWERS stats grid, matching the classic Old Twitter left-column
 * profile widget. Mounted non-destructively (as a sibling, never replacing X's own DOM) by
 * features/layout-engine's `layoutEngine.enableOldTwitter()`.
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
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
            boxSizing: 'border-box',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName || 'Avatar'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : null}
        </div>

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
                fontFamily: 'inherit',
                letterSpacing: '0.02em',
              }}
            >
              TWEETS
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1DA1F2', lineHeight: 1.2 }}>
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
                fontFamily: 'inherit',
                letterSpacing: '0.02em',
              }}
            >
              FOLLOWING
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1DA1F2', lineHeight: 1.2 }}>
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
                fontFamily: 'inherit',
                letterSpacing: '0.02em',
              }}
            >
              FOLLOWERS
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1DA1F2', lineHeight: 1.2 }}>
              {followersCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const HOST_ATTR = 'data-bt-mini-profile-card-host';
const PROFILE_STORAGE_KEY = 'bt_cached_user_profile';
let inMemoryProfile: MiniProfileCardProps | null = null;

function getStoredProfile(): MiniProfileCardProps {
  if (inMemoryProfile) return inMemoryProfile;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(PROFILE_STORAGE_KEY) : null;
    if (raw) {
      inMemoryProfile = JSON.parse(raw);
      return inMemoryProfile || {};
    }
  } catch {}
  return {};
}

function storeProfile(props: MiniProfileCardProps): void {
  if (props.displayName || props.handle || props.avatarUrl) {
    inMemoryProfile = { ...getStoredProfile(), ...props };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(inMemoryProfile));
      }
    } catch {}
  }
}

let root: Root | null = null;
let hostEl: HTMLDivElement | null = null;
let retryTimer: ReturnType<typeof setInterval> | null = null;

function scrapeUserProfile(): MiniProfileCardProps {
  try {
    let displayName: string | undefined;
    let handle: string | undefined;
    let avatarUrl: string | undefined;

    const accountBtn = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
    if (accountBtn) {
      const avatarImg = accountBtn.querySelector('img') as HTMLImageElement | null;
      if (avatarImg?.src) avatarUrl = avatarImg.src;
      if (avatarImg?.alt && avatarImg.alt.trim() && !avatarImg.alt.startsWith('http')) {
        displayName = avatarImg.alt.trim();
      }

      const textNodes = Array.from(
        accountBtn.querySelectorAll('span, div[dir="auto"], div[dir="ltr"]')
      ).map((s) => s.textContent?.trim()).filter(Boolean);

      const foundHandle = textNodes.find((t) => t?.startsWith('@'));
      if (foundHandle) handle = foundHandle;

      const foundName = textNodes.find((t) => t && !t.startsWith('@') && t.length > 0 && !t.includes('\n'));
      if (foundName) displayName = foundName;

      const ariaLabel = accountBtn.getAttribute('aria-label') || '';
      const handleMatch = ariaLabel.match(/@([a-zA-Z0-9_]+)/);
      if (handleMatch && !handle) handle = `@${handleMatch[1]}`;
    }

    if (!handle) {
      const profileLink = document.querySelector('a[data-testid="AppTabBar_Profile_Link"]');
      const href = profileLink?.getAttribute('href')?.replace(/^\//, '');
      if (href && href !== 'profile' && !href.includes('/')) {
        handle = `@${href}`;
      }
    }

    if (!avatarUrl) {
      const composerAvatar = document.querySelector<HTMLImageElement>(
        'div[data-testid="primaryColumn"] [data-testid="tweetTextarea_0_label"] img, div[data-testid="primaryColumn"] [data-testid="Tweet-User-Avatar"] img'
      );
      if (composerAvatar?.src) {
        avatarUrl = composerAvatar.src;
        if (!displayName && composerAvatar.alt && !composerAvatar.alt.startsWith('http')) {
          displayName = composerAvatar.alt.trim();
        }
      }
    }

    if (displayName || handle || avatarUrl) {
      const scraped: MiniProfileCardProps = { displayName, handle, avatarUrl };
      storeProfile(scraped);
      return { ...getStoredProfile(), ...scraped };
    }
  } catch {}
  return getStoredProfile();
}

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

  const userProfile = scrapeUserProfile();
  root = createRoot(hostEl);
  root.render(<MiniProfileCard {...userProfile} />);

  if (!userProfile.displayName || !userProfile.handle || !userProfile.avatarUrl) {
    let attempts = 0;
    retryTimer = setInterval(() => {
      attempts++;
      const updated = scrapeUserProfile();
      if (updated.displayName && updated.handle) {
        if (retryTimer) clearInterval(retryTimer);
        retryTimer = null;
        root?.render(<MiniProfileCard {...updated} />);
      } else if (attempts > 20) {
        if (retryTimer) clearInterval(retryTimer);
        retryTimer = null;
      }
    }, 400);
  }
}

/**
 * Cleanly unmounts the MiniProfileCard and removes its host element. Safe to call even if
 * nothing is currently mounted.
 */
export function unmountMiniProfileCard(): void {
  if (retryTimer) {
    clearInterval(retryTimer);
    retryTimer = null;
  }
  if (root) {
    root.unmount();
    root = null;
  }
  if (hostEl) {
    hostEl.remove();
    hostEl = null;
  }
}
