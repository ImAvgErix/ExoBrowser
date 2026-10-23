import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))

// The Bar and Settings (browser.html) and the new tab page (newtab.html), with public/ (icons, fonts, the page
// script Exo Vault puts in every tab) beside them: built into dist/, which build.cmd copies into out\ui.
export default defineConfig({
  plugins: [react({ compiler: { target: '19' } }), tailwindcss()],
  base: './',
  build: {
    outDir: resolve(root, 'dist'),
    emptyOutDir: true,
    sourcemap: false,
    assetsInlineLimit: 0,
    rolldownOptions: { input: { browser: resolve(root, 'browser.html'), newtab: resolve(root, 'newtab.html') } },
  },
})
