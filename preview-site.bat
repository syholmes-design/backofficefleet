@echo off
setlocal

cd /d "%~dp0"

echo.
echo BackOfficeFleet local preview
echo =============================
echo Project folder: %CD%
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found on this computer.
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found on this computer.
  echo Install Node.js with npm, then run this file again.
  pause
  exit /b 1
)

if not exist package.json (
  echo package.json was not found.
  echo Make sure this file is inside the BackOfficeFleet project folder.
  pause
  exit /b 1
)

if not exist node_modules\next (
  echo Dependencies are not installed yet.
  echo.
  echo Run this first:
  echo   npm install
  echo.
  pause
  exit /b 1
)

set "PORT=3000"
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) { exit 1 } else { exit 0 }" >nul 2>nul
if errorlevel 1 set "PORT=3001"

set "URL=http://localhost:%PORT%"

echo Starting BackOfficeFleet at %URL%
echo.
echo Leave this window open while previewing the site.
echo Press Ctrl+C in this window to stop the preview server.
echo.

start "" powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Start-Sleep -Seconds 5; Start-Process '%URL%'"

echo Clearing stale Next.js cache...
node scripts\clear-next-cache.mjs
if errorlevel 1 (
  echo.
  echo Could not clear the Next.js cache.
  echo Close other BackOfficeFleet preview windows and try again.
  pause
  exit /b 1
)

echo.
echo Starting preview server...
echo.
call npm run dev -- --hostname 127.0.0.1 --port %PORT%

echo.
echo Preview server stopped.
pause
