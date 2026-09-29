@echo off
setlocal
cd /d "%~dp0"

where npm >/dev/null 2>nul
if errorlevel 1 (
  echo [Music Lab] Node.js not found. Install it from https://nodejs.org and try again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo [Music Lab] Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [Music Lab] npm install failed.
    pause
    exit /b 1
  )
)

echo [Music Lab] Starting dev server, the browser will open automatically.
echo [Music Lab] Press Ctrl+C to stop.
call npm run dev -- --open

pause
