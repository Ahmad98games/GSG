@echo off
:: scripts/uninstall-service.bat
echo Removing Noxis Hub from Windows Services...

pm2 stop omnora-hub
pm2 delete omnora-hub
pm2 save

echo.
echo Service removed successfully.
pause
