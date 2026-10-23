# Getting started and help

## Install and update

1. Download **ExoBrowser-Setup.exe** from the [latest release](https://github.com/ImAvgErix/ExoBrowser/releases/latest).
2. Run it, choose Install, then Launch Exo Browser. **Options** under Install has the desktop shortcut switch.
3. First run walks you through Exo Vault, bringing your things from your other browsers, your look and your default browser. Every step can be skipped and found later in Settings.

Exo Browser looks for a new version when it starts and twice a day, and tells you when one is ready. **Settings > About** shows your version with **Check for updates**; when a new one is out, **Install update** downloads it, checks it, then closes Exo Browser, installs it and opens it again with your tabs, history, sign-ins and vault as they were. **Check for updates automatically** turns the automatic check off. New versions are also on the [releases page](https://github.com/ImAvgErix/ExoBrowser/releases): running a newer Setup does the same.

Exo Browser needs **Windows 11 x64** and installs for your Windows user only, in `%LOCALAPPDATA%\ExoBrowser\app`. The installer isn't code-signed yet, so SmartScreen may warn the first time: choose **More info**, then **Run anyway**. Each release lists the installer's SHA-256.

To uninstall, open **Windows Settings > Apps > Installed apps**, choose **Exo Browser**, then **Uninstall**. Your data stays for a reinstall unless you switch on **Also remove my data and Exo Vault**.

## Make it your default browser

**Settings > General > Default browser > Make default** opens Windows' Default apps page at Exo Browser: choose **Set default** there. Windows only lets you make that choice yourself. Links from your other apps then open in Exo Browser, in a new tab of the window you have open.

## The Bar

- **Search or go:** click the address, or press **Ctrl+L** or **F6**, and type. An address opens; anything else is searched with your search engine (**Settings > General > Search engine**). Suggestions come from your open tabs, bookmarks and history.
- **Everything at once:** **Ctrl+K** finds a tab, bookmark, page from your history or action.
- **Tabs:** across the top or down the side (**Settings > General > Tabs**). Drag a tab to move it; right-click it to pin, mute, duplicate or close others. **Ctrl+T** opens a new tab, **Ctrl+Shift+T** reopens the last one you closed, **Ctrl+W** closes one, and **Ctrl+Tab** moves between them.
- **Hide the toolbar** gives the page the whole window; the Bar slides in when the pointer touches the top edge (side tabs at the left edge).
- **More keys:** **Ctrl+D** bookmarks the page, **Ctrl+F** finds on it, **Ctrl+H** opens History, **Ctrl+J** Downloads, **Ctrl+Shift+E** your extensions, **F11** full screen, **Alt+Left** and **Alt+Right** back and forward.

## The new tab page

Your bookmarks as glass cards (drag one to rearrange them) and, under them, the sites you visit most; a card's × forgets a most-visited site. **Settings > New tab** shows bookmarks as cards, a bar, icons only or not at all, and turns Most visited off.

## Exo Shield

Exo Shield is always on, at its strongest, on every site, and has no settings. If a site misbehaves, reload it; if it still does, [report it](https://github.com/ImAvgErix/ExoBrowser/issues/new/choose) with the site's address. **Settings > About** lists Exo Shield's parts and when its lists were built.

Twitch: a stream can take a second longer to start, since its playlist comes through another country. The video itself comes straight from Twitch.

## Exo Vault

- **Open it:** **Settings > Privacy > Passwords > Exo Vault**. Make a master password the first time: at least 10 characters, and nobody can reset it, Exo included.
- **Windows Hello:** **Vault settings > Unlock with Windows Hello** opens the vault with your face, fingerprint or PIN.
- **Signing in:** click a sign-in field and pick a login from the menu. After you sign in somewhere new, Exo Vault offers to save the login, or to update a saved password you changed.
- **New passwords:** on a sign-up form the menu offers a strong password; **Vault settings** sets its length and symbols.
- **2FA codes:** add a site's setup key (or its otpauth link) to a login, and Exo Vault shows its current code.
- **Bring your passwords in:** **Import and export** brings them from the browsers on this PC (close that browser first), or from a file: an export from Proton Pass, Bitwarden, 1Password, LastPass, Dashlane, KeePass, Safari or any browser (CSV or JSON), or an Exo Vault export. Proton Pass: in Proton Pass, **Settings > Export**, choose CSV, then import that file.
- **Moving to another PC:** **Import and export > Encrypted export** saves everything as one file locked with a password you choose; import it in Exo Vault on the other PC.
- **Locking:** after the time you set in **Vault settings**, when Windows locks and when the PC sleeps, or with **Lock**.

## Bringing your things from another browser

**Settings > Import** lists the browsers on this PC. **Import** brings bookmarks, history, sign-ins (so you stay signed in), site icons, the search engine and Chrome Web Store extensions; Firefox brings bookmarks, history and sign-ins. Close that browser first so its sign-ins can be read. Nothing is removed from it. Passwords go into Exo Vault from its own **Import and export**.

Bookmarks from any browser: export them as an HTML file there, then **Settings > Bookmarks > Import file**.

Password managers' extensions (Proton Pass, Bitwarden, 1Password and others) aren't brought over: Exo Vault keeps your passwords, and two managers would both answer every sign-in field. Bring your passwords into Exo Vault instead. One you add from the Chrome Web Store yourself stays.

## Extensions

Open the [Chrome Web Store](https://chromewebstore.google.com) from **Settings > Extensions** and choose **Add to Exo** on an extension's page, or paste its link or id into **Add an extension**. **Load unpacked** adds an extension from a folder. Each extension there can be turned off or removed.

## Look and feel

**Settings > General**: **Appearance** (Match Windows, Light, Dark or Void, pure black for OLED screens) and **Material** (Liquid Glass, or solid surfaces with nothing showing through).

## Privacy

Exo Browser has no account and sends nothing to Exo. **Settings > Privacy > Cookies, site data and cache > Clear** signs you out of every site. The [privacy policy](../PRIVACY.md) lists everything that leaves your PC.

## Something wrong?

[Report a problem or suggest a feature](https://github.com/ImAvgErix/ExoBrowser/issues/new/choose). Issues are public: leave out passwords, addresses you'd rather keep private and personal details.
