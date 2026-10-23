# Building Exo Browser

Reading the source is welcome; see the [terms](../LICENSE) for what else is allowed.

| Path | What |
| --- | --- |
| `src/` | The C++ host: the window, tabs, glass, Exo Shield's setup, and Exo Vault's file and keys (`vault.cpp`). |
| `ui/` | The interface (React, Vite): the Bar, new tab page, Settings, Exo Vault and first run in `ui/src/browser`, Setup's screens in `ui/src/setup`. |
| `ui/src/` (outside `browser/` and `setup/`) | Exo Launcher's design, copied. `ui/scripts/sync-exo.mjs` refreshes it from `..\ExoLauncher` before each build when that is on the PC; `ui/exo-sync.json` lists the files and the Exo commit. |
| `extensions/exo-shield` | Exo Shield, built by `tools/build-shield.mjs` ([its own repository](https://github.com/ImAvgErix/exo-shield), GPL-3.0). |
| `vendor/` | Third-party code, unmodified: uBlock Origin Lite, TTV LOL PRO and Argon2. |
| `setup/` | Exo Browser Setup's window (`setup/src/main.cpp`), which runs the install engine `tools/ExoBrowser.nsi`. |
| `brand/`, `tools/` | Icons, and the scripts that build Exo Shield, the installer and the release, fetch extensions and capture the window for checks. |

## Build

You need Visual Studio's C++ build tools (x64), the WebView2 SDK from NuGet (`Microsoft.Web.WebView2` 1.0.4312-prerelease, in `%USERPROFILE%\.nuget\packages`) and Node.

```bat
build.cmd
```

builds `out\ExoBrowser.exe` and copies the interface and Exo Shield beside it. `npm --prefix ui run check` type-checks and lints the interface.

## Release

```powershell
pwsh -File tools\Build-Release.ps1
```

builds the browser, Setup's window and the NSIS install engine (NSIS 3 at `C:\Program Files (x86)\NSIS`), and writes `artifacts\ExoBrowser-Setup.exe` with its `.sha256`. `-TestRoot <folder>` makes a walk-through installer that installs only under that folder, with its own shortcuts and registry entries; run it with `EXO_SETUP_TEST_ROOT` set to the same folder.

`EXO_BROWSER_DATA=<folder>` runs the browser on a separate profile beside your own, and `EXO_BROWSER_CDP=<port>` opens a DevTools port on it.
