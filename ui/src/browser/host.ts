import { useSyncExternalStore } from 'react'

/*
 * The window (Exo Browser's C++ host) owns tabs, pages and the profile; this page draws the chrome and tells it
 * what the user did as "verb\targ\targ" (main.cpp OnUiMessage). The host answers with JSON messages ({ t: ... })
 * and data on request (api: /state.json, /extensions.json, ...).
 */

type WebView = {
  postMessage: (message: string) => void
  addEventListener: (type: 'message', listener: (event: MessageEvent) => void) => void
}
const webview = (window as unknown as { chrome?: { webview?: WebView } }).chrome?.webview

export const send = (...parts: (string | number)[]) => webview?.postMessage(parts.join('\t'))

export type Tab = { id: number; url: string; title: string; loading?: boolean; pinned?: boolean; muted?: boolean; audible?: boolean; sleeping?: boolean }
export type Visit = [url: string, title: string, visits: number, last: number]
export type Mark = [url: string, title: string, icon: string, sharp?: boolean]
export type Extension = { id: string; name: string; enabled: boolean; builtIn?: boolean; manifest?: string }
export type Download = { id: number; name: string; url: string; state: string; received: number; total: number }
export type Settings = Record<string, string>

type IconSet = string | Record<string, string>
type Action = { default_icon?: IconSet; default_popup?: string }
/** What the chrome reads from an extension's manifest.json. */
export type Manifest = {
  name?: string
  short_name?: string
  version?: string
  icons?: IconSet
  action?: Action
  browser_action?: Action
  page_action?: Action
  options_ui?: { page?: string }
  options_page?: string
}

export type Browser = {
  tabs: Tab[]
  active: number
  back: boolean
  fwd: boolean
  max: boolean
  full: boolean
  favicons: Record<number, string>
  extIcons: Record<string, string | null>
  history: Visit[]
  bookmarks: Mark[]
  extensions: Extension[]
  downloads: Download[]
  /** A download started since the window opened: the Bar shows its button from then on. */
  downloaded: boolean
  settings: Settings
  /** The host has sent the settings (so a missing one means unset, not not yet known). */
  settingsLoaded: boolean
  theme: 'void' | 'dark' | 'light'
  revealTop: boolean
  revealSide: boolean
}

let store: Browser = {
  tabs: [], active: 0, back: false, fwd: false, max: false, full: false, favicons: {}, extIcons: {}, history: [], bookmarks: [],
  extensions: [], downloads: [], downloaded: false, settings: {}, settingsLoaded: false, theme: 'void', revealTop: true, revealSide: true,
}
const listeners = new Set<() => void>()
const update = (next: Partial<Browser>) => {
  store = { ...store, ...next }
  for (const listener of listeners) listener()
}
export const useBrowser = () => useSyncExternalStore(on => { listeners.add(on); return () => listeners.delete(on) }, () => store)
export const browser = () => store

export const setting = (key: string, fallback: string) => store.settings[key] || fallback
export function setSetting(key: string, value: string) {
  update({ settings: { ...store.settings, [key]: value } })
  send('set', key, value)
}

// Messages the page reacts to beyond the store (Search opening, Settings opening, toasts, imports).
type Message = { t: string } & Record<string, unknown>
const handlers = new Map<string, Set<(message: Message) => void>>()
export function onHost(type: string, handler: (message: Message) => void) {
  if (!handlers.has(type)) handlers.set(type, new Set())
  handlers.get(type)!.add(handler)
  return () => { handlers.get(type)?.delete(handler) }
}

// Data the host reads on request, by path.
let apiSeq = 0
const waits = new Map<string, (data: unknown) => void>()
export function api<T>(path: string): Promise<T | null> {
  return new Promise(resolve => {
    if (!webview) { resolve(null); return }
    const id = String(++apiSeq)
    waits.set(id, data => resolve(data as T))
    send('api', id, path)
    setTimeout(() => { if (waits.delete(id)) resolve(null) }, 5000)
  })
}

export function manifestOf(x: Extension): Manifest {
  try { return JSON.parse((x.manifest ?? '').trimStart()) as Manifest } catch { return {} }
}
/** The icon file nearest `size` px in a manifest's icon set. */
export function iconPath(set: IconSet | undefined, size: number): string | null {
  if (!set) return null
  if (typeof set === 'string') return set
  const sizes = Object.keys(set).map(Number).sort((a, b) => Math.abs(a - size) - Math.abs(b - size))
  return set[sizes[0]] ?? null
}
const toolbarIcon = (m: Manifest) => iconPath(m.action?.default_icon ?? m.browser_action?.default_icon ?? m.page_action?.default_icon ?? m.icons, 32)

const fromHost: Record<string, (m: Message) => void> = {
  state(m) {
    const tabs = m.tabs as Tab[]
    const favicons = Object.fromEntries(Object.entries(store.favicons).filter(([id]) => tabs.some(t => t.id === Number(id))))
    update({ tabs, active: m.active as number, back: !!m.back, fwd: !!m.fwd, max: !!m.max, full: !!m.full, favicons })
  },
  fav(m) {
    const favicons = { ...store.favicons }
    if (m.fav) favicons[m.id as number] = m.fav as string; else delete favicons[m.id as number]
    update({ favicons })
  },
  history: m => update({ history: m.items as Visit[] }),
  visit(m) {
    const item = m.item as Visit
    update({ history: [item, ...store.history.filter(h => h[0] !== item[0])] })
  },
  bookmarks: m => update({ bookmarks: m.items as Mark[] }),
  settings: m => update({ settings: m.values as Settings, settingsLoaded: true, theme: (m.theme as Browser['theme']) ?? store.theme }),
  extensions(m) {
    const extensions = m.items as Extension[]
    for (const x of extensions) {
      const path = toolbarIcon(manifestOf(x))
      if (path && !(x.id in store.extIcons)) { store.extIcons[x.id] = null; send('extIcon', x.id, path.replace(/^\//, '')) }
    }
    update({ extensions })
  },
  extIcon: m => update({ extIcons: { ...store.extIcons, [m.id as string]: (m.icon as string) || null } }),
  downloads(m) {
    const downloads = m.items as Download[]
    const started = downloads.some(d => d.state === 'progress') && !store.downloads.some(d => d.state === 'progress')
    update({ downloads, downloaded: store.downloaded || started })
  },
  revealed: m => update({ revealTop: !!m.top, revealSide: !!m.side }),
  api(m) {
    const done = waits.get(m.id as string)
    waits.delete(m.id as string)
    done?.(m.data)
  },
}

webview?.addEventListener('message', ({ data }) => {
  const m = data as Message
  fromHost[m.t]?.(m)
  for (const handler of handlers.get(m.t) ?? []) handler(m)
})

/** A message raised by the page itself, as if the host had sent it (Find from Search's commands). */
export function local(m: Message) { for (const handler of handlers.get(m.t) ?? []) handler(m) }

/** Tell the host the page is listening; it answers with the settings, tabs, history and the rest. */
export function startHost() {
  send('ready')
  send('downloads')
}
