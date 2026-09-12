@echo off
setlocal

set "ROOT_DIR=%~dp0.."
set "RESULT_FILE=%ROOT_DIR%\results\load-test-results.jtl"
set "REPORT_DIR=%ROOT_DIR%\reports\load-test-report"

if exist "%RESULT_FILE%" del /f /q "%RESULT_FILE%"
if exist "%REPORT_DIR%" rmdir /s /q "%REPORT_DIR%"
if not exist "%ROOT_DIR%\results" mkdir "%ROOT_DIR%\results"
if not exist "%ROOT_DIR%\reports" mkdir "%ROOT_DIR%\reports"

if "%THREADS%"=="" set "THREADS=150"
if "%RAMP_UP%"=="" set "RAMP_UP=30"
if "%DURATION%"=="" set "DURATION=300"
if "%THROUGHPUT%"=="" set "THROUGHPUT=16200"

call jmeter -n ^
  -t "%ROOT_DIR%\jmeter\blazedemo-load-test.jmx" ^
  -l "%RESULT_FILE%" ^
  -e -o "%REPORT_DIR%" ^
  -Jthreads=%THREADS% ^
  -JrampUp=%RAMP_UP% ^
  -Jduration=%DURATION% ^
  -Jthroughput=%THROUGHPUT% ^
  -JpassengerFile="%ROOT_DIR%\data\passengers.csv"

if errorlevel 1 exit /b %errorlevel%

node "%ROOT_DIR%\scripts\evaluate-performance.js" load "%RESULT_FILE%" --ramp-up-seconds=%RAMP_UP% --output="%ROOT_DIR%\results\load-test-summary.md"
if errorlevel 1 exit /b %errorlevel%

echo JTL: %RESULT_FILE%
echo HTML report: %REPORT_DIR%\index.html

endlocal
