@echo off
setlocal

cd /d "%~dp0"

echo Creating a ChatGPT-friendly Website copy...
echo This skips PDFs, office files, videos, audio, archives, logs, and files over 3 MB.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File ".codex\scripts\export-website-for-chatgpt.ps1"

if errorlevel 1 (
    echo.
    echo Export failed. Review the message above for details.
) else (
    echo.
    echo Export complete. Upload the ZIP shown above to ChatGPT for evaluation.
)

echo.
pause
