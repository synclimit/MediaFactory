@echo off
cd /d "%~dp0"
title MediaFactory Visualizer Parity & Root Cause Diagnostic Workbench
echo ======================================================================
echo  MediaFactory Visualizer Parity & Root Cause Diagnostic Workbench
echo ======================================================================
echo.
echo Starting MediaFactory in Dev Mode with Visualizer Parity Tool...
echo.

taskkill /f /im electron.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":5173\> :5174\> :18888\>"') do (
    taskkill /f /pid %%a >nul 2>&1
)

call npm run electron:serve
