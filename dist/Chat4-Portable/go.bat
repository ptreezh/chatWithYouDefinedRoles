@echo off
title Chat4 Simple

echo Chat4 Launcher
echo.

cd /d "%~dp0"

node --version >nul 2>&1
if errorlevel 1 (
    echo Please install Node.js first
    echo Download from: nodejs.org
    pause
    exit /b 1
)

echo Starting Chat4...
echo Go to: http://localhost:3000
echo Press CTRL+C to stop
echo.

npm run dev

pause