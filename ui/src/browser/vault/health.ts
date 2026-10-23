import type { Item } from './store'
import { strength } from './generate'
import { siteOfUrl } from './sites'

/** Password health, worked out here alone: weak passwords, passwords used on more than one site, and sites that offer 2FA codes where none is saved. */

// Popular sites that offer authenticator-app (TOTP) codes.
const TWO_FACTOR = new Set([
  'google.com', 'youtube.com', 'microsoft.com', 'live.com', 'outlook.com', 'github.com', 'gitlab.com', 'bitbucket.org', 'amazon.com', 'aws.amazon.com',
  'facebook.com', 'instagram.com', 'x.com', 'twitter.com', 'discord.com', 'reddit.com', 'twitch.tv', 'tiktok.com', 'snapchat.com', 'linkedin.com',
  'dropbox.com', 'box.com', 'paypal.com', 'coinbase.com', 'binance.com', 'kraken.com', 'gemini.com', 'epicgames.com', 'ea.com', 'ubisoft.com',
  'battle.net', 'blizzard.com', 'riotgames.com', 'roblox.com', 'nintendo.com', 'playstation.com', 'xbox.com', 'slack.com', 'zoom.us', 'notion.so',
  'atlassian.com', 'cloudflare.com', 'digitalocean.com', 'heroku.com', 'npmjs.com', 'vercel.com', 'netlify.com', 'proton.me', 'tuta.com',
  'namecheap.com', 'godaddy.com', 'porkbun.com', 'shopify.com', 'stripe.com', 'wise.com', 'revolut.com', 'robinhood.com', 'kucoin.com',
  'bitwarden.com', '1password.com', 'lastpass.com', 'dashlane.com', 'adobe.com', 'autodesk.com', 'figma.com', 'canva.com', 'wordpress.com',
  'patreon.com', 'kickstarter.com', 'ebay.com', 'etsy.com', 'steamcommunity.com', 'gog.com', 'humblebundle.com', 'mega.nz', 'pcloud.com',
  'docker.com', 'openai.com', 'anthropic.com', 'mailchimp.com', 'hubspot.com', 'salesforce.com', 'zendesk.com', 'okta.com', 'duo.com',
])

export type Health = { weak: Item[]; reused: Item[]; missing2fa: Item[] }

export function health(items: Item[]): Health {
  const logins = items.filter(i => i.type === 'login' && !i.trashed && i.password)
  const uses = new Map<string, number>()
  for (const i of logins) uses.set(i.password!, (uses.get(i.password!) ?? 0) + 1)
  return {
    weak: logins.filter(i => strength(i.password!).score < 2),
    reused: logins.filter(i => (uses.get(i.password!) ?? 0) > 1),
    missing2fa: logins.filter(i => !i.totp && (i.urls ?? []).some(u => TWO_FACTOR.has(siteOfUrl(u)))),
  }
}
