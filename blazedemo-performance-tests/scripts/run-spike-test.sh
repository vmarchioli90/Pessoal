#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RESULT_FILE="$ROOT_DIR/results/spike-test-results.jtl"
REPORT_DIR="$ROOT_DIR/reports/spike-test-report"

rm -f "$RESULT_FILE"
rm -rf "$REPORT_DIR"
mkdir -p "$ROOT_DIR/results" "$ROOT_DIR/reports"

jmeter -n \
  -t "$ROOT_DIR/jmeter/blazedemo-spike-test.jmx" \
  -l "$RESULT_FILE" \
  -e -o "$REPORT_DIR" \
  -JwarmupThreads="${WARMUP_THREADS:-20}" \
  -JspikeThreads="${SPIKE_THREADS:-150}" \
  -JcooldownThreads="${COOLDOWN_THREADS:-20}" \
  -JwarmupDuration="${WARMUP_DURATION:-60}" \
  -JspikeRampUp="${SPIKE_RAMP_UP:-15}" \
  -JpeakDuration="${PEAK_DURATION:-60}" \
  -JcooldownDuration="${COOLDOWN_DURATION:-60}" \
  -JwarmupDelay="${WARMUP_DELAY:-0}" \
  -JspikeDelay="${SPIKE_DELAY:-60}" \
  -JpeakDelay="${PEAK_DELAY:-75}" \
  -JcooldownDelay="${COOLDOWN_DELAY:-135}" \
  -JwarmupThroughput="${WARMUP_THROUGHPUT:-3000}" \
  -JpeakThroughput="${PEAK_THROUGHPUT:-16200}" \
  -JcooldownThroughput="${COOLDOWN_THROUGHPUT:-3000}" \
  -JpassengerFile="$ROOT_DIR/data/passengers.csv"

node "$ROOT_DIR/scripts/evaluate-performance.js" spike "$RESULT_FILE" \
  "--output=$ROOT_DIR/results/spike-test-summary.md"

echo "JTL: $RESULT_FILE"
echo "HTML report: $REPORT_DIR/index.html"
