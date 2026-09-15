import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Tag,
  ArrowRight,
  Heart,
  MessageSquareHeart,
} from 'lucide-react';
import {
  X_HOME_URL,
  GITHUB_REPO_URL,
  PRIVACY_POLICY_URL,
  UNINSTALL_FEEDBACK_URL,
} from '@/lib/lifecycle';

interface ReleaseNote {
  version: string;
  date: string;
  isLatest?: boolean;
  highlights: {
    category: 'Feature' | 'Improvement' | 'Fix';
    title: string;
    description: string;
  }[];
}

const RELEASES: ReleaseNote[] = [
  {
    version: '0.1.0',
    date: 'September 2026',
    isLatest: true,
    highlights: [
      {
        category: 'Feature',
        title: 'Timeline Ad & Promoted Post Stripper',
        description:
          'Continuously purges sponsored posts and promoted accounts before they appear in your feed.',
      },
      {
        category: 'Feature',
        title: 'Custom Themes & Accent Colors',
        description:
          'Native integration for Dracula, Nord, Matrix, and Minimalist themes, with custom accent color picker.',
      },
      {
        category: 'Feature',
        title: 'Twemoji & Animated Emoji Reactions',
        description:
          'Hover or hold Like/Reply to select expressive reactions that seamlessly prefill the native reply composer.',
      },
      {
        category: 'Feature',
        title: 'Local Bookmark Folders & Resurfacing',
        description:
          'Organize bookmarks into color-coded folders directly inside x.com/bookmarks and resurface saved tweets in your feed.',
      },
      {
        category: 'Improvement',
        title: 'Feeds Decluttering',
        description:
          'Swap tabs to start on Following instead of For You, or hide algorithmic tabs and right-hand sidebars completely.',
      },
    ],
  },
];

export default function UpdateApp() {
  const [currentVersion, setCurrentVersion] = useState('0.1.0');

  useEffect(() => {
    if (typeof browser !== 'undefined' && browser.runtime?.getManifest) {
      const v = browser.runtime.getManifest()?.version;
      if (v) setCurrentVersion(v);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] text-[#E7E9EA] font-sans flex flex-col items-center px-4 py-12 md:py-16">
      <div className="w-full max-w-3xl space-y-10">
        {/* Header */}
        <header className="flex flex-col items-center text-center space-y-3">
          <div className="flex items-center gap-3">
            <img
              src="/better-twitter-logo.svg"
              alt="Better Twitter Logo"
              className="w-12 h-12 rounded-xl border border-[#2F3336] bg-[#16181C] p-1.5"
            />
            <div className="inline-flex items-center gap-2 bg-[#1D9BF0]/15 text-[#1D9BF0] border border-[#1D9BF0]/30 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>What's New in v{currentVersion}</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-1">
            Release Notes & Updates
          </h1>
          <p className="text-[#71767B] text-base max-w-lg">
            Stay up to date with the latest features, performance boosts, and fixes in Better Twitter.
          </p>
        </header>

        {/* Releases Timeline */}
        <div className="space-y-8">
          {RELEASES.map((release) => (
            <div
              key={release.version}
              className="bg-[#16181C] border border-[#2F3336] rounded-2xl p-6 md:p-8 space-y-6"
            >
              {/* Release Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#2F3336]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-white">v{release.version}</span>
                  {release.isLatest && (
                    <span className="bg-[#00BA7C]/20 text-[#00BA7C] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      Current Version
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#71767B]">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{release.date}</span>
                </div>
              </div>

              {/* Highlights List */}
              <div className="space-y-4">
                {release.highlights.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3.5">
                    <div className="mt-0.5 shrink-0">
                      {item.category === 'Feature' && (
                        <span className="bg-[#1D9BF0]/15 text-[#1D9BF0] text-[10px] font-semibold px-2 py-0.5 rounded">
                          Feature
                        </span>
                      )}
                      {item.category === 'Improvement' && (
                        <span className="bg-[#7856FF]/15 text-[#7856FF] text-[10px] font-semibold px-2 py-0.5 rounded">
                          Improvement
                        </span>
                      )}
                      {item.category === 'Fix' && (
                        <span className="bg-[#00BA7C]/15 text-[#00BA7C] text-[10px] font-semibold px-2 py-0.5 rounded">
                          Fix
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-white leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#71767B] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Suggestion Banner */}
        <div className="bg-[#16181C]/60 border border-[#2F3336] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-[#7856FF]/15 text-[#7856FF] flex items-center justify-center shrink-0">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Have an idea for Better Twitter?</h4>
              <p className="text-xs text-[#71767B]">
                We build features based on what our community wants to see next.
              </p>
            </div>
          </div>

          <a
            href={UNINSTALL_FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 bg-[#202327] hover:bg-[#272C30] text-white text-xs font-semibold px-4 py-2.5 rounded-lg border border-[#2F3336] transition-colors"
          >
            <span>Suggest Feature</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-[#2F3336]">
          <a
            href={X_HOME_URL}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white font-bold px-8 py-3 rounded-full transition-colors text-sm"
          >
            <span>Go to X / Twitter</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#16181C] hover:bg-[#202327] border border-[#2F3336] text-[#E7E9EA] font-medium px-6 py-3 rounded-full transition-colors text-sm"
          >
            <span>GitHub Repository</span>
          </a>
        </div>

        {/* Footer */}
        <footer className="text-center pt-6 text-xs text-[#71767B] space-y-2">
          <p className="flex items-center justify-center gap-1">
            Better Twitter is open-source and respects your privacy.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href={PRIVACY_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white underline underline-offset-2"
            >
              Privacy Policy
            </a>
            <span>•</span>
            <a
              href={UNINSTALL_FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white underline underline-offset-2"
            >
              Feedback
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
