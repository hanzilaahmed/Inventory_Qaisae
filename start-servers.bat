@echo off
title StockPro Server Launcher
echo ===================================================
echo   Starting StockPro Inventory & POS System
echo ===================================================

echo [1/2] Starting Backend API on http://localhost:5000...
start "StockPro Backend (Port 5000)" cmd /k "cd /d "%~dp0backend" && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend on http://localhost:3000...
start "StockPro Frontend (Port 3000)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo ===================================================
echo   Both servers launched!
echo   Opening: http://localhost:3000
echo ===================================================
timeout /t 3 >nul
start http://localhost:3000
