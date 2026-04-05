@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
set EXITCODE=%ERRORLEVEL%
if not "%EXITCODE%"=="0" (
  echo.
  echo [ERROR] setup.ps1 finalizo con codigo %EXITCODE%.
  pause
  exit /b %EXITCODE%
)
exit /b 0
