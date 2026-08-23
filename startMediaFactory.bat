@echo off
cd /d "%~dp0"
title MediaFactory Dev Server
echo Menghentikan proses lama di port 5173 dan 18888...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":5173\> :18888\>"') do (
    taskkill /f /pid %%a >nul 2>&1
)
call npm run dev -- --port 5173 --strictPort
