@echo off
echo ==============================================
echo Softcomerce Quick Start Script
echo ==============================================

echo.
echo [1/3] Setting up Backend Virtual Environment (Using Python 3.12)...
cd backend
if not exist .venv (
    uv venv --python 3.12 .venv
)
call .venv\Scripts\activate.bat
uv pip install -r requirements.txt
cd ..

echo.
echo [2/3] Preparing Frontend...
cd frontend
if exist .next (
    rmdir /s /q .next
)
if not exist node_modules (
    echo Installing node_modules...
    call npm install --legacy-peer-deps --no-fund --no-audit
)
cd ..

echo.
echo [3/3] Starting Servers...
start cmd /k "cd backend && call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --reload-dir app"
start cmd /k "cd frontend && npm run dev"

echo.
echo ==============================================
echo Servers are starting in new windows!
echo - Backend will be at http://127.0.0.1:8000
echo - Frontend will be at http://localhost:3000
echo ==============================================
pause
