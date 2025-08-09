@echo off
title Chat4

echo Starting Chat4...
echo.

cd /d "%~dp0"

echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js not found
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js OK
echo Installing dependencies...
npm install --production

echo Setting up database...
npm run db:push

echo Starting server...
echo Please open http://localhost:3000 in your browser
echo.

npm start

pause