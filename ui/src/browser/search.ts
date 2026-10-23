// What a typed line means: an address or a search. Shared by the Bar and the new tab page.

const enc = encodeURIComponent

export const ENGINES = {
  brave: { name: 'Brave Search', short: 'Brave', url: (q: string) => `https://search.brave.com/search?q=${enc(q)}` },
  duckduckgo: { name: 'DuckDuckGo', short: 'DuckDuckGo', url: (q: string) => `https://duckduckgo.com/?q=${enc(q)}` },
  google: { name: 'Google', short: 'Google', url: (q: string) => `https://www.google.com/search?q=${enc(q)}` },
  startpage: { name: 'Startpage', short: 'Startpage', url: (q: string) => `https://www.startpage.com/do/search?q=${enc(q)}` },
  kagi: { name: 'Kagi', short: 'Kagi', url: (q: string) => `https://kagi.com/search?q=${enc(q)}` },
  bing: { name: 'Bing', short: 'Bing', url: (q: string) => `https://www.bing.com/search?q=${enc(q)}` },
} as const
export type EngineKey = keyof typeof ENGINES

export const engineOf = (key: string | undefined) => ENGINES[(key ?? 'brave') as EngineKey] ?? ENGINES.brave

export function looksLikeUrl(text: string) {
  if (/\s/.test(text)) return false
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(text) || /^(about|data|file|edge|view-source|chrome-extension):/i.test(text)) return true
  if (/^localhost(:\d+)?(\/|$)/i.test(text)) return true
  if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/|$)/.test(text)) return true
  return /^[^/?#]+\.[a-z]{2,}(:\d+)?([/?#].*)?$/i.test(text)
}

export function toUrl(text: string, engine: string | undefined) {
  const t = text.trim()
  if (!t) return null
  if (looksLikeUrl(t)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return t
    return (/^(localhost|\d{1,3}(\.\d{1,3}){3})/.test(t) ? 'http://' : 'https://') + t
  }
  return engineOf(engine).url(t)
}

export const hostOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' } }
export const isNewTab = (url: string) => hostOf(url) === 'newtab.exo'
