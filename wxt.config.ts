import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Better Twitter!',
    description: 'A clean, fast, and respectful Twitter experience',
    permissions: ['storage'],
    action: {
      default_popup: 'popup.html',
    },
    web_accessible_resources: [
      {
        resources: ['bridge.js'],
        matches: ['*://x.com/*', '*://twitter.com/*'],
      },
    ],
  },
});