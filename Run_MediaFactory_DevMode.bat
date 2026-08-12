@echo off
echo ===================================================
echo Memulai MediaFactory (Instant Dev Mode - No Build)
echo ===================================================
echo.
cd /d "D:\MediaFactory"
taskkill /f /im electron.exe >nul 2>&1
call npx kill-port 5173 5174 18888 3001 >nul 2>&1
echo Starting MediaFactory Dev Engine...
call npx concurrently "npx vite --host 127.0.0.1 --port 5173 --strictPort" "npx wait-on http://127.0.0.1:5173 && npx electron ."
call npx kill-port 5173 5174 18888 3001 >nul 2>&1



