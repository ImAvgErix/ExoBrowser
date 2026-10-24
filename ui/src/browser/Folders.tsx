import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from 'react'
import { browser, holdInput, onHost, send, type Folder, type Tab } from './host'
import { openMenu, type Item } from './menus'
import * as I from './icons'

/*
 * Folders among a space's pinned tabs (side tabs), as Arc's: a folder's row opens and closes it, a tab dropped on it
 * goes in, right click renames it, makes one inside it or takes it away (what it held moves up). The window keeps them
 * (main.cpp TabFolder) and orders the pinned tabs to match: a folder's tabs, then the folders inside it, then the rest.
 * A live folder follows a site's feed instead: the window fetches it, this page reads its newest posts out of it.
 */

export type Post = { title: string; url: string }
const posts = new Map<number, Post[]>()
const postListeners = new Set<() => void>()
let postsVersion = 0

/** A feed's newest posts (RSS items or Atom entries), each a title and its web address; nothing else of it is used. */
function readFeed(xml: string): Post[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  return [...doc.querySelectorAll('item, entry')].slice(0, 8).map(it => {
    const link = it.querySelector('link[rel="alternate"][href]') ?? it.querySelector('link[href]') ?? it.querySelector('link')
    return { title: (it.querySelector('title')?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 200), url: (link?.getAttribute('href') ?? link?.textContent ?? '').trim() }
  }).filter(p => p.title && /^https?:\/\//.test(p.url))
}

if (typeof window !== 'undefined') onHost('feed', m => {
  posts.set(m.id as number, readFeed(String(m.xml ?? '')))
  postsVersion++
  for (const l of postListeners) l()
})
/** Draws again when a feed arrives. */
export const usePosts = () => useSyncExternalStore(on => { postListeners.add(on); return () => { postListeners.delete(on) } }, () => postsVersion)

export type FolderLine = { folder: Folder; depth: number; hidden: boolean; count: number }
export type PostLine = { post: Post; depth: number; hidden: boolean }
export type SideRow = FolderLine | PostLine | { tab: Tab; depth: number; hidden: boolean }

/** The side tabs' rows in the window's order: each folder, depth first, with its own tabs; then the other tabs. Tabs in
 *  a closed folder are kept (hidden), so a drag still counts every tab's place. */
export function sideRows(listed: Tab[], folders: Folder[]): SideRow[] {
  const rows: SideRow[] = []
  const inFolder = (t: Tab, id: number) => !!t.pinned && t.folder === id
  const count = (id: number): number => listed.filter(t => inFolder(t, id)).length + folders.filter(f => f.parent === id).reduce((n, f) => n + count(f.id), 0)
  const walk = (parent: number, depth: number, hidden: boolean) => {
    for (const f of folders.filter(x => x.parent === parent)) {
      const live = f.live ? posts.get(f.id) ?? [] : []
      rows.push({ folder: f, depth, hidden, count: f.live ? live.length : count(f.id) })
      const inside = hidden || !f.open
      if (!inside) for (const post of live) rows.push({ post, depth: depth + 1, hidden: false })
      for (const t of listed) if (inFolder(t, f.id)) rows.push({ tab: t, depth: depth + 1, hidden: inside })
      walk(f.id, depth + 1, inside)
    }
  }
  walk(0, 0, false)
  const ids = new Set(folders.map(f => f.id))
  for (const t of listed) if (!(t.pinned && t.folder && ids.has(t.folder))) rows.push({ tab: t, depth: 0, hidden: false })
  return rows
}

// The folder whose name is being typed, and whether the next folder made gets its name typed at once.
let renaming = 0
let nameNext = false
const listeners = new Set<() => void>()
const renameFolder = (id: number) => { renaming = id; for (const l of listeners) l() }
const useRenaming = () => useSyncExternalStore(on => { listeners.add(on); return () => { listeners.delete(on) } }, () => renaming)

/** A new folder in the space on screen (inside another, or with a tab in it), its name ready to type. */
export function newFolder(parent = 0, tab = 0) {
  nameNext = browser().settings.tabs === 'vertical'
  send('folderNew', parent, 'New folder', tab)
}

/** A folder just made by newFolder takes its name at once. */
export function useNameNewFolder(folders: Folder[]) {
  const newest = folders.reduce((n, f) => Math.max(n, f.id), 0)
  const seen = useRef(newest)
  useEffect(() => {
    if (newest > seen.current && nameNext) { nameNext = false; renameFolder(newest) }
    seen.current = newest
  }, [newest])
}

function folderMenu(f: Folder, x: number, y: number) {
  if (f.live) {
    openMenu([
      { label: 'Check for new posts', Icon: I.Reload, run: () => send('feedRefresh', f.id) },
      { label: 'Rename', Icon: I.Pencil, run: () => renameFolder(f.id) },
      '-',
      { label: 'Unfollow', Icon: I.Trash, run: () => send('folderDelete', f.id) },
    ], x, y)
    return
  }
  openMenu([
    { label: 'Rename', Icon: I.Pencil, run: () => renameFolder(f.id) },
    { label: 'New folder inside', Icon: I.FolderPlus, run: () => { if (!f.open) send('folderEdit', f.id, 'open', 1); newFolder(f.id) } },
    '-',
    { label: 'Remove folder, keep its tabs', Icon: I.Trash, run: () => send('folderDelete', f.id) },
  ], x, y)
}

/** A tab's menu: into a folder of its space, a new folder with it, or out of its folder. */
export function folderItems(tab: Tab): Item[] {
  const b = browser()
  if (tab.space === 0 || b.settings.tabs !== 'vertical') return []
  const here = b.folders.filter(f => f.space === tab.space && !f.live && f.id !== (tab.pinned ? tab.folder : 0))
  return [
    '-',
    ...here.map(f => ({ label: `Move to ${f.name}`, Icon: I.Folder, run: () => send('toFolder', tab.id, f.id) })),
    { label: 'New folder with this tab', Icon: I.FolderPlus, run: () => newFolder(0, tab.id) },
    ...(/^https?:/.test(tab.url) ? [{ label: 'Follow this site in a live folder', Icon: I.Rss, run: () => send('follow', tab.id) }] : []),
    ...(tab.pinned && tab.folder ? [{ label: 'Take out of folder', Icon: I.Undo, run: () => send('toFolder', tab.id, 0) }] : []),
  ]
}

export function FolderRow({ line, last }: { line: FolderLine; last: boolean }) {
  const { folder, depth, hidden, count } = line
  const editing = useRenaming() === folder.id
  const field = useRef<HTMLInputElement>(null)
  // While its name is typed, the keyboard stays on this page (taken once the window has handed it over: a menu that
  // just closed gave it back to the tab first).
  useEffect(() => {
    if (!editing) return
    // A folder out of sight (in a closed one) can't take a name: nothing waits for it.
    if (hidden) { renameFolder(0); return }
    holdInput('rename', true)
    const frame = requestAnimationFrame(() => { field.current?.focus(); field.current?.select() })
    return () => { cancelAnimationFrame(frame); holdInput('rename', false) }
  }, [editing, hidden])
  const toggle = () => send('folderEdit', folder.id, 'open', folder.open ? 0 : 1)
  return (
    <div role="button" tabIndex={0} aria-expanded={folder.open} data-folder={folder.live ? undefined : folder.id} hidden={hidden}
      className={`exb-vtab exb-folder${last ? ' is-last-pinned' : ''}`} style={{ '--depth': depth } as CSSProperties}
      onClick={() => { if (!editing) toggle() }}
      onKeyDown={e => { if (!editing && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle() } }}
      onContextMenu={e => { e.preventDefault(); folderMenu(folder, e.clientX, e.clientY) }}>
      <I.ChevronRight size={14} className={`exb-folder-chev${folder.open ? ' is-open' : ''}`} />
      {folder.live ? <I.Rss /> : folder.open ? <I.FolderOpen /> : <I.Folder />}
      {editing ? (
        <input ref={field} className="exb-edit exb-folder-edit" defaultValue={folder.name} spellCheck={false} aria-label="Folder name" maxLength={60}
          onClick={e => e.stopPropagation()}
          onKeyDown={e => {
            e.stopPropagation()
            if (e.key === 'Enter') e.currentTarget.blur()
            else if (e.key === 'Escape') { e.currentTarget.value = folder.name; e.currentTarget.blur() }
          }}
          onBlur={e => {
            const name = e.currentTarget.value.trim()
            if (name && name !== folder.name) send('folderEdit', folder.id, 'name', name)
            renameFolder(0)
          }} />
      ) : <span className="exb-tab-title">{folder.name}</span>}
      {!folder.open && count ? <span className="exb-folder-count">{count}</span> : null}
    </div>
  )
}

/** A live folder's post: its title; a click opens it in a new tab. */
export function PostRow({ line }: { line: PostLine }) {
  const open = () => send('navigate', line.post.url, 'new')
  return (
    <div role="link" tabIndex={0} className="exb-vtab exb-post" style={{ '--depth': line.depth } as CSSProperties} hidden={line.hidden}
      onClick={open} onKeyDown={e => { if (e.key === 'Enter') open() }}>
      <span className="exb-post-dot" aria-hidden="true" />
      <span className="exb-tab-title">{line.post.title}</span>
    </div>
  )
}
