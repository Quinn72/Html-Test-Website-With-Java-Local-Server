@echo off
:: Set this to the path where your Visual Studio is installed
:: Adjust version if needed (ex: 2022, 2019)
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"

echo === Building Server_data.cpp using MSVC ===
cl /EHsc /std:c++17 /W4 /O2 Server_data.cpp /Fe:server_log_analyzer.exe
if %errorlevel% neq 0 (
    echo ❌ Build failed.
    pause
    exit /b
)
echo ✅ Build succeeded! Output: server_log_analyzer.exe
pause
