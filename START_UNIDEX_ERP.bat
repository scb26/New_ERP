@echo off
title UNIDEX ERP - STORE COUNTER ENGINE
color 0A

echo ==================================================
echo        UNIDEX ERP - STORE COUNTER ENGINE          
echo ==================================================
echo [1/3] Checking environment...

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [2/3] Launching Unidex Local Server...
echo Server running on: http://localhost:3000
echo Do not close this window during business hours.
echo ==================================================

start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

npm run dev
pause
