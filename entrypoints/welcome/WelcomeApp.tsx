import React from 'react';
import {
  Pin,
  Shield,
  Bookmark,
  Palette,
  ArrowRight,
  Heart,
  ExternalLink,
} from 'lucide-react';
import {
  X_HOME_URL,
  GITHUB_REPO_URL,
  PRIVACY_POLICY_URL,
  FEATUREBASE_URL,
  PORTFOLIO_URL,
} from '@/lib/lifecycle';

export default function WelcomeApp() {
  return (
    <div className="min-h-screen bg-[#000000] text-[#E7E9EA] flex flex-col items-center justify-between px-6 py-12 md:py-16 selection:bg-[#1D9BF0] selection:text-white font-sans">
      <main className="w-full max-w-2xl space-y-12">
        {/* Header & Status */}
        <header className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-[#16181C] border border-[#2F3336] rounded-2xl shadow-sm">
            <img
              src="/better-twitter-logo.svg"
              alt="Better Twitter"
              className="w-16 h-16 rounded-xl"
            />
          </div>

          <div className="space-y-2 max-w-lg">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Your timeline is clean now.
            </h1>
            <p className="text-[#71767B] text-base leading-relaxed">
              Better Twitter is installed and active. Promoted posts, trends, and algorithmic noise are removed right as you scroll.
            </p>
          </div>
        </header>

        {/* Toolbar Pin Tip */}
        <div className="bg-[#16181C] border border-[#2F3336] rounded-2xl p-6 transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center gap-2 text-[#1D9BF0] font-medium text-sm">
                <Pin className="w-4 h-4" />
                <span>Pin the extension</span>
              </div>
              <p className="text-sm text-[#A4A7AB] leading-relaxed">
                Keep Better Twitter one click away to switch themes (Lights Out, Dracula, Nord), manage bookmark folders, or toggle vanity metrics.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#202327] border border-[#2F3336] rounded-xl px-3.5 py-2.5 text-xs text-[#71767B] shrink-0 font-medium select-none">
              <span>Extensions</span>
              <span>›</span>
              <span className="text-white">Better Twitter</span>
              <span>›</span>
              <span className="text-[#1D9BF0]">Pin</span>
            </div>
          </div>
        </div>

        {/* What to expect / Key highlights */}
        <section className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#16181C]/50 border border-[#2F3336]/60">
            <div className="p-2 rounded-lg bg-[#202327] text-[#1D9BF0] shrink-0 mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">Clean feeds by default</h3>
              <p className="text-xs text-[#71767B] leading-relaxed">
                Ads and sponsored tweets are removed silently. You can also hide 'Who to Follow', trending sidebars, and default directly to your Following tab.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#16181C]/50 border border-[#2F3336]/60">
            <div className="p-2 rounded-lg bg-[#202327] text-[#1D9BF0] shrink-0 mt-0.5">
              <Bookmark className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">Bookmark folders & feed resurfacing</h3>
              <p className="text-xs text-[#71767B] leading-relaxed">
                Organize your saved tweets into folders directly on <code className="text-[#E7E9EA] bg-[#202327] px-1.5 py-0.5 rounded text-[11px]">x.com/bookmarks</code>. Great saves are also resurfaced into your timeline so you never lose them.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#16181C]/50 border border-[#2F3336]/60">
            <div className="p-2 rounded-lg bg-[#202327] text-[#1D9BF0] shrink-0 mt-0.5">
              <Palette className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">Custom themes & quick emoji reactions</h3>
              <p className="text-xs text-[#71767B] leading-relaxed">
                Pick community themes like Dracula, Nord, or Matrix, and long-press the Like button to react with any emoji in one tap.
              </p>
            </div>
          </div>
        </section>

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <a
            href={X_HOME_URL}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white hover:bg-[#E7E9EA] text-black font-semibold px-8 py-3.5 rounded-full transition-all text-sm shadow-sm"
          >
            <span>Open X / Twitter</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#16181C] hover:bg-[#202327] border border-[#2F3336] text-[#E7E9EA] font-medium px-6 py-3.5 rounded-full transition-colors text-sm"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#71767B]" />
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-2xl text-center pt-16 pb-4 space-y-3">
        <p className="flex items-center justify-center gap-1.5 text-xs text-[#71767B]">
          <span>Built with</span>
          <Heart className="w-3.5 h-3.5 text-[#F4212E] fill-[#F4212E]" />
          <span>for a better web. Made with love by</span>
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E7E9EA] hover:text-[#1D9BF0] font-medium underline underline-offset-4 decoration-[#2F3336] hover:decoration-[#1D9BF0] transition-colors"
          >
            Andro Nasef
          </a>
        </p>

        <div className="flex items-center justify-center gap-4 text-xs text-[#71767B]">
          <a
            href={PRIVACY_POLICY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Privacy Policy
          </a>
          <span>•</span>
          <a
            href={FEATUREBASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Feedback & Roadmap
          </a>
          <span>•</span>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Source Code
          </a>
        </div>
      </footer>
    </div>
  );
}
