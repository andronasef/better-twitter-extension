import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import '@/assets/tailwind.css';
import './popup.css';

// Load fonts dynamically from extension origin using runtime.getURL
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

function renderApp(props?: any) {
  root.render(
    <React.StrictMode>
      <App key={props ? JSON.stringify(props) : 'default'} {...props} />
    </React.StrictMode>,
  );
}

renderApp();

if (typeof window !== 'undefined') {
  (window as any).__BT_RENDER__ = renderApp;
}