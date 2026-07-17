@echo off
echo ===================================================
echo Memulai MediaFactory dalam Mode Developer (Instan)
echo ===================================================
echo.
echo Aplikasi akan terbuka sebentar lagi.
echo Setiap kali AI Antigravity mengedit kode, 
echo aplikasi akan otomatis terupdate tanpa perlu build!
echo.
echo PERHATIAN: JANGAN TUTUP JENDELA HITAM INI SELAMA APLIKASI MENYALA.
echo.
cd /d "D:\MediaFactory"
call npx kill-port 5173 18888 >nul 2>&1
call npm run electron:serve
