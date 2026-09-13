import type { ThemeId } from './storage';

/**
 * Master Theme CSS Generator (THEME-01..07, D-09..D-15)
 *
 * Defines the `--bt-theme-*` CSS custom property contract, Dracula / Nord / Matrix /
 * Minimal / Old Twitter aesthetic engines, surface recoloring rules, action icon palettes,
 * typography transforms, and universal custom accent color overrides.
 */

export interface ThemePreset {
  id: ThemeId;
  label: string;
  desc: string;
  bg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
}

const DEFAULT_ACCENT = '#1d9bf0';

export const THEME_PRESETS: Record<ThemeId, ThemePreset> = {
  default: {
    id: 'default',
    label: 'Default',
    desc: 'Standard X appearance',
    bg: '',
    surface: '',
    surfaceHover: '',
    border: '',
    text: '',
    textMuted: '',
    accent: DEFAULT_ACCENT,
  },
  dracula: {
    id: 'dracula',
    label: 'Dracula',
    desc: 'Dark vampire purple',
    bg: '#282a36',
    surface: '#343746',
    surfaceHover: '#44475a',
    border: '#44475a',
    text: '#f8f8f2',
    textMuted: '#6272a4',
    accent: '#bd93f9',
  },
  nord: {
    id: 'nord',
    label: 'Nord',
    desc: 'Arctic blue and gray',
    bg: '#2e3440',
    surface: '#3b4252',
    surfaceHover: '#434c5e',
    border: '#4c566a',
    text: '#eceff4',
    textMuted: '#d8dee9',
    accent: '#88c0d0',
  },
  matrix: {
    id: 'matrix',
    label: 'Matrix',
    desc: 'Hacker green terminal',
    bg: '#000000',
    surface: '#0a140a',
    surfaceHover: '#0f240f',
    border: '#003b00',
    text: '#00ff66',
    textMuted: '#008f11',
    accent: '#00ff66',
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    desc: 'Zen editorial & distraction-free',
    bg: '#08090a',
    surface: '#0e1015',
    surfaceHover: '#151820',
    border: '#1c2028',
    text: '#f3f4f6',
    textMuted: '#6b7280',
    accent: '#f3f4f6',
  },
  'old-twitter': {
    id: 'old-twitter',
    label: 'Old Twitter',
    desc: 'Classic 2015 desktop',
    bg: '#E6ECF0',
    surface: '#FFFFFF',
    surfaceHover: '#F5F8FA',
    border: '#E1E8ED',
    text: '#14171A',
    textMuted: '#657786',
    accent: '#1DA1F2',
  },
};

const COLOR_ENGINE_THEME_IDS: ThemeId[] = ['dracula', 'nord', 'matrix', 'minimal'];

const ROOT_TOKENS = `
:root {
  --bt-theme-bg: #000000;
  --bt-theme-surface: #16181c;
  --bt-theme-surface-hover: #1e2025;
  --bt-theme-border: #2f3336;
  --bt-theme-text: #e7e9ea;
  --bt-theme-text-muted: #71767b;
  --bt-theme-accent: ${DEFAULT_ACCENT};
}
`;

function presetTokenBlock(preset: ThemePreset): string {
  return `
html[data-bt-theme="${preset.id}"] {
  --bt-theme-bg: ${preset.bg} !important;
  --bt-theme-surface: ${preset.surface} !important;
  --bt-theme-surface-hover: ${preset.surfaceHover} !important;
  --bt-theme-border: ${preset.border} !important;
  --bt-theme-text: ${preset.text} !important;
  --bt-theme-text-muted: ${preset.textMuted} !important;
  --bt-theme-accent: ${preset.accent} !important;
}
`;
}

const THEME_PRESET_TOKEN_BLOCKS = COLOR_ENGINE_THEME_IDS.map((id) =>
  presetTokenBlock(THEME_PRESETS[id])
).join('');

const PRIMARY_CONTAINER_SELECTORS = [
  '[data-testid="primaryColumn"]',
  '[data-testid="primaryColumn"] > div',
  '[data-testid="sidebarColumn"]',
  'header[role="banner"]',
  'main[role="main"]',
  '[data-testid="tweet"]',
  '[data-testid="cellInnerDiv"]',
  'article[data-testid="tweet"]',
];

const htmlBgSelector = COLOR_ENGINE_THEME_IDS.map((id) => `html[data-bt-theme="${id}"]`).join(
  ',\n'
);
const bodyRootSelector = COLOR_ENGINE_THEME_IDS.flatMap((id) => [
  `html[data-bt-theme="${id}"] body`,
  `html[data-bt-theme="${id}"] #react-root`,
  `html[data-bt-theme="${id}"] #react-root > div`,
  `html[data-bt-theme="${id}"] #react-root > div > div`,
  `html[data-bt-theme="${id}"] #react-root > div > div > div`,
]).join(',\n');
const primaryContainerSelector = COLOR_ENGINE_THEME_IDS.flatMap((id) =>
  PRIMARY_CONTAINER_SELECTORS.map((sel) => `html[data-bt-theme="${id}"] ${sel}`)
).join(',\n');

/**
 * Surface recoloring & atmospheric vibe styling (Dracula, Nord, Matrix)
 */
export const APPLY_SURFACE_RULES = `
${htmlBgSelector} {
  background-color: var(--bt-theme-bg) !important;
}

${bodyRootSelector} {
  background-color: var(--bt-theme-bg) !important;
  color: var(--bt-theme-text) !important;
}

${primaryContainerSelector} {
  background-color: var(--bt-theme-surface) !important;
  border-color: var(--bt-theme-border) !important;
}

/* ========================================================
   DRACULA VIBE: Cyber Vampiric Glow & Neon Pastels
   ======================================================== */
html[data-bt-theme="dracula"] [data-testid="primaryColumn"] section,
html[data-bt-theme="dracula"] [data-testid="primaryColumn"] section > div,
html[data-bt-theme="dracula"] [data-testid="cellInnerDiv"],
html[data-bt-theme="dracula"] article[data-testid="tweet"],
html[data-bt-theme="dracula"] [data-testid="ScrollSnap-List"],
html[data-bt-theme="dracula"] div[aria-label*="Timeline"] {
  background-color: #343746 !important;
  border-color: #44475a !important;
}

html[data-bt-theme="dracula"] div[data-testid="primaryColumn"] > div > div:first-child {
  background-color: rgba(40, 42, 54, 0.85) !important;
  backdrop-filter: blur(12px) !important;
  border-bottom: 1px solid #44475a !important;
}

html[data-bt-theme="dracula"] article[data-testid="tweet"] {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
  border-radius: 8px !important;
  border: 1px solid #44475a !important;
  margin-bottom: 6px !important;
}

html[data-bt-theme="dracula"] article[data-testid="tweet"] [dir="auto"] {
  color: #f8f8f2 !important;
}

/* Dracula Tweet Card Hover Glow */
html[data-bt-theme="dracula"] article[data-testid="tweet"]:hover {
  border-color: #bd93f9 !important;
  box-shadow: 0 4px 16px rgba(189, 147, 249, 0.25) !important;
}

html[data-bt-theme="dracula"] [data-testid="retweet"] svg,
html[data-bt-theme="dracula"] [data-testid="unretweet"] svg {
  color: #50fa7b !important;
}
html[data-bt-theme="dracula"] [data-testid="like"] svg,
html[data-bt-theme="dracula"] [data-testid="unlike"] svg {
  color: #ff79c6 !important;
}
html[data-bt-theme="dracula"] [data-testid="reply"] svg {
  color: #8be9fd !important;
}
html[data-bt-theme="dracula"] [data-testid="bookmark"] svg {
  color: #ffb86c !important;
}

/* ========================================================
   NORD VIBE: Arctic Cold Aurora & Frosted Glass
   ======================================================== */
html[data-bt-theme="nord"] [data-testid="primaryColumn"] section,
html[data-bt-theme="nord"] [data-testid="primaryColumn"] section > div,
html[data-bt-theme="nord"] [data-testid="cellInnerDiv"],
html[data-bt-theme="nord"] article[data-testid="tweet"],
html[data-bt-theme="nord"] [data-testid="ScrollSnap-List"],
html[data-bt-theme="nord"] div[aria-label*="Timeline"] {
  background-color: #3b4252 !important;
  border-color: #4c566a !important;
}

html[data-bt-theme="nord"] div[data-testid="primaryColumn"] > div > div:first-child {
  background-color: rgba(46, 52, 64, 0.85) !important;
  backdrop-filter: blur(16px) !important;
  border-bottom: 1px solid #4c566a !important;
}

html[data-bt-theme="nord"] article[data-testid="tweet"] {
  border-radius: 8px !important;
  border: 1px solid #4c566a !important;
  margin-bottom: 6px !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25) !important;
}

html[data-bt-theme="nord"] article[data-testid="tweet"]:hover {
  border-color: #88c0d0 !important;
  box-shadow: 0 4px 16px rgba(136, 192, 208, 0.2) !important;
}

html[data-bt-theme="nord"] article[data-testid="tweet"] [dir="auto"] {
  color: #eceff4 !important;
}

/* Nord Action Icons: Aurora Palette */
html[data-bt-theme="nord"] [data-testid="retweet"] svg,
html[data-bt-theme="nord"] [data-testid="unretweet"] svg {
  color: #a3be8c !important;
}
html[data-bt-theme="nord"] [data-testid="like"] svg,
html[data-bt-theme="nord"] [data-testid="unlike"] svg {
  color: #bf616a !important;
}
html[data-bt-theme="nord"] [data-testid="reply"] svg {
  color: #88c0d0 !important;
}
html[data-bt-theme="nord"] [data-testid="bookmark"] svg {
  color: #ebcb8b !important;
}

/* ========================================================
   MATRIX VIBE: Terminal Monospace Hacker Phosphor
   ======================================================== */
html[data-bt-theme="matrix"] * {
  font-family: ui-monospace, "SF Mono", "Cascadia Code", "Fira Code", "Courier New", monospace !important;
}

html[data-bt-theme="matrix"] [data-testid="primaryColumn"] section,
html[data-bt-theme="matrix"] [data-testid="primaryColumn"] section > div,
html[data-bt-theme="matrix"] [data-testid="cellInnerDiv"],
html[data-bt-theme="matrix"] article[data-testid="tweet"],
html[data-bt-theme="matrix"] [data-testid="ScrollSnap-List"],
html[data-bt-theme="matrix"] div[aria-label*="Timeline"] {
  background-color: #0a140a !important;
  border-color: #003b00 !important;
}

html[data-bt-theme="matrix"] div[data-testid="primaryColumn"] > div > div:first-child {
  background-color: rgba(0, 0, 0, 0.9) !important;
  backdrop-filter: blur(12px) !important;
  border-bottom: 1px solid #003b00 !important;
}

html[data-bt-theme="matrix"] article[data-testid="tweet"] {
  border-radius: 2px !important;
  border: 1px solid #003b00 !important;
  margin-bottom: 4px !important;
  background-color: #0a140a !important;
}

html[data-bt-theme="matrix"] article[data-testid="tweet"]:hover {
  border-color: #00ff66 !important;
  box-shadow: 0 0 10px rgba(0, 255, 102, 0.3) !important;
}

html[data-bt-theme="matrix"] article[data-testid="tweet"] [dir="auto"] {
  color: #00ff66 !important;
  text-shadow: 0 0 5px rgba(0, 255, 102, 0.3) !important;
}

html[data-bt-theme="matrix"] [data-testid="Tweet-User-Avatar"] img,
html[data-bt-theme="matrix"] [data-testid="Tweet-User-Avatar"] div,
html[data-bt-theme="matrix"] [data-testid="UserAvatar-Container"] {
  border-radius: 2px !important;
}

html[data-bt-theme="matrix"] [data-testid="retweet"] svg,
html[data-bt-theme="matrix"] [data-testid="unretweet"] svg,
html[data-bt-theme="matrix"] [data-testid="like"] svg,
html[data-bt-theme="matrix"] [data-testid="unlike"] svg,
html[data-bt-theme="matrix"] [data-testid="reply"] svg,
html[data-bt-theme="matrix"] [data-testid="bookmark"] svg {
  color: #00ff66 !important;
  fill: #00ff66 !important;
}

/* ========================================================
   MINIMAL VIBE: Zen Editorial Distraction-Free
   ======================================================== */
html[data-bt-theme="minimal"] [data-testid="primaryColumn"] section,
html[data-bt-theme="minimal"] [data-testid="primaryColumn"] section > div,
html[data-bt-theme="minimal"] [data-testid="cellInnerDiv"],
html[data-bt-theme="minimal"] article[data-testid="tweet"],
html[data-bt-theme="minimal"] [data-testid="ScrollSnap-List"],
html[data-bt-theme="minimal"] div[aria-label*="Timeline"] {
  background-color: #0e1015 !important;
  border-color: #1c2028 !important;
}

html[data-bt-theme="minimal"] div[data-testid="primaryColumn"] > div > div:first-child {
  background-color: rgba(14, 16, 21, 0.88) !important;
  backdrop-filter: blur(16px) !important;
  border-bottom: 1px solid #1c2028 !important;
}

html[data-bt-theme="minimal"] article[data-testid="tweet"] {
  background-color: #0e1015 !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  border-radius: 12px !important;
  margin-bottom: 8px !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
}

html[data-bt-theme="minimal"] article[data-testid="tweet"]:hover {
  border-color: rgba(255, 255, 255, 0.12) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
}

/* Relaxed Editorial Typography */
html[data-bt-theme="minimal"] article[data-testid="tweet"] [dir="auto"] {
  color: #f3f4f6 !important;
  line-height: 1.65 !important;
  letter-spacing: 0.01em !important;
}

/* Zen Action Icons: Dimmed on idle, illuminate smoothly on tweet hover */
html[data-bt-theme="minimal"] article[data-testid="tweet"] [role="group"] {
  opacity: 0.55;
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

html[data-bt-theme="minimal"] article[data-testid="tweet"]:hover [role="group"],
html[data-bt-theme="minimal"] article[data-testid="tweet"] [role="group"]:hover {
  opacity: 1 !important;
}

/* Minimal Action Icon hover colors */
html[data-bt-theme="minimal"] [data-testid="retweet"]:hover svg,
html[data-bt-theme="minimal"] [data-testid="unretweet"]:hover svg {
  color: #34d399 !important;
}
html[data-bt-theme="minimal"] [data-testid="like"]:hover svg,
html[data-bt-theme="minimal"] [data-testid="unlike"]:hover svg {
  color: #f43f5e !important;
}
html[data-bt-theme="minimal"] [data-testid="reply"]:hover svg {
  color: #38bdf8 !important;
}
html[data-bt-theme="minimal"] [data-testid="bookmark"]:hover svg {
  color: #fbbf24 !important;
}

/* Sleek frosted glass navigation pill for Minimal Left Rail */
html[data-bt-theme="minimal"] header[role="banner"] nav {
  background: rgba(14, 16, 21, 0.75) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 32px !important;
  padding: 8px 4px !important;
  margin: 4px auto !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35) !important;
}

/* Suppress native separators and stray divider lines in Minimal mode */
html[data-bt-theme="minimal"] [role="separator"],
html[data-bt-theme="minimal"] hr {
  display: none !important;
}
`;

const ACCENT_OVERRIDE_RULES = `
[style*="color: rgb(29, 155, 240)"],
[style*="color:rgb(29,155,240)"] {
  color: var(--bt-theme-accent) !important;
}
[style*="background-color: rgb(29, 155, 240)"],
[style*="background-color:rgb(29,155,240)"] {
  background-color: var(--bt-theme-accent) !important;
}
[style*="border-color: rgb(29, 155, 240)"],
[style*="border-color:rgb(29,155,240)"] {
  border-color: var(--bt-theme-accent) !important;
}
svg [fill="rgb(29, 155, 240)"],
svg [fill="#1d9bf0" i] {
  fill: var(--bt-theme-accent) !important;
}
`;

/**
 * Minimal Layout Transform Rules (THEME-05, D-14)
 * Collapses navigation to a clean 68px icon rail with all SVG icons intact,
 * centers timeline at 650px without horizontal/vertical split overflow,
 * and hides the right sidebar column and floating distractions.
 */
export const MINIMAL_LAYOUT_CSS = `
/* Hide sidebar column completely */
html[data-bt-theme="minimal"] div[data-testid="sidebarColumn"] {
  display: none !important;
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  flex: 0 0 0 !important;
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* Hide complementary sidebar wrappers */
html[data-bt-theme="minimal"] [role="complementary"] {
  display: none !important;
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  flex: 0 0 0 !important;
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* Center outer flex layout with zero gap blowout */
html[data-bt-theme="minimal"] #react-root > div > div > div.app-row,
html[data-bt-theme="minimal"] #react-root > div > div > div {
  width: 100% !important;
  max-width: 100% !important;
  justify-content: center !important;
  display: flex !important;
  flex-direction: row !important;
}

/* Left rail dock: collapse wrapper and header to 68px flush */
html[data-bt-theme="minimal"] #react-root > div > div > div > div:has(header[role="banner"]),
html[data-bt-theme="minimal"] #react-root > div > div > div > header[role="banner"],
html[data-bt-theme="minimal"] .header-wrapper {
  flex-grow: 0 !important;
  flex-shrink: 0 !important;
  width: 68px !important;
  max-width: 68px !important;
  min-width: 68px !important;
  align-items: center !important;
}

html[data-bt-theme="minimal"] header[role="banner"] {
  width: 68px !important;
  min-width: 68px !important;
  max-width: 68px !important;
  flex-grow: 0 !important;
  flex-shrink: 0 !important;
  align-items: center !important;
  border-right: none !important;
  padding: 16px 0 !important;
  overflow: visible !important;
}

/* X makes this wrapper position:fixed, so width:100% resolves against the VIEWPORT,
   not the 68px rail - that is what painted a full-width horizontal scrollbar across
   the page and a stray vertical one over the timeline. Pin it to the rail instead.
   justify-content:center keeps the pill off the viewport top/bottom edges. */
html[data-bt-theme="minimal"] header[role="banner"] > div {
  width: 68px !important;
  min-width: 68px !important;
  max-width: 68px !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 8px 0 !important;
  overflow: hidden !important;
}

html[data-bt-theme="minimal"] header[role="banner"] > div > div {
  width: 100% !important;
  align-items: center !important;
  justify-content: center !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
}

/* No scrollbar anywhere in the rail subtree - the overflowing node is not always
   the one we style, so cover the whole subtree. */
html[data-bt-theme="minimal"] header[role="banner"],
html[data-bt-theme="minimal"] header[role="banner"] * {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

html[data-bt-theme="minimal"] header[role="banner"]::-webkit-scrollbar,
html[data-bt-theme="minimal"] header[role="banner"] *::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  display: none !important;
}

html[data-bt-theme="minimal"] header[role="banner"] > div > div > div {
  width: 100% !important;
  align-items: center !important;
  justify-content: flex-start !important;
}

/* Minimal X Logo icon sizing and spacing */
html[data-bt-theme="minimal"] header[role="banner"] h1 {
  width: 44px !important;
  height: 44px !important;
  margin: 0 auto 6px auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

html[data-bt-theme="minimal"] header[role="banner"] h1 a {
  width: 44px !important;
  height: 44px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 9999px !important;
  padding: 0 !important;
}

html[data-bt-theme="minimal"] header[role="banner"] nav {
  width: 100% !important;
  align-items: center !important;
  margin-top: 0 !important;
}

html[data-bt-theme="minimal"] header[role="banner"] nav a span,
html[data-bt-theme="minimal"] header[role="banner"] nav [role="button"] span {
  display: none !important;
}

html[data-bt-theme="minimal"] header[role="banner"] nav a,
html[data-bt-theme="minimal"] header[role="banner"] nav [role="button"] {
  width: 44px !important;
  height: 44px !important;
  padding: 0 !important;
  margin: 2px auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 9999px !important;
  transition: background-color 0.15s ease, transform 0.15s ease !important;
}

html[data-bt-theme="minimal"] header[role="banner"] nav a:hover,
html[data-bt-theme="minimal"] header[role="banner"] nav [role="button"]:hover {
  transform: scale(1.06) !important;
}

html[data-bt-theme="minimal"] header[role="banner"] nav a svg,
html[data-bt-theme="minimal"] header[role="banner"] nav [role="button"] svg {
  display: block !important;
  width: 26px !important;
  height: 26px !important;
  margin: 0 auto !important;
}

/* Main column: fixed 650px, zero flex shrink, centered right next to rail */
html[data-bt-theme="minimal"] main[role="main"] {
  display: flex !important;
  justify-content: center !important;
  width: 650px !important;
  max-width: 650px !important;
  min-width: 650px !important;
  flex-grow: 0 !important;
  flex-shrink: 0 !important;
  margin: 0 0 0 16px !important;
  overflow: visible !important;
}

html[data-bt-theme="minimal"] main[role="main"] > div {
  width: 100% !important;
  max-width: 100% !important;
  justify-content: center !important;
  overflow: visible !important;
}

html[data-bt-theme="minimal"] div[data-testid="primaryColumn"] {
  margin: 0 auto !important;
  max-width: 650px !important;
  width: 100% !important;
  border-left: 1px solid var(--bt-theme-border) !important;
  border-right: 1px solid var(--bt-theme-border) !important;
  overflow: visible !important;
}

html[data-bt-theme="minimal"] div[data-testid="primaryColumn"] > div {
  max-width: 100% !important;
  width: 100% !important;
  overflow: visible !important;
}

/* Collapse Post button to 50x50 round circle button */
html[data-bt-theme="minimal"] [data-testid="SideNav_NewTweet_Button"] {
  width: 44px !important;
  height: 44px !important;
  min-width: 44px !important;
  padding: 0 !important;
  margin: 8px auto !important;
  border-radius: 9999px !important;
  justify-content: center !important;
  align-items: center !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
  transition: transform 0.15s ease !important;
}

html[data-bt-theme="minimal"] [data-testid="SideNav_NewTweet_Button"]:hover {
  transform: scale(1.08) !important;
}

html[data-bt-theme="minimal"] [data-testid="SideNav_NewTweet_Button"] span {
  display: none !important;
}

html[data-bt-theme="minimal"] [data-testid="SideNav_NewTweet_Button"] svg {
  display: block !important;
  margin: 0 auto !important;
}

/* Collapse Account Switcher to avatar-only */
html[data-bt-theme="minimal"] [data-testid="SideNav_AccountSwitcher_Button"] {
  width: 44px !important;
  height: 44px !important;
  padding: 0 !important;
  margin: 8px auto !important;
  justify-content: center !important;
  align-items: center !important;
}

html[data-bt-theme="minimal"] [data-testid="SideNav_AccountSwitcher_Button"] > div:not(:first-child) {
  display: none !important;
}

/* Hide floating action buttons (DM drawer, Grok floating) in Minimal mode */
html[data-bt-theme="minimal"] div[data-testid="DMDrawer"],
html[data-bt-theme="minimal"] div[data-testid="floatingActionButton"] {
  display: none !important;
}
`;

const LAYOUT_TOKEN_ONLY_THEME_IDS: ThemeId[] = ['old-twitter'];

const LAYOUT_PRESET_TOKEN_BLOCKS = LAYOUT_TOKEN_ONLY_THEME_IDS.map((id) =>
  presetTokenBlock(THEME_PRESETS[id])
).join('');

/**
 * Old Twitter 2015 Classic Layout Transform Rules (THEME-06, D-15)
 * Authentic 2015 desktop: 46px top navbar, 3-column desktop layout (290px / 590px / 290px),
 * discrete bordered tweet cards with 5px radius, 4px rounded-square avatars, and dark text.
 */
export const OLD_TWITTER_LAYOUT_CSS = `
html[data-bt-theme="old-twitter"],
html[data-bt-theme="old-twitter"] body {
  background-color: #e6ecf0 !important;
  overflow-x: hidden !important;
}

html[data-bt-theme="old-twitter"] body {
  padding-top: 54px !important;
}

/* Native header keeps fixed 46px 100% top banner contract, but rendered invisible
   in favor of the authentic OldTwitterNavbar component */
html[data-bt-theme="old-twitter"] header[role="banner"] {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 46px !important;
  opacity: 0 !important;
  pointer-events: none !important;
  z-index: -1 !important;
}

html[data-bt-theme="old-twitter"] main[role="main"] {
  padding-top: 10px !important;
  display: flex !important;
  justify-content: center !important;
  background-color: #e6ecf0 !important;
  width: 100% !important;
}

/* Discrete tweet cards: classic 2015 white cards with 1px border and 5px radius */
html[data-bt-theme="old-twitter"] article[data-testid="tweet"] {
  background-color: #ffffff !important;
  border: 1px solid #e1e8ed !important;
  border-radius: 5px !important;
  margin-bottom: 10px !important;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05) !important;
}

/* Force dark text on white cards for Old Twitter so text is always high contrast */
html[data-bt-theme="old-twitter"] [data-testid="primaryColumn"],
html[data-bt-theme="old-twitter"] [data-testid="cellInnerDiv"],
html[data-bt-theme="old-twitter"] article[data-testid="tweet"],
html[data-bt-theme="old-twitter"] article[data-testid="tweet"] [dir="auto"],
html[data-bt-theme="old-twitter"] article[data-testid="tweet"] span,
html[data-bt-theme="old-twitter"] article[data-testid="tweet"] div {
  color: #14171a !important;
}

html[data-bt-theme="old-twitter"] article[data-testid="tweet"] a {
  color: #1da1f2 !important;
}

html[data-bt-theme="old-twitter"] article[data-testid="tweet"] time,
html[data-bt-theme="old-twitter"] article[data-testid="tweet"] [data-testid="User-Name"] span:not(:first-child) {
  color: #657786 !important;
}

html[data-bt-theme="old-twitter"] article[data-testid="tweet"] svg {
  color: #657786 !important;
  fill: #657786 !important;
}

/* Classic square avatars with 4px border-radius */
html[data-bt-theme="old-twitter"] [data-testid="Tweet-User-Avatar"] img,
html[data-bt-theme="old-twitter"] [data-testid="Tweet-User-Avatar"] div,
html[data-bt-theme="old-twitter"] [data-testid="UserAvatar-Container"],
html[data-bt-theme="old-twitter"] article[data-testid="tweet"] img[src*="profile_images"] {
  border-radius: 4px !important;
}

/* 3-column classic proportions: left mini profile card ~290px, center timeline ~590px, right sidebar ~290px */
html[data-bt-theme="old-twitter"]:not([data-bt-page="messages"]) div[data-testid="primaryColumn"] {
  max-width: 590px !important;
  width: 590px !important;
  background-color: transparent !important;
  border: none !important;
}

html[data-bt-theme="old-twitter"][data-bt-page="messages"] div[data-testid="primaryColumn"] {
  max-width: none !important;
  width: auto !important;
  background-color: #ffffff !important;
  border-right: 1px solid #e1e8ed !important;
}

html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] {
  max-width: 290px !important;
  width: 290px !important;
  margin-left: 15px !important;
}

/* Sticky feed header & Notifications bar transformed into classic white containers */
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] > div > div:first-child,
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] > div > div:first-child div,
html[data-bt-theme="old-twitter"] div[data-testid="ScrollSnap-List"],
html[data-bt-theme="old-twitter"] div[data-testid="TopNavBar"],
html[data-bt-theme="old-twitter"] div[data-testid="TopNavBar"] div,
html[data-bt-theme="old-twitter"] nav[aria-label*="Timeline"],
html[data-bt-theme="old-twitter"] nav[aria-label*="Timeline"] div,
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] div[style*="position: sticky"],
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] div[style*="position: sticky"] div,
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] div[style*="backdrop-filter"],
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] div[style*="backdrop-filter"] div {
  background-color: #ffffff !important;
  border-color: #e1e8ed !important;
  backdrop-filter: none !important;
}

html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] > div > div:first-child h2,
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] > div > div:first-child span,
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] > div > div:first-child [dir="auto"],
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] div[style*="position: sticky"] h2,
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] div[style*="position: sticky"] span,
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] div[style*="position: sticky"] [dir="auto"],
html[data-bt-theme="old-twitter"] div[data-testid="ScrollSnap-List"] *,
html[data-bt-theme="old-twitter"] nav[aria-label*="Timeline"] * {
  color: #14171a !important;
}

/* Notifications settings gear icon and header action icons */
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] > div > div:first-child svg,
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] div[style*="position: sticky"] svg {
  color: #1da1f2 !important;
  fill: #1da1f2 !important;
}

/* Timeline '+' tab button and navigation items */
html[data-bt-theme="old-twitter"] div[data-testid="ScrollSnap-List"] + div,
html[data-bt-theme="old-twitter"] nav[aria-label*="Timeline"] button,
html[data-bt-theme="old-twitter"] nav[aria-label*="Timeline"] a {
  background-color: #ffffff !important;
}
html[data-bt-theme="old-twitter"] div[data-testid="ScrollSnap-List"] + div svg {
  color: #14171a !important;
  fill: #14171a !important;
}

/* Inline composer on Home feed */
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] div:has(> [data-testid="tweetTextarea_0_label"]),
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] div:has([data-testid="tweetTextarea_0"]),
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] [data-testid="tweetTextarea_0_label"],
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] [data-testid="tweetTextarea_0"],
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] div[data-testid="toolBar"],
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] > div > div:nth-child(2),
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] > div > div:nth-child(2) div,
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] > div > div:nth-child(2) section {
  background-color: #ffffff !important;
  border-color: #e1e8ed !important;
  color: #14171a !important;
}

html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] [data-testid="tweetTextarea_0"] [dir="auto"],
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] [data-testid="tweetTextarea_0_label"] span {
  color: #14171a !important;
}

html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] [data-testid="tweetTextarea_0"]::placeholder,
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] [data-testid="tweetTextarea_0_label"] [dir="auto"]::placeholder {
  color: #657786 !important;
}

html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] > div > div:nth-child(2) {
  border: 1px solid #e1e8ed !important;
  border-radius: 5px !important;
  margin-bottom: 10px !important;
}

html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] div:has([data-testid="tweetTextarea_0"]) img[src*="profile_images"],
html[data-bt-theme="old-twitter"] div[data-testid="primaryColumn"] > div > div:nth-child(2) img[src*="profile_images"] {
  border-radius: 4px !important;
}

/* Classic blue Tweet and Post buttons */
html[data-bt-theme="old-twitter"] [data-testid="tweetButton"],
html[data-bt-theme="old-twitter"] [data-testid="tweetButtonInline"] {
  background-color: #1da1f2 !important;
  border: 1px solid #1da1f2 !important;
  border-radius: 4px !important;
  color: #ffffff !important;
  opacity: 1 !important;
  box-shadow: none !important;
}

html[data-bt-theme="old-twitter"] [data-testid="tweetButton"] *,
html[data-bt-theme="old-twitter"] [data-testid="tweetButtonInline"] * {
  color: #ffffff !important;
  font-weight: 700 !important;
}

html[data-bt-theme="old-twitter"] [data-testid="tweetButton"]:hover,
html[data-bt-theme="old-twitter"] [data-testid="tweetButtonInline"]:hover {
  background-color: #0c85d0 !important;
}

/* Right sidebar card modules (Subscribe to Premium, Today's News, What's happening, Who to follow) */
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] section,
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] aside,
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] [data-testid="trend"],
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] [role="region"],
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] [aria-label*="News"],
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] [aria-label*="Trending"],
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] [aria-label*="Timeline"],
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] > div > div > div > div > div,
html[data-bt-theme="old-twitter"] aside[role="complementary"] section,
html[data-bt-theme="old-twitter"] aside[role="complementary"] aside,
html[data-bt-theme="old-twitter"] aside[role="complementary"] [data-testid="trend"],
html[data-bt-theme="old-twitter"] aside[role="complementary"] [role="region"],
html[data-bt-theme="old-twitter"] aside[role="complementary"] > div > div > div > div > div {
  background-color: #ffffff !important;
  border: 1px solid #e1e8ed !important;
  border-radius: 5px !important;
}

/* Target any dark-background divs inside sidebar */
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] *[style*="background-color: rgb(22, 24, 28)"],
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] *[style*="background-color: rgb(0, 0, 0)"],
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] *[style*="background-color: rgb(21, 24, 28)"],
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] *[style*="background-color: rgb(32, 35, 39)"],
html[data-bt-theme="old-twitter"] aside[role="complementary"] *[style*="background-color: rgb(22, 24, 28)"],
html[data-bt-theme="old-twitter"] aside[role="complementary"] *[style*="background-color: rgb(0, 0, 0)"],
html[data-bt-theme="old-twitter"] aside[role="complementary"] *[style*="background-color: rgb(21, 24, 28)"],
html[data-bt-theme="old-twitter"] aside[role="complementary"] *[style*="background-color: rgb(32, 35, 39)"] {
  background-color: #ffffff !important;
  border-color: #e1e8ed !important;
}

/* Sub-containers / items inside sidebar modules */
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] section div,
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] aside div,
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] [role="region"] div,
html[data-bt-theme="old-twitter"] aside[role="complementary"] section div,
html[data-bt-theme="old-twitter"] aside[role="complementary"] aside div,
html[data-bt-theme="old-twitter"] aside[role="complementary"] [role="region"] div {
  background-color: transparent !important;
  border-color: #e1e8ed !important;
}

/* Right sidebar text colors */
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] *,
html[data-bt-theme="old-twitter"] aside[role="complementary"] * {
  color: #14171a !important;
}

html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] time,
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] [style*="color: rgb(113, 118, 123)"],
html[data-bt-theme="old-twitter"] aside[role="complementary"] time,
html[data-bt-theme="old-twitter"] aside[role="complementary"] [style*="color: rgb(113, 118, 123)"] {
  color: #657786 !important;
}

/* Follow buttons in right sidebar */
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] button[data-testid*="-follow"],
html[data-bt-theme="old-twitter"] aside[role="complementary"] button[data-testid*="-follow"] {
  background-color: #ffffff !important;
  border: 1px solid #1da1f2 !important;
  border-radius: 4px !important;
}
html[data-bt-theme="old-twitter"] div[data-testid="sidebarColumn"] button[data-testid*="-follow"] *,
html[data-bt-theme="old-twitter"] aside[role="complementary"] button[data-testid*="-follow"] * {
  color: #1da1f2 !important;
  font-weight: 700 !important;
}

/* Search inputs in sidebar, navbar, and messages */
html[data-bt-theme="old-twitter"] [data-testid="SearchBox_Search_Input"],
html[data-bt-theme="old-twitter"] [data-testid="SearchBox_Search_Input_Container"],
html[data-bt-theme="old-twitter"] form[role="search"] div,
html[data-bt-theme="old-twitter"] input[placeholder*="Search"] {
  background-color: #f5f8fa !important;
  border: 1px solid #e1e8ed !important;
  color: #14171a !important;
  border-radius: 21px !important;
}
html[data-bt-theme="old-twitter"] input[placeholder*="Search"]::placeholder,
html[data-bt-theme="old-twitter"] [data-testid="SearchBox_Search_Input"]::placeholder {
  color: #657786 !important;
}

/* Tweet compose dialog modal: classic 2015 white container */
html[data-bt-theme="old-twitter"] [role="dialog"],
html[data-bt-theme="old-twitter"] [role="dialog"] > div,
html[data-bt-theme="old-twitter"] div[aria-labelledby="modal-header"],
html[data-bt-theme="old-twitter"] div[aria-labelledby="modal-header"] > div {
  background-color: #ffffff !important;
  color: #14171a !important;
  border-color: #e1e8ed !important;
}

html[data-bt-theme="old-twitter"] [role="dialog"] [data-testid="tweetTextarea_0"],
html[data-bt-theme="old-twitter"] [role="dialog"] [data-testid="tweetTextarea_0_label"] {
  background-color: #ffffff !important;
  color: #14171a !important;
}

html[data-bt-theme="old-twitter"] [role="dialog"] [data-testid="tweetTextarea_0"] [dir="auto"],
html[data-bt-theme="old-twitter"] [role="dialog"] span,
html[data-bt-theme="old-twitter"] [role="dialog"] div[dir="auto"],
html[data-bt-theme="old-twitter"] [role="dialog"] h2 {
  color: #14171a !important;
}

/* Modal close icon */
html[data-bt-theme="old-twitter"] [role="dialog"] [data-testid="app-bar-close"] svg,
html[data-bt-theme="old-twitter"] [role="dialog"] [aria-label="Close"] svg {
  color: #657786 !important;
  fill: #657786 !important;
}

/* Composer media icons */
html[data-bt-theme="old-twitter"] [role="dialog"] div[data-testid="toolBar"] svg,
html[data-bt-theme="old-twitter"] div[data-testid="toolBar"] svg {
  color: #1da1f2 !important;
  fill: #1da1f2 !important;
}

/* Messages page chat list and message panel */
html[data-bt-theme="old-twitter"] [data-testid="DMDrawer"],
html[data-bt-theme="old-twitter"] section[aria-label*="Direct Messages"],
html[data-bt-theme="old-twitter"] section[aria-label*="Direct Messages"] * {
  background-color: #ffffff !important;
  color: #14171a !important;
}

/* Floating action buttons at bottom right */
html[data-bt-theme="old-twitter"] [data-testid="floatingActionButton"],
html[data-bt-theme="old-twitter"] div[data-testid="DMDrawer"] {
  background-color: #ffffff !important;
  border: 1px solid #e1e8ed !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12) !important;
}
html[data-bt-theme="old-twitter"] [data-testid="floatingActionButton"] svg {
  color: #1da1f2 !important;
  fill: #1da1f2 !important;
}

html[data-bt-theme="old-twitter"] [data-bt-mini-profile-card-host] {
  margin-right: 15px !important;
  margin-top: 0px !important;
}

/* Responsive: collapse the injected left mini profile card under 1000px viewports */
@media (max-width: 1000px) {
  [data-bt-mini-profile-card],
  [data-bt-mini-profile-card-host] {
    display: none !important;
  }
}
`;

export function generateThemeCss(): string {
  return [
    '/* Better Twitter Master Theme Engine (THEME-01..07, D-09..D-15) */',
    ROOT_TOKENS,
    '/* Theme Presets: Dracula (THEME-01), Nord (THEME-02), Matrix (THEME-03) */',
    THEME_PRESET_TOKEN_BLOCKS,
    "/* Surface recoloring & atmospheric vibe styling (D-10) */",
    APPLY_SURFACE_RULES,
    '/* Universal accent color overrides (THEME-04, D-11) */',
    ACCENT_OVERRIDE_RULES,
    '/* Minimal Layout (THEME-05, D-14) */',
    MINIMAL_LAYOUT_CSS,
    '/* Old Twitter 2015 classic palette tokens (THEME-06, D-15) */',
    LAYOUT_PRESET_TOKEN_BLOCKS,
    '/* Old Twitter 2015 Layout (THEME-06, D-15) */',
    OLD_TWITTER_LAYOUT_CSS,
  ].join('\n');
}

const THEME_STYLE_ID = 'bt-theme';

export function injectThemeStylesheet(): void {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById(THEME_STYLE_ID);
  if (existing) {
    existing.textContent = generateThemeCss();
    return;
  }

  const style = document.createElement('style');
  style.id = THEME_STYLE_ID;
  style.textContent = generateThemeCss();

  const target = document.documentElement || document.head || document.body;
  if (target) {
    target.appendChild(style);
  }
}

export function applyThemeAttributes(theme: ThemeId, customAccent: string | null): void {
  if (typeof document === 'undefined' || !document.documentElement) return;

  document.documentElement.setAttribute('data-bt-theme', theme);

  if (customAccent) {
    document.documentElement.style.setProperty('--bt-theme-accent', customAccent);
  } else {
    document.documentElement.style.removeProperty('--bt-theme-accent');
  }
}
