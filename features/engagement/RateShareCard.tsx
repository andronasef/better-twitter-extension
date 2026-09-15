import React, { useState } from 'react';
import { Star, Share2, Copy, Check, X } from 'lucide-react';
import { getBrowserStoreInfo, type BrowserStoreInfo } from './browser-detect';
import { BetterTwitterLogo } from '@/components/BetterTwitterLogo';

interface RateShareCardProps {
  scheme?: 'light' | 'dark';
  customStoreInfo?: BrowserStoreInfo;
  onRate: () => void;
  onShare: () => void;
  onDismiss: () => void;
}

export function RateShareCard({
  scheme = 'dark',
  customStoreInfo,
  onRate,
  onShare,
  onDismiss,
}: RateShareCardProps) {
  const storeInfo = customStoreInfo || getBrowserStoreInfo();
  const [copied, setCopied] = useState(false);

  const handleRate = () => {
    try {
      window.open(storeInfo.reviewUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // ignore popup blocker if any
    }
    onRate();
  };

  const handleShare = () => {
    try {
      window.open(storeInfo.shareUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // ignore popup blocker if any
    }
    onShare();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeInfo.extensionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const isDark = scheme === 'dark';

  return (
    <div
      role="dialog"
      aria-label="Rate and share Better Twitter"
      className={`w-[320px] rounded-2xl p-4 shadow-2xl transition-all duration-300 font-sans select-none border text-left ${
        isDark
          ? 'bg-[#000000] text-[#E7E9EA] border-[#2F3336] shadow-[0_8px_30px_rgb(0,0,0,0.5)]'
          : 'bg-[#FFFFFF] text-[#0F1419] border-[#EFF3F4] shadow-[0_8px_30px_rgb(0,0,0,0.12)]'
      }`}
    >
      {/* Header with Logo and Close */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <BetterTwitterLogo size={22} className="shrink-0" />
          <span className="text-[14px] font-bold tracking-tight">Better Twitter</span>
          <span
            className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${
              isDark ? 'bg-[#1D9BF0]/20 text-[#1D9BF0]' : 'bg-[#1D9BF0]/10 text-[#1D9BF0]'
            }`}
          >
            Friendly Ask
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss prompt"
          className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isDark ? 'hover:bg-[#181818] text-[#71767B]' : 'hover:bg-[#F7F9F9] text-[#536471]'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body text */}
      <p
        className={`text-[13px] leading-[18px] mb-3.5 ${
          isDark ? 'text-[#71767B]' : 'text-[#536471]'
        }`}
      >
        Enjoying a cleaner X? A quick 5-star rating in the {storeInfo.storeName} or sharing with friends keeps this extension completely free & open-source!
      </p>

      {/* Primary and secondary action buttons */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleRate}
          className="w-full h-9 px-3 bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white text-[13px] font-bold rounded-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-[0.98]"
        >
          <Star className="h-3.5 w-3.5 fill-current" />
          Rate on {storeInfo.storeName}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className={`flex-1 h-8 px-3 text-[12px] font-semibold rounded-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
              isDark
                ? 'border-[#2F3336] bg-[#16181C] hover:bg-[#202327] text-[#E7E9EA]'
                : 'border-[#CFD9DE] bg-[#F7F9F9] hover:bg-[#EFF3F4] text-[#0F1419]'
            }`}
          >
            <Share2 className="h-3.5 w-3.5 text-[#1D9BF0]" />
            Share on X
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            title={copied ? 'Copied link!' : 'Copy extension link'}
            aria-label="Copy extension link"
            className={`h-8 px-2.5 text-[12px] font-medium rounded-full flex items-center justify-center gap-1 transition-colors cursor-pointer border ${
              copied
                ? 'border-[#00BA7C] text-[#00BA7C] bg-[#00BA7C]/10'
                : isDark
                ? 'border-[#2F3336] bg-[#16181C] hover:bg-[#202327] text-[#71767B] hover:text-[#E7E9EA]'
                : 'border-[#CFD9DE] bg-[#F7F9F9] hover:bg-[#EFF3F4] text-[#536471] hover:text-[#0F1419]'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#00BA7C]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Snooze footer */}
      <div className="mt-2.5 flex justify-center">
        <button
          type="button"
          onClick={onDismiss}
          className={`text-[11px] underline-offset-2 hover:underline cursor-pointer transition-colors ${
            isDark ? 'text-[#71767B] hover:text-[#E7E9EA]' : 'text-[#536471] hover:text-[#0F1419]'
          }`}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
