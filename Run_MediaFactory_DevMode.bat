@echo off
cd /d "%~dp0"
title MediaFactory Dev Mode
echo ========================================================
echo       MEDIAFACTORY (INSTANT DEV MODE - NO BUILD)
echo ========================================================
echo.
echo [1/2] Membersihkan proses lama yang tertahan...
taskkill /f /im electron.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":5173\> :5174\> :18888\>" 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [2/2] Memulai MediaFactory Dev Engine...
echo.
call npm run electron:serve
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Gagal menjalankan via npm run electron:serve.
    echo Menjalankan fallback langsung...
    call npx electron .
)
echo.
pause
