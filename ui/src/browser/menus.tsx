import { useLayoutEffect, useRef, useSyncExternalStore, type KeyboardEvent } from 'react'
import { browser, holdInput, isFirstRun, manifestOf, send, type Extension } from './host'
import { openSettingsAt } from './SearchBox'
import * as I from './icons'

/*
 * Exo's menus (components/ui/Menu.tsx, GameMenu.tsx): a native popover of large glass, 34px rows rounded 8px,
 * a quiet heading over a section. Under a button they hang from its right edge; a context menu opens at the
 * pointer. While one is open the window gives this page its input, so a click anywhere closes it.
 */

export type Item =
  | { label: string; Icon?: I.Icon; img?: string | null; run: () => void; off?: boolean; meta?: string; progress?: number }
  | { head: string }
  | '-'

type Open = { items: Item[]; x: number; y: number; right: boolean; kind: string }
let current: Open | null = null
const listeners = new Set<() => void>()
const set = (next: Open | null) => { current = next; for (const l of listeners) l() }

export function openMenu(items: Item[], x: number, y: number, right = false, kind = '') {
  if (isFirstRun()) return
  set({ items, x, y, right, kind })
  holdInput('menu', true)
}
export function closeMenu() {
  if (!current) return
  set(null)
  holdInput('menu', false)
}
export const menuKind = () => current?.kind ?? ''

export function tabMenu(id: number, x: number, y: number) {
  const b = browser()
  const tab = b.tabs.find(t => t.id === id)
  if (!tab) return
  openMenu([
    { label: tab.pinned ? 'Unpin' : 'Pin', Icon: I.Pin, run: () => send('pin', id) },
    { label: tab.muted ? 'Unmute' : 'Mute', Icon: tab.muted ? I.Volume : I.VolumeOff, run: () => send('mute', id) },
    { label: 'Duplicate', Icon: I.Copy, run: () => send('duplicate', id) },
    ...(id !== b.active ? [{ label: 'Put to sleep', Icon: I.Sleep, run: () => send('sleep', id) }] : []),
    '-',
    { label: 'Close other tabs', Icon: I.Close, run: () => send('closeOthers', id) },
    { label: 'Close', Icon: I.Close, run: () => send('close', id) },
  ], x, y)
}

export function extName(x: Extension) {
  const m = manifestOf(x)
  const n = x.name || m.name || ''
  return n.startsWith('__MSG_') ? (m.short_name && !m.short_name.startsWith('__MSG_') ? m.short_name : 'Extension') : n
}

export function extensionsMenu(button: HTMLElement) {
  const b = browser()
  const r = button.getBoundingClientRect()
  openMenu([
    { head: 'Extensions' },
    ...b.extensions.map(x => {
      const m = manifestOf(x)
      const popup: string | undefined = m.action?.default_popup ?? m.browser_action?.default_popup
      return {
        label: extName(x), img: b.extIcons[x.id], Icon: I.Puzzle, off: !x.enabled,
        run: () => popup && x.enabled ? send('extPopup', x.id, popup.replace(/^\//, ''), Math.round(r.right), Math.round(r.bottom + 6)) : openSettingsAt('extensions'),
      }
    }),
    '-',
    { label: 'Get extensions', Icon: I.ExternalLink, run: () => send('navigate', 'https://chromewebstore.google.com/', 'new') },
    { label: 'Manage extensions', Icon: I.Settings, run: () => openSettingsAt('extensions') },
  ], r.right, r.bottom, true, 'extensions')
}

const size = (n: number) => n >= 1e9 ? (n / 1e9).toFixed(1) + ' GB' : n >= 1e6 ? (n / 1e6).toFixed(1) + ' MB' : n >= 1e3 ? Math.round(n / 1e3) + ' KB' : n + ' B'

export function downloadsMenu(button: HTMLElement) {
  const r = button.getBoundingClientRect()
  const items: Item[] = [{ head: 'Downloads' }]
  for (const d of browser().downloads.slice(0, 6)) {
    const pct = d.total ? Math.round((100 * d.received) / d.total) : 0
    const live = d.state === 'progress' || d.state === 'paused'
    items.push({
      label: d.name, Icon: d.state === 'done' ? I.FileDown : I.Download, off: ['gone', 'failed', 'cancelled'].includes(d.state),
      meta: d.state === 'progress' ? `${pct}%` : d.state === 'paused' ? 'Paused' : d.state === 'done' ? size(d.total) : d.state === 'gone' ? 'Deleted' : d.state === 'cancelled' ? 'Cancelled' : 'Failed',
      progress: live ? pct / 100 : undefined,
      run: () => send(d.state === 'done' ? 'dlOpen' : 'dlPause', d.id),
    })
  }
  items.push('-', { label: 'All downloads', Icon: I.FolderOpen, run: () => openSettingsAt('downloads') })
  openMenu(items, r.right, r.bottom, true, 'downloads')
}

/** The open menu, if any. */
export function MenuLayer() {
  const open = useSyncExternalStore(on => { listeners.add(on); return () => listeners.delete(on) }, () => current)
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const menu = ref.current
    if (!menu || !open) return
    if (!menu.matches(':popover-open')) menu.showPopover()
    const w = menu.offsetWidth, h = menu.offsetHeight
    const left = open.right ? open.x - w : open.x
    menu.style.left = `${Math.max(8, Math.min(left, innerWidth - w - 8))}px`
    menu.style.top = `${Math.max(8, Math.min(open.y + 4, innerHeight - h - 8))}px`
    menu.style.transformOrigin = open.right ? 'top right' : 'top left'
    if (!menu.contains(document.activeElement)) menu.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true })
  }, [open])
  if (!open) return null
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const index = list.indexOf(document.activeElement as HTMLElement)
    const to = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: list.length - 1 }[event.key]
    if (to !== undefined) { event.preventDefault(); list[(to + list.length) % list.length]?.focus() }
    else if (event.key === 'Escape') { event.preventDefault(); closeMenu() }
  }
  return (
    <div ref={ref} popover="manual" role="menu" className={`exo-shelf-sort-menu exo-game-menu exb-menu${open.right ? ' is-right' : ''}`} onKeyDown={onKeyDown}>
      {open.items.map((item, i) => {
        if (item === '-') return <div key={i} className="exb-menu-rule" role="separator" />
        if ('head' in item) return <div key={i} className="exo-menu-section" role="presentation">{item.head}</div>
        return [
          <div key={i} role="menuitem" tabIndex={-1} className={`exo-menu-item${item.off ? ' is-off' : ''}`}
            onClick={() => { closeMenu(); item.run() }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeMenu(); item.run() } }}>
            {item.img ? <img className="exb-menu-img" src={item.img} alt="" /> : item.Icon ? <item.Icon /> : null}
            <span className="exb-menu-label">{item.label}</span>
            {item.meta ? <span className="exb-menu-meta">{item.meta}</span> : null}
          </div>,
          item.progress !== undefined ? <span key={i + 'p'} className="exb-menu-progress"><i style={{ transform: `scaleX(${item.progress})` }} /></span> : null,
        ]
      })}
    </div>
  )
}

/** Clicks outside the open menu (on this page, which takes the window's input while it is open) close it. */
export function MenuScrim() {
  const open = useSyncExternalStore(on => { listeners.add(on); return () => listeners.delete(on) }, () => current)
  return open ? <div className="exb-menu-scrim" onPointerDown={() => closeMenu()} /> : null
}
