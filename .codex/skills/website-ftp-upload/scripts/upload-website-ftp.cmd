@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%upload-website-ftp.ps1" -AllowInvalidCertificate %*
set "EXITCODE=%ERRORLEVEL%"
echo.
if not "%EXITCODE%"=="0" echo FTPS upload failed with exit code %EXITCODE%.
if "%EXITCODE%"=="0" echo FTPS upload completed.
echo.
pause
exit /b %EXITCODE%
