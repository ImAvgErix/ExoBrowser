const disposable = new Map<string, number>([
  ['library.get', 120_000], ['library.refresh', 120_000],
  ['dlss.status', 120_000],
  ['app.checkUpdate', 30_000],
  ['dlss.updateAll', 600_000],
])

/**
 * Store jobs answer when the job ends: a Steam install answers when the whole
 * game has downloaded, and a queued uninstall or repair waits its turn. Their
 * progress arrives as events and Cancel ends them, so the request never times out.
 */
const untimed = new Set(['game.install', 'game.update', 'game.uninstall', 'game.repair', 'game.resumeDownload'])

export const requestTimeoutMs = (method: string, explicit?: number): number | null =>
  explicit ?? disposable.get(method) ?? (untimed.has(method) ? null : 600_000)

/** Installer, launch and already-started restore jobs keep their service ownership. */
export function cancelTimedOutRequest(method: string, requestId: string, post: (value: { method: string; params: { requestId: string } }) => void) {
  if (!disposable.has(method)) return false
  try { post({ method: 'rpc.cancel', params: { requestId } }); return true }
  catch { return false }
}
