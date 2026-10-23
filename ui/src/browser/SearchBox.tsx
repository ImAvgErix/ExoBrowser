import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { browser, local, onHost, send, setSetting, useBrowser, type Tab } from './host'
import { engineOf, hostOf, isNewTab, looksLikeUrl, toUrl } from './search'
import * as I from './icons'
import { openVault } from './vault/store'

/*
 * Search lives in the address: clicking it (or Ctrl+L, Ctrl+K) opens Exo's Search panel in place, the field over
 * the address, its suggestions under it: Exo's Ctrl+K rows (title over detail, the pointer selects, Enter opens),
 * large glass. Typing the start of a site you visit fills in the rest.
 */

type Mode = 'edit' | 'palette' | 'ntp' | 'new'
type Row =
  | { group: string }
  | { kind: 'go'; Icon: I.Icon; fav?: string; main: string; sub: string; url: string }
  | { kind: 'tab'; id: number; Icon: I.Icon; fav?: string; main: string; sub: string }
  | { kind: 'cmd'; Icon: I.Icon; main: string; run: () => void }

export const openSettingsAt = (section = '') => send('openSettings', section)

const COMMANDS: { title: string; Icon: I.Icon; run: () => void }[] = [
  { title: 'New tab', Icon: I.Plus, run: () => send('newtab') },
  { title: 'Close tab', Icon: I.Close, run: () => { const b = browser(); if (b.active) send('close', b.active) } },
  { title: 'Reopen closed tab', Icon: I.Undo, run: () => send('reopen') },
  { title: 'Bookmark this page', Icon: I.Star, run: () => send('bookmark') },
  { title: 'Duplicate tab', Icon: I.Copy, run: () => send('duplicate', browser().active) },
  { title: 'Pin tab', Icon: I.Pin, run: () => send('pin', browser().active) },
  { title: 'Mute tab', Icon: I.VolumeOff, run: () => send('mute', browser().active) },
  { title: 'Picture in picture', Icon: I.PictureInPicture, run: () => send('pip') },
  { title: 'Find in page', Icon: I.Search, run: () => local({ t: 'find' }) },
  { title: 'Close other tabs', Icon: I.Close, run: () => send('closeOthers', browser().active) },
  { title: 'Tabs down the side', Icon: I.SideTabs, run: () => setSetting('tabs', 'vertical') },
  { title: 'Tabs across the top', Icon: I.TopTabs, run: () => setSetting('tabs', 'horizontal') },
  { title: 'Hide the toolbar', Icon: I.TopTabs, run: () => setSetting('autohide', browser().settings.autohide === 'on' ? 'off' : 'on') },
  { title: 'Extensions', Icon: I.Puzzle, run: () => openSettingsAt('extensions') },
  { title: 'Exo Shield', Icon: I.Shield, run: () => openSettingsAt('privacy') },
  { title: 'Exo Vault', Icon: I.Vault, run: () => openVault() },
  { title: 'Bookmarks', Icon: I.Star, run: () => openSettingsAt('bookmarks') },
  { title: 'History', Icon: I.History, run: () => openSettingsAt('history') },
  { title: 'Downloads', Icon: I.Download, run: () => openSettingsAt('downloads') },
  { title: 'Import from another browser', Icon: I.Import, run: () => openSettingsAt('import') },
  { title: 'Settings', Icon: I.Settings, run: () => openSettingsAt() },
  { title: 'Get extensions', Icon: I.Puzzle, run: () => send('navigate', 'https://chromewebstore.google.com/', 'new') },
]

const frecency = (item: [string, string, number, number], now: number) => {
  const days = (now - item[3]) / 86400
  return item[2] * (days < 1 ? 100 : days < 4 ? 70 : days < 14 ? 50 : days < 31 ? 30 : days < 90 ? 10 : 2)
}
function matchScore(text: string, query: string) {
  if (!query) return 1
  const t = text.toLowerCase()
  let score = 0
  for (const word of query.toLowerCase().split(/\s+/).filter(Boolean)) {
    const at = t.indexOf(word)
    if (at < 0) return 0
    score += at === 0 ? 3 : /[\s./:-]/.test(t[at - 1]) ? 2 : 1
  }
  return score
}
const title = (t: Tab) => isNewTab(t.url) ? 'New tab' : t.title || hostOf(t.url) || 'New tab'
const bare = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '')

function rowsFor(text: string, mode: Mode, b: ReturnType<typeof browser>): Row[] {
  const now = Date.now() / 1000
  const rows: Row[] = []
  if (text) {
    const url = toUrl(text, b.settings.engine)!
    rows.push({ kind: 'go', Icon: looksLikeUrl(text) ? I.Globe : I.Search, main: text, sub: looksLikeUrl(text) ? 'Open' : `Search ${engineOf(b.settings.engine).short}`, url })
  }
  const open = new Set(b.tabs.map(t => t.url))
  const tabs = b.tabs.filter(t => (t.id !== b.active || mode === 'palette') && !isNewTab(t.url))
    .map(t => ({ t, s: matchScore(`${t.title} ${t.url}`, text) })).filter(x => x.s > 0).slice(0, text ? 5 : 6)
  if (tabs.length) {
    rows.push({ group: 'Switch to tab' })
    for (const { t } of tabs) rows.push({ kind: 'tab', id: t.id, fav: b.favicons[t.id], Icon: I.Globe, main: title(t), sub: hostOf(t.url) })
  }
  const marks = text ? b.bookmarks.map(m => ({ m, s: matchScore(`${m[1]} ${m[0]}`, text) })).filter(x => x.s > 0).slice(0, 4) : []
  if (marks.length) {
    rows.push({ group: 'Bookmarks' })
    for (const { m } of marks) rows.push({ kind: 'go', Icon: I.Star, fav: m[2], main: m[1] || hostOf(m[0]), sub: hostOf(m[0]), url: m[0] })
  }
  const marked = new Set(marks.map(x => x.m[0]))
  const hist = b.history.filter(h => !open.has(h[0]) && !marked.has(h[0]))
    .map(h => ({ h, s: matchScore(`${h[1]} ${bare(h[0])}`, text) })).filter(x => x.s > 0)
    .map(x => ({ ...x, score: x.s * 10 + Math.log2(1 + frecency(x.h, now)) })).sort((a, z) => z.score - a.score).slice(0, text ? 7 : 6)
  if (hist.length) {
    rows.push({ group: text ? 'History' : 'Recent' })
    for (const { h } of hist) rows.push({ kind: 'go', Icon: I.History, main: h[1] || hostOf(h[0]), sub: bare(h[0]), url: h[0] })
  }
  if (text && !looksLikeUrl(text)) {
    const cmds = COMMANDS.filter(c => matchScore(c.title, text) > 0).slice(0, 4)
    if (cmds.length) {
      rows.push({ group: 'Commands' })
      for (const c of cmds) rows.push({ kind: 'cmd', Icon: c.Icon, main: c.title, run: c.run })
    }
  }
  return rows
}

export function useSearch() {
  const [mode, setMode] = useState<Mode | null>(null)
  const [seed, setSeed] = useState('')
  const controller = {
    mode,
    seed,
    open(next: Mode, text = '', fromHost = false) {
      setSeed(text)
      setMode(next)
      if (!fromHost) send('overlay', 1)
    },
    close(silent = false) {
      setMode(null)
      if (!silent) send('overlay', 0)
    },
  }
  const ref = useRef(controller)
  ref.current = controller
  useEffect(() => onHost('overlay', m => ref.current.open(m.mode as Mode, (m.text as string) || '', true)), [])
  useEffect(() => onHost('close', () => ref.current.close()), [])
  useEffect(() => onHost('overlay.closed', () => ref.current.close(true)), [])
  return controller
}

export function SearchBox({ controller }: { controller: ReturnType<typeof useSearch> }) {
  const { mode, seed } = controller
  const b = useBrowser()
  const [text, setText] = useState('')
  const [sel, setSel] = useState(0)
  const [box, setBox] = useState({ left: 0, top: 0, width: 560 })
  const field = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)

  // Opening: the address (or what was typed elsewhere), selected; the panel over the address.
  useLayoutEffect(() => {
    if (!mode) return
    const b = browser()
    const tab = b.tabs.find(t => t.id === b.active)
    setText(mode === 'edit' && tab?.url && !isNewTab(tab.url) ? tab.url : seed)
    setSel(0)
    const place = () => {
      const cap = document.getElementById('exb-address')!.getBoundingClientRect()
      // Where the address rests: a hidden Bar is slid up by `translate` while it waits to come in.
      const slide = getComputedStyle(document.getElementById('exb-bar')!).translate
      const [dx = 0, dy = 0] = slide === 'none' ? [] : slide.split(' ').map(parseFloat)
      const width = Math.min(innerWidth - 24, Math.max(560, cap.width))
      setBox({ left: Math.max(12, Math.min(innerWidth - 12 - width, cap.left - dx + cap.width / 2 - width / 2)), top: cap.top - dy, width })
    }
    place()
    addEventListener('resize', place)
    requestAnimationFrame(() => { field.current?.focus(); if (mode === 'ntp') field.current?.setSelectionRange(9e9, 9e9); else field.current?.select() })
    return () => removeEventListener('resize', place)
  }, [mode, seed])

  if (!mode) return null
  const rows = rowsFor(text.trim(), mode, b)
  const picks = rows.filter((r): r is Exclude<Row, { group: string }> => !('group' in r))
  const choose = (i: number, newTab = false) => {
    const r = picks[i]
    if (!r) return
    if (r.kind === 'tab') { send('activate', r.id); controller.close(); return }
    if (r.kind === 'cmd') { controller.close(); r.run(); return }
    controller.close(true)
    send('navigate', r.url, newTab || mode === 'palette' || mode === 'new' ? 'new' : 'current')
  }
  // Typing the start of a site you visit fills in the rest, selected.
  const complete = (value: string, deleting: boolean) => {
    const input = field.current!
    if (!value || deleting || /\s/.test(value) || input.selectionStart !== value.length) return
    const lower = value.toLowerCase(), now = Date.now() / 1000
    let best = '', bestScore = 0
    for (const h of browser().history) {
      const url = bare(h[0])
      if (!url.toLowerCase().startsWith(lower)) continue
      const site = url.split('/')[0]
      const candidate = site.toLowerCase().startsWith(lower) ? site : url
      const score = frecency(h, now) + (candidate === site ? 50 : 0)
      if (score > bestScore) { best = candidate; bestScore = score }
    }
    // Written into the field and selected at once, so the next key replaces it.
    if (best.length > value.length) {
      input.value = value + best.slice(value.length)
      input.setSelectionRange(value.length, best.length)
      setText(input.value)
    }
  }

  let n = -1
  return (
    <div className="exb-search-layer" onPointerDown={e => { if (e.target === e.currentTarget) controller.close() }}>
      <div role="dialog" aria-label="Search" className="exo-glass is-panel exb-search" style={{ left: box.left, top: box.top, width: box.width }}>
        <div className="exb-search-field">
          <I.Search className="exb-search-icon" />
          <input ref={field} value={text} spellCheck={false} autoComplete="off" placeholder={`Search ${engineOf(b.settings.engine).short} or type an address`}
            onChange={e => { setText(e.target.value); setSel(0); complete(e.target.value, (e.nativeEvent as InputEvent).inputType?.startsWith('delete')) }}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => (s + 1) % Math.max(1, picks.length)) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => (s - 1 + picks.length) % Math.max(1, picks.length)) }
              else if (e.key === 'Enter') { e.preventDefault(); choose(sel, e.altKey || e.shiftKey) }
              else if (e.key === 'Escape') { e.preventDefault(); controller.close() }
            }} />
        </div>
        {rows.length ? (
          <div ref={list} className="exb-search-list" role="listbox">
            {rows.map((r, k) => {
              if ('group' in r) return <div key={'g' + k} className="exb-search-group">{r.group}</div>
              const i = ++n
              return (
                <div key={k} role="option" aria-selected={i === sel} className={`exb-search-row${i === sel ? ' is-selected' : ''}`}
                  onPointerMove={() => { if (i !== sel) setSel(i) }}
                  onPointerDown={e => { e.preventDefault(); choose(i, e.button === 1) }}>
                  {'fav' in r && r.fav ? <img className="exb-search-fav" src={r.fav} alt="" /> : <r.Icon className="exb-search-lead" />}
                  <span className="exb-search-text">
                    <span className="exb-search-main">{r.main}</span>
                    {'sub' in r && r.sub ? <span className="exb-search-sub">{r.sub}</span> : null}
                  </span>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
