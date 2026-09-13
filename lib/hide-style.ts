/**
 * Spike S4 fallback: Zero the cell container's height and hide overflow
 * if hiding firstElementChild alone leaves residual virtualizer slot gaps on live x.com.
 * Off by default; if live testing reveals gaps, toggle to true.
 * Reference: .planning/phases/01-foundation-settings-popup/spikes/S4-virtualizer-gap.md
 */
export const ENABLE_S4_COLLAPSE_FALLBACK = false;

const HIDE_STYLE_ID = 'bt-hide-style';

const FALLBACK_RULES = ENABLE_S4_COLLAPSE_FALLBACK
  ? `
[data-bt-hidden-cell] {
  height: 0 !important;
  min-height: 0 !important;
  overflow: hidden !important;
}
`
  : '';

const CSS_RULES = `
[data-bt-hidden] {
  display: none !important;
}
[data-bt-hidden] + [role="separator"],
[data-bt-hidden-cell] + [role="separator"] {
  display: none !important;
}
${FALLBACK_RULES}
`;

/**
 * Injects extension-owned stylesheet into document.documentElement at document_start.
 */
export function injectHideStylesheet(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(HIDE_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = HIDE_STYLE_ID;
  style.textContent = CSS_RULES;

  const target = document.documentElement || document.head || document.body;
  if (target) {
    target.appendChild(style);
  }
}

/**
 * Hides a promoted tweet cell by setting extension-owned attributes.
 * contentWrapper receives data-bt-hidden (display: none !important).
 * cell receives data-bt-hidden-cell (collapses trailing separator).
 */
export function hideTweetCell(cell: Element, contentWrapper: Element): void {
  cell.setAttribute('data-bt-hidden-cell', '');
  contentWrapper.setAttribute('data-bt-hidden', '');
}

/**
 * Restores a tweet cell's visibility losslessly by removing extension attributes.
 */
export function unhideTweetCell(cell: Element, contentWrapper: Element): void {
  cell.removeAttribute('data-bt-hidden-cell');
  contentWrapper.removeAttribute('data-bt-hidden');
}

/**
 * Removes all extension-owned hide attributes from the DOM.
 */
export function clearAllHidden(): void {
  if (typeof document === 'undefined') return;
  const hiddenElements = document.querySelectorAll('[data-bt-hidden]');
  hiddenElements.forEach((el) => el.removeAttribute('data-bt-hidden'));

  const hiddenCells = document.querySelectorAll('[data-bt-hidden-cell]');
  hiddenCells.forEach((el) => el.removeAttribute('data-bt-hidden-cell'));
}