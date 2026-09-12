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
  -Jthreads="${THREADS:-150}" \
  -JrampUp="${RAMP_UP:-30}" \
  -Jduration="${DURATION:-300}" \
  -Jthroughput="${THROUGHPUT:-16200}" \
  -JpassengerFile="$ROOT_DIR/data/passengers.csv"

node "$ROOT_DIR/scripts/evaluate-performance.js" load "$RESULT_FILE" \
  "--ramp-up-seconds=${RAMP_UP:-30}" \
  "--output=$ROOT_DIR/results/load-test-summary.md" \
  "--html=$ROOT_DIR/reports/load-test-executive/index.html"

echo "JTL: $RESULT_FILE"
echo "HTML report: $REPORT_DIR/index.html"
