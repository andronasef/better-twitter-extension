import React, { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

/**
 * Authentic 2015 Classic Desktop Twitter Top Navigation Bar.
 * Inspired by classic Twitter 2015 and dimdenGD/OldTwitter.
 *
 * Height: 46px, fixed at top of screen.
 * Contains:
 * - Left: Home, Notifications, Messages (with classic active indicator)
 * - Center: Classic Twitter bird logo
 * - Right: Rounded search box, user avatar, and classic blue Tweet button
 */

export interface OldTwitterNavbarProps {
  displayName?: string;
  handle?: string;
  avatarUrl?: string | null;
}

export function OldTwitterNavbar({
  handle = '',
  avatarUrl = null,
}: OldTwitterNavbarProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'notifications' | 'messages'>('home');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const updateActiveTab = () => {
      const path = window.location.pathname;
      if (path.startsWith('/notifications')) {
        setActiveTab('notifications');
      } else if (path.startsWith('/messages')) {
        setActiveTab('messages');
      } else {
        setActiveTab('home');
      }
    };
    updateActiveTab();
    window.addEventListener('popstate', updateActiveTab);
    return () => window.removeEventListener('popstate', updateActiveTab);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}&src=typed_query`;
  };

  const handleTweetClick = () => {
    // Trigger native tweet compose modal
    const nativeBtn = document.querySelector<HTMLElement>('a[data-testid="SideNav_NewTweet_Button"]');
    if (nativeBtn) {
      nativeBtn.click();
    } else {
      window.location.href = '/compose/post';
    }
  };

  return (
    <nav
      id="bt-old-twitter-navbar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '46px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid rgba(0, 0, 0, 0.15)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1190px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          boxSizing: 'border-box',
        }}
      >
        {/* Left Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '4px' }}>
          <a
            href="/home"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '100%',
              padding: '0 14px',
              textDecoration: 'none',
              color: activeTab === 'home' ? '#1DA1F2' : '#66757F',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: activeTab === 'home' ? '0 -4px 0 0 #1DA1F2 inset' : 'none',
              transition: 'color 0.15s, box-shadow 0.15s',
            }}
          >
            {/* Home Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z" />
            </svg>
            <span>Home</span>
          </a>

          <a
            href="/notifications"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '100%',
              padding: '0 14px',
              textDecoration: 'none',
              color: activeTab === 'notifications' ? '#1DA1F2' : '#66757F',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: activeTab === 'notifications' ? '0 -4px 0 0 #1DA1F2 inset' : 'none',
              transition: 'color 0.15s, box-shadow 0.15s',
            }}
          >
            {/* Bell Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
            <span>Notifications</span>
          </a>

          <a
            href="/messages"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '100%',
              padding: '0 14px',
              textDecoration: 'none',
              color: activeTab === 'messages' ? '#1DA1F2' : '#66757F',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: activeTab === 'messages' ? '0 -4px 0 0 #1DA1F2 inset' : 'none',
              transition: 'color 0.15s, box-shadow 0.15s',
            }}
          >
            {/* Envelope / Messages Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            <span>Messages</span>
          </a>
        </div>

        {/* Center: Classic Twitter Bird */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <a
            href="/home"
            title="Twitter"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#1DA1F2">
              <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z" />
            </svg>
          </a>
        </div>

        {/* Right: Search, Profile Avatar, Tweet Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search Twitter"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '210px',
                height: '32px',
                padding: '6px 32px 6px 14px',
                fontSize: '12px',
                borderRadius: '21px',
                border: '1px solid #E1E8ED',
                backgroundColor: '#F5F8FA',
                color: '#14171A',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'background-color 0.2s, border-color 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#1DA1F2';
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = '#F5F8FA';
                e.currentTarget.style.borderColor = '#E1E8ED';
              }}
            />
            <button
              type="submit"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                color: '#657786',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.71 20.29l-5.4-5.4A7.9 7.9 0 0 0 18 10a8 8 0 1 0-8 8 7.9 7.9 0 0 0 4.89-1.69l5.4 5.4a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42zM4 10a6 6 0 1 1 6 6 6 6 0 0 1-6-6z" />
              </svg>
            </button>
          </form>

          {/* User Profile Avatar Link */}
          {handle && (
            <a
              href={handle.startsWith('/') ? handle : `/${handle.replace('@', '')}`}
              title="Profile"
              style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    backgroundColor: '#CCD6DD',
                  }}
                />
              )}
            </a>
          )}

          {/* Classic Tweet Button */}
          <button
            onClick={handleTweetClick}
            type="button"
            style={{
              height: '32px',
              padding: '0 16px',
              backgroundColor: '#1DA1F2',
              color: '#FFFFFF',
              border: '1px solid #1DA1F2',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0c85d0')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1DA1F2')}
          >
            {/* Feather / Quill Icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
            <span>Tweet</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

const NAVBAR_HOST_ID = 'bt-old-twitter-navbar-host';
let navbarRoot: Root | null = null;
let navbarHostEl: HTMLElement | null = null;

function scrapeNavbarProfile(): OldTwitterNavbarProps {
  try {
    let displayName: string | undefined;
    let handle: string | undefined;
    let avatarUrl: string | null = null;

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

    return { displayName: displayName || undefined, handle: handle || undefined, avatarUrl };
  } catch {
    return {};
  }
}

/** Mounts the authentic 2015 Classic Old Twitter Top Navbar */
export function mountOldTwitterNavbar(): void {
  if (typeof document === 'undefined') return;
  unmountOldTwitterNavbar();

  navbarHostEl = document.createElement('div');
  navbarHostEl.id = NAVBAR_HOST_ID;
  document.body.prepend(navbarHostEl);

  const profile = scrapeNavbarProfile();
  navbarRoot = createRoot(navbarHostEl);
  navbarRoot.render(<OldTwitterNavbar {...profile} />);

  if (!profile.handle || !profile.avatarUrl) {
    let attempts = 0;
    const retryTimer = setInterval(() => {
      attempts++;
      const updated = scrapeNavbarProfile();
      if (updated.handle && updated.avatarUrl) {
        clearInterval(retryTimer);
        navbarRoot?.render(<OldTwitterNavbar {...updated} />);
      } else if (attempts > 20) {
        clearInterval(retryTimer);
      }
    }, 400);
  }
}

/** Cleanly unmounts the 2015 Top Navbar */
export function unmountOldTwitterNavbar(): void {
  if (navbarRoot) {
    navbarRoot.unmount();
    navbarRoot = null;
  }
  if (navbarHostEl) {
    navbarHostEl.remove();
    navbarHostEl = null;
  }
}
