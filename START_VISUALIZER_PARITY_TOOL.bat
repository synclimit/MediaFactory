@echo off
title MediaFactory Visualizer Parity & Root Cause Diagnostic Workbench
echo ======================================================================
echo  MediaFactory Visualizer Parity & Root Cause Diagnostic Workbench
echo ======================================================================
echo.
echo Starting MediaFactory in Dev Mode with Visualizer Parity Tool...
echo.

cd /d "D:\MediaFactory"
call npx kill-port 5173 5174 18888 >nul 2>&1
call npx electron .
