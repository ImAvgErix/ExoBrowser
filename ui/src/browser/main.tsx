/**
 * Exo Browser's chrome (the C++ host in the Exo Browser repo draws it in WebView2 over the tab): Exo's own look from
 * Exo's own styles and parts, the browser's logic in src/browser.
 */
import { StrictMode, useEffect, useState, type CSSProperties } from 'react'
import { createRoot } from 'react-dom/client'
import '../tokens.css'
import '../exo-shell.css'
import '../styles/rooms.css'
import './browser.css'
import { installMenuFit } from '../lib/menuFit'
import { installInputModality } from '../lib/motionPreference'
import { browser, onHost, send, setSetting, startHost, useBrowser } from './host'
import { engineOf, hostOf } from './search'
import { Chrome, isAutohide, isVertical, useLayoutReport, widthOf } from './Chrome'
import { MenuLayer, MenuScrim, closeMenu, downloadsMenu, extensionsMenu, menuKind } from './menus'
import { Settings } from './Settings'
import { VaultSheet } from './vault/VaultSheet'
import { VaultFill, startFill } from './vault/Fill'
import { startVault } from './vault/store'
import { Onboarding } from './onboarding/Onboarding'

function useToasts() {
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null)
  useEffect(() => {
    let timer = 0
    const show = (text: string) => { setToast({ text, key: Date.now() }); clearTimeout(timer); timer = window.setTimeout(() => setToast(null), 3600) }
    const offs = [
      onHost('toast', m => show(m.text as string)),
      onHost('importData', m => show(importFrom(m))),
    ]
    return () => offs.forEach(off => off())
  }, [])
  return toast
}

// A Chromium browser's bookmarks (folders flattened), its search engine and its Chrome Web Store extensions
// (installed again here); the host has already brought in history, site icons and sign-ins.
type BookmarkNode = { type?: string; url?: string; name?: string; children?: BookmarkNode[] }
type ExtensionEntry = { from_webstore?: boolean; location?: number; disable_reasons?: unknown[] }
type Prefs = { default_search_provider_data?: { template_url_data?: { url?: string } }; extensions?: { settings?: Record<string, ExtensionEntry> } }
const parse = <T,>(text: unknown): T | null => { try { return JSON.parse((text as string) || 'null') as T } catch { return null } }
const ENGINE_SITES: Record<string, string> = { 'google.com': 'google', 'bing.com': 'bing', 'duckduckgo.com': 'duckduckgo', 'search.brave.com': 'brave', 'kagi.com': 'kagi', 'startpage.com': 'startpage' }
// Chrome's own built-ins (Web Store, Chrome PDF viewer) are never installed again.
const SKIP = ['ghbmnnjooekpmoecnnnilnnbdlolhkhi', 'nmmhkkegccagdldgiimedpiccmgmieda']

function importBookmarks(text: unknown) {
  const out: string[] = []
  const walk = (node: BookmarkNode | undefined) => {
    if (!node) return
    if (node.type === 'url' && node.url && /^https?:/.test(node.url)) out.push(node.url, (node.name || '').replace(/\s+/g, ' '))
    for (const child of node.children ?? []) walk(child)
  }
  for (const root of Object.values(parse<{ roots?: Record<string, BookmarkNode> }>(text)?.roots ?? {})) walk(root)
  for (let i = 0; i < out.length; i += 400) send('addBookmarks', ...out.slice(i, i + 400))
  return out.length / 2
}

function importEngine(prefs: Prefs | null) {
  const site = hostOf((prefs?.default_search_provider_data?.template_url_data?.url || '').replace('{searchTerms}', 'x'))
  const key = Object.entries(ENGINE_SITES).find(([h]) => site.endsWith(h))?.[1]
  if (!key) return ''
  setSetting('engine', key)
  return `, search ${engineOf(key).short}`
}

function importExtensions(prefs: Prefs | null, secure: Prefs | null) {
  const all = { ...(prefs?.extensions?.settings ?? {}), ...(secure?.extensions?.settings ?? {}) }
  const ids = Object.entries(all)
    .filter(([id, s]) => /^[a-p]{32}$/.test(id) && (s.from_webstore || s.location === 1) && !s.disable_reasons?.length && !SKIP.includes(id))
    .map(([id]) => id)
  if (ids.length) send('extInstallMany', ...ids)
  return ids.length
}

function importFrom(m: Record<string, unknown>) {
  const marks = importBookmarks(m.bookmarks)
  const prefs = parse<Prefs>(m.prefs)
  const engine = importEngine(prefs)
  const exts = importExtensions(prefs, parse<Prefs>(m.secure))
  return `Imported ${marks} bookmarks, ${m.visits} pages, ${m.cookies ?? 0} sign-ins${exts ? `, ${exts} extensions` : ''}${engine} from ${m.name}${m.note ? `. ${m.note}` : ''}`
}

function App() {
  const b = useBrowser()
  const [settings, setSettings] = useState<{ open: boolean; section: string }>({ open: false, section: '' })
  const toast = useToasts()
  useLayoutReport()

  // Exo's Appearance and material, as Exo draws them: <html data-exo-theme> and data-exo-glass.
  useEffect(() => {
    const root = document.documentElement
    root.dataset.exoTheme = b.theme
    if (b.settings.material === 'solid') root.dataset.exoGlass = 'solid'
    else delete root.dataset.exoGlass
  }, [b.theme, b.settings.material])

  useEffect(() => onHost('settings.open', m => { closeMenu(true); setSettings({ open: true, section: (m.section as string) || '' }); send('overlay', 1) }), [])
  useEffect(() => onHost('downloads', () => { if (menuKind() === 'downloads') downloadsMenu(document.getElementById('exb-dl-btn')!) }), [])
  useEffect(() => onHost('extensions.open', () => extensionsMenu(document.getElementById('exb-tools')!)), [])
  // Exo Vault: its state from the host, and the sign-in fields pages report.
  useEffect(() => { const offs = [startVault(), startFill()]; return () => offs.forEach(off => off()) }, [])
  const closeSettings = () => { setSettings(s => ({ ...s, open: false })); send('overlay', 0) }
  // The host let go of the window's input (a page opened from Settings or another app): close with it. First run keeps it.
  useEffect(() => onHost('overlay.closed', () => {
    closeMenu(true)
    setSettings(s => ({ ...s, open: false }))
    const now = browser()
    if (now.settingsLoaded && now.settings.onboarded !== '1') send('overlay', 1)
  }), [])
  // First run: once, until it's finished, over the whole window.
  const firstRun = b.settingsLoaded && b.settings.onboarded !== '1'
  useEffect(() => { if (firstRun) send('overlay', 1) }, [firstRun])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && settings.open && !document.querySelector(':popover-open')) closeSettings() }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [settings.open])

  const classes = ['exb', isVertical(b.settings) ? 'is-vertical' : 'is-horizontal', isAutohide(b.settings) ? 'is-autohide' : '', b.revealTop ? 'reveal-top' : '', b.revealSide ? 'reveal-side' : ''].filter(Boolean).join(' ')
  return (
    // The sidebar's width, shared by the side tabs and the pill above them (and moved live while its edge is dragged).
    <div className={classes} style={{ '--exb-side-w': `${widthOf(b.settings)}px` } as CSSProperties} onContextMenu={e => { if (!(e.target as Element).closest('input')) e.preventDefault() }}>
      <Chrome settingsOpen={settings.open} onSettings={() => (settings.open ? closeSettings() : send('openSettings', ''))} />
      <MenuScrim />
      <MenuLayer />
      <Settings open={settings.open} section={settings.section} onClose={closeSettings} />
      <VaultSheet />
      <VaultFill />
      {firstRun ? <Onboarding onDone={() => { setSetting('onboarded', '1'); send('overlay', 0) }} /> : null}
      {toast ? <div className="exo-toast-stack exb-toasts"><div key={toast.key} className="exo-toast" role="status"><p className="min-w-0 flex-1 text-fg">{toast.text}</p></div></div> : null}
    </div>
  )
}

installMenuFit()
// Focus rings only after the keyboard moved focus, as in Exo (a menu opened by the mouse shows none).
installInputModality()
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
startHost()
