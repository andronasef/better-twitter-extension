import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import { categories as defaultCategories, features as defaultFeatures } from '@/lib/registry';
import type { CategoryEntry, FeatureEntry } from '@/lib/registry';
import { settingsItem, diagnosticsItem, xThemeItem } from '@/lib/storage';
import type { Settings, Diagnostics, ThemeId } from '@/lib/storage';
import { resolveScheme } from '@/lib/theme';
import { browser } from 'wxt/browser';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TileGrid } from './TileGrid';
import { CategoryPanel } from './CategoryPanel';
import { ThemesPanel } from './ThemesPanel';

const lightVars: Record<string, string> = {
  '--bt-accent': '#1D9BF0',
  '--bt-bg': '#FFFFFF',
  '--bt-surface': '#F7F9F9',
  '--bt-fg': '#0F1419',
  '--bt-fg-muted': '#536471',
  '--bt-border': '#EFF3F4',
  '--bt-warn': '#E07C00',
  '--bt-destructive': '#F4212E',
};

const darkVars: Record<string, string> = {
  '--bt-accent': '#1D9BF0',
  '--bt-bg': '#000000',
  '--bt-surface': '#16181C',
  '--bt-fg': '#E7E9EA',
  '--bt-fg-muted': '#71767B',
  '--bt-border': '#2F3336',
  '--bt-warn': '#FF9500',
  '--bt-destructive': '#F4212E',
};

interface AppProps {
  customCategories?: CategoryEntry[];
  customFeatures?: FeatureEntry[];
  initialSettingsError?: boolean;
}

export default function App({
  customCategories,
  customFeatures,
  initialSettingsError = false,
}: AppProps) {
  const categories = customCategories || defaultCategories;
  const features = customFeatures || defaultFeatures;

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostics>({});
  const [scheme, setScheme] = useState<'light' | 'dark' | null>(null);
  const [settingsError, setSettingsError] = useState(initialSettingsError);
  const [manifestVersion, setManifestVersion] = useState('');
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Read manifest version at runtime
    try {
      if (browser?.runtime?.getManifest) {
        const ver = browser.runtime.getManifest().version;
        setManifestVersion(ver);
      } else {
        setManifestVersion('0.1.0');
      }
    } catch {
      setManifestVersion('0.1.0');
    }

    // Read theme and resolve scheme
    xThemeItem.getValue().then((cached) => {
      setScheme(resolveScheme(cached));
    });

    const unwatchTheme = xThemeItem.watch((newTheme) => {
      setScheme(resolveScheme(newTheme));
    });

    // Read diagnostics
    diagnosticsItem.getValue().then((val) => {
      if (val) setDiagnostics(val);
    });

    const unwatchDiagnostics = diagnosticsItem.watch((newVal) => {
      setDiagnostics(newVal || {});
    });

    // Read settings
    if (!initialSettingsError) {
      settingsItem
        .getValue()
        .then((val) => {
          setSettings(val);
        })
        .catch(() => {
          setSettingsError(true);
        });

      const unwatchSettings = settingsItem.watch((newVal) => {
        setSettings(newVal);
      });

      return () => {
        unwatchTheme();
        unwatchDiagnostics();
        unwatchSettings();
      };
    }

    return () => {
      unwatchTheme();
      unwatchDiagnostics();
    };
  }, [initialSettingsError]);

  const handleSelectCategory = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleBackToGrid = () => {
    setActiveCategoryId(null);
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleToggle = async (featureId: string, enabled: boolean) => {
    const prev = settings || (await settingsItem.getValue());
    const next: Settings = {
      ...prev,
      features: {
        ...prev.features,
        [featureId]: enabled,
      },
    };
    setSettings(next);
    await settingsItem.setValue(next);
  };

  const handleThemeChange = async (theme: ThemeId) => {
    const prev = settings || (await settingsItem.getValue());
    const next: Settings = { ...prev, theme };
    setSettings(next);
    await settingsItem.setValue(next);
  };

  const handleAccentChange = async (hex: string) => {
    const prev = settings || (await settingsItem.getValue());
    const next: Settings = { ...prev, customAccent: hex };
    setSettings(next);
    await settingsItem.setValue(next);
  };

  const handleAccentReset = async () => {
    const prev = settings || (await settingsItem.getValue());
    const next: Settings = { ...prev, customAccent: null };
    setSettings(next);
    await settingsItem.setValue(next);
  };

  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const activeFeatures = activeCategory
    ? features.filter((f) => f.categoryId === activeCategory.id)
    : [];

  const themeStyle = scheme ? (scheme === 'dark' ? darkVars : lightVars) : undefined;

  return (
    <TooltipProvider delayDuration={400} skipDelayDuration={200}>
      <div
        data-theme={scheme || undefined}
        style={themeStyle as React.CSSProperties}
        className="w-[360px] h-[480px] bg-[var(--bt-bg)] text-[var(--bt-fg)] flex flex-col select-none overflow-hidden font-sans antialiased"
      >
        {/* Header - 48px fixed */}
        <header className="h-[48px] min-h-[48px] px-4 flex items-center border-b border-[var(--bt-border)]">
          {activeCategory ? (
            <div className="flex items-center w-full">
              <button
                type="button"
                onClick={handleBackToGrid}
                aria-label="Back to all settings"
                className="h-8 w-8 -ml-1 flex items-center justify-center text-[var(--bt-fg)] hover:bg-[var(--bt-surface)] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bt-accent)] focus-visible:ring-offset-2 cursor-pointer mr-2 shrink-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h1 className="text-[20px] font-bold leading-[24px] text-[var(--bt-fg)] truncate">
                {activeCategory.caption}
              </h1>
            </div>
          ) : (
            <h1 className="text-[15px] font-bold tracking-tight text-[var(--bt-fg)]">
              Better Twitter
            </h1>
          )}
        </header>

        {/* Content Viewport - 392px fixed */}
        <main
          ref={mainRef}
          className="h-[392px] max-h-[392px] overflow-y-auto p-4 flex-1"
        >
          {settingsError ? (
            <div className="h-full flex flex-col items-center justify-center py-8 px-4 text-center">
              <h2 className="text-[20px] font-bold text-[var(--bt-fg)]">
                Couldn&apos;t load your settings
              </h2>
              <p className="text-[13px] font-normal leading-[18.2px] text-[var(--bt-fg-muted)] mt-2 max-w-[280px]">
                Your settings live in this browser. Close and reopen the popup &mdash; if this keeps happening, reload the extension from chrome://extensions.
              </p>
            </div>
          ) : activeCategoryId === 'themes' ? (
            <ThemesPanel
              settings={settings}
              onThemeChange={handleThemeChange}
              onAccentChange={handleAccentChange}
              onAccentReset={handleAccentReset}
            />
          ) : activeCategory ? (
            <CategoryPanel
              category={activeCategory}
              features={activeFeatures}
              settings={settings}
              diagnostics={diagnostics}
              onToggle={handleToggle}
            />
          ) : (
            <TileGrid
              categories={categories}
              features={features}
              onSelectCategory={handleSelectCategory}
            />
          )}
        </main>

        {/* Footer - 40px fixed */}
        <footer className="h-[40px] min-h-[40px] px-4 flex items-center justify-between border-t border-[var(--bt-border)] text-[12px] text-[var(--bt-fg-muted)]">
          <span>{manifestVersion ? `v${manifestVersion}` : ''}</span>
          <a
            href="https://github.com/thewh1teagle/better-twitter/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-[var(--bt-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bt-accent)] focus-visible:ring-offset-2 rounded-[2px]"
          >
            Report an issue
          </a>
        </footer>
      </div>
    </TooltipProvider>
  );
}