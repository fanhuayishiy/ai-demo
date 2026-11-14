@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 22 LTS，然后重新打开本文件。
  pause
  exit /b 1
)
if not exist node_modules (
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
start "" "http://127.0.0.1:5173"
call npm run dev -- --port 5173 --strictPort
pause
