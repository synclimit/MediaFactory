@echo off
cd /d "%~dp0"
title MediaFactory Dev Mode
echo ===================================================
echo Memulai MediaFactory (Instant Dev Mode - No Build)
echo ===================================================
echo.

echo Membersihkan proses lama...
taskkill /f /im electron.exe >nul 2>&1

echo Memulai MediaFactory Dev Engine...
call npm run electron:serve
pause




