import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, X, AlertCircle } from 'lucide-react';
import type { CatalogEmoji } from './types';
import { fetchEmojiCatalog, searchEmojiCatalog } from './catalog';

const CATEGORIES = [
  'All',
  'Smileys',
  'Gestures',
  'Animals',
  'Food',
  'Activities',
  'Travel',
  'Objects',
  'Symbols',
];

export interface EmojiCatalogModalProps {
  open: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: CatalogEmoji) => void;
  targetSlotIndex: number;
  currentEmoji: string;
}

export function EmojiCatalogModal({
  open,
  onClose,
  onSelectEmoji,
  targetSlotIndex,
  currentEmoji,
}: EmojiCatalogModalProps) {
  const [catalog, setCatalog] = useState<CatalogEmoji[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const items = await fetchEmojiCatalog();
      setCatalog(items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadCatalog();
    }
  }, [open, loadCatalog]);

  // 150ms debounce for search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredEmojis = useMemo(() => {
    return searchEmojiCatalog(catalog, debouncedQuery, selectedCategory);
  }, [catalog, debouncedQuery, selectedCategory]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose Reaction Emoji"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[320px] h-[384px] max-h-[90vh] rounded-xl bg-[var(--bt-surface)] border border-[var(--bt-border)] shadow-2xl flex flex-col overflow-hidden text-[var(--bt-fg)] font-sans antialiased animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--bt-border)] shrink-0">
          <h2 className="text-[16px] font-bold text-[var(--bt-fg)] leading-none">
            Choose Reaction Emoji
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close emoji browser"
            className="p-1 rounded-full text-[var(--bt-fg-muted)] hover:text-[var(--bt-fg)] hover:bg-[var(--bt-surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-3 pt-2.5 pb-2 shrink-0">
          <div className="relative flex items-center h-10 w-full rounded-full bg-[var(--bt-bg)] border border-[var(--bt-border)] px-3 focus-within:ring-2 focus-within:ring-[var(--bt-accent)] transition-shadow">
            <Search className="w-4 h-4 text-[var(--bt-fg-muted)] shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 800+ emojis..."
              className="w-full bg-transparent text-[13px] text-[var(--bt-fg)] placeholder:text-[var(--bt-fg-muted)] focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="text-[var(--bt-fg-muted)] hover:text-[var(--bt-fg)] p-0.5 ml-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category filter chips */}
        <div className="flex items-center gap-1.5 px-3 pb-2 overflow-x-auto no-scrollbar shrink-0">
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--bt-accent)] text-white'
                    : 'bg-[var(--bt-surface-hover)] text-[var(--bt-fg-muted)] hover:text-[var(--bt-fg)]'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* 40x40px Emoji Grid / State Viewport */}
        <div className="flex-1 overflow-y-auto px-3 py-1 min-h-0">
          {loading ? (
            <div className="grid grid-cols-6 gap-1.5 justify-items-center py-1">
              {Array.from({ length: 18 }).map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-lg bg-[var(--bt-surface-hover)] animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-4 text-center h-full">
              <AlertCircle className="w-8 h-8 text-[var(--bt-destructive)] mb-2" />
              <h3 className="text-[16px] font-bold text-[var(--bt-fg)] mb-1">
                Emoji Catalog Unavailable
              </h3>
              <p className="text-[12px] text-[var(--bt-fg-muted)] leading-relaxed mb-3">
                Unable to load the remote Google Noto emoji catalog. Check your internet
                connection or click &apos;Retry Catalog Fetch&apos;.
              </p>
              <button
                type="button"
                onClick={loadCatalog}
                className="px-3.5 py-1.5 rounded-full bg-[var(--bt-accent)] text-white text-[12px] font-medium hover:opacity-90 cursor-pointer transition-opacity"
              >
                Retry Catalog Fetch
              </button>
            </div>
          ) : filteredEmojis.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-4 text-center h-full">
              <Search className="w-8 h-8 text-[var(--bt-fg-muted)] mb-2 opacity-60" />
              <h3 className="text-[16px] font-bold text-[var(--bt-fg)] mb-1">
                No Emojis Found
              </h3>
              <p className="text-[12px] text-[var(--bt-fg-muted)] leading-relaxed">
                No emojis match &apos;{debouncedQuery}&apos; in {selectedCategory}. Try a different
                keyword, check spelling, or select &apos;All Categories&apos;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-1.5 justify-items-center py-1">
              {filteredEmojis.map((emoji) => (
                <button
                  key={emoji.codepoint}
                  type="button"
                  role="button"
                  aria-label={`Select ${emoji.name} emoji`}
                  onClick={() => {
                    onSelectEmoji(emoji);
                    onClose();
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[var(--bt-surface-hover)] active:scale-95 transition-all text-[22px] select-none cursor-pointer"
                >
                  {emoji.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-3 py-1.5 border-t border-[var(--bt-border)] text-[11px] text-[var(--bt-fg-muted)] truncate bg-[var(--bt-surface)] shrink-0 flex items-center justify-between">
          <span>Slot {targetSlotIndex + 1} Target</span>
          <span>Current: {currentEmoji}</span>
        </div>
      </div>
    </div>
  );
}
