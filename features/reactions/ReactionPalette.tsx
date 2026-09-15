import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { ReactionSlot, ReactionStyle, CustomEmojiCache } from './types';
import { getReactionEmojiSource } from './constants';

export interface ReactionPaletteProps {
  anchorRect: DOMRect;
  slots: ReactionSlot[];
  style: ReactionStyle;
  customCache: CustomEmojiCache;
  onSelectEmoji: (slot: ReactionSlot) => void;
  onOpenPicker?: () => void;
  isPickerOpen?: boolean;
  onOpenSettings?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isClosing?: boolean;
}

export function ReactionPalette({
  anchorRect,
  slots,
  style,
  customCache,
  onSelectEmoji,
  onOpenPicker,
  isPickerOpen = false,
  onOpenSettings,
  onMouseEnter,
  onMouseLeave,
  isClosing = false,
}: ReactionPaletteProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Viewport-aware positioning
  const paletteWidth = 300;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const rawLeft = anchorRect.left + anchorRect.width / 2 - paletteWidth / 2;
  const left = Math.max(8, Math.min(rawLeft, viewportWidth - paletteWidth - 8));
  const top = anchorRect.top < 64 ? anchorRect.bottom + 8 : anchorRect.top - 56;

  const renderEmojiGlyph = (slot: ReactionSlot) => {
    const src = getReactionEmojiSource(slot, style, customCache);
    if (!src) {
      return (
        <span className="text-[24px] select-none leading-none">
          {slot.emoji}
        </span>
      );
    }
    return (
      <img
        src={src}
        alt={slot.emoji}
        className="w-7 h-7 select-none pointer-events-none object-contain"
      />
    );
  };

  return (
    <div
      role="toolbar"
      aria-label="Reaction palette"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full pointer-events-auto select-none"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        height: '48px',
        backgroundColor: 'color-mix(in srgb, var(--bt-surface) 88%, transparent)',
        border: '1px solid var(--bt-border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transform: isClosing
          ? 'scale(0.85) translateY(6px)'
          : mounted
          ? 'scale(1) translateY(0)'
          : 'scale(0.82) translateY(8px)',
        opacity: isClosing ? 0 : mounted ? 1 : 0,
        transition: isClosing
          ? 'transform 150ms ease-out, opacity 140ms ease-out'
          : 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 180ms ease-out',
      }}
    >
      {slots.map((slot, index) => {
        const isHovered = hoveredIndex === index;
        return (
          <div key={slot.id || index} className="relative flex items-center justify-center">
            {/* Sentiment Tooltip Badge */}
            {isHovered && (
              <div
                role="tooltip"
                aria-hidden="true"
                className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white pointer-events-none whitespace-nowrap shadow-md animate-in fade-in zoom-in-90 duration-100"
                style={{
                  background: 'rgba(0, 0, 0, 0.85)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {slot.label}
              </div>
            )}

            {/* Reaction Slot Button */}
            <button
              type="button"
              role="button"
              aria-label={`React with ${slot.label} (${slot.emoji})`}
              onClick={() => onSelectEmoji(slot)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bt-accent)]"
              style={{
                transform: isHovered ? 'scale(1.4) translateY(-4px)' : 'scale(1) translateY(0)',
                transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                zIndex: isHovered ? 10 : 1,
              }}
            >
              {renderEmojiGlyph(slot)}
            </button>
          </div>
        );
      })}

      {/* Plus (+) React with Any Emoji Button */}
      {(onOpenPicker || onOpenSettings) && (
        <button
          type="button"
          onClick={onOpenPicker || onOpenSettings}
          aria-label="React with more emojis"
          aria-expanded={isPickerOpen}
          className={`w-7 h-7 ml-0.5 flex items-center justify-center rounded-full transition-colors cursor-pointer shrink-0 ${
            isPickerOpen
              ? 'text-[var(--bt-accent)] bg-[var(--bt-surface)] ring-1 ring-[var(--bt-accent)]'
              : 'text-[var(--bt-fg-muted)] hover:text-[var(--bt-accent)] hover:bg-[var(--bt-surface)]'
          }`}
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
