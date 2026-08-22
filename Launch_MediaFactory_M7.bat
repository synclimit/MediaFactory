@echo off
title MediaFactory M7 - Astrofox Baseline Engine
cd /d "%~dp0m7-astrofox"
echo ========================================================
echo Starting MediaFactory M7 (Astrofox v1.4.0 Isolated Engine)
echo ========================================================
npx electron ./app
