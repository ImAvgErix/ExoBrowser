# Changelog

## 1.0.4 — October 23, 2026

The glass no longer fades in or drops out on its own: the window's frost follows the page frame for frame. New tabs show up sooner, and the window starts faster.

- **The hidden Bar arrives and leaves in one piece.** With Hide the toolbar on, the Bar's frost came in three frames before the Bar, as gray capsules with nothing on them, and when it hid, its frost went first and left its words on the bare page. The frost now moves with the Bar, both ways. _Verified: on screen, frame by frame._
- **The side tabs too.** Hidden side tabs come and go the same way as the Bar, by the same code. _Checked in code only._
- **Notices keep their glass under a hidden Bar.** A notice shown while the hidden Bar was away had no frost at all, its words over the sharp page, and got it back only when the Bar came in. _Verified: on screen, frame by frame._
- **Exo Vault's save prompt and sign-in menu too.** They sit on the same layer as notices, which no longer hides with the Bar. _Checked in code only._
- **Menus opened from the keyboard are glass at once.** A menu the keyboard opens is there at once, but its frost faded in over 160 ms, clear glass frosting over. Each piece's frost now takes exactly the time the piece itself takes. _Verified: on screen, frame by frame._
- **A new look in step.** Switching between Light, Dark and Void, the glass's frost and the band under the Bar changed about four frames before the rest, so Settings flashed gray. They now change in the same frame as the page. _Verified: on screen, frame by frame._
- **Menus leave with their glass, and maximizing moves it with the Bar.** A menu's frost went a frame before the menu, and when the window was maximized the Bar's frost reached its new place two frames before the Bar. _Verified: on screen, frame by frame._
- **New tabs show up at once.** The new tab page stayed black for about a third of a second and then appeared almost done arriving: WebView2 holds a new page's first frames until something on it can be seen, and everything on it starts invisible. It now starts at 1%, so it fades in from its first frame. _Verified: on screen, frame by frame._
- **New tabs open light in Light.** In Light, a new tab showed black for about a tenth of a second before its page drew; it's light from its first frame. _Verified: on screen, frame by frame._
- **A faster start.** The Bar draws its tabs about 45 ms sooner: the edge lens of Exo Launcher's glass, which bends what the page draws behind the glass and here changed no pixel (the window draws the frost), no longer builds its maps before the first paint, and Inter is asked for as the page loads instead of after its first layout. The window no longer searches AppData for other browsers to import from at every start (120 ms on a PC with 3,800 folders there); Settings and first run still find them. With the new tab fix above, the new tab page you start on shows up about a quarter of a second sooner. _Verified: end-to-end._
- **Built on stable parts.** The stable WebView2 SDK 1.0.4314.35 and stable tools throughout, with no previews. _Verified: end-to-end._

## 1.0.3 — October 23, 2026

Menus, Search and Settings come in as one piece of Exo Launcher's newest Liquid Glass, without a flash.

- **No gray box before a menu.** The window draws the frost under the Bar's glass a frame ahead of the page, so a menu's frost showed as a gray box a frame before the menu itself. It now waits that frame, and fades in and out with the menu, Search, Exo Vault's sign-in menu and prompt, and notices. _Verified: on screen, frame by frame._
- **Settings opens frosted.** The page behind Settings stayed sharp for about a quarter of a second while it loaded, then the frost snapped in. It's frosted from the first frame. _Verified: on screen, frame by frame._
- **No blink when something opens over Settings.** A menu opening over Settings rebuilt all the glass, which blinked the whole sheet for a frame; the glass already on screen now stays as it is. _Verified: on screen, frame by frame._
- **Exo Launcher's clear glass.** Menus, Search and the sign-in menu use Exo Launcher's clear tint again instead of 1.0.1's denser one, and the Bar and the tabs have its lens at the rim and its light where you press. _Verified: on screen._

## 1.0.2 — October 23, 2026

Exo Browser now updates itself, and leaves password managers to Exo Vault.

- **Updates in Settings.** Settings › About shows your version with Check for updates. When a new version is out, Install update downloads it with its progress on the button, checks it against the SHA-256 the release publishes, then closes Exo Browser, installs it and opens it again with your tabs as they were. _Verified: end-to-end, the last step (Setup closing, installing and reopening) on a test install._
- **Checks by itself.** Exo Browser asks GitHub for the newest version when it starts and twice a day, and says once when one is ready to install. Check for updates automatically turns it off. _Checked in code only; it runs the same check as the button, verified end-to-end._
- **Password managers stay out.** Importing from another browser no longer brings Proton Pass, Bitwarden, 1Password, LastPass and other password managers' extensions: Exo Vault keeps your passwords. One an earlier import brought in is removed once, the first time Exo Browser starts after this update, and one you add from the Chrome Web Store yourself stays. _Verified: end-to-end for the removal; the import checked in code only._
- **Startup notices show.** A notice from the moment Exo Browser opens (like the one above) waits until the window can show it, instead of being lost. _Checked in code only._

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
