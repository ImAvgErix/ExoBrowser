# Changelog

## 1.0.0 — October 22, 2026

The first release of Exo Browser: a private, fast browser in Exo Launcher's look.

- **Exo Shield, always on.** Ads, trackers, malware, cookie notices and pop-ups blocked before they load on every site, YouTube's ads included, from uBlock Origin Lite at its strongest and HaGeZi's Multi PRO list. It has no settings and can't be turned off or removed, and every start puts its rules back. _Verified: end-to-end._
- **Twitch without ad breaks.** Exo Shield asks for each live stream from a country Twitch shows no ads in (TTV LOL PRO, with its ad reports off), and the video still comes straight from Twitch at full quality. _Verified: end-to-end._
- **Every lookup encrypted.** Addresses are looked up over HTTPS with Cloudflare, with no unencrypted fallback, and Microsoft Edge's balanced tracking prevention is on. _Checked in code only._
- **Exo Vault.** A password manager kept encrypted on this PC (Argon2id and AES-256-GCM) for logins with 2FA codes, cards, notes and identities: a fill menu on sign-in fields, an offer to save or update after you sign in, a password generator, password health, Windows Hello, locking when you step away, and a clipboard that clears itself. _Verified: end-to-end._
- **Bring your passwords.** Exo Vault takes the passwords saved in the Chromium browsers and Firefox on this PC, exports from Proton Pass, Bitwarden, 1Password, LastPass, Dashlane, KeePass, Safari or any browser, and its own encrypted exports from another PC. _Checked in code only._
- **Bring everything else.** Bookmarks, history, sign-ins, site icons, the search engine and Chrome Web Store extensions from the other browsers on this PC, or bookmarks from any browser's HTML file. _Verified: end-to-end from a Chromium browser; Firefox checked in code only._
- **The Bar.** One Liquid Glass bar for the address, search and your tabs, across the top or down the side, which can hide until the pointer reaches the edge. Search with Brave Search, Google, DuckDuckGo, Startpage, Kagi or Bing; the Bar's suggestions come from your tabs, bookmarks and history only. _Verified: on screen._
- **The new tab page.** A line to read, your bookmarks as glass cards you drag to rearrange, and the sites you visit most, each with the site's own icon. _Verified: on screen._
- **Exo's look.** Light, Dark or Void (pure black, for OLED screens) or matched to Windows, Liquid Glass or solid surfaces, Inter type and Exo Launcher's motion. _Verified: on screen._
- **Chrome Web Store extensions.** Add any extension from the Chrome Web Store, or load an unpacked one. _Checked in code only._
- **First run.** A welcome, then making your vault, bringing your things from your other browsers, your look, and making Exo Browser your default browser. Every step can be skipped. _Verified: on screen._
- **Exo Browser Setup.** One window in Exo's look that installs, updates over the version you have and uninstalls, for your Windows user only, with no administrator rights. It lists Exo Browser among Windows' browsers so you can make it your default, installs WebView2 if it's missing, and can remove your data and Exo Vault too when you uninstall, off unless you choose it. _Verified: end-to-end._
