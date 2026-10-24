import { browser, send } from './host'
import { COLORS, SPACE_ICONS } from './look'

/*
 * Arc's sidebar (StorableSidebar.json, read from disk by the host, so it works after Arc stops opening): its spaces in
 * Arc's order, each one's pinned tabs with their folders (nested as in Arc) and Today tabs, and the favorites ("topApps").
 * The host makes them as Exo's spaces and tabs (importArc); nothing is fetched.
 *
 * Arc's lists alternate an id and its value: [id, value, id, value, ...].
 */

type Item = { title?: string | null; parentID?: string; childrenIds?: string[]; data?: { tab?: { savedURL?: string; savedTitle?: string }; list?: unknown; itemContainer?: { containerType?: Record<string, unknown> } } }
type Rgb = { red?: number; green?: number; blue?: number }
type SpaceModel = { title?: string; customInfo?: { windowTheme?: { primaryColorPalette?: { midTone?: Rgb } } } }
type Sidebar = {
  sidebar?: { containers?: { items?: unknown[]; spaces?: unknown[] }[] }
  firebaseSyncState?: { syncData?: { spaceModels?: unknown[] } }
}

const pairs = <T,>(list: unknown[] | undefined) => {
  const out = new Map<string, T>()
  for (let i = 0; list && i + 1 < list.length; i++) if (typeof list[i] === 'string' && list[i + 1] && typeof list[i + 1] === 'object') { out.set(list[i] as string, list[i + 1] as T); i++ }
  return out
}
// One field of a record: no tab, newline or the field separator.
const SEP = '\u001f'
const clean = (s: string) => s.split(SEP).join(' ').replace(/\s+/g, ' ').trim()

/** The swatch nearest Arc's theme color by hue, or none for a gray one. */
function nearest(c: Rgb | undefined) {
  if (!c) return ''
  const [r, g, b] = [c.red ?? 0, c.green ?? 0, c.blue ?? 0].map(v => Math.max(0, Math.min(1, v)))
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  if (max - min < 0.12) return ''
  const hue = (h: string) => {
    const n = parseInt(h.slice(1), 16), [x, y, z] = [n >> 16, (n >> 8) & 255, n & 255].map(v => v / 255)
    const M = Math.max(x, y, z), m = Math.min(x, y, z), d = M - m
    return d === 0 ? 0 : M === x ? ((y - z) / d + 6) % 6 * 60 : M === y ? ((z - x) / d + 2) * 60 : ((x - y) / d + 4) * 60
  }
  const d = max - min
  const h = max === r ? ((g - b) / d + 6) % 6 * 60 : max === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60
  const gap = (a: number) => Math.min(Math.abs(a - h), 360 - Math.abs(a - h))
  return [...COLORS].sort((a, z) => gap(hue(a[2])) - gap(hue(z[2])))[0][0]
}

// A tab as a record (with the folder it's in), or a folder: pinned ones come over as folders (F: Arc's id, its parent's,
// its name) before their tabs; elsewhere a folder's tabs come in order.
function tabRecords(items: Map<string, Item>, id: string, kind: string, out: string[], folder = '') {
  const it = items.get(id)
  if (!it) return
  const url = it.data?.tab?.savedURL
  if (url) out.push(['T', kind, clean(url), clean(it.title || it.data?.tab?.savedTitle || ''), folder].join(SEP))
  else if (it.data?.list !== undefined) {
    if (kind === 'p') out.push(['F', clean(id), folder, clean(it.title || 'Folder')].join(SEP))
    for (const child of it.childrenIds ?? []) tabRecords(items, child, kind, out, kind === 'p' ? clean(id) : folder)
  }
}

// A space's tabs: containerIDs holds "pinned", then the pinned containers, and "unpinned", then Today's.
function spaceRecords(items: Map<string, Item>, containers: string[], out: string[]) {
  let kind = ''
  for (const c of containers) {
    if (c === 'pinned' || c === 'unpinned') { kind = c === 'pinned' ? 'p' : 't'; continue }
    if (kind) for (const child of items.get(c)?.childrenIds ?? []) tabRecords(items, child, kind, out)
  }
}

/** Reads Arc's sidebar and sends it to the host; the number of spaces found, or 0 when it can't be read. */
export function importArc(text: unknown) {
  let data: Sidebar
  try { data = JSON.parse(text as string) as Sidebar } catch { return 0 }
  const box = data.sidebar?.containers?.find(c => Array.isArray(c.spaces) && Array.isArray(c.items))
  if (!box) return 0
  const items = pairs<Item>(box.items)
  const models = pairs<{ value?: SpaceModel }>(data.firebaseSyncState?.syncData?.spaceModels)
  const records: string[] = []
  // Favorites: every topApps container's tabs (Arc keeps one per profile; Exo's favorites are in every space).
  for (const it of items.values()) if ('topApps' in (it.data?.itemContainer?.containerType ?? {})) for (const id of it.childrenIds ?? []) tabRecords(items, id, 'f', records)
  const spaces = [...pairs<{ title?: string; containerIDs?: string[] }>(box.spaces)]
  // Each space an icon no space has yet (Arc's are emoji, which Exo doesn't draw).
  const used = new Set(browser().spaces.map(s => s.icon))
  spaces.forEach(([id, space], n) => {
    const model = models.get(id)?.value
    const icon = SPACE_ICONS.find(([k]) => !used.has(k))?.[0] ?? SPACE_ICONS[n % SPACE_ICONS.length][0]
    used.add(icon)
    records.push(['S', clean(model?.title || space.title || `Space ${n + 1}`), icon, nearest(model?.customInfo?.windowTheme?.primaryColorPalette?.midTone)].join(SEP))
    spaceRecords(items, space.containerIDs ?? [], records)
  })
  if (spaces.length) send('importArc', ...records)
  return spaces.length
}
