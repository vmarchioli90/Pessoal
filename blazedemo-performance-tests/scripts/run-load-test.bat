@echo off
setlocal

set "ROOT_DIR=%~dp0.."
set "RESULT_FILE=%ROOT_DIR%\results\load-test-results.jtl"
set "REPORT_DIR=%ROOT_DIR%\reports\load-test-report"

if exist "%RESULT_FILE%" del /f /q "%RESULT_FILE%"
if exist "%REPORT_DIR%" rmdir /s /q "%REPORT_DIR%"
if not exist "%ROOT_DIR%\results" mkdir "%ROOT_DIR%\results"
if not exist "%ROOT_DIR%\reports" mkdir "%ROOT_DIR%\reports"

if "%THREADS%"=="" set "THREADS=100"
if "%RAMP_UP%"=="" set "RAMP_UP=120"
if "%DURATION%"=="" set "DURATION=300"
if "%THROUGHPUT%"=="" set "THROUGHPUT=15000"

jmeter -n ^
  -t "%ROOT_DIR%\jmeter\blazedemo-load-test.jmx" ^
  -l "%RESULT_FILE%" ^
  -e -o "%REPORT_DIR%" ^
  -Jthreads=%THREADS% ^
  -JrampUp=%RAMP_UP% ^
  -Jduration=%DURATION% ^
  -Jthroughput=%THROUGHPUT% ^
  -JpassengerFile="%ROOT_DIR%\data\passengers.csv"

echo JTL: %RESULT_FILE%
echo HTML report: %REPORT_DIR%\index.html

endlocal
