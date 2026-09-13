import { describe, it, expect, beforeEach, vi } from 'vitest';
import { startPipeline, onTweetSeen, replayKnownTweets, resetPipeline } from '@/entrypoints/x.content/pipeline';

describe('Tweet observation pipeline (FOUND-01, FOUND-02)', () => {
  let timeline: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    resetPipeline?.();

    // Create container matching selector: primaryColumn section > h1 + div[aria-label] > div[style]
    const primaryColumn = document.createElement('div');
    primaryColumn.setAttribute('data-testid', 'primaryColumn');
    const section = document.createElement('section');
    const h1 = document.createElement('h1');
    const ariaDiv = document.createElement('div');
    ariaDiv.setAttribute('aria-label', 'Timeline: Your Home Timeline');
    timeline = document.createElement('div');
    timeline.setAttribute('style', 'position: relative; min-height: 500px;');

    ariaDiv.appendChild(timeline);
    section.appendChild(h1);
    section.appendChild(ariaDiv);
    primaryColumn.appendChild(section);
    document.body.appendChild(primaryColumn);
  });

  function createCell(tweetId: string): HTMLDivElement {
    const cell = document.createElement('div');
    cell.setAttribute('data-testid', 'cellInnerDiv');
    const inner = document.createElement('div');
    const tweet = document.createElement('article');
    tweet.setAttribute('data-testid', 'tweet');
    // link containing tweet ID
    const link = document.createElement('a');
    link.href = `https://x.com/user/status/${tweetId}`;
    tweet.appendChild(link);
    inner.appendChild(tweet);
    cell.appendChild(inner);
    return cell;
  }

  it('Given a timeline with zero children: the observer attaches, zero events are emitted, nothing throws', () => {
    const seen = vi.fn();
    onTweetSeen(seen);
    expect(() => startPipeline()).not.toThrow();
    expect(seen).not.toHaveBeenCalled();
  });

  it('Given tweet cells: emitted in timeline.children document order', async () => {
    const seen: string[] = [];
    onTweetSeen((_el, id) => seen.push(id));
    startPipeline();

    const cell1 = createCell('101');
    const cell2 = createCell('102');
    const cell3 = createCell('103');

    timeline.appendChild(cell1);
    timeline.appendChild(cell2);
    timeline.appendChild(cell3);

    // Wait for MutationObserver batch
    await new Promise((r) => setTimeout(r, 10));

    expect(seen).toEqual(['101', '102', '103']);
  });

  it('A subscriber that registers later receives replay in that same document order', async () => {
    startPipeline();

    const cell1 = createCell('201');
    const cell2 = createCell('202');
    timeline.appendChild(cell1);
    timeline.appendChild(cell2);

    await new Promise((r) => setTimeout(r, 10));

    const replayed: string[] = [];
    replayKnownTweets((_el, id) => replayed.push(id));

    expect(replayed).toEqual(['201', '202']);
  });

  it('Given the same tweet id appears on two distinct cell nodes simultaneously: both are processed; neither is skipped', async () => {
    const seenNodes: HTMLElement[] = [];
    onTweetSeen((el) => seenNodes.push(el as HTMLElement));
    startPipeline();

    const nodeA = createCell('300');
    const nodeB = createCell('300');

    timeline.appendChild(nodeA);
    timeline.appendChild(nodeB);

    await new Promise((r) => setTimeout(r, 10));

    expect(seenNodes.length).toBe(2);
    expect(seenNodes[0]).toBe(nodeA);
    expect(seenNodes[1]).toBe(nodeB);
  });

  it('Given a cell node is recycled to carry a different tweet id: it is re-processed because mark carries tweet id', async () => {
    const seen: string[] = [];
    onTweetSeen((_el, id) => seen.push(id));
    startPipeline();

    const cell = createCell('401');
    timeline.appendChild(cell);

    await new Promise((r) => setTimeout(r, 10));
    expect(seen).toEqual(['401']);

    // Recycle DOM node to represent tweet 402
    const link = cell.querySelector('a')!;
    link.href = 'https://x.com/user/status/402';

    // Simulate attribute / child mutation triggering observer or pipeline check
    timeline.appendChild(cell); // re-append or mutate

    await new Promise((r) => setTimeout(r, 10));
    expect(seen).toContain('402');
  });

  it('The de-duplication mark carries the tweet id, not a boolean', async () => {
    startPipeline();

    const cell = createCell('501');
    timeline.appendChild(cell);

    await new Promise((r) => setTimeout(r, 10));

    const marked = cell.getAttribute('data-bt-seen');
    expect(marked).toBe('501');
  });
});