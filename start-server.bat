@echo off
cd /d "D:\LogInHtmlPageWithServer\"

echo Running setupDB.js...
node setupDB.js

echo Starting server.js...
start cmd /k "cd /d A:\Path\To\Your\Project && node server.js"

echo Server started. Press any key to close this window...
pause >nul
