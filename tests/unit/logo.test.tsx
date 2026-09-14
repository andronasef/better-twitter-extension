(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterTwitterLogo } from '@/components/BetterTwitterLogo';
import Logo from '@/components/Logo';

describe('BetterTwitterLogo component', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('renders with default props (size 24, original blue gradient, sparkle)', () => {
    act(() => {
      const root = createRoot(container);
      root.render(<BetterTwitterLogo />);
    });

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 1254 1254');

    // Should contain defs with linearGradient in original mode (base template, bird, sparkle)
    const gradients = container.querySelectorAll('linearGradient');
    expect(gradients.length).toBe(3);

    // Paths: bird, eye, sparkle
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(3);

    // Bird path uses gradient url
    expect(paths[0]?.getAttribute('fill')).toMatch(/^url\(#bt-logo-g1-/);
    // Eye path uses white by default
    expect(paths[1]?.getAttribute('fill')).toBe('#ffffff');
    // Sparkle path uses gradient url
    expect(paths[2]?.getAttribute('fill')).toMatch(/^url\(#bt-logo-g2-/);
  });

  it('renders custom size and custom className', () => {
    act(() => {
      const root = createRoot(container);
      root.render(<BetterTwitterLogo size={36} className="my-logo-class" />);
    });

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('36');
    expect(svg?.getAttribute('height')).toBe('36');
    expect(svg?.getAttribute('class')).toContain('my-logo-class');
  });

  it('supports hiding the sparkle star', () => {
    act(() => {
      const root = createRoot(container);
      root.render(<BetterTwitterLogo showSparkle={false} />);
    });

    const paths = container.querySelectorAll('path');
    // Only bird and eye, no sparkle
    expect(paths.length).toBe(2);
  });

  it('renders accent variant matching theme accent color', () => {
    act(() => {
      const root = createRoot(container);
      root.render(
        <BetterTwitterLogo
          variant="accent"
          accentColor="#F91880"
          eyeColor="#000000"
        />
      );
    });

    // In accent mode, defs are not rendered since gradients are not needed
    const gradients = container.querySelectorAll('linearGradient');
    expect(gradients.length).toBe(0);

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(3);
    expect(paths[0]?.getAttribute('fill')).toBe('#F91880');
    expect(paths[1]?.getAttribute('fill')).toBe('#000000');
    expect(paths[2]?.getAttribute('fill')).toBe('#F91880');
  });

  it('renders monochrome variant using currentColor', () => {
    act(() => {
      const root = createRoot(container);
      root.render(<BetterTwitterLogo variant="monochrome" />);
    });

    const paths = container.querySelectorAll('path');
    expect(paths[0]?.getAttribute('fill')).toBe('currentColor');
    expect(paths[2]?.getAttribute('fill')).toBe('currentColor');
  });

  it('works when imported as default Logo export', () => {
    act(() => {
      const root = createRoot(container);
      root.render(<Logo size={20} />);
    });

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('20');
    expect(svg?.getAttribute('height')).toBe('20');
  });
});
