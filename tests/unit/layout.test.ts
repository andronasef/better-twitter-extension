import { describe, it, expect } from 'vitest';
import { generateThemeCss, MINIMAL_LAYOUT_CSS } from '@/lib/theme-engine';

describe('Minimal layout engine CSS (THEME-05, D-14)', () => {
  const css = generateThemeCss();

  it('generateThemeCss() includes html[data-bt-theme="minimal"] rules', () => {
    expect(css).toContain('html[data-bt-theme="minimal"]');
  });

  it('completely hides the right sidebar column', () => {
    expect(MINIMAL_LAYOUT_CSS).toContain(
      'html[data-bt-theme="minimal"] div[data-testid="sidebarColumn"]'
    );
    expect(MINIMAL_LAYOUT_CSS).toMatch(
      /div\[data-testid="sidebarColumn"\]\s*\{\s*display: none !important;/
    );
  });

  it('collapses the navigation bar to a 68px icon-only rail (D-14)', () => {
    expect(MINIMAL_LAYOUT_CSS).toContain('header[role="banner"]');
    expect(MINIMAL_LAYOUT_CSS).toContain('width: 68px !important;');
    expect(MINIMAL_LAYOUT_CSS).toContain('min-width: 68px !important;');
  });

  it('centers the timeline with max-width 650px and margin 0 auto', () => {
    expect(MINIMAL_LAYOUT_CSS).toContain('div[data-testid="primaryColumn"]');
    expect(MINIMAL_LAYOUT_CSS).toContain('max-width: 650px !important;');
    expect(MINIMAL_LAYOUT_CSS).toContain('margin: 0 auto !important;');
  });
});
