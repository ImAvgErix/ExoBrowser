import { useCallback, useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Section, Row, State } from '../components/settings/parts'
import { Menu } from '../components/ui/Menu'
import { Switch } from '../components/Switch'
import { Button } from '../components/ui/Button'
import { openVault } from './vault/store'
import { useGlide } from '../lib/glide'
import { api, iconPath, onHost, send, setSetting, useBrowser, manifestOf, type Download, type Extension, type Mark, type Visit } from './host'
import { ENGINES, hostOf } from './search'
import { extName } from './menus'
import * as I from './icons'

/*
 * Settings, as Exo's (SettingsPanel): the floating sheet with the section list on the left and every section in one
 * column beside it, Exo's rows, dropdowns, switches and buttons. Every list Exo Browser keeps is here and editable.
 */

const SECTIONS = [
  ['general', 'General'], ['newtab', 'New tab'], ['privacy', 'Privacy'], ['extensions', 'Extensions'],
  ['bookmarks', 'Bookmarks'], ['history', 'History'], ['downloads', 'Downloads'], ['import', 'Import'], ['about', 'About'],
] as const

type Data = {
  state: {
    history?: number; engine?: string; sources?: [string, string, boolean][]
    /** What Exo Shield is made of, from its build. */
    shield?: { ubol: string; ttv: string; hagezi: number; filters: number; built: string } | null
    version?: string
    /** Setup registered it as a browser with Windows, and whether it's the default now. */
    registered?: boolean
    isDefault?: boolean
  } | null
  extensions: (Extension & { icon?: string | null })[]
  bookmarks: Mark[]
  history: { items: Visit[]; favicons: Record<string, string> }
  downloads: Download[]
  /** The first answers are in: until then nothing says "none yet". */
  loaded: boolean
}

/** Exo's dropdown for a setting with choices (components/settings/Choice.tsx): its Menu and trigger, this chevron. */
export function Choice({ label, value, choices, onChange }: { label: string; value: string; choices: { value: string; label: string }[]; onChange: (value: string) => void }) {
  const anchor = `--exb-choice-${useId().replace(/[^a-zA-Z0-9]/g, '')}` as const
  return (
    <Menu label={label} anchor={anchor} offset={4} triggerClassName="exo-shelf-sort-trigger exo-graphics-menu"
      trigger={<>{choices.find(c => c.value === value)?.label ?? 'Set elsewhere'}<I.ChevronDown size={12} /></>}
      items={choices.map(c => ({ id: c.value, label: c.label }))} checked={value} onAction={id => { if (id !== value) onChange(id) }} />
  )
}

const size = (n: number) => n >= 1e9 ? (n / 1e9).toFixed(1) + ' GB' : n >= 1e6 ? (n / 1e6).toFixed(1) + ' MB' : n >= 1e3 ? Math.round(n / 1e3) + ' KB' : n + ' B'

// An extension's icon, read once per extension and file.
const extIcons = new Map<string, Promise<string | null>>()
const extIcon = (x: Extension) => {
  const m = manifestOf(x)
  const path = iconPath(m.icons ?? m.action?.default_icon, 48)
  if (!path) return Promise.resolve(null)
  const key = `${x.id}/${path.replace(/^\//, '')}`
  if (!extIcons.has(key)) extIcons.set(key, api<string>(`/exticon/${key}`))
  return extIcons.get(key)!
}

/**
 * What Settings shows, each part read again only when the host says that part changed (a download's progress
 * no longer reloads the whole history). Downloads come with their own message. A part's newest answer wins.
 */
function useData(open: boolean) {
  const [data, setData] = useState<Data>({ state: null, extensions: [], bookmarks: [], history: { items: [], favicons: {} }, downloads: [], loaded: false })
  const loaders = useMemo(() => {
    const asked: Record<string, number> = {}
    const part = <K extends keyof Data>(key: K, read: () => Promise<Data[K]>) => async () => {
      const n = asked[key] = (asked[key] ?? 0) + 1
      const value = await read()
      if (asked[key] === n) setData(d => ({ ...d, [key]: value }))
    }
    return {
      state: part('state', () => api<Data['state']>('/state.json')),
      extensions: part('extensions', async () => {
        const list = (await api<Extension[]>('/extensions.json')) ?? []
        const icons = await Promise.all(list.map(extIcon))
        return list.map((x, i) => ({ ...x, icon: icons[i] }))
      }),
      bookmarks: part('bookmarks', async () => (await api<Mark[]>('/bookmarks.json')) ?? []),
      history: part('history', async () => (await api<Data['history']>('/history.json')) ?? { items: [], favicons: {} }),
      downloads: part('downloads', async () => (await api<Download[]>('/downloads.json')) ?? []),
    }
  }, [])
  const load = useCallback(async () => {
    await Promise.all(Object.values(loaders).map(l => l()))
    setData(d => ({ ...d, loaded: true }))
  }, [loaders])
  useEffect(() => { if (open) void load() }, [open, load])
  useEffect(() => {
    if (!open) return
    // History and bookmarks change in bursts (an import, a page's icon): read once the burst is over.
    let later = 0
    const soon = () => { clearTimeout(later); later = window.setTimeout(() => { void loaders.bookmarks(); void loaders.history() }, 300) }
    const offs = [
      onHost('downloads', m => setData(d => ({ ...d, downloads: (m.items as Download[]) ?? d.downloads }))),
      onHost('bookmarks', () => void loaders.bookmarks()),
      onHost('history', soon),
      onHost('refresh', soon),
      onHost('extensions', () => void loaders.extensions()),
      onHost('importSources', () => void loaders.state()),
    ]
    return () => { clearTimeout(later); offs.forEach(off => off()) }
  }, [open, loaders])
  return { data, reload: load }
}

const Lead = ({ src, Icon = I.Globe }: { src?: string | null; Icon?: I.Icon }) =>
  src ? <img className="exb-set-lead" src={src} alt="" /> : <Icon className="exb-set-lead is-blank" />

function Bookmarks({ marks, loaded }: { marks: Mark[]; loaded: boolean }) {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const list = useRef<HTMLDivElement>(null)
  // Reordering: the row follows the pointer by its handle and the others make room (transforms only).
  const drag = (e: ReactPointerEvent<HTMLSpanElement>, from: number) => {
    if (e.button !== 0) return
    e.preventDefault()
    const handle = e.currentTarget
    const rows = [...(list.current?.querySelectorAll<HTMLElement>('[data-mark]') ?? [])]
    const row = rows[from]
    const tops = rows.map(r => r.offsetTop), h = row.offsetHeight, y0 = e.clientY
    let to = from
    row.classList.add('is-dragging')
    handle.setPointerCapture(e.pointerId)
    const move = (ev: PointerEvent) => {
      const dy = ev.clientY - y0
      row.style.transform = `translateY(${dy}px)`
      to = Math.max(0, Math.min(rows.length - 1, tops.findLastIndex(t => t <= tops[from] + dy + h / 2)))
      rows.forEach((r, i) => {
        if (r === row) return
        const shift = from < to && i > from && i <= to ? -h : from > to && i >= to && i < from ? h : 0
        r.style.transform = shift ? `translateY(${shift}px)` : ''
      })
    }
    const up = () => {
      handle.removeEventListener('pointermove', move)
      for (const r of rows) r.style.transform = ''
      row.classList.remove('is-dragging')
      if (to !== from) send('bookmarkMove', from, to)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up, { once: true })
    handle.addEventListener('pointercancel', up, { once: true })
  }
  const add = () => {
    let u = url.trim()
    if (!u) return
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u
    send('bookmarkAdd', u, name.trim())
    setUrl(''); setName('')
  }
  return (
    <Section id="bookmarks" title="Bookmarks" action={
      <div className="exb-set-actions">
        <Button size="sm" className="exo-set-btn" onPress={() => send('bookmarksImport')}>Import file</Button>
        <Button size="sm" className="exo-set-btn" onPress={() => send('bookmarksExport')}>Export file</Button>
      </div>}>
      <Row label="Add a bookmark" detail="Shown on the new tab page. Edit a name or address in place, drag to reorder">
        <input className="exo-field exb-field" placeholder="Address" value={url} spellCheck={false} onChange={e => setUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }} />
        <input className="exo-field exb-field" placeholder="Name" value={name} spellCheck={false} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }} />
        <Button size="sm" className="exo-set-btn is-primary" onPress={add}>Add</Button>
      </Row>
      <div ref={list}>
        {marks.length ? marks.map(([u, title, fav], i) => (
          <div key={u} className="exo-set-item exb-mark" data-mark="">
            <div className="exo-set-item-main">
              <span className="exb-handle" aria-label="Drag to reorder" onPointerDown={e => drag(e, i)}><I.Grip size={14} /></span>
              <Lead src={fav} />
              <div className="exo-set-item-copy">
                <input className="exb-edit exo-set-item-label" defaultValue={title} spellCheck={false} aria-label="Name"
                  onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} onBlur={e => { if (e.target.value !== title) send('bookmarkEdit', u, e.target.value.trim(), '') }} />
                <input className="exb-edit exo-set-item-detail" defaultValue={u} spellCheck={false} aria-label="Address"
                  onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} onBlur={e => { if (e.target.value.trim() !== u) send('bookmarkEdit', u, title, e.target.value.trim()) }} />
              </div>
              <div className="exo-set-item-control">
                <Button variant="ghost" size="sm" isIconOnly className="exo-titlebar-button" aria-label="Open" onPress={() => send('navigate', u, 'new')}><I.ExternalLink /></Button>
                <Button variant="ghost" size="sm" isIconOnly className="exo-titlebar-button" aria-label="Remove" onPress={() => send('unbookmark', u)}><I.Trash /></Button>
              </div>
            </div>
          </div>
        )) : loaded ? <Row label="No bookmarks yet" detail="Star a page, or import from another browser" /> : null}
      </div>
    </Section>
  )
}

function History({ history, loaded }: { history: Data['history']; loaded: boolean }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const items = history.items.filter(([u, t]) => !q || u.toLowerCase().includes(q) || (t || '').toLowerCase().includes(q)).slice(0, q ? 50 : 8)
  return (
    <Section id="history" title="History" action={
      <div className="exb-set-actions">
        <input className="exo-field exb-field" type="search" placeholder={`Search ${history.items.length} pages`} value={query} spellCheck={false} onChange={e => setQuery(e.target.value)} />
        <Button size="sm" className="exo-set-btn is-danger" onPress={() => send('clearHistory')}>Clear all</Button>
      </div>}>
      {items.length ? items.map(([u, t, , last]) => (
        <Row key={u} label={t || hostOf(u)} icon={<Lead src={history.favicons[hostOf(u)]} />}
          detail={`${new Date(last * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · ${u.replace(/^https?:\/\/(www\.)?/, '')}`}>
          <Button variant="ghost" size="sm" isIconOnly className="exo-titlebar-button" aria-label="Open" onPress={() => send('navigate', u, 'new')}><I.ExternalLink /></Button>
          <Button variant="ghost" size="sm" isIconOnly className="exo-titlebar-button" aria-label="Remove" onPress={() => send('historyDelete', u)}><I.Trash /></Button>
        </Row>
      )) : loaded ? <Row label={q ? `Nothing matches “${query}”` : 'No history'} /> : null}
    </Section>
  )
}

function Extensions({ list }: { list: Data['extensions'] }) {
  const [id, setId] = useState('')
  const add = () => {
    const found = id.match(/[a-p]{32}/)?.[0]
    if (found) { send('extInstall', found); setId('') }
  }
  return (
    <Section id="extensions" title="Extensions" action={
      <div className="exb-set-actions">
        <Button size="sm" className="exo-set-btn" onPress={() => send('extLoad')}>Load unpacked</Button>
        <Button size="sm" className="exo-set-btn" onPress={() => send('navigate', 'https://chromewebstore.google.com/', 'new')}>Chrome Web Store</Button>
      </div>}>
      <Row label="Add an extension" detail="Paste its Chrome Web Store link, or choose Add to Exo on its store page">
        <input className="exo-field exb-field" placeholder="Link or ID" value={id} spellCheck={false} onChange={e => setId(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }} />
        <Button size="sm" className="exo-set-btn is-primary" onPress={add}>Add</Button>
      </Row>
      {list.map(x => {
        const m = manifestOf(x)
        const options: string | undefined = m.options_ui?.page ?? m.options_page
        return (
          <Row key={x.id} label={extName(x)} icon={<Lead src={x.icon} Icon={I.Puzzle} />} detail={[m.version, x.builtIn ? 'Built in' : ''].filter(Boolean).join(' · ')}>
            {options ? <Button size="sm" className="exo-set-btn" onPress={() => send('navigate', `chrome-extension://${x.id}/${options.replace(/^\//, '')}`, 'new')}>Options</Button> : null}
            {x.builtIn ? null : <Button size="sm" className="exo-set-btn is-danger" onPress={() => send('extRemove', x.id)}>Remove</Button>}
            <Switch checked={x.enabled} label={`${extName(x)} on`} onChange={() => send('extToggle', x.id)} />
          </Row>
        )
      })}
    </Section>
  )
}

function Downloads({ items, loaded }: { items: Download[]; loaded: boolean }) {
  return (
    <Section id="downloads" title="Downloads" action={items.length ? <Button size="sm" className="exo-set-btn" onPress={() => send('dlClear')}>Clear finished</Button> : undefined}>
      {items.length ? items.map(d => {
        const live = d.state === 'progress' || d.state === 'paused'
        const status = live ? `${size(d.received)} of ${d.total ? size(d.total) : '?'}${d.state === 'paused' ? ' · Paused' : ''}`
          : d.state === 'done' ? size(d.total) : d.state === 'gone' ? 'Deleted' : d.state === 'cancelled' ? 'Cancelled' : 'Failed'
        return (
          <Row key={d.id} label={d.name} icon={<I.FileDown className="exb-set-lead is-blank" />} detail={<>
            {status} · {hostOf(d.url)}
            {live ? <span className="exb-progress"><i style={{ transform: `scaleX(${d.total ? d.received / d.total : 0})` }} /></span> : null}
          </>}>
            {live ? <>
              <Button variant="ghost" size="sm" isIconOnly className="exo-titlebar-button" aria-label={d.state === 'paused' ? 'Resume' : 'Pause'} onPress={() => send('dlPause', d.id)}>
                {d.state === 'paused' ? <I.Play /> : <I.Pause />}
              </Button>
              <Button variant="ghost" size="sm" isIconOnly className="exo-titlebar-button" aria-label="Cancel" onPress={() => send('dlCancel', d.id)}><I.Close /></Button>
            </> : <>
              {d.state === 'done' ? <Button size="sm" className="exo-set-btn" onPress={() => send('dlOpen', d.id)}>Open</Button> : null}
              {d.state === 'done' ? <Button variant="ghost" size="sm" isIconOnly className="exo-titlebar-button" aria-label="Show in folder" onPress={() => send('dlShow', d.id)}><I.FolderOpen /></Button> : null}
              <Button variant="ghost" size="sm" isIconOnly className="exo-titlebar-button" aria-label="Remove" onPress={() => send('dlRemove', d.id)}><I.Trash /></Button>
            </>}
          </Row>
        )
      }) : loaded ? <Row label="No downloads" /> : null}
    </Section>
  )
}

function Import({ sources }: { sources: [string, string, boolean][] }) {
  const [busy, setBusy] = useState('')
  // Done (or not): the button comes back either way.
  useEffect(() => {
    const offs = ['importData', 'importSources'].map(t => onHost(t, () => setBusy('')))
    return () => offs.forEach(off => off())
  }, [])
  useEffect(() => {
    if (!busy) return
    const t = setTimeout(() => setBusy(''), 120000)
    return () => clearTimeout(t)
  }, [busy])
  return (
    <Section id="import" title="Import">
      {sources.length ? sources.map(([key, name, firefox]) => (
        <Row key={key} label={name} detail={firefox ? 'Bookmarks, history and sign-ins' : 'Bookmarks, history, sign-ins, site icons, search engine and extensions'}>
          <Button size="sm" className="exo-set-btn is-primary" isDisabled={busy === key} onPress={() => { setBusy(key); send('import', key) }}>{busy === key ? 'Importing' : 'Import'}</Button>
        </Row>
      )) : <Row label="No other browsers to import" detail="A browser you have imported from is not offered again" />}
      <Row label="Bookmarks file" detail="The HTML file every browser exports">
        <Button size="sm" className="exo-set-btn" onPress={() => send('bookmarksImport')}>Import</Button>
        <Button size="sm" className="exo-set-btn" onPress={() => send('bookmarksExport')}>Export</Button>
      </Row>
      <Row label="Before importing" detail="Close the other browser, so its sign-ins can be read. Nothing is removed from it" />
    </Section>
  )
}

/** The sheet exists only while open, so its parts (the section list's glide) measure what is on screen. */
export function Settings({ open, section, onClose }: { open: boolean; section: string; onClose: () => void }) {
  return open ? <Sheet open section={section} onClose={onClose} /> : null
}

function Sheet({ open, section, onClose }: { open: boolean; section: string; onClose: () => void }) {
  const b = useBrowser()
  const { data } = useData(open)
  const [current, setCurrent] = useState('general')
  const scroll = useRef<HTMLDivElement>(null)
  const picked = useRef(0)
  const glide = useGlide<HTMLUListElement>()
  const s = (key: string, fallback: string) => b.settings[key] || fallback
  const choice = (key: string, label: string, fallback: string, choices: [string, string][], detail?: string) => (
    <Row label={label} detail={detail}>
      <Choice label={label} value={s(key, fallback)} choices={choices.map(([value, l]) => ({ value, label: l }))} onChange={v => setSetting(key, v)} />
    </Row>
  )
  const toggle = (key: string, label: string, detail: string, fallback: string, on = 'on', off = 'off') => (
    <Row label={label} detail={detail}>
      <Switch checked={s(key, fallback) === on} label={label} onChange={v => setSetting(key, v ? on : off)} />
    </Row>
  )

  const jump = (id: string, smooth = true) => {
    picked.current = Date.now()
    setCurrent(id)
    scroll.current?.querySelector(`#set-${id}`)?.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' })
  }
  useEffect(() => { if (open) requestAnimationFrame(() => jump(section || 'general', false)) }, [open, section])
  // The lists arrive a moment later and push what's below them down: land on the section asked for again.
  useEffect(() => { if (open && data.loaded && section) requestAnimationFrame(() => jump(section, false)) }, [data.loaded, open, section])
  // The list follows the scroll (not while a jump it started is still moving).
  const onScroll = () => {
    const el = scroll.current
    if (!el || Date.now() - picked.current < 700) return
    let id: string = SECTIONS[0][0]
    for (const [sid] of SECTIONS) {
      const sec = el.querySelector<HTMLElement>(`#set-${sid}`)
      if (sec && sec.offsetTop - 80 <= el.scrollTop) id = sid
    }
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) id = SECTIONS[SECTIONS.length - 1][0]
    setCurrent(id)
  }

  if (!open) return null
  const shield = data.state?.shield
  return (
    <div className="exo-set-room exb-set-room" onPointerDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <main className="exo-settings" aria-label="Settings">
        <span className="exo-glass is-panel exo-sheet-glass" aria-hidden="true" />
        <nav className="exo-settings-nav" aria-label="Settings sections">
          <ul ref={glide} className="exo-glide">
            {SECTIONS.map(([id, label]) => (
              <li key={id}>
                <button type="button" aria-current={current === id ? 'true' : undefined} className={current === id ? 'is-current' : undefined} onClick={() => jump(id)}>{label}</button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="exo-settings-scroll" ref={scroll} onScroll={onScroll}>
          <div className="exo-settings-layout">
            <div className="exo-settings-column">
              <Section id="general" title="General">
                <Row label="Default browser" detail={!data.state ? '' : data.state.isDefault ? 'Links from your other apps open in Exo Browser' : data.state.registered ? 'Windows opens its Default apps page: choose Set default there' : 'Install Exo Browser with its Setup first, so Windows lists it'}>
                  {!data.state ? null : data.state.isDefault ? <State on>Default</State> : <Button size="sm" className="exo-set-btn" isDisabled={!data.state.registered} onPress={() => send('makeDefault')}>Make default</Button>}
                </Row>
                {choice('appearance', 'Appearance', 'void', [['match', 'Match Windows'], ['light', 'Light'], ['dark', 'Dark'], ['void', 'Void']], 'Void is pure black, for OLED screens')}
                {choice('material', 'Material', 'glass', [['glass', 'Glass'], ['solid', 'Solid']], 'Liquid Glass, or solid surfaces with nothing showing through')}
                {choice('tabs', 'Tabs', 'horizontal', [['horizontal', 'Across the top'], ['vertical', 'Down the side']])}
                {toggle('autohide', 'Hide the toolbar', 'It slides in when the pointer touches the top edge, side tabs at the left edge', 'off')}
                {toggle('startup', 'Reopen tabs', 'On start, the tabs from last time. Off, a new tab', 'restore', 'restore', 'fresh')}
                {choice('engine', 'Search engine', 'brave', Object.entries(ENGINES).map(([k, v]) => [k, v.short]))}
              </Section>
              <Section id="newtab" title="New tab">
                {choice('bookmarkStyle', 'Bookmarks', 'cards', [['cards', 'Cards'], ['labels', 'Bar'], ['icons', 'Icons only'], ['off', 'Hidden']])}
                {toggle('tiles', 'Most visited', 'The sites you open most, under your bookmarks', 'on')}
              </Section>
              <Section id="privacy" title="Privacy">
                {/* Exo Shield is the blocker, Edge's balanced tracking prevention and Cloudflare's secure DNS together, always
                    at their best, so there is nothing to choose: it says what it does. */}
                <Row label="Exo Shield" detail="Ads, trackers, malware and pop-ups blocked before they load, Twitch and YouTube included, and every lookup encrypted through Cloudflare"><State on>On</State></Row>
                <Row label="Cookies, site data and cache" detail="Signs you out of every site"><Button size="sm" className="exo-set-btn is-danger" onPress={() => send('clearData')}>Clear</Button></Row>
                <Row label="Passwords" detail="Exo Vault keeps them, encrypted on this PC and nowhere else"><Button size="sm" className="exo-set-btn" onPress={() => { onClose(); openVault() }}>Exo Vault</Button></Row>
              </Section>
              <Extensions list={data.extensions} />
              <Bookmarks marks={data.bookmarks} loaded={data.loaded} />
              <History history={data.history} loaded={data.loaded} />
              <Downloads items={data.downloads} loaded={data.loaded} />
              <Import sources={data.state?.sources ?? []} />
              <Section id="about" title="About">
                <Row label={`Exo Browser ${data.state?.version ?? ''}`} detail={`Engine ${data.state?.engine ?? ''} · Microsoft Edge WebView2`} />
                <Row label="Exo Shield" detail={shield
                  ? `uBlock Origin Lite ${shield.ubol} by Raymond Hill, HaGeZi's Multi PRO (${shield.hagezi.toLocaleString()} sites), TTV LOL PRO ${shield.ttv} by Younes Aassila (all GPL-3.0). Lists from ${new Date(shield.built).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
                  : "uBlock Origin Lite by Raymond Hill, HaGeZi's DNS blocklists, TTV LOL PRO by Younes Aassila (all GPL-3.0)"} />
                <Row label="Exo Vault" detail="Argon2 by Daniel Dinu, Dmitry Khovratovich, Jean-Philippe Aumasson and Samuel Neves (CC0), with Windows' own AES-256-GCM" />
                <Row label="Exo's look" detail="Exo Launcher's interface: Inter and Josefin Sans (SIL OFL), Tabler Icons (MIT), React (MIT)" />
              </Section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

