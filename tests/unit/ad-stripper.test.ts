import { describe, it, expect } from 'vitest';
import { isPromoted } from '@/features/ad-stripper';

function cell(inner: string): Element {
  const el = document.createElement('div');
  el.setAttribute('data-testid', 'cellInnerDiv');
  el.innerHTML = inner;
  return el;
}

describe('isPromoted', () => {
  it('flags an ad whose media card mounted the placement tracker', () => {
    expect(
      isPromoted(cell('<article data-testid="tweet"><div data-testid="placementTracking"></div></article>'))
    ).toBe(true);
  });

  it('flags an ad before its card mounts (no timestamp in the header)', () => {
    expect(isPromoted(cell('<article data-testid="tweet"><span>Ad</span></article>'))).toBe(true);
  });

  it('leaves an organic tweet alone', () => {
    expect(
      isPromoted(cell('<article data-testid="tweet"><time datetime="2026-09-14"></time></article>'))
    ).toBe(false);
  });

  it('ignores cells that are not tweets', () => {
    expect(isPromoted(cell('<div>Show more replies</div>'))).toBe(false);
  });
});
