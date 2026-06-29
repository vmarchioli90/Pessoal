#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RESULT_FILE="$ROOT_DIR/results/load-test-results.jtl"
REPORT_DIR="$ROOT_DIR/reports/load-test-report"

rm -f "$RESULT_FILE"
rm -rf "$REPORT_DIR"
mkdir -p "$ROOT_DIR/results" "$ROOT_DIR/reports"

jmeter -n \
  -t "$ROOT_DIR/jmeter/blazedemo-load-test.jmx" \
  -l "$RESULT_FILE" \
  -e -o "$REPORT_DIR" \
  -Jthreads="${THREADS:-100}" \
  -JrampUp="${RAMP_UP:-120}" \
  -Jduration="${DURATION:-300}" \
  -Jthroughput="${THROUGHPUT:-15000}" \
  -JpassengerFile="$ROOT_DIR/data/passengers.csv"

echo "JTL: $RESULT_FILE"
echo "HTML report: $REPORT_DIR/index.html"
