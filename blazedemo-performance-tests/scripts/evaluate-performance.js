const fs = require("fs");
const path = require("path");

const HTTP_LABELS = new Set([
  "GET Home",
  "POST Search Flights",
  "POST Choose Flight",
  "POST Confirm Purchase",
]);
const MIN_THROUGHPUT = 250;
const MAX_P90_MS = 2000;

function usage() {
  console.error(
    "Uso: node evaluate-performance.js <load|spike> <arquivo.jtl> " +
      "[--ramp-up-seconds=30] [--output=resumo.md]",
  );
  process.exit(2);
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}

function percentile(values, percentileValue) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[index];
}

function formatNumber(value, decimals = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

const [mode, jtlArgument, ...options] = process.argv.slice(2);
if (!['load', 'spike'].includes(mode) || !jtlArgument) usage();

const optionMap = Object.fromEntries(
  options.map((option) => {
    const [key, ...parts] = option.replace(/^--/, "").split("=");
    return [key, parts.join("=")];
  }),
);
const jtlPath = path.resolve(jtlArgument);
const rampUpSeconds = Number(optionMap["ramp-up-seconds"] || 30);

if (!fs.existsSync(jtlPath)) {
  throw new Error(`Arquivo JTL não encontrado: ${jtlPath}`);
}

const lines = fs.readFileSync(jtlPath, "utf8").trim().split(/\r?\n/);
const headers = parseCsvLine(lines.shift());
const column = Object.fromEntries(headers.map((header, index) => [header, index]));
const rows = lines.map(parseCsvLine).map((values) => ({
  timestamp: Number(values[column.timeStamp]),
  elapsed: Number(values[column.elapsed]),
  label: values[column.label],
  threadName: values[column.threadName],
  success: values[column.success] === "true",
}));

let evaluated = rows.filter((row) => HTTP_LABELS.has(row.label));
let windowDescription;
if (mode === "load") {
  const testStartedAt = Math.min(...evaluated.map((row) => row.timestamp));
  const stableStartedAt = testStartedAt + rampUpSeconds * 1000;
  evaluated = evaluated.filter((row) => row.timestamp >= stableStartedAt);
  windowDescription = `fase estável após ${rampUpSeconds} segundos de ramp-up`;
} else {
  evaluated = evaluated.filter((row) => row.threadName.startsWith("03 Peak Sustain"));
  windowDescription = "fase 03 de sustentação do pico";
}

if (evaluated.length === 0) {
  throw new Error(`Nenhuma requisição HTTP encontrada na ${windowDescription}.`);
}

const startedAt = Math.min(...evaluated.map((row) => row.timestamp));
const endedAt = Math.max(...evaluated.map((row) => row.timestamp + row.elapsed));
const durationSeconds = (endedAt - startedAt) / 1000;
const throughput = evaluated.length / durationSeconds;
const p90 = percentile(evaluated.map((row) => row.elapsed), 90);
const failures = evaluated.filter((row) => !row.success).length;
const errorRate = (failures / evaluated.length) * 100;
const approved = throughput >= MIN_THROUGHPUT && p90 < MAX_P90_MS && failures === 0;
const title = mode === "load" ? "Teste de Carga" : "Teste de Pico";

const markdown = `# Relatório do ${title}\n\n` +
  `## Janela avaliada\n\n- ${windowDescription}\n` +
  `- Requisições HTTP válidas: ${evaluated.length}\n` +
  `- Duração observada: ${formatNumber(durationSeconds, 3)} segundos\n\n` +
  `## Critérios de aceitação\n\n` +
  `| Métrica | Resultado | Limite | Situação |\n` +
  `| --- | ---: | ---: | --- |\n` +
  `| Throughput | ${formatNumber(throughput)} req/s | >= 250 req/s | ${throughput >= MIN_THROUGHPUT ? "Atendido" : "Não atendido"} |\n` +
  `| Percentil 90 | ${formatNumber(p90, 0)} ms | < 2.000 ms | ${p90 < MAX_P90_MS ? "Atendido" : "Não atendido"} |\n` +
  `| Erros | ${failures} (${formatNumber(errorRate)}%) | 0 | ${failures === 0 ? "Atendido" : "Não atendido"} |\n\n` +
  `## Conclusão\n\n**${approved ? "APROVADO" : "REPROVADO"}** - ` +
  `${approved ? "todos os critérios foram satisfeitos simultaneamente" : "um ou mais critérios não foram satisfeitos"}.\n`;

if (optionMap.output) {
  const outputPath = path.resolve(optionMap.output.replace(/^"|"$/g, ""));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown, "utf8");
}

console.log(markdown);
process.exitCode = approved ? 0 : 1;
