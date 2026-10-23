# Changelog

## 1.0.1 — October 23, 2026

This update fixes glitches all over the browser and makes it lighter while you use it.

- **Find no longer pins your first tab.** Opening Find (Ctrl+F) pinned or unpinned whichever tab was first. _Verified: end-to-end._
- **Settings, Exo Vault and first run keep the mouse.** Closing a menu or Search on top of them handed the mouse back to the page underneath, so they stayed on screen but couldn't be clicked. Esc now closes only the top one, and nothing opens over first run. _Verified: end-to-end._
- **Full screen behaves.** F11 with Settings open left the page unclickable; now it closes Settings. Opening Search or Find leaves full screen, and switching away from or closing a video's tab leaves its full screen. _Verified: on screen; a video's full screen checked in code only._
- **Search and menus read over any page.** The tab row no longer shows through the search list, and menus, Search and the sign-in menu carry a denser tint, so their words stay readable over a light page. _Verified: on screen._
- **Exo Vault's sign-in menu and save prompt.** The save prompt can be clicked and sits under the tabs. The sign-in menu opens above a field near the bottom of the window and leaves no dead spot on the page when it closes. Show-password and "Forgot password" buttons no longer count as a sign-in. _Verified: end-to-end._
- **Exo Vault stays safe.** Creating a vault never replaces one that exists, an unlock that finishes after the vault locked is dropped, and a change made just before a lock is saved first. Importing an Exo Vault export no longer duplicates items. _Checked in code only._
- **Sign-in fields inside web components** (some sites build their sign-in that way) get Exo Vault's menu and fill, and the locked vault offers to unlock only on sign-in forms. _Checked in code only._
- **Resize from the window's edge, not the page.** The resize edges are Windows' own, outside the window, so a page's scrollbar at the right edge is yours again. _Verified: on screen._
- **Drop files on pages.** Files and links dragged onto the window go to the page (uploads, boards). A page's dropdown lists open in the right place after you move the window. _Checked in code only._
- **The Bar comes back by itself** if it crashes, and a page that keeps crashing stops reloading after three tries a minute. _Verified: end-to-end._
- **The new tab page.** Remove on a most-visited site forgets it instead of bookmarking it, Esc closes its menu, it fits a short window without running into the Bar, and sites with only a small icon show it. _Verified: on screen; small icons on cards checked in code only._
- **Nothing lost on shutdown.** Your tabs, history and window are saved when Windows signs out or restarts, and a page that retitles itself every second no longer delays saving your tabs. _Checked in code only._
- **Downloads finish.** A long download keeps its tab awake, and a muted tab stays muted when it wakes up. _Checked in code only._
- **Lighter.** Settings no longer reloads everything while a file downloads (it did 8 times a second); site icons are fetched one at a time and kept small; the Bar draws less while pages animate; and tab buttons redraw only when their own tab changes. _Verified: end-to-end._

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
