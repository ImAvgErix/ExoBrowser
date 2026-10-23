type TextColour = 'white' | 'grey'
type TextSize = 'small' | 'normal' | 'large'

/**
 * Settings paint CSS custom properties. `settings.get` is async over the
 * WebView2 bridge, so the last pair is mirrored in localStorage and applied
 * synchronously at module load to avoid a one-frame flash of the defaults.
 */

const STORAGE_KEY = 'exo.textTheme'

const TEXT_SCALES: Record<TextSize, number> = {
  small: 0.9,
  normal: 1,
  large: 1.14,
}

export type TextTheme = { textColour: TextColour; textSize: TextSize }

const DEFAULT_TEXT_THEME: TextTheme = { textColour: 'white', textSize: 'normal' }

function isColour(value: unknown): value is TextColour {
  return value === 'white' || value === 'grey'
}

function isSize(value: unknown): value is TextSize {
  return value === 'small' || value === 'normal' || value === 'large'
}

export function readCachedTextTheme(): TextTheme {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_TEXT_THEME
    const parsed = JSON.parse(raw) as Partial<TextTheme>
    return {
      textColour: isColour(parsed.textColour) ? parsed.textColour : DEFAULT_TEXT_THEME.textColour,
      textSize: isSize(parsed.textSize) ? parsed.textSize : DEFAULT_TEXT_THEME.textSize,
    }
  } catch {
    return DEFAULT_TEXT_THEME
  }
}

let currentScale = 1
const scaleListeners = new Set<(scale: number) => void>()

/** Settings > General > Text size as a factor (small 0.9, normal 1, large 1.14). */
export const textScale = () => currentScale

/** Called whenever the text size changes; returns the unsubscribe. */
export function onTextScale(listener: (scale: number) => void) {
  scaleListeners.add(listener)
  return () => { scaleListeners.delete(listener) }
}

export function applyTextTheme(theme: TextTheme) {
  const root = document.documentElement
  const scale = TEXT_SCALES[theme.textSize] ?? 1
  // Ink comes from the Appearance (tokens.css), never set here: an inline color would beat every theme.
  root.style.setProperty('--exo-scale', String(scale))
  root.style.removeProperty('--exo-ui-zoom')
  root.style.zoom = '1'
  root.dataset.exoTextColour = theme.textColour
  root.dataset.exoTextSize = theme.textSize
  if (scale !== currentScale) {
    currentScale = scale
    for (const listener of scaleListeners) listener(scale)
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
  } catch {
    /* cache miss only costs a flash next launch */
  }
}

export function textThemeFrom(
  settings: { textColour?: string; textSize?: string } | null | undefined,
  fallback: TextTheme = DEFAULT_TEXT_THEME,
): TextTheme {
  return {
    textColour: isColour(settings?.textColour) ? settings.textColour : fallback.textColour,
    textSize: isSize(settings?.textSize) ? settings.textSize : fallback.textSize,
  }
}
