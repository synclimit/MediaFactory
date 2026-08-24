@echo off
cd /d "%~dp0"
title MediaFactory Dev Server
echo Memulai MediaFactory Dev Server...
call npm run dev -- --port 5173 --strictPort

