/** Strong passwords from the system's secure random numbers, and an honest guess at how strong one is. */

export type Recipe = { length: number; upper: boolean; digits: boolean; symbols: boolean }
export const DEFAULT_RECIPE: Recipe = { length: 20, upper: true, digits: true, symbols: true }

// Look-alikes (l, 1, I, O, 0) left out, so a password read aloud or typed on a phone comes out right.
const LOWER = 'abcdefghijkmnopqrstuvwxyz', UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ', DIGITS = '23456789', SYMBOLS = '!@#$%^&*-_=+?'

/** A uniform pick from 0 to n - 1 (rejection sampling: no bias toward the start of a set). */
function pick(n: number) {
  const limit = Math.floor(0x100000000 / n) * n
  const buf = new Uint32Array(1)
  do crypto.getRandomValues(buf)
  while (buf[0] >= limit)
  return buf[0] % n
}

export function generate(recipe: Recipe = DEFAULT_RECIPE) {
  const sets = [LOWER, recipe.upper ? UPPER : '', recipe.digits ? DIGITS : '', recipe.symbols ? SYMBOLS : ''].filter(Boolean)
  const all = sets.join('')
  const length = Math.max(8, Math.min(64, recipe.length))
  // One from each chosen set, the rest from all of them, then shuffled (Fisher-Yates).
  const chars = [...sets.map(set => set[pick(set.length)]), ...Array.from({ length: length - sets.length }, () => all[pick(all.length)])]
  for (let i = chars.length - 1; i > 0; i--) {
    const j = pick(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

// The passwords people pick most, and patterns guessers try first.
const COMMON = new Set(['password', '123456', '12345678', '123456789', 'qwerty', 'abc123', 'password1', '111111', 'iloveyou', 'admin', 'welcome',
  'letmein', 'monkey', 'dragon', 'football', 'baseball', 'sunshine', 'princess', 'master', 'shadow', 'qwertyuiop', '1q2w3e4r', 'passw0rd', 'trustno1'])

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: 'Very weak' | 'Weak' | 'Fair' | 'Strong' | 'Very strong'; bits: number }

/** Bits of guessing it would take, from its length and the kinds of characters in it, less for common shapes. */
export function strength(password: string): Strength {
  const p = password ?? ''
  let pool = 0
  if (/[a-z]/.test(p)) pool += 26
  if (/[A-Z]/.test(p)) pool += 26
  if (/\d/.test(p)) pool += 10
  if (/[^a-zA-Z\d]/.test(p)) pool += 33
  let bits = p.length * Math.log2(Math.max(pool, 1))
  const lower = p.toLowerCase().replace(/[^a-z\d]/g, '')
  if (COMMON.has(lower) || COMMON.has(lower.replace(/\d+$/, ''))) bits = Math.min(bits, 10)
  if (/(.)\1\1/.test(p)) bits -= 10
  if (/(?:0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf|zxcv)/i.test(p)) bits -= 10
  if (/^[A-Za-z]+\d{1,4}[!.?]?$/.test(p)) bits = Math.min(bits, 35)
  bits = Math.max(0, Math.round(bits))
  const score = bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4
  return { score, label: (['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'] as const)[score], bits }
}
