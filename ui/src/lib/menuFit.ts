/**
 * Every menu, picker, popout and tooltip stays inside the window (and inside the list that clips it, such as
 * Discord's message list), 8px from the edge: it flips to the other side of what opened it (up from a message's
 * More button or the pointer, left of a submenu's row) when there is no room, and is moved inside the edge when
 * neither side fits, and scrolls when it is taller than the window. Installed once; it measures each one as it appears
 * and again when its size changes.
 * Native popovers anchored with CSS (components/ui/Menu.tsx) flip with position-try-fallbacks instead.
 */
const POPUPS = [
  '[role="menu"]', '[role="listbox"]', '[role="tooltip"]',
  '.exo-dc-menu', '.exo-dc-picker', '.exo-dc-popover', '.exo-dc-profile', '.exo-dc-soundboard-pop',
].join(',')
const EDGE = 8
/** Popouts that open beside a person or a row and slide to fit instead of flipping (Discord's profile popout, a submenu). */
const SLIDES = '.exo-dc-profile, .exo-dc-ctx-sub'

type Span = { start: number; size: number }

// Where it goes on one axis: as laid out if it fits, else mirrored across what opened it, else moved inside.
// `slide`: never mirrored, only moved inside, as Discord's profile popout slides up beside the person you
// clicked instead of jumping above them.
function place(at: Span, from: { start: number; end: number }, lo: number, hi: number, slide = false) {
  const fits = (start: number) => start >= lo && start + at.size <= hi
  if (fits(at.start)) return at.start
  const mirrored = from.start + from.end - at.start - at.size
  if (!slide && fits(mirrored)) return mirrored
  return Math.max(lo, Math.min(at.start, hi - at.size))
}

// The room a popup has: the window under the Bar, less what clips the list it is in. A popup drawn in the top layer
// is over the Bar and may use the whole window; one in a room is under it (a tall profile lost its banner there).
function room(el: HTMLElement, parent: HTMLElement | null) {
  const bar = el.matches(':popover-open, :modal') ? 0 : document.querySelector('.exo-titlebar')?.getBoundingClientRect().bottom ?? 0
  let top = bar, left = 0, bottom = window.innerHeight, right = window.innerWidth
  for (let up = parent; up && up !== document.body; up = up.parentElement) {
    const clip = getComputedStyle(up)
    if (clip.overflowX === 'visible' && clip.overflowY === 'visible') continue
    const r = up.getBoundingClientRect()
    top = Math.max(top, r.top); left = Math.max(left, r.left); bottom = Math.min(bottom, r.bottom); right = Math.min(right, r.right)
  }
  return { top, left, bottom, right }
}

// Taller than the room it has (a person's menu in a short window): it scrolls instead, and the cap lets go once the
// room grows. Each change is a style change, so it is measured again (true).
function cap(el: HTMLElement, height: number, space: number) {
  if (height > space + 1) { el.style.maxHeight = `${space}px`; el.style.overflowY = 'auto'; return true }
  if (!el.style.maxHeight || parseFloat(el.style.maxHeight) >= space) return false
  el.style.maxHeight = ''
  el.style.overflowY = ''
  return true
}

function fit(el: HTMLElement) {
  if (!el.isConnected) { sizes.unobserve(el); return }
  const style = getComputedStyle(el)
  const fixed = style.position === 'fixed'
  if ((!fixed && style.position !== 'absolute') || style.getPropertyValue('position-anchor').startsWith('--')) return
  // Measured as it will rest: without its last move, and past its opening animation.
  const [dx = 0, dy = 0] = el.style.translate.split(' ').map(v => parseFloat(v) || 0)
  const animations = el.getAnimations().filter(a => a.currentTime !== null && Number.isFinite(Number(a.effect?.getComputedTiming().endTime)))
  const times = animations.map(a => a.currentTime)
  animations.forEach(a => { a.currentTime = Number(a.effect?.getComputedTiming().endTime ?? 0) })
  const rect = el.getBoundingClientRect()
  animations.forEach((a, i) => { a.currentTime = times[i] })
  const box = new DOMRect(rect.left - dx, rect.top - dy, rect.width, rect.height)
  if (!box.width || !box.height) return
  // What opened it: the point it was put at (fixed), or the element it hangs from.
  const parent = fixed ? null : el.offsetParent as HTMLElement | null
  const from = parent?.getBoundingClientRect() ?? new DOMRect(el.offsetLeft, el.offsetTop, 0, 0)
  // The window, and every box between it and the element that clips it.
  const { top, left, bottom, right } = room(el, parent)
  if (cap(el, box.height, Math.floor(bottom - top - 2 * EDGE))) return
  const x = place({ start: box.left, size: box.width }, { start: from.left, end: from.right }, left + EDGE, right - EDGE)
  const y = place({ start: box.top, size: box.height }, { start: from.top, end: from.bottom }, top + EDGE, bottom - EDGE, el.matches(SLIDES))
  const [mx, my] = [Math.round(x - box.left), Math.round(y - box.top)]
  // Written only when it changes: the write is a style change this watches too.
  if (mx !== Math.round(dx) || my !== Math.round(dy)) el.style.translate = mx || my ? `${mx}px ${my}px` : ''
}

const sizes = new ResizeObserver(entries => entries.forEach(entry => fit(entry.target as HTMLElement)))
const seen = new WeakSet<Element>()

/** Starts keeping every popup inside the window (main.tsx). */
export function installMenuFit() {
  // A popup that moves without changing size (a tooltip on the next target, a picker that changes side) is measured again.
  const moves = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') { fit(record.target as HTMLElement); continue }
      record.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return
        const found = [...(node.matches(POPUPS) ? [node] : []), ...node.querySelectorAll<HTMLElement>(POPUPS)]
        for (const el of found) {
          if (seen.has(el)) continue
          seen.add(el)
          // Placed now, before it is drawn, and again once what opened it has settled (a hover bar that moved);
          // measured again when its size changes (its content loads).
          fit(el)
          requestAnimationFrame(() => fit(el))
          sizes.observe(el)
          moves.observe(el, { attributes: true, attributeFilter: ['style', 'class'] })
        }
      })
    }
  })
  moves.observe(document.body, { childList: true, subtree: true })
}
