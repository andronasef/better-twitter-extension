import React from 'react';
import {
  ShieldCheck,
  Pin,
  Sliders,
  Palette,
  Smile,
  Bookmark,
  ExternalLink,
  Lock,
  Sparkles,
  Heart,
} from 'lucide-react';
import {
  X_HOME_URL,
  GITHUB_REPO_URL,
  PRIVACY_POLICY_URL,
} from '@/lib/lifecycle';

export default function WelcomeApp() {
  return (
    <div className="min-h-screen bg-[#000000] text-[#E7E9EA] font-sans flex flex-col items-center px-4 py-12 md:py-16">
      <div className="w-full max-w-3xl space-y-10">
        {/* Header */}
        <header className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <img
              src="/better-twitter-logo.svg"
              alt="Better Twitter Logo"
              className="w-20 h-20 rounded-2xl shadow-lg border border-[#2F3336] bg-[#16181C] p-2"
            />
            <span className="absolute -bottom-2 -right-2 bg-[#00BA7C] text-black text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              Active
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-2">
            Welcome to Better Twitter!
          </h1>
          <p className="text-[#71767B] text-base md:text-lg max-w-xl">
            A clean, fast, and respectful Twitter experience. Take control back from algorithms and clutter.
          </p>
        </header>

        {/* Pin Extension Callout Banner */}
        <div className="bg-gradient-to-r from-[#1D9BF0]/15 to-[#1D9BF0]/5 border border-[#1D9BF0]/30 rounded-2xl p-6 md:p-7 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-[#1D9BF0] font-semibold text-sm">
                <Pin className="w-4 h-4" />
                <span>Recommended First Step</span>
              </div>
              <h2 className="text-xl font-bold text-white">Pin Better Twitter to your toolbar</h2>
              <p className="text-[#A4A7AB] text-sm leading-relaxed max-w-lg">
                Pinning the extension ensures you can toggle features, change themes, and access your bookmarks in one click anytime you're browsing.
              </p>
            </div>

            <div className="bg-[#16181C] border border-[#2F3336] rounded-xl p-4 shrink-0 flex items-center gap-3 text-xs text-[#E7E9EA]">
              <div className="flex items-center gap-1.5 bg-[#202327] px-2.5 py-1.5 rounded-lg border border-[#2F3336]">
                <span className="text-[#71767B]">🧩 Extensions</span>
                <span className="text-[#71767B]">→</span>
                <span className="font-semibold text-white">Better Twitter</span>
                <span className="text-[#71767B]">→</span>
                <span className="text-[#1D9BF0] font-bold">📌 Pin</span>
              </div>
            </div>
          </div>
        </div>

        {/* What's already working */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold tracking-wider uppercase text-[#71767B]">
            Features active right now
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#16181C] border border-[#2F3336] rounded-xl p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-[#00BA7C]/15 text-[#00BA7C] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-white">Zero Promoted Tweets</h4>
              <p className="text-sm text-[#71767B] leading-relaxed">
                Ads and sponsored posts are purged from your timeline continuously before they distract you.
              </p>
            </div>

            <div className="bg-[#16181C] border border-[#2F3336] rounded-xl p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-[#1D9BF0]/15 text-[#1D9BF0] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-white">100% Local & Private</h4>
              <p className="text-sm text-[#71767B] leading-relaxed">
                Zero telemetry, zero tracking, zero accounts. Everything stays safely in your browser's local storage.
              </p>
            </div>
          </div>
        </section>

        {/* Customization Highlights */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold tracking-wider uppercase text-[#71767B]">
            Customize in your Settings Popup
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-[#16181C]/60 border border-[#2F3336] rounded-xl p-4 space-y-2 hover:border-[#1D9BF0]/50 transition-colors">
              <Sliders className="w-5 h-5 text-[#1D9BF0]" />
              <h4 className="font-semibold text-sm text-white">Declutter Feeds</h4>
              <p className="text-xs text-[#71767B] leading-relaxed">
                Hide 'Who to Follow', 'What's Happening', and start on Following instead of 'For You'.
              </p>
            </div>

            <div className="bg-[#16181C]/60 border border-[#2F3336] rounded-xl p-4 space-y-2 hover:border-[#F91880]/50 transition-colors">
              <Palette className="w-5 h-5 text-[#F91880]" />
              <h4 className="font-semibold text-sm text-white">Community Themes</h4>
              <p className="text-xs text-[#71767B] leading-relaxed">
                Choose Dracula, Nord, Matrix, or pick custom accent colors for your timeline.
              </p>
            </div>

            <div className="bg-[#16181C]/60 border border-[#2F3336] rounded-xl p-4 space-y-2 hover:border-[#FFD400]/50 transition-colors">
              <Smile className="w-5 h-5 text-[#FFD400]" />
              <h4 className="font-semibold text-sm text-white">Twemoji Reactions</h4>
              <p className="text-xs text-[#71767B] leading-relaxed">
                Hover or hold Like to react with emojis that seamlessly prefill the native reply box.
              </p>
            </div>

            <div className="bg-[#16181C]/60 border border-[#2F3336] rounded-xl p-4 space-y-2 hover:border-[#00BA7C]/50 transition-colors sm:col-span-2 lg:col-span-3">
              <Bookmark className="w-5 h-5 text-[#00BA7C]" />
              <h4 className="font-semibold text-sm text-white">Bookmark Folders & Timeline Resurfacing</h4>
              <p className="text-xs text-[#71767B] leading-relaxed">
                Organize your bookmarks into custom folders directly inside <code className="text-[#E7E9EA] bg-[#202327] px-1 rounded">x.com/bookmarks</code> and have your favorite tweets gently resurfaced in your timeline.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Launch Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-[#2F3336]">
          <a
            href={X_HOME_URL}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white font-bold px-8 py-3.5 rounded-full shadow-md transition-colors text-base"
          >
            <span>Open X / Twitter</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#16181C] hover:bg-[#202327] border border-[#2F3336] text-[#E7E9EA] font-medium px-6 py-3.5 rounded-full transition-colors text-base"
          >
            <span>GitHub Repository</span>
          </a>
        </div>

        {/* Footer */}
        <footer className="text-center pt-6 text-xs text-[#71767B] space-y-2">
          <p className="flex items-center justify-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-[#F4212E] inline" /> for a better web.
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
              href="https://bettertwitter.featurebase.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white underline underline-offset-2"
            >
              Feedback & Suggestions
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
