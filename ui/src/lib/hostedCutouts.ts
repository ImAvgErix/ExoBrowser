/**
 * Exo's open popovers (menus drawn by this page). A hosted app's window is
 * native and sits over its room, so every room surface sends these rects with
 * its bounds and the host cuts them out of the app's visible region: Exo's
 * menus always show over Discord and the music apps.
 */
export type Cutout = { left: number; top: number; width: number; height: number }

const open = new Set<HTMLElement>()
const listeners = new Set<() => void>()
let watching = false

function watch() {
  if (watching) return
  watching = true
  // toggle does not bubble; capture still sees every popover's.
  document.addEventListener('toggle', event => {
    const target = event.target
    if (!(target instanceof HTMLElement) || !target.hasAttribute('popover')) return
    if ((event as ToggleEvent).newState === 'open') open.add(target)
    else open.delete(target)
    // Anchored popovers are placed by layout: read them on the next frame.
    requestAnimationFrame(() => listeners.forEach(listener => listener()))
  }, true)
}

export function cutouts(): Cutout[] {
  return [...open]
    .filter(element => element.isConnected)
    .map(element => element.getBoundingClientRect())
    .filter(rect => rect.width > 0 && rect.height > 0)
    .map(rect => ({ left: rect.left, top: rect.top, width: rect.width, height: rect.height }))
}

export function onCutouts(listener: () => void) {
  watch()
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
