/** Version 1 of the packaged UI/native bridge. Unknown result fields remain forward compatible. */
export const HOST_PROTOCOL_VERSION = 1
type RecordValue = Record<string, unknown>
function record(value: unknown): value is RecordValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
function flag(value: RecordValue, key: string, required = false): boolean {
  return value[key] === undefined ? !required : typeof value[key] === 'boolean'
}
export function validProgress(value: unknown): boolean {
  if (!record(value) || !flag(value, 'isActive', true) || !flag(value, 'canCancel', true)) return false
  return (value.gameId == null || typeof value.gameId === 'string') &&
    (value.percent == null || typeof value.percent === 'number' && Number.isFinite(value.percent) && value.percent >= 0 && value.percent <= 100) &&
    typeof value.phase === 'string' && typeof value.status === 'string'
}
export function validateHostResult(method: string, value: unknown): void {
  if (method === 'stores.matrix') {
    if (Array.isArray(value)) return
    throw new Error('The host returned an invalid store list.')
  }
  if (!record(value)) throw new Error(`Invalid host result: ${method}`)
  if (!flag(value, 'ok')) throw new Error(`Invalid host success state: ${method}`)
  if (method === 'game.progress' && !validProgress(value)) throw new Error('Invalid transfer progress from host.')
  if (method === 'app.checkUpdate' || method === 'app.installUpdate') {
    validateUpdate(value)
  }
  if ((method === 'library.get' || method === 'library.refresh') && !Array.isArray(value.games)) throw new Error('Invalid library response from host.')
  if (method === 'deps.list' && value.ok && !Array.isArray(value.items)) throw new Error('Invalid runtime response from host.')
}
function validateUpdate(value: RecordValue) {
  if (!flag(value, 'ok', true) || !['updateAvailable', 'alreadyLatest', 'installed', 'shouldExit'].every(key => flag(value, key))) throw new Error('Invalid update response from host.')
  if (value.ok && !(value.updateAvailable || value.alreadyLatest || value.installed)) throw new Error('The update check did not return a confirmed result. Retry the check.')
}
const EVENT_CHECKS: Record<string, (value: unknown) => boolean> = {
  'install.progress': validProgress,
  'library.updated': value => record(value) && Array.isArray(value.games),
  'music.status': value => record(value) && typeof value.ok === 'boolean',
  'music.playback': value => record(value) && typeof value.provider === 'string' && typeof value.status === 'string',
  'friends.badge': value => record(value) && typeof value.count === 'number',
  'game.runState': value => record(value) && typeof value.id === 'string' && flag(value, 'isRunning', true) && flag(value, 'canStop', true),
  'game.achievements': value => record(value) && typeof value.id === 'string' && typeof value.unlocked === 'number' && typeof value.total === 'number',
  'shaders.event': value => record(value) && typeof value.name === 'string',
}

export function validHostEvent(name: string, value: unknown): boolean {
  return Object.hasOwn(EVENT_CHECKS, name) ? EVENT_CHECKS[name](value) : true
}
