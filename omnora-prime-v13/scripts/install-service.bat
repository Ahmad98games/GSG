@echo off
:: scripts/install-service.bat
echo ===================================================
echo   Noxis — Service Installation
echo ===================================================
echo.

:: Ensure PM2 is installed globally
where pm2 >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] PM2 not found. Installing globally...
    npm install -g pm2 pm2-windows-startup
)

echo [1/3] Starting Noxis Hub via PM2...
pm2 start ecosystem.config.js --env production

echo [2/3] Freezing process list...
pm2 save

echo [3/3] Setting up Windows Startup...
pm2 startup windows

echo.
echo ===================================================
echo   Success! Noxis Hub is now a Windows Service.
echo   It will start automatically on system boot.
echo ===================================================
pause

