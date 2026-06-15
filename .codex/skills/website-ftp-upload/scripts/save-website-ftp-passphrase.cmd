@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%save-website-ftp-passphrase.ps1" %*
set "EXITCODE=%ERRORLEVEL%"
echo.
if not "%EXITCODE%"=="0" echo Save passphrase failed with exit code %EXITCODE%.
if "%EXITCODE%"=="0" echo Save passphrase completed.
echo.
pause
exit /b %EXITCODE%
