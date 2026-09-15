import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { reactionsSettingsItem, customEmojiCacheItem } from '@/lib/storage';
import {
  DEFAULT_REACTION_SLOTS,
  getTwemojiAssetUrl,
  getNotoAssetUrl,
} from '@/features/reactions/constants';
import { cacheCustomEmoji } from '@/features/reactions/catalog';
import { EmojiCatalogModal } from '@/features/reactions/EmojiCatalogModal';
import type {
  ReactionsSettings,
  ReactionStyle,
  ReactionSlot,
  CustomEmojiCache,
  CatalogEmoji,
} from '@/features/reactions/types';

export function ReactionsPanel() {
  const [settings, setSettings] = useState<ReactionsSettings>({
    enabled: true,
    style: 'twemoji',
    slots: DEFAULT_REACTION_SLOTS,
  });
  const [customCache, setCustomCache] = useState<CustomEmojiCache>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [targetSlotIndex, setTargetSlotIndex] = useState(0);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    void reactionsSettingsItem.getValue().then((val) => {
      if (val) setSettings(val);
    });
    void customEmojiCacheItem.getValue().then((val) => {
      if (val) setCustomCache(val);
    });

    const unwatchSettings = reactionsSettingsItem.watch((val) => {
      if (val) setSettings(val);
    });
    const unwatchCache = customEmojiCacheItem.watch((val) => {
      if (val) setCustomCache(val);
    });

    return () => {
      unwatchSettings();
      unwatchCache();
    };
  }, []);

  const handleStyleChange = async (style: ReactionStyle) => {
    const next: ReactionsSettings = { ...settings, style };
    setSettings(next);
    await reactionsSettingsItem.setValue(next);
  };

  const handleAutoCommentChange = async (checked: boolean) => {
    const next: ReactionsSettings = { ...settings, autoComment: checked };
    setSettings(next);
    await reactionsSettingsItem.setValue(next);
  };

  const handleMoveSlot = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= settings.slots.length) return;
    const nextSlots = [...settings.slots];
    const moved = nextSlots[fromIndex];
    if (!moved) return;
    nextSlots.splice(fromIndex, 1);
    nextSlots.splice(toIndex, 0, moved);

    const next: ReactionsSettings = { ...settings, slots: nextSlots };
    setSettings(next);
    await reactionsSettingsItem.setValue(next);
  };

  const handleOpenModal = (index: number) => {
    setTargetSlotIndex(index);
    setModalOpen(true);
  };

  const handleSelectEmoji = async (emoji: CatalogEmoji) => {
    const nextSlots = [...settings.slots];
    const existing = nextSlots[targetSlotIndex];
    nextSlots[targetSlotIndex] = {
      id: emoji.codepoint,
      emoji: emoji.emoji,
      label: emoji.name.split(' ')[0] || existing?.label || 'Emoji',
      twemojiCodepoint: emoji.codepoint,
      notoCodepoint: emoji.codepoint,
      isCustom: true,
    };

    const next: ReactionsSettings = { ...settings, slots: nextSlots };
    setSettings(next);
    await reactionsSettingsItem.setValue(next);

    void cacheCustomEmoji(emoji.codepoint);
  };

  const handleConfirmReset = async () => {
    const next: ReactionsSettings = { ...settings, slots: DEFAULT_REACTION_SLOTS };
    setSettings(next);
    await reactionsSettingsItem.setValue(next);
    setResetConfirmOpen(false);
  };

  const handleClearCache = async () => {
    await customEmojiCacheItem.setValue({});
    setCustomCache({});
  };

  const cacheJson = JSON.stringify(customCache);
  const cacheBytes = cacheJson.length;
  const isQuotaExceeded = cacheBytes > 4 * 1024 * 1024; // 4MB warning

  const renderSlotEmoji = (slot: ReactionSlot) => {
    if (settings.style === 'normal') {
      return <span className="text-[20px] select-none leading-none">{slot.emoji}</span>;
    }

    if (settings.style === 'twemoji') {
      const cached = customCache[slot.twemojiCodepoint]?.twemojiSvg;
      const src = cached || getTwemojiAssetUrl(slot.twemojiCodepoint);
      return (
        <img
          src={src}
          alt={slot.emoji}
          className="w-6 h-6 object-contain select-none pointer-events-none"
        />
      );
    }

    const cachedWebp = customCache[slot.notoCodepoint]?.notoWebp;
    const src = cachedWebp || getNotoAssetUrl(slot.notoCodepoint);
    return (
      <img
        src={src}
        alt={slot.emoji}
        className="w-6 h-6 object-contain select-none pointer-events-none"
      />
    );
  };

  return (
    <div className="view-enter-panel flex flex-col gap-4 pb-4 select-none">
      {/* SECTION 1: EMOJI VISUAL STYLE */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--bt-fg-muted)]">
          EMOJI VISUAL STYLE
        </h2>

        <div className="grid grid-cols-3 gap-2">
          {/* Normal Style */}
          <button
            type="button"
            onClick={() => handleStyleChange('normal')}
            className={`h-[80px] rounded-xl p-2.5 flex flex-col justify-between text-left transition-all relative border cursor-pointer ${
              settings.style === 'normal'
                ? 'border-[2px] border-[var(--bt-accent)] bg-[var(--bt-surface)]'
                : 'border-[var(--bt-border)] hover:bg-[var(--bt-surface-hover)] bg-[var(--bt-surface)]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[12px] font-bold text-[var(--bt-fg)] leading-tight">
                Normal
              </span>
              {settings.style === 'normal' && (
                <span className="h-4 w-4 rounded-full bg-[var(--bt-accent)] flex items-center justify-center text-white">
                  <Check className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
            <span className="text-[16px] leading-none">👍 ❤️</span>
            <span className="text-[9px] text-[var(--bt-fg-muted)] line-clamp-1 leading-none">
              Native OS
            </span>
          </button>

          {/* Twemoji Style */}
          <button
            type="button"
            onClick={() => handleStyleChange('twemoji')}
            className={`h-[80px] rounded-xl p-2.5 flex flex-col justify-between text-left transition-all relative border cursor-pointer ${
              settings.style === 'twemoji'
                ? 'border-[2px] border-[var(--bt-accent)] bg-[var(--bt-surface)]'
                : 'border-[var(--bt-border)] hover:bg-[var(--bt-surface-hover)] bg-[var(--bt-surface)]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[12px] font-bold text-[var(--bt-fg)] leading-tight">
                Twemoji
              </span>
              {settings.style === 'twemoji' && (
                <span className="h-4 w-4 rounded-full bg-[var(--bt-accent)] flex items-center justify-center text-white">
                  <Check className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <img
                src={getTwemojiAssetUrl('1f44d')}
                alt="👍"
                className="w-4 h-4 object-contain"
              />
              <img
                src={getTwemojiAssetUrl('2764')}
                alt="❤️"
                className="w-4 h-4 object-contain"
              />
            </div>
            <span className="text-[9px] text-[var(--bt-fg-muted)] line-clamp-1 leading-none">
              Classic SVGs
            </span>
          </button>

          {/* Animated Noto Style */}
          <button
            type="button"
            onClick={() => handleStyleChange('noto-animated')}
            className={`h-[80px] rounded-xl p-2.5 flex flex-col justify-between text-left transition-all relative border cursor-pointer ${
              settings.style === 'noto-animated'
                ? 'border-[2px] border-[var(--bt-accent)] bg-[var(--bt-surface)]'
                : 'border-[var(--bt-border)] hover:bg-[var(--bt-surface-hover)] bg-[var(--bt-surface)]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[12px] font-bold text-[var(--bt-fg)] leading-tight">
                Animated Noto
              </span>
              {settings.style === 'noto-animated' && (
                <span className="h-4 w-4 rounded-full bg-[var(--bt-accent)] flex items-center justify-center text-white">
                  <Check className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <img
                src={getNotoAssetUrl('1f44d')}
                alt="👍"
                className="w-4 h-4 object-contain"
              />
              <img
                src={getNotoAssetUrl('2764_fe0f')}
                alt="❤️"
                className="w-4 h-4 object-contain"
              />
            </div>
            <span className="text-[9px] text-[var(--bt-fg-muted)] line-clamp-1 leading-none">
              Google WebP
            </span>
          </button>
        </div>
      </section>

      {/* SECTION 2: BEHAVIOR */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--bt-fg-muted)]">
          BEHAVIOR
        </h2>
        <div className="rounded-xl border border-[var(--bt-border)] bg-[var(--bt-surface)] p-3 flex items-center justify-between">
          <div className="flex flex-col pr-2">
            <span className="text-[13px] font-medium text-[var(--bt-fg)] leading-tight">
              Auto-send reply
            </span>
            <span className="text-[11px] text-[var(--bt-fg-muted)] mt-0.5 leading-normal">
              Automatically post reply when a reaction is clicked
            </span>
          </div>
          <Switch
            id="reactions-auto-comment"
            checked={settings.autoComment ?? true}
            onCheckedChange={handleAutoCommentChange}
          />
        </div>
      </section>

      {/* SECTION 3: PALETTE SLOTS (6) */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--bt-fg-muted)]">
          PALETTE SLOTS (6)
        </h2>

        <div className="flex flex-col gap-1.5">
          {settings.slots.map((slot, index) => (
            <div
              key={slot.id || index}
              className="h-[48px] rounded-lg border border-[var(--bt-border)] bg-[var(--bt-surface)] px-3 flex items-center justify-between transition-colors hover:bg-[var(--bt-surface-hover)]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[12px] font-bold text-[var(--bt-fg-muted)] w-3 text-center shrink-0">
                  {index + 1}
                </span>
                <div className="w-7 h-7 flex items-center justify-center shrink-0">
                  {renderSlotEmoji(slot)}
                </div>
                <span className="text-[13px] font-medium text-[var(--bt-fg)] truncate">
                  {slot.label}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMoveSlot(index, index - 1)}
                  aria-label={`Move ${slot.label} slot left`}
                  className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--bt-fg-muted)] hover:text-[var(--bt-fg)] hover:bg-[var(--bt-surface)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={index === settings.slots.length - 1}
                  onClick={() => handleMoveSlot(index, index + 1)}
                  aria-label={`Move ${slot.label} slot right`}
                  className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--bt-fg-muted)] hover:text-[var(--bt-fg)] hover:bg-[var(--bt-surface)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenModal(index)}
                  aria-label={`Change emoji for ${slot.label} slot`}
                  className="h-7 px-2.5 ml-1 flex items-center justify-center rounded-md bg-[var(--bt-bg)] border border-[var(--bt-border)] text-[12px] font-medium text-[var(--bt-fg)] hover:border-[var(--bt-accent)] hover:text-[var(--bt-accent)] cursor-pointer transition-colors"
                >
                  Change
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: RESET ACTIONS */}
      <section className="pt-1 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setResetConfirmOpen(true)}
          aria-label="Reset reaction palette to default slots"
          className="w-full py-2 px-3 text-[12px] font-medium text-[var(--bt-fg-muted)] hover:text-[var(--bt-destructive)] hover:bg-[var(--bt-surface-hover)] rounded-lg transition-colors cursor-pointer text-center"
        >
          Reset to Defaults
        </button>
      </section>

      {/* SECTION 4: STORAGE QUOTA & CACHE CLEARING */}
      {isQuotaExceeded && (
        <div className="p-3 rounded-xl border border-[var(--bt-destructive)]/40 bg-[var(--bt-destructive)]/10 text-[var(--bt-destructive)] flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[12px] leading-relaxed">
              Emoji Storage Full: Local cache limit reached. Click &apos;Clear Cached Emojis&apos; to free storage.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearCache}
            className="self-end px-3 py-1 rounded-full bg-[var(--bt-destructive)] text-white text-[11px] font-medium hover:opacity-90 cursor-pointer"
          >
            Clear Cached Emojis
          </button>
        </div>
      )}

      {/* MODAL: EMOJI CATALOG BROWSER */}
      <EmojiCatalogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelectEmoji={handleSelectEmoji}
        targetSlotIndex={targetSlotIndex}
        currentEmoji={settings.slots[targetSlotIndex]?.emoji || '👍'}
      />

      {/* MODAL: DESTRUCTIVE CONFIRMATION DIALOG */}
      {resetConfirmOpen && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Reset Reactions Palette"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="w-[300px] rounded-xl bg-[var(--bt-surface)] border border-[var(--bt-border)] shadow-2xl p-4 flex flex-col gap-3 font-sans antialiased animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-[16px] font-bold text-[var(--bt-fg)] leading-tight">
              Reset Reactions Palette
            </h3>
            <p className="text-[12px] text-[var(--bt-fg-muted)] leading-relaxed">
              Are you sure you want to reset all 6 reaction slots to the default emoji set (👍, ❤️, 😂, 😮, 😢, 🔥)? Any custom assigned emojis will be replaced.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-[var(--bt-bg)] border border-[var(--bt-border)] text-[var(--bt-fg)] hover:bg-[var(--bt-surface-hover)] cursor-pointer transition-colors"
              >
                Keep Custom Slots
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-[#F4212E] hover:bg-[#E0245E] text-white cursor-pointer transition-colors"
              >
                Reset Default Slots
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
