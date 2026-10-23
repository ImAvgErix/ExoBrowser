import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Button } from '../components/ui/Button'
import { useGlide } from '../lib/glide'
import { useLens } from '../lib/glass'
import { onHost, send, setSetting, setting, useBrowser, type Settings, type Tab } from './host'
import { engineOf, hostOf, isNewTab } from './search'
import * as I from './icons'
import { SearchBox, useSearch } from './SearchBox'
import { tabMenu, downloadsMenu } from './menus'

/*
 * Exo Browser's chrome, drawn with Exo's own parts: one Bar across the window (Exo's small glass, edge to edge),
 * the tabs under it or down the side, the address set into it. The host composites this transparent page over the
 * tab and draws the live glass under the Bar and the floating sidebar from the boxes reported here.
 */

// Read from the settings a render was given (React Compiler memoizes by what a component reads), or, outside a
// render, from the store.
export const isVertical = (s: Settings) => (s.tabs || 'horizontal') === 'vertical'
export const isAutohide = (s: Settings) => (s.autohide || 'off') === 'on'
export const widthOf = (s: Settings) => Math.min(420, Math.max(180, Number(s.sidebarWidth || '240') || 240))
const autohide = () => setting('autohide', 'off') === 'on'
export const tabTitle = (t: Tab) => isNewTab(t.url) ? 'New tab' : t.title || hostOf(t.url) || 'New tab'

/** The site's icon, a spinner while it loads, the grid for a new tab. */
export function Favicon({ tab }: { tab: Tab }) {
  const { favicons } = useBrowser()
  if (tab.loading) return <span className="exb-spin" aria-hidden="true" />
  if (isNewTab(tab.url)) return <I.Grid className="exb-fav-blank" />
  const fav = favicons[tab.id]
  return fav ? <img className="exb-fav" src={fav} alt="" /> : <I.Globe className="exb-fav-blank" />
}

/*
 * Every piece of Exo's glass on this page (the Bar, Search, menus, the Settings sheet, toasts). In Exo, CSS blurs
 * what is behind the glass; here what is behind it is the tab, another process this page can't see, so the window
 * draws that blur under each piece with Exo's own filters (small or large glass), and the page draws Exo's tint,
 * rim and words over it. Each is reported where it rests once shown (an auto-hidden Bar or sidebar slides its glass
 * itself). A scrim under a piece (Settings' room) is drawn by this page over the window's blur, so it dims it just as
 * Exo's glass sees it dimmed.
 */
const GLASS = '.exo-glass, .exo-shelf-sort-menu:popover-open, .exb-vault-fill, .exo-toast'
const LARGE = '.is-panel, .exo-shelf-sort-menu, .exo-toast'

function slideOf(el: Element): [number, number] {
  const group = el.closest('#exb-bar, #exb-side')
  const t = group ? getComputedStyle(group).translate : 'none'
  if (!t || t === 'none') return [0, 0]
  const [x = '0', y = '0'] = t.split(' ')
  return [parseFloat(x) || 0, parseFloat(y) || 0]
}

function glassSpec() {
  const items: string[] = []
  for (const el of document.querySelectorAll<HTMLElement>(GLASS)) {
    const style = getComputedStyle(el)
    if (!el.getClientRects().length || style.visibility === 'hidden') continue
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) continue
    const [dx, dy] = slideOf(el)
    const radius = Math.min(parseFloat(style.borderTopLeftRadius) || 0, r.height / 2)
    items.push([el.matches('.exo-glass.is-panel') ? 'p' : el.matches(LARGE) ? 'l' : 's', (r.left - dx).toFixed(1), (r.top - dy).toFixed(1), r.width.toFixed(1), r.height.toFixed(1),
      radius.toFixed(1), el.closest('#exb-side') ? 'd' : 't'].join(','))
  }
  return items.join(';')
}
let glassFrame = 0
let glassSent: string | null = null
/** Measured on the next frame and sent only when it changed (rebuilding the window's glass costs a frame). */
export const queueGlass = () => {
  cancelAnimationFrame(glassFrame)
  glassFrame = requestAnimationFrame(() => {
    const spec = glassSpec()
    if (spec !== glassSent) { glassSent = spec; send('glass', spec) }
  })
}
// Glass comes and goes with what the page shows: a panel opening, a menu (a popover: its toggle), an animation
// settling (a sheet grows in from 0.98).
if (typeof document !== 'undefined') {
  new MutationObserver(queueGlass).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] })
  for (const type of ['toggle', 'animationend', 'transitionend']) document.addEventListener(type, queueGlass, true)
  addEventListener('resize', queueGlass)
}

/** The page's layout as the window needs it: the Bar's height, the sidebar's width, auto-hide. */
export function useLayoutReport() {
  const b = useBrowser()
  const v = isVertical(b.settings), hide = isAutohide(b.settings)
  const width = widthOf(b.settings)
  useEffect(() => {
    send('chrome', v ? 52 : 94, v && !b.full ? width : 0, hide ? 1 : 0)
    queueGlass()
  }, [v, hide, width, b.full])
  useEffect(() => {
    const sizes = new ResizeObserver(queueGlass)
    sizes.observe(document.body)
    return () => sizes.disconnect()
  }, [])
}

function Address({ onEdit }: { onEdit: () => void }) {
  const b = useBrowser()
  const tab = b.tabs.find(t => t.id === b.active)
  const url = tab?.url ?? ''
  const blank = !url || isNewTab(url)
  const loading = !!tab?.loading && !blank
  // The field carries the page's loading: a light travels along it, then lands as a short glow.
  const [landed, setLanded] = useState(false)
  const was = useRef(loading)
  useEffect(() => {
    if (was.current && !loading) { setLanded(true); const t = setTimeout(() => setLanded(false), 420); was.current = loading; return () => clearTimeout(t) }
    was.current = loading
  }, [loading])
  let host = '', rest = '', secure = false
  if (!blank) {
    try {
      const u = new URL(url)
      secure = u.protocol === 'https:'
      if (u.protocol === 'http:' || u.protocol === 'https:') { host = u.hostname.replace(/^www\./, ''); rest = (u.pathname === '/' ? '' : u.pathname) + u.search }
      else host = url
    } catch { host = url }
  }
  const marked = b.bookmarks.some(m => m[0] === url)
  const store = url.match(/^https:\/\/chromewebstore\.google\.com\/detail\/(?:[^/]+\/)?([a-p]{32})/)
  const Lead = blank ? I.Search : secure ? I.Lock : I.Globe
  return (
    <>
      <button type="button" className="exb-address-text" onClick={onEdit} aria-label="Search or enter address" aria-keyshortcuts="Control+L">
        <Lead className="exb-address-icon" />
        {blank
          ? <span className="exb-address-placeholder">Search {engineOf(b.settings.engine).short} or type an address</span>
          : <span className="exb-address-url"><span className="exb-address-host">{host}</span><span className="exb-address-path">{rest}</span></span>}
      </button>
      {store ? <Button size="sm" className="exo-set-btn is-primary exb-store-add" onPress={() => send('extInstall', store[1])}>Add to Exo</Button> : null}
      {blank ? null : (
        <Button variant="ghost" size="sm" isIconOnly className={`exo-titlebar-button exb-star${marked ? ' is-on' : ''}`} aria-label="Bookmark" aria-pressed={marked}
          aria-keyshortcuts="Control+D" onPress={() => send('bookmark')}>
          <I.Star filled={marked} />
        </Button>
      )}
      <span className={`exb-load${loading ? ' is-loading' : ''}${landed ? ' is-landed' : ''}`} aria-hidden="true" />
    </>
  )
}

function Find({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const field = useRef<HTMLInputElement>(null)
  useEffect(() => { field.current?.focus(); send('pin', 1); return () => { send('findClose'); send('pin', 0) } }, [])
  useEffect(() => onHost('findResult', m => setResult(m.count ? `${m.index} of ${m.count}` : text ? 'No matches' : '')), [text])
  return (
    <div className="exb-find">
      <I.Search className="exb-address-icon" />
      <input ref={field} className="exb-find-input" value={text} placeholder="Find in page" spellCheck={false} autoComplete="off"
        onChange={e => { setText(e.target.value); send('find', e.target.value) }}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); send(e.shiftKey ? 'findPrev' : 'findNext') }
          if (e.key === 'Escape') { e.preventDefault(); onClose() }
        }} />
      <span className="exb-find-count">{result}</span>
      <Button variant="ghost" size="sm" isIconOnly className="exo-titlebar-button" aria-label="Previous" onPress={() => send('findPrev')}><I.ChevronUp /></Button>
      <Button variant="ghost" size="sm" isIconOnly className="exo-titlebar-button" aria-label="Next" onPress={() => send('findNext')}><I.ChevronDown /></Button>
      <Button variant="ghost" size="sm" isIconOnly className="exo-titlebar-button" aria-label="Close" onPress={onClose}><I.Close /></Button>
    </div>
  )
}


/** Download progress as a ring around the icon. */
function DownloadsButton() {
  const b = useBrowser()
  if (!b.downloaded) return null
  const active = b.downloads.filter(d => d.state === 'progress' || d.state === 'paused')
  const got = active.reduce((s, d) => s + d.received, 0), total = active.reduce((s, d) => s + (d.total || 0), 0)
  return (
    <Button variant="ghost" size="sm" isIconOnly className={`exo-titlebar-button exb-dl${active.length ? ' is-busy' : ''}`} aria-label="Downloads"
      onPress={() => downloadsMenu(document.getElementById('exb-dl-btn')!)} id="exb-dl-btn">
      <svg className="exb-ring" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" /><circle className="exb-arc" cx="10" cy="10" r="8"
        style={{ strokeDashoffset: 50.27 * (1 - (total ? got / total : 0.15)) }} /></svg>
      <I.Download size={14} />
    </Button>
  )
}

export function WindowButtons() {
  const { max } = useBrowser()
  return (
    <>
      <Button variant="ghost" size="sm" isIconOnly className="exo-winbtn exo-titlebar-button" aria-label="Minimize" onPress={() => send('min')}><I.Minus /></Button>
      <Button variant="ghost" size="sm" isIconOnly className="exo-winbtn exo-titlebar-button" aria-label={max ? 'Restore' : 'Maximize'} onPress={() => send('max')}>
        {max ? <I.Restore /> : <I.Maximize />}
      </Button>
      <Button variant="ghost" size="sm" isIconOnly className="exo-winbtn exo-titlebar-button is-close" aria-label="Close" onPress={() => send('closewin')}><I.Close /></Button>
    </>
  )
}

// Tabs, either strip: click opens, middle click or the close button closes, drag reorders, right click for more.
function useTabDrag(axis: 'x' | 'y', offset = 0) {
  const drag = useRef<{ el: HTMLElement; id: number; at: number; moved: boolean } | null>(null)
  return {
    onPointerDown(e: ReactPointerEvent<HTMLElement>, id: number) {
      if (e.button !== 0 || (e.target as Element).closest('[data-act]')) return
      drag.current = { el: e.currentTarget, id, at: axis === 'x' ? e.clientX : e.clientY, moved: false }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    onPointerMove(e: ReactPointerEvent<HTMLElement>) {
      const d = drag.current
      if (!d) return
      const delta = (axis === 'x' ? e.clientX : e.clientY) - d.at
      if (!d.moved && Math.abs(delta) < 6) return
      d.moved = true
      d.el.classList.add('is-dragging')
      d.el.style.transform = axis === 'x' ? `translateX(${delta}px)` : `translateY(${delta}px)`
    },
    onPointerUp(e: ReactPointerEvent<HTMLElement>) {
      const d = drag.current
      drag.current = null
      if (!d) return
      d.el.classList.remove('is-dragging')
      d.el.style.transform = ''
      if (!d.moved) { send('activate', d.id); return }
      const others = [...(d.el.parentElement?.querySelectorAll<HTMLElement>('[data-tab]') ?? [])].filter(c => c !== d.el)
      const p = axis === 'x' ? e.clientX : e.clientY
      let index = others.findIndex(c => { const r = c.getBoundingClientRect(); return p < (axis === 'x' ? r.left + r.width / 2 : r.top + r.height / 2) })
      if (index < 0) index = others.length
      send('move', d.id, offset + index)
    },
  }
}

function TabButton({ tab, className, drag }: { tab: Tab; className: string; drag: ReturnType<typeof useTabDrag> }) {
  const { active } = useBrowser()
  const on = tab.id === active
  return (
    <div role="tab" data-tab={tab.id} aria-selected={on} aria-current={on ? 'page' : undefined}
      className={`${className}${on ? ' is-on' : ''}${tab.sleeping && !on ? ' is-sleeping' : ''}`}
      onPointerDown={e => drag.onPointerDown(e, tab.id)} onPointerMove={drag.onPointerMove} onPointerUp={drag.onPointerUp}
      onAuxClick={e => { if (e.button === 1) send('close', tab.id) }}
      onContextMenu={e => { e.preventDefault(); tabMenu(tab.id, e.clientX, e.clientY) }}>
      <Favicon tab={tab} />
      <span className="exb-tab-title">{tabTitle(tab)}</span>
      {tab.audible || tab.muted ? (
        <button type="button" data-act="" className="exb-tab-act" aria-label={tab.muted ? 'Unmute' : 'Mute'} onClick={e => { e.stopPropagation(); send('mute', tab.id) }}>
          {tab.muted ? <I.VolumeOff size={14} /> : <I.Volume size={14} />}
        </button>
      ) : null}
      <button type="button" data-act="" className="exb-tab-act exb-tab-close" aria-label="Close tab" onClick={e => { e.stopPropagation(); send('close', tab.id) }}>
        <I.Close size={14} />
      </button>
    </div>
  )
}

function TopTabs() {
  const { tabs } = useBrowser()
  const glide = useGlide<HTMLElement>()
  useLens(glide)
  const drag = useTabDrag('x')
  const tight = tabs.length > 0 && (innerWidth - 80) / tabs.length < 104
  // The + follows the last tab, as in every browser, so it is always where the next tab will appear.
  return (
    <div className="exb-tabrow">
      <nav ref={glide} className={`exo-glass exo-top-rooms exo-glide exb-tabs${tight ? ' is-tight' : ''}`} aria-label="Tabs" role="tablist"
        onWheel={e => { const el = e.currentTarget; if (el.scrollWidth > el.clientWidth) el.scrollLeft += e.deltaY || e.deltaX }}>
        {tabs.map(tab => <TabButton key={tab.id} tab={tab} className={`exo-nav-btn exb-tab${tab.pinned ? ' is-pinned' : ''}`} drag={drag} />)}
        <Button variant="ghost" size="sm" isIconOnly className="exo-titlebar-button exb-new" aria-label="New tab" aria-keyshortcuts="Control+T" onPress={() => send('newtab')}>
          <I.Plus />
        </Button>
      </nav>
    </div>
  )
}

function SideTabs() {
  const { tabs, active, settings } = useBrowser()
  const pinned = tabs.filter(t => t.pinned)
  const glide = useGlide<HTMLDivElement>()
  const drag = useTabDrag('y', pinned.length)
  const grip = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    let w = widthOf(settings)
    const move = (ev: PointerEvent) => {
      w = Math.min(420, Math.max(180, Math.round(ev.clientX)))
      el.closest<HTMLElement>('.exb')?.style.setProperty('--exb-side-w', `${w}px`)
      send('chrome', 52, w, autohide() ? 1 : 0)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', () => { el.removeEventListener('pointermove', move); setSetting('sidebarWidth', String(w)) }, { once: true })
  }
  return (
    <aside id="exb-side" className="exo-glass exb-side">
      <button type="button" className="exb-side-new" aria-label="New tab" aria-keyshortcuts="Control+T" onClick={() => send('newtab')}><I.Plus /></button>
      {pinned.length ? (
        <div className="exb-side-pinned">
          {pinned.map(t => (
            <button key={t.id} type="button" className={`exb-ptab${t.id === active ? ' is-on' : ''}`} aria-label={tabTitle(t)} onClick={() => send('activate', t.id)}
              onContextMenu={e => { e.preventDefault(); tabMenu(t.id, e.clientX, e.clientY) }}>
              <Favicon tab={t} />
            </button>
          ))}
        </div>
      ) : null}
      <div ref={glide} className="exb-side-tabs exo-glide" role="tablist" aria-orientation="vertical">
        {tabs.filter(t => !t.pinned).map(tab => <TabButton key={tab.id} tab={tab} className="exb-vtab" drag={drag} />)}
      </div>
      <div className="exb-side-grip" onPointerDown={grip} aria-hidden="true" />
    </aside>
  )
}

export function Chrome({ settingsOpen, onSettings }: { settingsOpen: boolean; onSettings: () => void }) {
  const b = useBrowser()
  const search = useSearch()
  const [finding, setFinding] = useState(false)
  const v = isVertical(b.settings)
  // Exo's Bar: each group its own capsule of small Liquid Glass, its lens at the rim (lib/glass.ts).
  const nav = useRef<HTMLDivElement>(null)
  const address = useRef<HTMLDivElement>(null)
  const tools = useRef<HTMLDivElement>(null)
  useLens(nav)
  useLens(address)
  useLens(tools)
  useEffect(() => onHost('find', () => setFinding(true)), [])
  useLayoutEffect(queueGlass)
  return (
    <>
      <header id="exb-bar" className="exo-titlebar exb-bar">
        <div className="exb-bar-row">
          {/* Settings, then the page's own: reload, back, forward. */}
          <div ref={nav} className="exo-glass exo-titlebar-tools exb-pill exb-nav">
            <Button variant="ghost" size="sm" isIconOnly className={`exo-settings-btn exo-titlebar-button${settingsOpen ? ' is-on' : ''}`} aria-label="Settings"
              aria-pressed={settingsOpen} onPress={onSettings}><I.Settings /></Button>
            <Button variant="ghost" size="sm" isIconOnly className="exo-titlebar-button" aria-label="Reload" onPress={() => send('reload')}>
              {b.tabs.find(t => t.id === b.active)?.loading ? <I.Close /> : <I.Reload />}
            </Button>
            <Button variant="ghost" size="sm" isIconOnly className="exo-titlebar-button" aria-label="Back" isDisabled={!b.back} onPress={() => send('back')}><I.Back /></Button>
            <Button variant="ghost" size="sm" isIconOnly className="exo-titlebar-button" aria-label="Forward" isDisabled={!b.fwd} onPress={() => send('forward')}><I.Forward /></Button>
          </div>
          <div ref={address} id="exb-address" className="exo-glass exb-address">
            {finding ? <Find onClose={() => setFinding(false)} /> : <Address onEdit={() => search.open('edit')} />}
          </div>
          {/* The window's own buttons; a download in progress joins them while there is one. Extensions open with
              Ctrl+Shift+E (their menu hangs from here) and are managed in Settings. */}
          <div ref={tools} id="exb-tools" className="exo-glass exo-titlebar-tools exb-pill is-end">
            {b.downloaded ? <><DownloadsButton /><span className="exo-titlebar-divider" aria-hidden="true" /></> : null}
            <WindowButtons />
          </div>
        </div>
        {v ? null : <TopTabs />}
      </header>
      {v && !b.full ? <SideTabs /> : null}
      <SearchBox controller={search} />
    </>
  )
}

