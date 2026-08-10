@echo off
echo ===================================================
echo Memulai MediaFactory
echo ===================================================
echo.
cd /d "D:\MediaFactory"
call npx kill-port 5173 5174 18888 3001 >nul 2>&1
echo Launching MediaFactory Electron App...
call npx electron .


