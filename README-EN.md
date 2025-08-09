# Chat4 Quick Start

## Start Chat4

### Method 1: Direct Start (Recommended)
1. Double click `launcher.bat`
2. Wait for service to start
3. Open browser to http://localhost:3000

### Method 2: Full Installation
1. Double click `installer.bat` (first time only)
2. Double click `launcher.bat` to start service

## System Requirements

- Windows 10/11
- Node.js 18+ (installer.bat will install automatically)
- 2GB RAM minimum
- 1GB disk space

## Common Issues

### 1. "Not internal or external command"
- Install Node.js first
- Run installer.bat
- Restart computer

### 2. Port already in use
- Close other programs using port 3000
- Or modify PORT value in .env file

### 3. Dependencies installation failed
- Check network connection
- Run as administrator
- Delete node_modules folder and try again

## File Description

- `launcher.bat` - Simple launch script
- `installer.bat` - Full installation script
- `start.bat` - Alternative launch script
- `setup.bat` - Alternative installation script

## Access URLs

- Main interface: http://localhost:3000
- Health check: http://localhost:3000/api/health

## Stop Service

Close the command window to stop service