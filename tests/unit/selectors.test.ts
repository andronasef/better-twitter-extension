import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolve, resolveAll, withFeature, SELECTORS } from '@/lib/selectors';
import * as diagnostics from '@/lib/diagnostics';

describe('selector layer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('two candidates in a chain both match: resolve returns the first candidate match', () => {
    // Construct a custom DOM where both candidate 1 and candidate 2 would match if tested
    // For timeline:
    // candidate 0: 'div[data-testid="primaryColumn"] section > h1 + div[aria-label] > div'
    // candidate 1: 'section > h1 + div[aria-label] > div'
    document.body.innerHTML = `
      <div data-testid="primaryColumn">
        <section>
          <h1>Heading 1</h1>
          <div aria-label="Timeline 1">
            <div id="first-candidate-match">First</div>
          </div>
        </section>
      </div>
      <section>
        <h1>Heading 2</h1>
        <div aria-label="Timeline 2">
          <div id="second-candidate-match">Second</div>
        </div>
      </section>
    `;

    const match = resolve('timeline');
    expect(match).not.toBeNull();
    expect(match?.id).toBe('first-candidate-match');
  });

  it('a chain matching nothing returns null and does not throw', () => {
    document.body.innerHTML = '<div>No matching elements</div>';
    expect(() => {
      const match = resolve('promotedContainer');
      expect(match).toBeNull();
    }).not.toThrow();
  });

  it('chain candidate order is declared order and is stable across multiple evaluations', () => {
    document.body.innerHTML = `
      <div data-testid="primaryColumn">
        <section>
          <h1>Heading</h1>
          <div aria-label="Timeline">
            <div id="primary-match">Primary</div>
          </div>
        </section>
      </div>
    `;

    for (let i = 0; i < 50; i++) {
      const match = resolve('timeline');
      expect(match?.id).toBe('primary-match');
    }
  });

  it('withFeature reports hit on successful resolution and miss on null resolution', () => {
    const hitSpy = vi.spyOn(diagnostics, 'recordHit');
    const missSpy = vi.spyOn(diagnostics, 'recordMiss');

    const scoped = withFeature('hidePromotedTweets');

    document.body.innerHTML = '<div data-testid="tweet">Tweet content</div>';

    const tweet = scoped.resolve('tweet');
    expect(tweet).not.toBeNull();
    expect(hitSpy).toHaveBeenCalledWith('hidePromotedTweets', 'tweet');

    const ad = scoped.resolve('promotedContainer');
    expect(ad).toBeNull();
    expect(missSpy).toHaveBeenCalledWith('hidePromotedTweets', 'promotedContainer');
  });
});
