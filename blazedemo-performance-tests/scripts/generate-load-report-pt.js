const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const statisticsPath = path.join(rootDir, "reports", "load-test-report", "statistics.json");
const jtlPath = path.join(rootDir, "results", "load-test-results.jtl");
const outputDir = path.join(rootDir, "reports", "load-test-report-pt");
const outputPath = path.join(outputDir, "index.html");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseJtlSummary(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const lines = fs.readFileSync(filePath, "utf8").trim().split(/\r?\n/);
  if (lines.length <= 1) {
    return null;
  }

  const headers = lines[0].split(",");
  const timeStampIndex = headers.indexOf("timeStamp");
  const elapsedIndex = headers.indexOf("elapsed");

  let startedAt = Number.MAX_SAFE_INTEGER;
  let endedAt = 0;

  for (const line of lines.slice(1)) {
    const columns = line.split(",");
    const timeStamp = Number(columns[timeStampIndex]);
    const elapsed = Number(columns[elapsedIndex]);

    if (Number.isFinite(timeStamp)) {
      startedAt = Math.min(startedAt, timeStamp);
      endedAt = Math.max(endedAt, timeStamp + (Number.isFinite(elapsed) ? elapsed : 0));
    }
  }

  if (startedAt === Number.MAX_SAFE_INTEGER || endedAt === 0) {
    return null;
  }

  return {
    startedAt,
    endedAt,
    durationSeconds: Math.round((endedAt - startedAt) / 1000),
  };
}

function formatNumber(value, decimals = 0) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

function normalizeText(value) {
  const replacements = {
    "Compra de passagem aerea": "Compra de passagem aérea",
    "Com ocorrencias": "Com ocorrências",
  };

  return replacements[value] || value;
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}min ${String(remainingSeconds).padStart(2, "0")}s`;
}

function statusBadge(ok, successText, failText) {
  return `<span class="badge ${ok ? "ok" : "fail"}">${ok ? successText : failText}</span>`;
}

function metricCard(title, value, detail, tone = "neutral") {
  return `
    <section class="metric ${tone}">
      <span>${title}</span>
      <strong>${value}</strong>
      <small>${detail}</small>
    </section>
  `;
}

const statistics = readJson(statisticsPath);
const total = statistics.Total;
const jtlSummary = parseJtlSummary(jtlPath);

const throughputOk = total.throughput >= 250;
const p90Ok = total.pct1ResTime < 2000;
const errorsOk = total.errorPct === 0;
const rows = Object.values(statistics)
  .filter((item) => item.transaction !== "Total")
  .sort((a, b) => b.sampleCount - a.sampleCount)
  .map((item) => `
    <tr>
      <td>${normalizeText(item.transaction)}</td>
      <td>${formatNumber(item.sampleCount)}</td>
      <td>${formatNumber(item.errorPct, 2)}%</td>
      <td>${formatNumber(item.throughput, 2)} req/s</td>
      <td>${formatNumber(item.meanResTime)} ms</td>
      <td>${formatNumber(item.pct1ResTime)} ms</td>
      <td>${formatNumber(item.maxResTime)} ms</td>
    </tr>
  `)
  .join("");

const generatedAt = Date.now();
const executionDate = jtlSummary ? formatDate(jtlSummary.startedAt) : "Não identificada";
const duration = jtlSummary ? formatDuration(jtlSummary.durationSeconds) : "Não identificada";

const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Relatório de Performance - BlazeDemo</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f7fb;
      --panel: #ffffff;
      --ink: #172033;
      --muted: #667085;
      --line: #d9e0ea;
      --green: #178a5c;
      --green-bg: #e8f6ef;
      --red: #b42318;
      --red-bg: #fff0ee;
      --blue: #1d5fd1;
      --blue-bg: #eef5ff;
      --amber: #9a6700;
      --amber-bg: #fff7df;
      --shadow: 0 18px 45px rgba(23, 32, 51, 0.08);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Inter, "Segoe UI", Arial, sans-serif;
      background: var(--bg);
      color: var(--ink);
    }

    .hero {
      background:
        linear-gradient(135deg, rgba(29, 95, 209, 0.93), rgba(23, 138, 92, 0.86)),
        url("https://www.blazedemo.com/favicon.ico");
      background-size: cover;
      color: #fff;
      padding: 42px 28px 34px;
    }

    .wrap {
      width: min(1180px, calc(100% - 40px));
      margin: 0 auto;
    }

    .hero .wrap {
      display: block;
    }

    h1 {
      margin: 0 0 12px;
      font-size: clamp(2rem, 4vw, 3.6rem);
      line-height: 1;
      letter-spacing: 0;
    }

    .subtitle {
      margin: 0;
      max-width: 760px;
      color: rgba(255, 255, 255, 0.86);
      font-size: 1.05rem;
      line-height: 1.55;
    }

    main {
      padding: 28px 0 46px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 18px;
    }

    .metric,
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }

    .metric {
      padding: 18px;
      min-height: 132px;
    }

    .metric span,
    .eyebrow {
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .metric strong {
      display: block;
      margin: 12px 0 8px;
      font-size: 1.8rem;
      line-height: 1;
    }

    .metric small {
      color: var(--muted);
      line-height: 1.45;
    }

    .metric.danger {
      border-color: #ffc9c3;
      background: linear-gradient(180deg, #fff, var(--red-bg));
    }

    .metric.warning {
      border-color: #ffe2a8;
      background: linear-gradient(180deg, #fff, var(--amber-bg));
    }

    .metric.info {
      border-color: #cfe0ff;
      background: linear-gradient(180deg, #fff, var(--blue-bg));
    }

    .panel {
      margin-top: 18px;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: center;
      padding: 18px 20px;
      border-bottom: 1px solid var(--line);
    }

    h2 {
      margin: 4px 0 0;
      font-size: 1.2rem;
    }

    .panel-body {
      padding: 20px;
    }

    .criteria {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .criterion {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
      background: #fbfcfe;
    }

    .criterion p {
      margin: 10px 0 0;
      color: var(--muted);
      line-height: 1.45;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 700;
    }

    .badge.ok {
      color: var(--green);
      background: var(--green-bg);
    }

    .badge.fail {
      color: var(--red);
      background: var(--red-bg);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.93rem;
    }

    th,
    td {
      padding: 13px 14px;
      border-bottom: 1px solid var(--line);
      text-align: right;
      white-space: nowrap;
    }

    th:first-child,
    td:first-child {
      text-align: left;
      white-space: normal;
    }

    th {
      color: var(--muted);
      background: #f8fafc;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    tr:last-child td {
      border-bottom: 0;
    }

    .note {
      margin: 0;
      color: var(--muted);
      line-height: 1.6;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      color: rgba(255, 255, 255, 0.84);
      margin-top: 20px;
    }

    .meta span {
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 999px;
      padding: 7px 11px;
      background: rgba(255, 255, 255, 0.1);
    }

    @media (max-width: 900px) {
      .grid,
      .criteria {
        grid-template-columns: 1fr;
      }

      .table-scroll {
        overflow-x: auto;
      }
    }
  </style>
</head>
<body>
  <header class="hero">
    <div class="wrap">
      <div>
        <h1>Relatório de Performance</h1>
        <p class="subtitle">Teste de carga do fluxo de compra de passagem no BlazeDemo, com resumo executivo em português e dados consolidados a partir da execução real do Apache JMeter.</p>
        <div class="meta">
          <span>Execução: ${executionDate}</span>
          <span>Duração: ${duration}</span>
          <span>Gerado em: ${formatDate(generatedAt)}</span>
        </div>
      </div>
    </div>
  </header>

  <main class="wrap">
    <section class="grid">
      ${metricCard("Amostras", formatNumber(total.sampleCount), "Total de requisições registradas", "info")}
      ${metricCard("Throughput", `${formatNumber(total.throughput, 2)} req/s`, "Meta: pelo menos 250 req/s", throughputOk ? "neutral" : "danger")}
      ${metricCard("Percentil 90", `${formatNumber(total.pct1ResTime)} ms`, "Meta: abaixo de 2.000 ms", p90Ok ? "neutral" : "danger")}
      ${metricCard("Taxa de erro", `${formatNumber(total.errorPct, 2)}%`, "Meta ideal: 0%", errorsOk ? "neutral" : "warning")}
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <span class="eyebrow">Critérios de aceitação</span>
          <h2>Validação do resultado</h2>
        </div>
      </div>
      <div class="panel-body criteria">
        <article class="criterion">
          ${statusBadge(throughputOk, "Atendido", "Não atendido")}
          <p>Throughput observado de <strong>${formatNumber(total.throughput, 2)} req/s</strong>, contra meta mínima de <strong>250 req/s</strong>.</p>
        </article>
        <article class="criterion">
          ${statusBadge(p90Ok, "Atendido", "Não atendido")}
          <p>Percentil 90 observado de <strong>${formatNumber(total.pct1ResTime)} ms</strong>, contra limite de <strong>2.000 ms</strong>.</p>
        </article>
        <article class="criterion">
          ${statusBadge(errorsOk, "Atendido", "Com ocorrências")}
          <p>Taxa de erro observada de <strong>${formatNumber(total.errorPct, 2)}%</strong>. O critério desejado é erro zero ou muito baixo.</p>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <span class="eyebrow">Resumo por transação</span>
          <h2>Métricas detalhadas</h2>
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Transação</th>
              <th>Amostras</th>
              <th>Erros</th>
              <th>Throughput</th>
              <th>Média</th>
              <th>P90</th>
              <th>Máximo</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <span class="eyebrow">Conclusão</span>
          <h2>Leitura executiva</h2>
        </div>
      </div>
      <div class="panel-body">
        <p class="note">
          A execução registrou <strong>${formatNumber(total.sampleCount)}</strong> amostras, throughput de
          <strong>${formatNumber(total.throughput, 2)} req/s</strong>, percentil 90 de
          <strong>${formatNumber(total.pct1ResTime)} ms</strong> e taxa de erro de
          <strong>${formatNumber(total.errorPct, 2)}%</strong>. Use estes dados como evidência para avaliar
          os critérios de aceitação definidos para o teste.
        </p>
      </div>
    </section>
  </main>
</body>
</html>`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, html, "utf8");

console.log(`Relatório em português gerado em: ${outputPath}`);
