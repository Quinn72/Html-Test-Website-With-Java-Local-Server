@echo off
cd /d "D:\LogInHtmlPageWithServer\"

echo Running setupDB.js...
node setupDB.js

echo Starting server.js...
start cmd /k "cd /d D:\Git\Html-Test-Website-With-Java-Local-Server && node server.js"

echo Server started. Press any key to close this window...
pause >nul
