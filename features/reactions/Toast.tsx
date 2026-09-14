/**
 * Discreet Fallback Notification Toast
 *
 * Implements D-08 and REACT-03 fallback notification:
 * Injected inside the shadow root container when DraftJS reply composer
 * fails to mount within 1000ms or replies are restricted.
 * Copies emoji to clipboard and displays:
 * "Replies unavailable — emoji copied to clipboard"
 */

import React, { useEffect } from 'react';
import { ClipboardCheck, X } from 'lucide-react';
import { TOAST_AUTO_DISMISS_MS } from './constants';

export interface ToastProps {
  message?: string;
  onDismiss: () => void;
  durationMs?: number;
}

export function ReactionToast({
  message = 'Replies unavailable — emoji copied to clipboard',
  onDismiss,
  durationMs = TOAST_AUTO_DISMISS_MS,
}: ToastProps) {
  useEffect(() => {
    if (durationMs <= 0) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [onDismiss, durationMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed flex items-center gap-2 px-4 py-2 h-[40px] min-w-[280px] rounded-full border shadow-xl backdrop-blur-md text-[15px] font-normal text-[#E7E9EA] select-none z-50 pointer-events-auto"
      style={{
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(15, 20, 25, 0.95)',
        borderColor: 'var(--bt-border, #2F3336)',
      }}
    >
      <ClipboardCheck className="w-[18px] h-[18px] text-[#1D9BF0] flex-shrink-0" />
      <span className="truncate">{message}</span>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
        className="ml-auto flex items-center justify-center p-1 rounded-full text-[#71767B] hover:text-[#E7E9EA] hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
