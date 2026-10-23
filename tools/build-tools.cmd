@echo off
rem Builds the test tools into out\tools: wincap (one frame of a window) and winrec (every frame for a while).
setlocal
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1 || exit /b 1
cd /d "%~dp0.."
if not exist out\tools mkdir out\tools
cl /nologo /std:c++20 /EHsc /O2 /MT tools\wincap.cpp /Foout\tools\ /Feout\tools\wincap.exe /link d3d11.lib windowsapp.lib windowscodecs.lib ole32.lib user32.lib || exit /b 1
cl /nologo /std:c++20 /EHsc /O2 /MT /DNOMINMAX tools\winrec.cpp /Foout\tools\ /Feout\tools\winrec.exe /link d3d11.lib windowsapp.lib windowscodecs.lib ole32.lib user32.lib || exit /b 1
