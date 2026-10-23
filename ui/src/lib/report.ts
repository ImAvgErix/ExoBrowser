/**
 * UI-side failure reporting. Normalises whatever was thrown, drops repeats of
 * the same context+message inside a short window, echoes to the console in
 * dev, and hands the entry to a sink (the host log in the app). Never throws.
 */
import type { AppLogEntry } from './host'

export type ReportLevel = 'warn' | 'error'
export type ReportSink = (entry: AppLogEntry) => Promise<unknown> | void

const DEDUP_WINDOW_MS = 5_000
const RECENT_LIMIT = 200

const recent = new Map<string, number>()
let sink: ReportSink = () => undefined
let globalHandlersInstalled = false

/** Replace where reports go. Pass null to drop them. Used by main.tsx. */
export function setReportSink(next: ReportSink | null): void {
  sink = next ?? (() => undefined)
}

function describe(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message || error.name, stack: error.stack }
  }
  if (typeof error === 'string') return { message: error }
  return { message: String(error) }
}

function isRepeat(key: string, now: number): boolean {
  const last = recent.get(key)
  if (last !== undefined && now - last < DEDUP_WINDOW_MS) return true
  if (recent.size >= RECENT_LIMIT) pruneRecent(now)
  recent.set(key, now)
  return false
}

function pruneRecent(now: number): void {
  for (const [key, at] of recent) {
    if (now - at >= DEDUP_WINDOW_MS) recent.delete(key)
  }
  if (recent.size >= RECENT_LIMIT) recent.clear()
}

function deliver(entry: AppLogEntry): void {
  try {
    const result = sink(entry)
    if (result) void result.then(undefined, () => undefined)
  } catch { }
}

function echoInDev(context: string, message: string, error: unknown): void {
  if (import.meta.env?.DEV !== true) return
  console.error(`[exo] ${context}: ${message}`, error)
}

/** Record a failure the user would otherwise never hear about. Safe to call anywhere. */
export function report(error: unknown, context: string, options?: { level?: ReportLevel }): void {
  try {
    const { message, stack } = describe(error)
    if (isRepeat(`${context}\u001f${message}`, Date.now())) return
    echoInDev(context, message, error)
    deliver({ level: options?.level ?? 'error', message, context, stack })
  } catch { }
}

/** Route uncaught window errors and unhandled rejections through report(). Idempotent. */
export function installGlobalErrorReporting(): void {
  if (globalHandlersInstalled || typeof window === 'undefined') return
  globalHandlersInstalled = true
  window.addEventListener('error', (event) => {
    report(event.error ?? event.message, 'window.error')
  })
  window.addEventListener('unhandledrejection', (event) => {
    report(event.reason, 'window.unhandledrejection')
  })
}
