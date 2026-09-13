import React from 'react';
import { Check } from 'lucide-react';
import type { ThemeId } from '@/lib/storage';

export interface ThemeCardPreset {
  id: ThemeId;
  label: string;
  desc: string;
  bg: string;
  surface: string;
  accent: string;
}

interface ThemeCardProps {
  preset: ThemeCardPreset;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * Visual thumbnail preview card for a theme preset (D-12, UI-SPEC § Theme Thumbnail Card Anatomy).
 * 156x88px, 8px rounded corners; a 52px mini-mock preview area over a 36px label area.
 * Selected state renders a 2px accent border and a circular checkmark badge.
 */
export function ThemeCard({ preset, isSelected, onSelect }: ThemeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`${preset.label}: ${preset.desc}`}
      className={`relative w-[156px] h-[88px] rounded-[8px] overflow-hidden text-left flex flex-col cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bt-accent)] focus-visible:ring-offset-2 ${
        isSelected ? 'border-2 border-[var(--bt-accent)]' : 'border border-[var(--bt-border)]'
      }`}
    >
      {/* Preview Area - 52px */}
      <div
        className="h-[52px] min-h-[52px] flex items-stretch gap-1.5 p-1.5"
        style={{ backgroundColor: preset.bg }}
      >
        <div className="w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: preset.surface }} />
        <div className="flex-1 flex flex-col gap-1 justify-center min-w-0">
          <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: preset.surface }} />
          <div className="h-1.5 rounded-full w-2/3" style={{ backgroundColor: preset.surface }} />
          <div className="h-1.5 w-4 rounded-full" style={{ backgroundColor: preset.accent }} />
        </div>
      </div>

      {/* Label Area - 36px */}
      <div className="h-[36px] min-h-[36px] flex items-center justify-between px-2 bg-[var(--bt-surface)]">
        <span className="text-[13px] font-bold leading-[18.2px] text-[var(--bt-fg)] truncate">
          {preset.label}
        </span>
        {isSelected && (
          <span className="h-4 w-4 rounded-full bg-[var(--bt-accent)] flex items-center justify-center shrink-0">
            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
          </span>
        )}
      </div>
    </button>
  );
}
