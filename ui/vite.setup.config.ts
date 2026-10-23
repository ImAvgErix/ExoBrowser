import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))

// Exo Browser Setup's screens (setup/src/main.cpp): built into setup/build/ui, then packed into ExoSetup.exe.
export default defineConfig({
  plugins: [react({ compiler: { target: '19' } }), tailwindcss()],
  base: './',
  publicDir: false,
  build: {
    outDir: resolve(root, '../setup/build/ui'),
    emptyOutDir: true,
    sourcemap: false,
    assetsInlineLimit: 0,
    rolldownOptions: { input: { index: resolve(root, 'setup.html') } },
  },
})
