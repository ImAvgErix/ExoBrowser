# Builds Exo Browser Setup's window (setup\out\ExoSetup.exe), as Exo Launcher's setup\build.ps1 does: its screens from
# ui\ (vite.setup.config.ts), packed into the exe, then the C++ window with the Visual Studio C++ tools and WebView2's
# static loader (the same NuGet package build.cmd uses). -Engine appends the NSIS install engine and writes the finished
# installer to -Out (tools\Build-Release.ps1 does this).
#   pwsh -File setup\build.ps1 [-Engine path\to\engine.exe -AppBytes n -Out path\to\ExoBrowser-Setup.exe]
[CmdletBinding()]
param([string]$Engine, [long]$AppBytes, [string]$Out)
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$repo = Split-Path -Parent $here
$version = (Get-Content (Join-Path $repo 'VERSION') -Raw).Trim()
$build = Join-Path $here 'build'
$outDir = Join-Path $here 'out'
New-Item -ItemType Directory -Force -Path $build, $outDir | Out-Null

# The screens, then one pack the exe serves from memory: [u32 count] then [u16 name][name][u32 size][bytes] per file.
Push-Location (Join-Path $repo 'ui')
npm run -s build:setup
if ($LASTEXITCODE) { throw "Setup screens build failed ($LASTEXITCODE)." }
Pop-Location
$ui = Join-Path $build 'ui'
Move-Item -Force (Join-Path $ui 'setup.html') (Join-Path $ui 'index.html')
Copy-Item (Join-Path $repo 'ui\public\exo-browser.svg') (Join-Path $ui 'logo.svg') -Force
# Inter, as Exo draws it (ui/src/fonts.css loads /fonts): the upright cut is all the screens use.
New-Item -ItemType Directory -Force (Join-Path $ui 'fonts') | Out-Null
Copy-Item (Join-Path $repo 'ui\public\fonts\InterVariable.woff2'), (Join-Path $repo 'ui\public\fonts\LICENSE-Inter.txt') (Join-Path $ui 'fonts') -Force
$files = Get-ChildItem -Recurse -File $ui
$pack = [IO.MemoryStream]::new()
$writer = [IO.BinaryWriter]::new($pack)
$writer.Write([uint32]$files.Count)
foreach ($file in $files) {
    $name = [Text.Encoding]::UTF8.GetBytes($file.FullName.Substring($ui.Length + 1).Replace('\', '/'))
    $bytes = [IO.File]::ReadAllBytes($file.FullName)
    $writer.Write([uint16]$name.Length); $writer.Write($name)
    $writer.Write([uint32]$bytes.Length); $writer.Write($bytes)
}
$writer.Flush()
[IO.File]::WriteAllBytes((Join-Path $build 'ui.pack'), $pack.ToArray())

$vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
$vs = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
if (-not $vs) { throw 'Visual Studio C++ tools (x64) are not installed.' }
$vcvars = Join-Path $vs 'VC\Auxiliary\Build\vcvars64.bat'
$wv2 = Join-Path $env:USERPROFILE '.nuget\packages\microsoft.web.webview2\1.0.4314.35\build\native'
if (-not (Test-Path (Join-Path $wv2 'x64\WebView2LoaderStatic.lib'))) { throw "WebView2 SDK not found in $wv2 (the package build.cmd uses)." }
$comma = ($version -replace '\.', ',') + ',0'
$obj = Join-Path $build 'obj'
New-Item -ItemType Directory -Force $obj | Out-Null
$shell = Join-Path $outDir 'ExoSetup.exe'
$commands = @(
    "`"$vcvars`" >nul 2>&1",
    "cd /d `"$here\src`"",
    "rc /nologo /dVERSION_COMMA=$comma /dVERSION_TEXT=\`"$version\`" /fo `"$obj\setup.res`" setup.rc",
    ("cl /nologo /std:c++20 /EHsc /O2 /MT /W3 /utf-8 /permissive- /DUNICODE /D_UNICODE /DNOMINMAX /DWIN32_LEAN_AND_MEAN /D_WIN32_WINNT=0x0A00 " +
     "/DPRODUCT_VERSION=L\`"$version\`" /I`"$wv2\include`" main.cpp `"$obj\setup.res`" /Fo`"$obj\\`" /Fe`"$shell`" " +
     "/link /SUBSYSTEM:WINDOWS /MANIFEST:NO `"$wv2\x64\WebView2LoaderStatic.lib`" ole32.lib oleaut32.lib shell32.lib shlwapi.lib user32.lib gdi32.lib dwmapi.lib version.lib advapi32.lib")
) -join ' && '
cmd /c $commands
if ($LASTEXITCODE) { throw "Exo Browser Setup build failed ($LASTEXITCODE)." }
Write-Output "Exo Browser Setup window: $shell"

# The finished installer: the window, then the engine, its size, the app's size (for progress) and the mark.
if ($Engine) {
    $target = [IO.File]::Open($Out, [IO.FileMode]::Create)
    try {
        foreach ($part in $shell, $Engine) { $source = [IO.File]::OpenRead($part); $source.CopyTo($target); $source.Dispose() }
        $tail = [IO.BinaryWriter]::new($target)
        $tail.Write([uint64](Get-Item $Engine).Length)
        $tail.Write([uint64]$AppBytes)
        $tail.Write([Text.Encoding]::ASCII.GetBytes('EXOSETUP'))
        $tail.Flush()
    } finally { $target.Dispose() }
    Write-Output "Exo Browser Setup: $Out"
}
