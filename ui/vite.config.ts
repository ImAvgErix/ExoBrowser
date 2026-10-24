import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import pruneCss from './scripts/prune-css.mjs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))

// The Bar and Settings (browser.html), the new tab page (newtab.html) and Little Exo's strip (little.html), with public/ (icons, fonts, the page
// script Exo Vault puts in every tab) beside them: built into dist/, which build.cmd copies into out\ui.
export default defineConfig({
  plugins: [react({ compiler: { target: '19' } }), tailwindcss(), pruneCss()],
  base: './',
  build: {
    outDir: resolve(root, 'dist'),
    emptyOutDir: true,
    sourcemap: false,
    assetsInlineLimit: 0,
    rolldownOptions: { input: { browser: resolve(root, 'browser.html'), newtab: resolve(root, 'newtab.html'), little: resolve(root, 'little.html') } },
  },
})
