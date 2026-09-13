import type { ThemeId } from './storage';

/**
 * Master Theme CSS Generator (THEME-01..04, THEME-07, D-09, D-10, D-11, D-13)
 *
 * Defines the `--bt-theme-*` CSS custom property contract, the Dracula / Nord / Matrix
 * color engine palettes, the surface recoloring rules that force those palettes across
 * X's own Light/Dark mode (D-10), and the universal custom accent color overrides that
 * replace X's hardcoded `rgb(29, 155, 240)` / `#1d9bf0` accent everywhere (THEME-04, D-11).
 *
 * `THEME_PRESETS` also carries metadata for all 6 unified theme/layout presets (D-09) so the
 * popup's Themes panel thumbnail cards (D-12) can render every option, including Minimal
 * (THEME-05) and Old Twitter (THEME-06), whose layout-transform CSS ships in a later plan.
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

/**
 * Theme preset metadata for the popup's Themes panel thumbnail cards (D-12, UI-SPEC).
 * `default` and `minimal` are native/layout-only presets with no forced palette — THEME-05
 * (Minimal) is a layout transform, not a color theme — so their bg/surface/border/text
 * tokens are left as empty strings; consumers fall back to the popup's own native
 * light/dark surface tokens for preview purposes.
 */
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
    desc: 'Hacker green and black',
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
    desc: 'Centered distraction-free',
    bg: '',
    surface: '',
    surfaceHover: '',
    border: '',
    text: '',
    textMuted: '',
    accent: DEFAULT_ACCENT,
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

/**
 * Theme presets with an active color-engine surface application in this plan (THEME-01/02/03).
 * Minimal (THEME-05) and Old Twitter (THEME-06) are layout transforms implemented in a later plan.
 */
const COLOR_ENGINE_THEME_IDS: ThemeId[] = ['dracula', 'nord', 'matrix'];

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
  '[data-testid="sidebarColumn"]',
  'header[role="banner"]',
  '[data-testid="tweet"]',
];

const htmlBgSelector = COLOR_ENGINE_THEME_IDS.map((id) => `html[data-bt-theme="${id}"]`).join(
  ',\n'
);
const bodyRootSelector = COLOR_ENGINE_THEME_IDS.flatMap((id) => [
  `html[data-bt-theme="${id}"] body`,
  `html[data-bt-theme="${id}"] #react-root`,
]).join(',\n');
const primaryContainerSelector = COLOR_ENGINE_THEME_IDS.flatMap((id) =>
  PRIMARY_CONTAINER_SELECTORS.map((sel) => `html[data-bt-theme="${id}"] ${sel}`)
).join(',\n');

/**
 * Surface recoloring rules (D-10): forces the active theme's background/surface/text colors
 * across documentElement, body, #react-root, and primary containers regardless of whether
 * X itself is currently in Light or Dark mode.
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
`;

/**
 * Universal custom accent color overrides (THEME-04, D-11): targets X's React-Native-for-Web
 * inline styles and SVG fills directly rather than fighting generated atomic class names.
 */
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
 * Minimal layout transform rules (THEME-05, D-14): centers the timeline column, hides the
 * right sidebar completely, and collapses the left navigation rail to a 68px icon-only rail.
 * Purely a layout transform — Minimal enforces no forced background/surface recoloring, unlike
 * the Dracula/Nord/Matrix color-engine presets above.
 */
export const MINIMAL_LAYOUT_CSS = `
html[data-bt-theme="minimal"] div[data-testid="sidebarColumn"] {
  display: none !important;
}

html[data-bt-theme="minimal"] header[role="banner"] {
  width: 68px !important;
  min-width: 68px !important;
  align-items: center !important;
}

html[data-bt-theme="minimal"] header[role="banner"] nav a span,
html[data-bt-theme="minimal"] header[role="banner"] nav [role="button"] span {
  display: none !important;
}

html[data-bt-theme="minimal"] main[role="main"] {
  display: flex !important;
  justify-content: center !important;
  width: 100% !important;
}

html[data-bt-theme="minimal"] div[data-testid="primaryColumn"] {
  margin: 0 auto !important;
  max-width: 650px !important;
  width: 100% !important;
  border-left: 1px solid var(--bt-theme-border) !important;
  border-right: 1px solid var(--bt-theme-border) !important;
}
`;

/**
 * Generates the full master theme stylesheet: root custom properties, Dracula/Nord/Matrix
 * palette token blocks, surface recoloring rules, universal accent overrides, and the Minimal
 * (THEME-05) layout transform.
 */
export function generateThemeCss(): string {
  return [
    '/* Better Twitter Master Theme Engine (THEME-01..05, THEME-07, D-09..D-14) */',
    ROOT_TOKENS,
    '/* Theme Presets: Dracula (THEME-01), Nord (THEME-02), Matrix (THEME-03) */',
    THEME_PRESET_TOKEN_BLOCKS,
    "/* Surface recoloring (D-10): enforces theme background/surface/text regardless of X's Light/Dark mode */",
    APPLY_SURFACE_RULES,
    '/* Universal accent color overrides (THEME-04, D-11) */',
    ACCENT_OVERRIDE_RULES,
    '/* Minimal Layout (THEME-05, D-14) */',
    MINIMAL_LAYOUT_CSS,
  ].join('\n');
}

const THEME_STYLE_ID = 'bt-theme';

/**
 * Injects the master theme stylesheet synchronously into document.documentElement.
 * Idempotent: does nothing if the stylesheet is already present.
 */
export function injectThemeStylesheet(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(THEME_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = THEME_STYLE_ID;
  style.textContent = generateThemeCss();

  const target = document.documentElement || document.head || document.body;
  if (target) {
    target.appendChild(style);
  }
}

/**
 * Applies the active theme and custom accent color to document.documentElement (THEME-07, D-13).
 * Sets `data-bt-theme` so the injected stylesheet's preset selectors match, and sets or clears
 * the `--bt-theme-accent` custom property override so a custom accent instantly recolors every
 * surface targeted by the universal accent overrides above.
 */
export function applyThemeAttributes(theme: ThemeId, customAccent: string | null): void {
  if (typeof document === 'undefined' || !document.documentElement) return;

  document.documentElement.setAttribute('data-bt-theme', theme);

  if (customAccent) {
    document.documentElement.style.setProperty('--bt-theme-accent', customAccent);
  } else {
    document.documentElement.style.removeProperty('--bt-theme-accent');
  }
}
