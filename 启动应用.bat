@echo off
chcp 65001 >nul
set "ROOT=%~dp0"
set "PORT=4173"
set "URL=http://127.0.0.1:%PORT%"
set "NO_BROWSER=%~1"

netstat -ano | findstr /C:":%PORT% " >nul
if not errorlevel 1 goto open

start "Personal App Server" /min "%ROOT%tools\start-server.cmd"
ping -n 3 127.0.0.1 >nul

:open
if /I "%NO_BROWSER%"=="/no-browser" goto end

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" "%URL%"
  goto end
)

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "%URL%"
  goto end
)

start "" "%URL%"

:end
