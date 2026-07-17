@echo off
echo Menghentikan proses lama di port 5173 dan 18888...
call npx kill-port 5173 18888 >nul 2>&1
npm run dev -- --port 5173 --strictPort
