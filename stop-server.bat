@echo off
echo Killing all Node.js tasks...
taskkill /F /IM node.exe >nul 2>&1

:: Notifcation of close of server
echo All Node.js processes terminated.

:: Run log analysis
echo Running server log analyzer...
Server_data.exe

pause
