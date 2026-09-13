import React from 'react';
import { ThemeCard } from './ThemeCard';
import { AccentPicker } from './AccentPicker';
import { THEME_PRESETS } from '@/lib/theme-engine';
import type { ThemeId, Settings } from '@/lib/storage';

const THEME_ORDER: ThemeId[] = ['default', 'dracula', 'nord', 'matrix', 'minimal', 'old-twitter'];

interface ThemesPanelProps {
  settings: Settings | null;
  onThemeChange: (theme: ThemeId) => void;
  onAccentChange: (hex: string) => void;
  onAccentReset: () => void;
}

/**
 * Dedicated Themes panel (D-09, D-12, UI-SPEC § Themes Panel Layout & Thumbnail Cards):
 * a 2-column grid of 6 preset thumbnail cards plus a custom accent color picker section.
 */
export function ThemesPanel({
  settings,
  onThemeChange,
  onAccentChange,
  onAccentReset,
}: ThemesPanelProps) {
  const activeTheme: ThemeId = settings?.theme ?? 'default';
  const customAccent = settings?.customAccent ?? null;
  const effectiveAccent = customAccent ?? THEME_PRESETS[activeTheme].accent;

  return (
    <div className="view-enter-panel flex flex-col gap-3">
      <h2 className="text-[12px] font-bold uppercase tracking-wide text-[var(--bt-fg-muted)]">
        Preset Themes
      </h2>

      <div className="grid grid-cols-2 gap-2">
        {THEME_ORDER.map((id) => {
          const preset = THEME_PRESETS[id];
          return (
            <ThemeCard
              key={id}
              preset={{
                id: preset.id,
                label: preset.label,
                desc: preset.desc,
                // Default & Minimal are native/layout-only presets (empty tokens); fall back to
                // the popup's own light/dark surface tokens so the card preview never renders
                // an invalid/blank CSS color.
                bg: preset.bg || 'var(--bt-bg)',
                surface: preset.surface || 'var(--bt-surface)',
                accent: preset.accent,
              }}
              isSelected={activeTheme === id}
              onSelect={() => onThemeChange(id)}
            />
          );
        })}
      </div>

      <h2 className="text-[12px] font-bold uppercase tracking-wide text-[var(--bt-fg-muted)] mt-3">
        Custom Accent Color
      </h2>

      <AccentPicker
        customAccent={customAccent}
        effectiveAccent={effectiveAccent}
        onChange={onAccentChange}
        onReset={onAccentReset}
      />
    </div>
  );
}
