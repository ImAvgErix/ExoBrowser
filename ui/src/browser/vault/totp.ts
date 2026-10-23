/** 2FA codes (TOTP, RFC 6238) from a secret or an otpauth:// link, made here with Web Crypto's HMAC. */

export type Otp = { secret: Uint8Array<ArrayBuffer>; digits: number; period: number; algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512' }

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32(text: string): Uint8Array<ArrayBuffer> | null {
  const clean = text.toUpperCase().replace(/[\s=-]/g, '')
  if (!clean || /[^A-Z2-7]/.test(clean)) return null
  const out: number[] = []
  let bits = 0, value = 0
  for (const c of clean) {
    value = (value << 5) | ALPHABET.indexOf(c)
    bits += 5
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8 }
  }
  return out.length ? new Uint8Array(out) : null
}

const ALGORITHMS: Record<string, Otp['algorithm']> = { SHA1: 'SHA-1', SHA256: 'SHA-256', SHA512: 'SHA-512' }

/** A setup key ("JBSW Y3DP ...") or the otpauth:// link a site's QR code holds. */
export function parseOtp(input: string | undefined): Otp | null {
  const text = (input ?? '').trim()
  if (!text) return null
  if (/^otpauth:\/\//i.test(text)) {
    try {
      const url = new URL(text)
      if (url.host.toLowerCase() !== 'totp') return null
      const q = url.searchParams
      const secret = base32(q.get('secret') ?? '')
      if (!secret) return null
      const digits = Number(q.get('digits') ?? 6), period = Number(q.get('period') ?? 30)
      return { secret, digits: digits >= 6 && digits <= 8 ? digits : 6, period: period >= 10 && period <= 120 ? period : 30, algorithm: ALGORITHMS[(q.get('algorithm') ?? 'SHA1').toUpperCase()] ?? 'SHA-1' }
    } catch {
      return null
    }
  }
  const secret = base32(text)
  return secret ? { secret, digits: 6, period: 30, algorithm: 'SHA-1' } : null
}

export async function totpCode(otp: Otp, now = Date.now()) {
  const counter = Math.floor(now / 1000 / otp.period)
  const message = new Uint8Array(8)
  new DataView(message.buffer).setUint32(4, counter >>> 0)
  new DataView(message.buffer).setUint32(0, Math.floor(counter / 2 ** 32))
  const key = await crypto.subtle.importKey('raw', otp.secret, { name: 'HMAC', hash: otp.algorithm }, false, ['sign'])
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, message))
  const at = mac[mac.length - 1] & 15
  const code = (((mac[at] & 127) << 24) | (mac[at + 1] << 16) | (mac[at + 2] << 8) | mac[at + 3]) % 10 ** otp.digits
  return String(code).padStart(otp.digits, '0')
}

/** Seconds left on the current code. */
export const secondsLeft = (otp: Otp, now = Date.now()) => otp.period - (Math.floor(now / 1000) % otp.period)
