@echo off
echo ===================================================
echo Memulai MediaFactory (Instan)
echo ===================================================
echo.
cd /d "D:\MediaFactory"
call npx kill-port 5173 5174 18888 >nul 2>&1
call npx electron .

