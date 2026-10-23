# Exo Browser privacy statement

**Exo Browser is local-first. It has no Exo account, no ads, no analytics and no telemetry.**

Exo Browser has no server of its own. Nothing you do in it is sent to Exo or its developer.

## What stays on this PC

Exo Browser keeps its data in `%LocalAppData%\ExoBrowser`, beside the app (in `app`), never inside it, so updates never touch it:

- your settings, open tabs, history, bookmarks, site icons, downloads list and the extensions you added (`settings.tsv`, `session.tsv`, `history.tsv`, `bookmarks.tsv`, `favicons.tsv`, `icons.tsv`, `downloads.tsv`, `extensions.tsv`);
- the browser profile (`Profile`): cookies and sign-ins, site data, the cache, and your extensions' own data, kept by Microsoft Edge WebView2 as Edge keeps them;
- Exo Vault (`vault.exovault`, and `vault.exovault.bak` from the save before): your logins, cards, notes and identities, encrypted (see **Exo Vault**);
- a working copy of Exo Shield (`Builtin`).

Settings > Privacy > Cookies, site data and cache clears cookies, every site's stored data and the cache, which signs you out of every site. Uninstalling with **Also remove my data and Exo Vault** deletes the whole folder; without it, the folder stays for a reinstall.

## Exo Vault

- Exo Vault is one file, encrypted with AES-256-GCM (Windows' own implementation). Its key is random and is itself locked twice: by a key made from your master password with Argon2id (256 MiB of memory, 4 passes), and, if you turn it on, by Windows Hello, through a key Windows Hello keeps for your Windows user on this PC (in its security chip when it has one).
- Your master password is never stored. Nobody can recover the vault without it or Windows Hello, Exo included.
- While the vault is open, its items are held in memory by Exo Browser's own interface, which has no access to the web. It locks after the time you choose, when Windows locks and when the PC sleeps, and forgets them.
- Filling a sign-in form: a small script in each page finds sign-in fields and tells Exo Browser where they are. Exo Browser matches logins to the page's real address as WebView2 reports it, not what the page claims, and the page gets nothing until you pick a login. After you sign in, it passes what you typed to Exo Browser so it can offer to save it.
- A password you copy is kept out of Windows' clipboard history and cloud clipboard, and cleared from the clipboard after 30 seconds.
- Password health (weak, reused and missing 2FA) is worked out on this PC. Exo Vault never sends your passwords, or parts of their hashes, anywhere.
- An export is one file encrypted with a password you choose. It leaves your PC only if you move it yourself.

## Bringing your things from other browsers

When you choose Import (or Bring in on first run), Exo Browser reads that browser's own files on this PC: bookmarks, history, site icons, cookies (so you stay signed in), its search engine and its Chrome Web Store extensions, and, into Exo Vault, its saved passwords. For Firefox it reads bookmarks, history, cookies and passwords. Encrypted data is decrypted on this PC with Windows' own protection for your user. Nothing is removed from the other browser, and nothing is sent anywhere. A password export file you import is read the same way.

## What leaves your PC

### The sites you visit

The sites you open, and what they load, minus what Exo Shield blocks. They see what any browser sends them. Exo Browser turns on Microsoft Edge's balanced tracking prevention, and does not send the "pings" some links ask for.

### Cloudflare (secure DNS)

Every address lookup (a site's name, like `github.com`) goes encrypted over HTTPS to Cloudflare's resolver (`chrome.cloudflare-dns.com`), with no unencrypted fallback, so your network and internet provider don't see which sites you look up. Cloudflare sees the names looked up and your IP address; see [Cloudflare's resolver privacy policy](https://developers.cloudflare.com/1.1.1.1/privacy/public-dns-resolver/).

### Your search engine

What you type in the Bar when it isn't an address goes to the search engine you pick in Settings > General (Brave Search unless you change it; Google, DuckDuckGo, Startpage, Kagi and Bing are the others), as a normal search. Nothing is sent while you type: the Bar's suggestions come from your tabs, bookmarks and history on this PC.

### Site icons

For your bookmarks and most visited sites, Exo Browser asks each site for its large icon (`/apple-touch-icon.png`, or the icon the page names). These requests go to that site only, through Windows' own download service, so their address lookups use your PC's usual DNS rather than Cloudflare.

### Twitch (Exo Shield)

To skip Twitch's ads, Exo Shield's TTV LOL PRO sends Twitch's request for a live stream's playlist (the list of video pieces, never the video) through TTV LOL PRO's proxy servers (`perfprod.com`) in a country where Twitch shows no ads. That request includes the channel name and the playback token Twitch gives your browser for the stream; the proxy sees it and your IP address. It looks up those servers' addresses with Cloudflare. TTV LOL PRO's ad reports are off, and it sends nothing else about you.

### Chrome Web Store

Opening the Chrome Web Store is a visit to Google's site. When you add an extension, its package is downloaded from Google (`clients2.google.com`) with the extension's id and your WebView2 version.

### Microsoft

Exo Browser runs on Microsoft Edge WebView2, part of Windows. WebView2 updates itself and its components through Microsoft, and may send diagnostic data according to your Windows privacy settings. Exo Browser turns off Microsoft Defender SmartScreen's address checks, so the pages you open are not checked with Microsoft; Exo Shield's malware lists block known bad sites instead. If WebView2 is missing, Setup downloads Microsoft's installer from `go.microsoft.com` and checks Microsoft's signature on it.

### Exo Shield's lists

Exo Shield's filter lists are built into each release. It downloads no lists and sends nothing about the pages you visit.

## Updates

Exo Browser doesn't check for updates by itself. New versions are on [the releases page](https://github.com/ImAvgErix/ExoBrowser/releases); the installer installs over the version you have and keeps your data.

## Questions

Open an issue at <https://github.com/ImAvgErix/ExoBrowser/issues>. Issues are public: leave out anything personal.
