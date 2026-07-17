@echo off
echo ========================================
echo   Comfort Studio - Starting...
echo ========================================
echo.
echo Node version:
node --version
echo.

echo Starting Backend (port 5000)...
cd /d "%~dp0backend"
start cmd /k "npx tsx src/server.ts"

timeout /t 5 /nobreak >nul

echo Starting Frontend (port 3000)...
cd /d "%~dp0frontend"
start cmd /k "npm run dev"

echo.
echo ========================================
echo   Comfort Studio is starting!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo ========================================
echo.
pause
