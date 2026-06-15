@echo off
setlocal

set "ROOT=%~dp0"
set "APP_DIR=%ROOT%Website"
set "DEFAULT_PORT=3000"

if not exist "%APP_DIR%\index.html" (
  echo Could not find Website\index.html.
  echo The Next.js app has been removed. Build the new slim static site in Website, then run preview.bat again.
  pause
  exit /b 1
)

set "PORT=%DEFAULT_PORT%"
set "URL=http://localhost:%PORT%"

powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%.codex\scripts\check-preview.ps1" -Url "%URL%"
if not errorlevel 1 goto already_running

for /f %%P in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$used = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty LocalPort; 3000..3010 | Where-Object { $used -notcontains $_ } | Select-Object -First 1"') do set "PORT=%%P"

if "%PORT%"=="" (
  echo Could not find an open preview port between 3000 and 3010.
  echo Close an old preview window or stop an old local server, then try again.
  pause
  exit /b 1
)

set "URL=http://localhost:%PORT%"

echo.
echo Starting BOF static Website preview...
echo %URL%
echo.
echo Leave this window open while previewing.
echo Press Ctrl+C to stop the server.
echo.

start "" "%URL%"
cd /d "%APP_DIR%"
python -m http.server %PORT%

endlocal
exit /b 0

:already_running
echo.
echo BOF static Website preview is already running:
echo %URL%
echo.
start "" "%URL%"
pause
endlocal
exit /b 0
