@echo off
setlocal

set "ROOT_DIR=%~dp0.."
set "RESULT_FILE=%ROOT_DIR%\results\spike-test-results.jtl"
set "REPORT_DIR=%ROOT_DIR%\reports\spike-test-report"

if exist "%RESULT_FILE%" del /f /q "%RESULT_FILE%"
if exist "%REPORT_DIR%" rmdir /s /q "%REPORT_DIR%"
if not exist "%ROOT_DIR%\results" mkdir "%ROOT_DIR%\results"
if not exist "%ROOT_DIR%\reports" mkdir "%ROOT_DIR%\reports"

if "%WARMUP_THREADS%"=="" set "WARMUP_THREADS=20"
if "%SPIKE_THREADS%"=="" set "SPIKE_THREADS=100"
if "%COOLDOWN_THREADS%"=="" set "COOLDOWN_THREADS=20"
if "%WARMUP_DURATION%"=="" set "WARMUP_DURATION=60"
if "%SPIKE_RAMP_UP%"=="" set "SPIKE_RAMP_UP=15"
if "%PEAK_DURATION%"=="" set "PEAK_DURATION=60"
if "%COOLDOWN_DURATION%"=="" set "COOLDOWN_DURATION=60"
if "%WARMUP_DELAY%"=="" set "WARMUP_DELAY=0"
if "%SPIKE_DELAY%"=="" set "SPIKE_DELAY=60"
if "%PEAK_DELAY%"=="" set "PEAK_DELAY=75"
if "%COOLDOWN_DELAY%"=="" set "COOLDOWN_DELAY=135"
if "%WARMUP_THROUGHPUT%"=="" set "WARMUP_THROUGHPUT=3000"
if "%PEAK_THROUGHPUT%"=="" set "PEAK_THROUGHPUT=15000"
if "%COOLDOWN_THROUGHPUT%"=="" set "COOLDOWN_THROUGHPUT=3000"

jmeter -n ^
  -t "%ROOT_DIR%\jmeter\blazedemo-spike-test.jmx" ^
  -l "%RESULT_FILE%" ^
  -e -o "%REPORT_DIR%" ^
  -JwarmupThreads=%WARMUP_THREADS% ^
  -JspikeThreads=%SPIKE_THREADS% ^
  -JcooldownThreads=%COOLDOWN_THREADS% ^
  -JwarmupDuration=%WARMUP_DURATION% ^
  -JspikeRampUp=%SPIKE_RAMP_UP% ^
  -JpeakDuration=%PEAK_DURATION% ^
  -JcooldownDuration=%COOLDOWN_DURATION% ^
  -JwarmupDelay=%WARMUP_DELAY% ^
  -JspikeDelay=%SPIKE_DELAY% ^
  -JpeakDelay=%PEAK_DELAY% ^
  -JcooldownDelay=%COOLDOWN_DELAY% ^
  -JwarmupThroughput=%WARMUP_THROUGHPUT% ^
  -JpeakThroughput=%PEAK_THROUGHPUT% ^
  -JcooldownThroughput=%COOLDOWN_THROUGHPUT% ^
  -JpassengerFile="%ROOT_DIR%\data\passengers.csv"

echo JTL: %RESULT_FILE%
echo HTML report: %REPORT_DIR%\index.html

endlocal
