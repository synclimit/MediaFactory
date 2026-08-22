@echo off
title Astrofox v1.4.0 Standalone
cd /d "%~dp0astrofox-standalone"
echo ========================================================
echo Starting Astrofox v1.4.0 (Windows Standalone)
echo ========================================================
npx electron ./app
