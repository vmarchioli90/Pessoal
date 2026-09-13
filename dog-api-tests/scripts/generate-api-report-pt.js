const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const resultsDir = path.join(rootDir, "target", "allure-results");
const outputDir = path.join(rootDir, "target", "site", "api-report-pt");
const outputPath = path.join(outputDir, "index.html");

function readResults() {
  if (!fs.existsSync(resultsDir)) {
    throw new Error(`Resultados do Allure não encontrados em: ${resultsDir}`);
  }

  const allResults = fs.readdirSync(resultsDir)
    .filter((file) => file.endsWith("-result.json"))
    .map((file) => {
      const content = fs.readFileSync(path.join(resultsDir, file), "utf8");
      return JSON.parse(content);
    });

  if (allResults.length === 0) {
    throw new Error(`Nenhum resultado de teste encontrado em: ${resultsDir}`);
  }

  // Allure preserva resultados anteriores quando `mvn test` é executado sem
  // `clean`. Mantemos somente a ocorrência mais recente de cada cenário para
  // que o relatório represente uma única execução lógica, sem duplicidades.
  const latestByScenario = new Map();
  for (const result of allResults) {
    const scenarioId = result.historyId || result.fullName || result.name;
    const current = latestByScenario.get(scenarioId);
    if (!current || (result.stop || result.start) > (current.stop || current.start)) {
      latestByScenario.set(scenarioId, result);
    }
  }

  return [...latestByScenario.values()].sort((a, b) => a.start - b.start);
}

function labelValue(test, name) {
  return normalizeText(test.labels?.find((label) => label.name === name)?.value || "-");
}

function normalizeText(value) {
  const replacements = {
    "Consultas de racas e imagens": "Consultas de raças e imagens",
    "Deve listar todas as racas disponiveis": "Deve listar todas as raças disponíveis",
    "Deve consultar imagens de uma raca valida": "Deve consultar imagens de uma raça válida",
    "Deve consultar uma imagem aleatoria": "Deve consultar uma imagem aleatória",
    "Deve retornar erro ao consultar imagens de uma raca inexistente": "Deve retornar erro ao consultar imagens de uma raça inexistente",
  };

  return replacements[value] || value;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(Number(value) || 0);
}

function formatMs(value) {
  return `${formatNumber(value)} ms`;
}

function statusText(status) {
  const statuses = {
    passed: "Passou",
    failed: "Falhou",
    broken: "Quebrou",
    skipped: "Ignorado",
  };

  return statuses[status] || status;
}

function statusClass(status) {
  return status === "passed" ? "ok" : status === "skipped" ? "warn" : "fail";
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

const tests = readResults();
const total = tests.length;
const passed = tests.filter((test) => test.status === "passed").length;
const failed = tests.filter((test) => ["failed", "broken"].includes(test.status)).length;
const skipped = tests.filter((test) => test.status === "skipped").length;
const startedAt = Math.min(...tests.map((test) => test.start));
const endedAt = Math.max(...tests.map((test) => test.stop));
const durationMs = endedAt - startedAt;
const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
const epic = labelValue(tests[0], "epic");
const feature = labelValue(tests[0], "feature");

const rows = tests.map((test) => {
  const duration = Math.max(0, test.stop - test.start);
  const method = labelValue(test, "testMethod");

  return `
    <tr>
      <td>
        <strong>${normalizeText(test.name)}</strong>
        <small>${method}</small>
      </td>
      <td><span class="badge ${statusClass(test.status)}">${statusText(test.status)}</span></td>
      <td>${formatMs(duration)}</td>
      <td>${labelValue(test, "testClass")}</td>
    </tr>
  `;
}).join("");

const generatedAt = Date.now();

const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Relatório de API - Dog API</title>
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
      background: linear-gradient(135deg, rgba(29, 95, 209, 0.94), rgba(23, 138, 92, 0.86));
      color: #fff;
      padding: 42px 28px 34px;
    }

    .wrap {
      width: min(1180px, calc(100% - 40px));
      margin: 0 auto;
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
      color: rgba(255, 255, 255, 0.88);
      font-size: 1.05rem;
      line-height: 1.55;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 20px;
      color: rgba(255, 255, 255, 0.86);
    }

    .meta span {
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 999px;
      padding: 7px 11px;
      background: rgba(255, 255, 255, 0.1);
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

    .metric.info {
      border-color: #cfe0ff;
      background: linear-gradient(180deg, #fff, var(--blue-bg));
    }

    .metric.success {
      border-color: #bde8d1;
      background: linear-gradient(180deg, #fff, var(--green-bg));
    }

    .metric.warning {
      border-color: #ffe2a8;
      background: linear-gradient(180deg, #fff, var(--amber-bg));
    }

    .metric.danger {
      border-color: #ffc9c3;
      background: linear-gradient(180deg, #fff, var(--red-bg));
    }

    .panel {
      margin-top: 18px;
      overflow: hidden;
    }

    .panel-header {
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

    .summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .summary-item {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
      background: #fbfcfe;
    }

    .summary-item p {
      margin: 8px 0 0;
      color: var(--muted);
      line-height: 1.45;
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
      text-align: left;
      vertical-align: middle;
    }

    th {
      color: var(--muted);
      background: #f8fafc;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    td:first-child small {
      display: block;
      margin-top: 4px;
      color: var(--muted);
    }

    tr:last-child td {
      border-bottom: 0;
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

    .badge.warn {
      color: var(--amber);
      background: var(--amber-bg);
    }

    .note {
      margin: 0;
      color: var(--muted);
      line-height: 1.6;
    }

    @media (max-width: 900px) {
      .grid,
      .summary {
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
      <h1>Relatório de API</h1>
      <p class="subtitle">Resumo objetivo dos testes automatizados da Dog API, gerado a partir dos resultados reais do Allure/JUnit.</p>
      <div class="meta">
        <span>Projeto: ${epic}</span>
        <span>Funcionalidade: ${feature}</span>
        <span>Execução: ${formatDate(startedAt)}</span>
        <span>Gerado em: ${formatDate(generatedAt)}</span>
      </div>
    </div>
  </header>

  <main class="wrap">
    <section class="grid">
      ${metricCard("Cenários", formatNumber(total), "Total de testes executados", "info")}
      ${metricCard("Passaram", formatNumber(passed), `${successRate}% de sucesso`, "success")}
      ${metricCard("Falharam", formatNumber(failed), "Falhas e quebras detectadas", failed > 0 ? "danger" : "neutral")}
      ${metricCard("Duração", formatMs(durationMs), "Tempo total da execução", skipped > 0 ? "warning" : "neutral")}
    </section>

    <section class="panel">
      <div class="panel-header">
        <span class="eyebrow">Resumo da execução</span>
        <h2>Visão geral</h2>
      </div>
      <div class="panel-body summary">
        <article class="summary-item">
          <span class="eyebrow">Escopo</span>
          <p>Validação dos endpoints de raças e imagens da Dog API.</p>
        </article>
        <article class="summary-item">
          <span class="eyebrow">Evidência</span>
          <p>Dados extraídos dos arquivos gerados em <strong>target/allure-results</strong>.</p>
        </article>
        <article class="summary-item">
          <span class="eyebrow">Ignorados</span>
          <p><strong>${formatNumber(skipped)}</strong> cenário(s) ignorado(s) nesta execução.</p>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <span class="eyebrow">Cenários testados</span>
        <h2>Detalhamento</h2>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Cenário</th>
              <th>Status</th>
              <th>Duração</th>
              <th>Classe</th>
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
        <span class="eyebrow">Conclusão</span>
        <h2>Leitura executiva</h2>
      </div>
      <div class="panel-body">
        <p class="note">
          A execução registrou <strong>${formatNumber(total)}</strong> cenários, com
          <strong>${formatNumber(passed)}</strong> sucesso(s),
          <strong>${formatNumber(failed)}</strong> falha(s) e
          <strong>${formatNumber(skipped)}</strong> ignorado(s). Este relatório resume os resultados
          essenciais para revisão rápida, enquanto o Allure original permanece disponível para análise detalhada.
        </p>
      </div>
    </section>
  </main>
</body>
</html>`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, html, "utf8");

console.log(`Relatório objetivo de API gerado em: ${outputPath}`);
