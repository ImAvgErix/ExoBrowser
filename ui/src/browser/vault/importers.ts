import type { Field, Item, ItemType } from './store'
import { siteName } from './sites'

/*
 * Other password managers' exports, read into Exo Vault's items: any CSV (Chrome, Edge, Brave, Firefox, Safari,
 * Proton Pass, Bitwarden, 1Password, LastPass, Dashlane, KeePass and the like, by their column names), Bitwarden's
 * and Proton Pass's JSON, and Exo Vault's own JSON.
 */

/** RFC 4180: quoted fields, doubled quotes, line breaks inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some(f => f !== '')) rows.push(row)
      row = []
    } else field += c
  }
  row.push(field)
  if (row.some(f => f !== '')) rows.push(row)
  return rows
}

// Each of our fields, and the column names other apps give it (lowercase).
const COLUMNS: Record<string, string[]> = {
  name: ['name', 'title', 'item name', 'account', 'login name'],
  url: ['url', 'login_uri', 'website', 'web site', 'origin', 'hostname', 'login url', 'urls', 'uri'],
  username: ['username', 'login_username', 'user name', 'login', 'user', 'email', 'username2', 'e-mail', 'login email'],
  password: ['password', 'login_password', 'pass'],
  totp: ['totp', 'otp', 'login_totp', 'otpauth', 'one-time password', 'otpsecret', '2fa', 'otp secret', 'otp auth'],
  note: ['notes', 'note', 'extra', 'comments', 'comment', 'description'],
  type: ['type', 'category', 'item type'],
}

const column = (header: string[], field: string) => {
  const names = COLUMNS[field]
  return header.findIndex(h => names.includes(h.trim().toLowerCase()))
}

const TYPES: Record<string, ItemType> = { login: 'login', password: 'login', note: 'note', securenote: 'note', 'secure note': 'note', card: 'card', creditcard: 'card', identity: 'identity' }

function fromRow(cell: (field: string) => string): Partial<Item> {
  const url = cell('url')
  const urls = url ? url.split(/[,\s]+(?=https?:)/).map(u => u.trim()).filter(Boolean) : []
  const type = TYPES[cell('type').toLowerCase()] ?? (cell('password') || cell('username') ? 'login' : 'note')
  return {
    type, name: cell('name') || (urls[0] ? siteName(urls[0]) : ''), urls, username: cell('username'), password: cell('password'),
    totp: cell('totp'), note: cell('note'),
  }
}

export function fromCsv(text: string): Partial<Item>[] {
  const [header, ...rows] = parseCsv(text)
  if (!header || column(header, 'password') < 0 && column(header, 'note') < 0) return []
  const at = Object.fromEntries(Object.keys(COLUMNS).map(f => [f, column(header, f)]))
  return rows.map(r => fromRow(field => (at[field] >= 0 ? (r[at[field]] ?? '').trim() : '')))
}

// ---------------------------------------------------------------- JSON exports

type Json = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))
const obj = (v: unknown): Json => (v && typeof v === 'object' ? (v as Json) : {})
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

function bitwardenFields(item: Json): Field[] {
  return list(item.fields).map(f => ({ name: str(obj(f).name), value: str(obj(f).value), hidden: obj(f).type === 1 })).filter(f => f.name || f.value)
}

function bitwardenCard(c: Json): Partial<Item> {
  const month = str(c.expMonth).padStart(2, '0'), year = str(c.expYear).slice(-2)
  return { type: 'card', cardholder: str(c.cardholderName), number: str(c.number), expiry: month && year ? `${month}/${year}` : '', cvv: str(c.code) }
}

function bitwardenIdentity(i: Json): Partial<Item> {
  return {
    type: 'identity', fullName: [i.firstName, i.middleName, i.lastName].map(str).filter(Boolean).join(' '), email: str(i.email), phone: str(i.phone),
    company: str(i.company), address: [i.address1, i.address2, i.address3].map(str).filter(Boolean).join(', '), city: str(i.city), region: str(i.state),
    postal: str(i.postalCode), country: str(i.country),
  }
}

/** Bitwarden's unencrypted JSON export: { items: [{ type: 1 login, 2 note, 3 card, 4 identity }] }. */
function fromBitwarden(data: Json): Partial<Item>[] {
  return list(data.items).map(raw => {
    const item = obj(raw)
    const base: Partial<Item> = { name: str(item.name), note: str(item.notes), favorite: !!item.favorite, fields: bitwardenFields(item) }
    const login = obj(item.login)
    if (item.type === 1)
      return { ...base, type: 'login', username: str(login.username), password: str(login.password), totp: str(login.totp), urls: list(login.uris).map(u => str(obj(u).uri)).filter(Boolean) }
    if (item.type === 3) return { ...base, ...bitwardenCard(obj(item.card)) }
    if (item.type === 4) return { ...base, ...bitwardenIdentity(obj(item.identity)) }
    return { ...base, type: 'note' }
  })
}

function protonItem(raw: unknown): Partial<Item> {
  const data = obj(obj(raw).data), meta = obj(data.metadata), content = obj(data.content)
  const base: Partial<Item> = {
    name: str(meta.name), note: str(meta.note),
    fields: list(data.extraFields).map(f => ({ name: str(obj(f).fieldName), value: str(obj(obj(f).data).content), hidden: obj(f).type === 'hidden' })),
  }
  if (data.type === 'login')
    return { ...base, type: 'login', username: str(content.itemUsername) || str(content.itemEmail), password: str(content.password), totp: str(content.totpUri), urls: list(content.urls).map(str) }
  if (data.type === 'creditCard')
    return { ...base, type: 'card', cardholder: str(content.cardholderName), number: str(content.number), expiry: str(content.expirationDate), cvv: str(content.verificationNumber), pin: str(content.pin) }
  if (data.type === 'identity')
    return { ...base, type: 'identity', fullName: str(content.fullName), email: str(content.email), phone: str(content.phoneNumber), company: str(content.company), address: str(content.streetAddress), city: str(content.city), region: str(content.stateOrProvince), postal: str(content.zipOrPostalCode), country: str(content.countryOrRegion) }
  return { ...base, type: 'note' }
}

/** Proton Pass's JSON (data.json in its export): { vaults: { id: { items: [...] } } }. */
const fromProton = (data: Json) => Object.values(obj(data.vaults)).flatMap(v => list(obj(v).items).map(protonItem))

export function fromJson(text: string): Partial<Item>[] {
  let data: Json
  try { data = obj(JSON.parse(text)) } catch { return [] }
  if (data.encrypted) return []
  if (Array.isArray(data.items) && data.version === 1 && list(data.items).every(i => typeof obj(i).type === 'string')) return list(data.items) as Partial<Item>[]
  if (Array.isArray(data.items)) return fromBitwarden(data)
  if (data.vaults) return fromProton(data)
  return []
}

/** Whatever a file holds, as items to bring in. */
export const readExport = (name: string, text: string) => (/\.json$/i.test(name) || /^\s*\{/.test(text) ? fromJson(text) : fromCsv(text))
