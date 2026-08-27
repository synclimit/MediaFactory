@echo off
title MediaFactory M7 - Astrofox Baseline Engine
cd /d "%~dp0m7-astrofox"
echo ========================================================
echo Starting MediaFactory M7 (Astrofox v1.4.0 Isolated Engine)
echo ========================================================
taskkill /f /im electron.exe >nul 2>&1
call npx electron ./app
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Gagal membuka Astrofox M7.
)
pause
