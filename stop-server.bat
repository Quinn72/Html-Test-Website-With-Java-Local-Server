@echo off
echo Killing all Node.js tasks...
taskkill /F /IM node.exe >nul 2>&1

echo All Node.js processes terminated.
pause
