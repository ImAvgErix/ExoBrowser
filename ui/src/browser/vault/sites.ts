/** Which logins belong to a page: the same site (its registrable domain, so www and accounts. agree), never a lookalike. */

// Second-level names under a country's code that are themselves public suffixes (example.co.uk, example.com.au).
const SHARED = new Set(['co', 'com', 'net', 'org', 'gov', 'edu', 'ac', 'or', 'ne', 'go', 'gob', 'nic', 'mil', 'ltd', 'plc', 'sch', 'nom', 'gv'])

export function hostOf(url: string) {
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** example.com for accounts.example.com; example.co.uk for login.example.co.uk; an address stays whole. */
export function siteOf(host: string) {
  if (!host || /^[\d.]+$/.test(host) || host.includes(':')) return host
  const labels = host.split('.')
  if (labels.length < 3) return host
  const take = labels[labels.length - 1].length === 2 && SHARED.has(labels[labels.length - 2]) ? 3 : 2
  return labels.slice(-take).join('.')
}

export const siteOfUrl = (url: string) => siteOf(hostOf(url))

/** A login fills a page on its own site, and never a secure page's password into an insecure one. */
export function sameSite(saved: string, origin: string) {
  if (!saved || !origin || siteOfUrl(saved) !== siteOfUrl(origin)) return false
  return !(/^https:/i.test(saved) && /^http:/i.test(origin))
}

export function siteName(url: string) {
  const site = siteOfUrl(url)
  if (/^[\d.]+$/.test(site) || site.includes(':')) return site
  const label = site.split('.')[0] || site
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : url
}
