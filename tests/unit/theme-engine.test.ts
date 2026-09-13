import { describe, it, expect } from 'vitest';
import { generateThemeCss, THEME_PRESETS, APPLY_SURFACE_RULES } from '@/lib/theme-engine';

describe('Theme engine CSS generator (THEME-01..04, THEME-07, D-09..D-11)', () => {
  const css = generateThemeCss();

  it('produces valid CSS without unescaped tokens', () => {
    expect(css).not.toContain('undefined');
    expect(css).not.toContain('NaN');
    expect(css).not.toContain('${');

    const openBraces = (css.match(/{/g) || []).length;
    const closeBraces = (css.match(/}/g) || []).length;
    expect(openBraces).toBe(closeBraces);
    expect(openBraces).toBeGreaterThan(0);
  });

  it('defines root theme custom properties with the default X accent', () => {
    expect(css).toContain(':root {');
    expect(css).toContain('--bt-theme-bg:');
    expect(css).toContain('--bt-theme-surface:');
    expect(css).toContain('--bt-theme-surface-hover:');
    expect(css).toContain('--bt-theme-border:');
    expect(css).toContain('--bt-theme-text:');
    expect(css).toContain('--bt-theme-text-muted:');
    expect(css).toContain('--bt-theme-accent: #1d9bf0;');
  });

  describe('Dracula palette (THEME-01)', () => {
    it('THEME_PRESETS.dracula matches spec tokens verbatim', () => {
      const p = THEME_PRESETS.dracula;
      expect(p.bg).toBe('#282a36');
      expect(p.surface).toBe('#343746');
      expect(p.surfaceHover).toBe('#44475a');
      expect(p.border).toBe('#44475a');
      expect(p.text).toBe('#f8f8f2');
      expect(p.textMuted).toBe('#6272a4');
      expect(p.accent).toBe('#bd93f9');
    });

    it('emits an html[data-bt-theme="dracula"] token block', () => {
      expect(css).toContain('html[data-bt-theme="dracula"]');
      expect(css).toContain('--bt-theme-bg: #282a36 !important;');
      expect(css).toContain('--bt-theme-surface: #343746 !important;');
      expect(css).toContain('--bt-theme-text: #f8f8f2 !important;');
      expect(css).toContain('--bt-theme-accent: #bd93f9 !important;');
    });
  });

  describe('Nord palette (THEME-02)', () => {
    it('THEME_PRESETS.nord matches spec tokens verbatim', () => {
      const p = THEME_PRESETS.nord;
      expect(p.bg).toBe('#2e3440');
      expect(p.surface).toBe('#3b4252');
      expect(p.surfaceHover).toBe('#434c5e');
      expect(p.border).toBe('#4c566a');
      expect(p.text).toBe('#eceff4');
      expect(p.textMuted).toBe('#d8dee9');
      expect(p.accent).toBe('#88c0d0');
    });

    it('emits an html[data-bt-theme="nord"] token block', () => {
      expect(css).toContain('html[data-bt-theme="nord"]');
      expect(css).toContain('--bt-theme-bg: #2e3440 !important;');
      expect(css).toContain('--bt-theme-text: #eceff4 !important;');
      expect(css).toContain('--bt-theme-accent: #88c0d0 !important;');
    });
  });

  describe('Matrix palette (THEME-03)', () => {
    it('THEME_PRESETS.matrix matches spec tokens verbatim', () => {
      const p = THEME_PRESETS.matrix;
      expect(p.bg).toBe('#000000');
      expect(p.surface).toBe('#0a140a');
      expect(p.surfaceHover).toBe('#0f240f');
      expect(p.border).toBe('#003b00');
      expect(p.text).toBe('#00ff66');
      expect(p.textMuted).toBe('#008f11');
      expect(p.accent).toBe('#00ff66');
    });

    it('emits an html[data-bt-theme="matrix"] token block', () => {
      expect(css).toContain('html[data-bt-theme="matrix"]');
      expect(css).toContain('--bt-theme-bg: #000000 !important;');
      expect(css).toContain('--bt-theme-text: #00ff66 !important;');
      expect(css).toContain('--bt-theme-accent: #00ff66 !important;');
    });
  });

  describe('Minimal palette (Zen Editorial)', () => {
    it('THEME_PRESETS.minimal defines Zen tokens', () => {
      const p = THEME_PRESETS.minimal;
      expect(p.bg).toBe('#08090a');
      expect(p.surface).toBe('#0e1015');
      expect(p.surfaceHover).toBe('#151820');
      expect(p.border).toBe('#1c2028');
      expect(p.text).toBe('#f3f4f6');
      expect(p.textMuted).toBe('#6b7280');
      expect(p.accent).toBe('#f3f4f6');
    });

    it('emits an html[data-bt-theme="minimal"] token block', () => {
      expect(css).toContain('html[data-bt-theme="minimal"]');
      expect(css).toContain('--bt-theme-bg: #08090a !important;');
      expect(css).toContain('--bt-theme-surface: #0e1015 !important;');
      expect(css).toContain('--bt-theme-text: #f3f4f6 !important;');
    });
  });

  it('Default preset uses the native X appearance and default accent (#1d9bf0)', () => {
    const p = THEME_PRESETS.default;
    expect(p.accent.toLowerCase()).toBe('#1d9bf0');
    expect(p.bg).toBe('');
    expect(css).not.toContain('html[data-bt-theme="default"]');
  });

  describe('Universal accent color overrides (THEME-04, D-11)', () => {
    it('overrides inline color rgb(29, 155, 240)', () => {
      expect(css).toContain('[style*="color: rgb(29, 155, 240)"]');
      expect(css).toContain('[style*="color:rgb(29,155,240)"]');
      expect(css).toContain('color: var(--bt-theme-accent) !important;');
    });

    it('overrides inline background-color rgb(29, 155, 240)', () => {
      expect(css).toContain('[style*="background-color: rgb(29, 155, 240)"]');
      expect(css).toContain('[style*="background-color:rgb(29,155,240)"]');
      expect(css).toContain('background-color: var(--bt-theme-accent) !important;');
    });

    it('overrides inline border-color rgb(29, 155, 240)', () => {
      expect(css).toContain('[style*="border-color: rgb(29, 155, 240)"]');
      expect(css).toContain('[style*="border-color:rgb(29,155,240)"]');
      expect(css).toContain('border-color: var(--bt-theme-accent) !important;');
    });

    it('overrides SVG fill attributes for the default X accent', () => {
      expect(css).toContain('svg [fill="rgb(29, 155, 240)"]');
      expect(css).toContain('svg [fill="#1d9bf0" i]');
      expect(css).toContain('fill: var(--bt-theme-accent) !important;');
    });
  });

  describe('Surface recoloring (D-10)', () => {
    it('applies theme background/text regardless of X light/dark mode', () => {
      expect(APPLY_SURFACE_RULES).toContain('html[data-bt-theme="dracula"]');
      expect(APPLY_SURFACE_RULES).toContain('html[data-bt-theme="nord"]');
      expect(APPLY_SURFACE_RULES).toContain('html[data-bt-theme="matrix"]');
      expect(APPLY_SURFACE_RULES).toContain('background-color: var(--bt-theme-bg) !important;');
      expect(APPLY_SURFACE_RULES).toContain('color: var(--bt-theme-text) !important;');
    });

    it('applies surface/border recoloring to primary containers', () => {
      expect(APPLY_SURFACE_RULES).toContain('[data-testid="primaryColumn"]');
      expect(APPLY_SURFACE_RULES).toContain('[data-testid="sidebarColumn"]');
      expect(APPLY_SURFACE_RULES).toContain('background-color: var(--bt-theme-surface) !important;');
      expect(APPLY_SURFACE_RULES).toContain('border-color: var(--bt-theme-border) !important;');
    });
  });
});
