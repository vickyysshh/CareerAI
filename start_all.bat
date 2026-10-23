@echo off
echo ========================================================
echo  Starting CareerIQ — Market-Aware AI Career Intelligence
echo ========================================================
echo.
echo [1/2] Launching FastAPI Backend on http://localhost:8000 ...
start "CareerIQ Backend (FastAPI)" cmd /k "cd /d %~dp0 && uvicorn backend.main:app --reload --port 8000"

echo [2/2] Launching Next.js Frontend on http://localhost:3000 ...
start "CareerIQ Frontend (Next.js)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo All services launched!
echo - API Docs:  http://localhost:8000/docs
echo - Web App:   http://localhost:3000
echo.
pause
