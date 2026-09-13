import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const PRESET_SWATCHES: { label: string; hex: string }[] = [
  { label: 'Default Twitter Blue', hex: '#1D9BF0' },
  { label: 'Dracula Purple', hex: '#BD93F9' },
  { label: 'Nord Cyan', hex: '#88C0D0' },
  { label: 'Matrix Neon', hex: '#00FF66' },
  { label: 'Classic Twitter Blue', hex: '#1DA1F2' },
];

const HEX_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

interface AccentPickerProps {
  /** The user's stored custom accent override, or null if reverted to the theme preset default. */
  customAccent: string | null;
  /** The color actually in effect right now (customAccent, or the active theme preset's default). */
  effectiveAccent: string;
  onChange: (hex: string) => void;
  onReset: () => void;
}

/**
 * Custom accent color picker (THEME-04, D-11, UI-SPEC § Custom Accent Color Picker Anatomy):
 * a 28x28 swatch button that opens a native color picker, a hex input validating 3/6 digit hex,
 * 5 quick-pick preset swatches, and a Reset button reverting to the theme preset default.
 */
export function AccentPicker({
  customAccent,
  effectiveAccent,
  onChange,
  onReset,
}: AccentPickerProps) {
  const [draft, setDraft] = useState(customAccent ?? effectiveAccent);

  useEffect(() => {
    setDraft(customAccent ?? effectiveAccent);
  }, [customAccent, effectiveAccent]);

  const isValid = HEX_PATTERN.test(draft);

  const commitIfValid = (value: string) => {
    if (HEX_PATTERN.test(value)) {
      onChange(value.toUpperCase());
    }
  };

  const handleHexInput = (raw: string) => {
    const digits = raw.replace(/^#/, '').replace(/[^0-9A-Fa-f]/g, '');
    const value = `#${digits}`.slice(0, 7).toUpperCase();
    setDraft(value);
    commitIfValid(value);
  };

  const handleColorInput = (hex: string) => {
    const value = hex.toUpperCase();
    setDraft(value);
    onChange(value);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <label className="relative h-7 w-7 rounded-full border border-[var(--bt-border)] shrink-0 cursor-pointer overflow-hidden">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: isValid ? draft : effectiveAccent }}
          />
          <input
            type="color"
            value={isValid ? draft : effectiveAccent}
            onChange={(e) => handleColorInput(e.target.value)}
            aria-label="Choose a custom accent color"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>

        <input
          type="text"
          value={draft}
          onChange={(e) => handleHexInput(e.target.value)}
          placeholder="#1D9BF0"
          maxLength={7}
          aria-label="Custom accent hex color"
          className={`w-[100px] h-8 px-2 rounded-[6px] font-mono text-[14px] bg-[var(--bt-surface)] border text-[var(--bt-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bt-accent)] focus-visible:ring-offset-2 ${
            isValid ? 'border-[var(--bt-border)]' : 'border-[var(--bt-destructive)]'
          }`}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onReset}
              className="ml-auto inline-flex items-center gap-1 text-[12px] text-[var(--bt-accent)] hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bt-accent)] focus-visible:ring-offset-2 rounded-[4px] px-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={8}
            className="max-w-[220px] bg-[var(--bt-surface)] text-[var(--bt-fg)] border border-[var(--bt-border)] rounded-[8px] p-2 text-[13px] font-normal leading-[18.2px] shadow-sm z-50"
          >
            <p>Reverts to the theme preset&apos;s default accent color.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {!isValid && (
        <p className="mt-1.5 text-[12px] text-[var(--bt-destructive)]">
          Enter a valid 3 or 6 digit hex code
        </p>
      )}

      <div className="flex items-center gap-2 mt-3">
        {PRESET_SWATCHES.map((swatch) => (
          <button
            key={swatch.hex}
            type="button"
            onClick={() => handleColorInput(swatch.hex)}
            aria-label={swatch.label}
            title={swatch.label}
            className="h-5 w-5 rounded-full border border-[var(--bt-border)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bt-accent)] focus-visible:ring-offset-2 shrink-0"
            style={{ backgroundColor: swatch.hex }}
          />
        ))}
      </div>
    </div>
  );
}
