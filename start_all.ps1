# CareerIQ Project Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting CareerIQ — Market-Aware AI Career Intelligence" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[1/2] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir'; uvicorn backend.main:app --reload --port 8000"

Write-Host "[2/2] Starting Next.js Frontend on http://localhost:3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\frontend'; npm run dev"

Write-Host ""
Write-Host "Services running in background terminals!" -ForegroundColor Green
Write-Host "-> Backend API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "-> Frontend Web App: http://localhost:3000" -ForegroundColor White
Write-Host ""
