import React from 'react';
import ReactDOM from 'react-dom/client';
import UpdateApp from './UpdateApp';
import '@/assets/tailwind.css';

// Load fonts dynamically from extension origin
if (typeof browser !== 'undefined' && browser.runtime?.getURL) {
  try {
    const font400 = new FontFace(
      'BTPopupSans',
      `url(${browser.runtime.getURL('/fonts/inter-400.woff2')}) format('woff2')`,
      { weight: '400', style: 'normal', display: 'block' }
    );
    const font700 = new FontFace(
      'BTPopupSans',
      `url(${browser.runtime.getURL('/fonts/inter-700.woff2')}) format('woff2')`,
      { weight: '700', style: 'normal', display: 'block' }
    );
    document.fonts.add(font400);
    document.fonts.add(font700);
    font400.load().catch(() => {});
    font700.load().catch(() => {});
  } catch {
    // Non-extension environment fallback
  }
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <UpdateApp />
  </React.StrictMode>
);
