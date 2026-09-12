const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const HTTP_LABELS = [
  "GET Home",
  "POST Search Flights",
  "POST Choose Flight",
  "POST Confirm Purchase",
];
const HTTP_LABEL_SET = new Set(HTTP_LABELS);
const MIN_THROUGHPUT = 250;
const MAX_P90_MS = 2000;
const MAX_ERRORS = 0;

function usage() {
  console.error(
    "Uso: node evaluate-performance.js <load|spike> <arquivo.jtl> " +
      "[--ramp-up-seconds=30] [--output=resumo.md] [--html=relatorio/index.html]",
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

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatNumber(value, decimals = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(timestamp));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function summarize(sampleRows, windowSeconds) {
  const elapsed = sampleRows.map((row) => row.elapsed);
  const failures = sampleRows.filter((row) => !row.success).length;
  return {
    samples: sampleRows.length,
    throughput: sampleRows.length / windowSeconds,
    mean: average(elapsed),
    p50: percentile(elapsed, 50),
    p90: percentile(elapsed, 90),
    p95: percentile(elapsed, 95),
    p99: percentile(elapsed, 99),
    max: Math.max(...elapsed),
    failures,
    errorRate: (failures / sampleRows.length) * 100,
  };
}

function createSeries(sampleRows, startedAt, endedAt) {
  const bucketMs = 5000;
  const count = Math.max(1, Math.floor((endedAt - startedAt) / bucketMs));
  return Array.from({ length: count }, (_, index) => {
    const from = startedAt + index * bucketMs;
    const to = Math.min(from + bucketMs, endedAt);
    const bucketRows = sampleRows.filter(
      (row) => row.timestamp >= from && row.timestamp < to,
    );
    return {
      second: index * 5,
      throughput: bucketRows.length / ((to - from) / 1000),
      p90: bucketRows.length ? percentile(bucketRows.map((row) => row.elapsed), 90) : 0,
    };
  });
}

function makeChart(series, field, limit, color, unit) {
  const width = 900;
  const height = 230;
  const padding = 34;
  const values = series.map((point) => point[field]);
  const maximum = Math.max(limit * 1.15, ...values, 1);
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;
  const x = (index) => padding + (index / Math.max(1, series.length - 1)) * plotWidth;
  const y = (value) => padding + plotHeight - (value / maximum) * plotHeight;
  const points = series.map((point, index) => `${x(index)},${y(point[field])}`).join(" ");
  const thresholdY = y(limit);
  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Série temporal de ${field}">
      <line x1="${padding}" y1="${thresholdY}" x2="${width - padding}" y2="${thresholdY}" class="threshold" />
      <text x="${width - padding}" y="${thresholdY - 8}" text-anchor="end" class="chart-label">limite ${limit} ${unit}</text>
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" />
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" class="axis" />
      <text x="${padding}" y="${height - 8}" class="chart-label">0 s</text>
      <text x="${width - padding}" y="${height - 8}" text-anchor="end" class="chart-label">${Math.round((series.length - 1) * 5)} s</text>
    </svg>`;
}

function endpointMarkdown(endpointRows) {
  return endpointRows
    .map(
      ({ label, metrics }) =>
        `| ${label} | ${formatNumber(metrics.samples, 0)} | ${formatNumber(metrics.throughput)} req/s | ` +
        `${formatNumber(metrics.mean, 0)} ms | ${formatNumber(metrics.p90, 0)} ms | ` +
        `${formatNumber(metrics.p95, 0)} ms | ${formatNumber(metrics.p99, 0)} ms | ` +
        `${metrics.failures} |`,
    )
    .join("\n");
}

function endpointHtml(endpointRows) {
  return endpointRows
    .map(
      ({ label, metrics }) => `
        <tr>
          <td>${escapeHtml(label)}</td>
          <td>${formatNumber(metrics.samples, 0)}</td>
          <td>${formatNumber(metrics.throughput)}</td>
          <td>${formatNumber(metrics.mean, 0)} ms</td>
          <td>${formatNumber(metrics.p90, 0)} ms</td>
          <td>${formatNumber(metrics.p95, 0)} ms</td>
          <td>${formatNumber(metrics.p99, 0)} ms</td>
          <td>${metrics.failures}</td>
        </tr>`,
    )
    .join("");
}

const [mode, jtlArgument, ...options] = process.argv.slice(2);
if (!["load", "spike"].includes(mode) || !jtlArgument) usage();

const optionMap = Object.fromEntries(
  options.map((option) => {
    const [key, ...parts] = option.replace(/^--/, "").split("=");
    return [key, parts.join("=").replace(/^"|"$/g, "")];
  }),
);
const jtlPath = path.resolve(jtlArgument);
const rampUpSeconds = Number(optionMap["ramp-up-seconds"] || 30);

if (!fs.existsSync(jtlPath)) {
  throw new Error(`Arquivo JTL não encontrado: ${jtlPath}`);
}

const jtlBuffer = fs.readFileSync(jtlPath);
const lines = jtlBuffer.toString("utf8").trim().split(/\r?\n/);
const headers = parseCsvLine(lines.shift());
const column = Object.fromEntries(headers.map((header, index) => [header, index]));
const rows = lines.map(parseCsvLine).map((values) => ({
  timestamp: Number(values[column.timeStamp]),
  elapsed: Number(values[column.elapsed]),
  label: values[column.label],
  threadName: values[column.threadName],
  success: values[column.success] === "true",
}));

let evaluated = rows.filter((row) => HTTP_LABEL_SET.has(row.label));
let windowDescription;
let workloadDescription;
if (mode === "load") {
  const testStartedAt = Math.min(...evaluated.map((row) => row.timestamp));
  const stableStartedAt = testStartedAt + rampUpSeconds * 1000;
  evaluated = evaluated.filter((row) => row.timestamp >= stableStartedAt);
  windowDescription = `fase estável após ${rampUpSeconds} segundos de ramp-up`;
  workloadDescription = "150 usuários; alvo de 270 req/s; execução total de 5 minutos";
} else {
  evaluated = evaluated.filter((row) => row.threadName.startsWith("03 Peak Sustain"));
  windowDescription = "fase 03 de sustentação do pico";
  workloadDescription = "150 usuários no pico; alvo de 270 req/s; sustentação por 60 segundos";
}

if (evaluated.length === 0) {
  throw new Error(`Nenhuma requisição HTTP encontrada na ${windowDescription}.`);
}

const startedAt = Math.min(...evaluated.map((row) => row.timestamp));
const endedAt = Math.max(...evaluated.map((row) => row.timestamp + row.elapsed));
const durationSeconds = (endedAt - startedAt) / 1000;
const metrics = summarize(evaluated, durationSeconds);
const throughputOk = metrics.throughput >= MIN_THROUGHPUT;
const p90Ok = metrics.p90 < MAX_P90_MS;
const errorsOk = metrics.failures === MAX_ERRORS;
const approved = throughputOk && p90Ok && errorsOk;
const title = mode === "load" ? "Teste de Carga" : "Teste de Pico";
const shortName = mode === "load" ? "load-test" : "spike-test";
const executionId = `${mode.toUpperCase()}-${new Date(startedAt).toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
const sha256 = crypto.createHash("sha256").update(jtlBuffer).digest("hex");
const series = createSeries(evaluated, startedAt, endedAt);
const endpointRows = HTTP_LABELS.map((label) => ({
  label,
  metrics: summarize(
    evaluated.filter((row) => row.label === label),
    durationSeconds,
  ),
}));

const markdown = `# Relatório Executivo - ${title}\n\n` +
  `> **Decisão: ${approved ? "APROVADO" : "REPROVADO"}.** ${approved ? "Todos os critérios foram atendidos simultaneamente na janela avaliada." : "Ao menos um critério não foi atendido na janela avaliada."}\n\n` +
  `## Identificação\n\n` +
  `| Campo | Valor |\n| --- | --- |\n` +
  `| ID da execução | \`${executionId}\` |\n` +
  `| Sistema sob teste | \`https://www.blazedemo.com\` |\n` +
  `| Cenário | Compra de passagem aérea com confirmação de sucesso |\n` +
  `| Início da janela | ${formatDate(startedAt)} |\n` +
  `| Janela avaliada | ${windowDescription} |\n` +
  `| Perfil de carga | ${workloadDescription} |\n` +
  `| Evidência SHA-256 | \`${sha256}\` |\n\n` +
  `## Critérios de aceitação\n\n` +
  `| Critério | Resultado | Limite | Situação |\n| --- | ---: | ---: | --- |\n` +
  `| Throughput HTTP | ${formatNumber(metrics.throughput)} req/s | >= 250 req/s | **${throughputOk ? "Atendido" : "Não atendido"}** |\n` +
  `| Percentil 90 | ${formatNumber(metrics.p90, 0)} ms | < 2.000 ms | **${p90Ok ? "Atendido" : "Não atendido"}** |\n` +
  `| Erros funcionais/técnicos | ${metrics.failures} (${formatNumber(metrics.errorRate)}%) | 0 | **${errorsOk ? "Atendido" : "Não atendido"}** |\n\n` +
  `## Indicadores consolidados\n\n` +
  `| Requisições | Duração | Média | P50 | P90 | P95 | P99 | Máximo |\n| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n` +
  `| ${formatNumber(metrics.samples, 0)} | ${formatNumber(durationSeconds, 3)} s | ${formatNumber(metrics.mean, 0)} ms | ${formatNumber(metrics.p50, 0)} ms | ${formatNumber(metrics.p90, 0)} ms | ${formatNumber(metrics.p95, 0)} ms | ${formatNumber(metrics.p99, 0)} ms | ${formatNumber(metrics.max, 0)} ms |\n\n` +
  `## Resultado por endpoint\n\n` +
  `| Endpoint | Amostras | Throughput | Média | P90 | P95 | P99 | Erros |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n` +
  `${endpointMarkdown(endpointRows)}\n\n` +
  `## Metodologia e rastreabilidade\n\n` +
  `- Foram considerados somente os quatro samplers HTTP do fluxo de compra.\n` +
  `- O sampler sintético do Transaction Controller foi excluído para não inflar a vazão.\n` +
  `- ${mode === "load" ? "O ramp-up foi excluído; a decisão usa somente a fase estável." : "Aquecimento, subida e recuperação foram excluídos; a decisão usa somente a sustentação do pico."}\n` +
  `- O P90 foi calculado pelo método nearest-rank sobre os tempos decorridos da janela.\n` +
  `- As assertions do JMeter validaram as respostas e a confirmação da compra.\n\n` +
  `## Riscos e limitações\n\n` +
  `- Resultado pontual obtido contra um ambiente público e dependente da rede do gerador.\n` +
  `- Execução realizada a partir de um único gerador de carga, sem telemetria do servidor.\n` +
  `- O teste comprova o aceite nesta execução; não determina sozinho a capacidade máxima do sistema.\n\n` +
  `## Evidências\n\n` +
  `- [Resultado bruto JTL](${shortName}-results.jtl)\n` +
  `- [Dashboard técnico do JMeter](../reports/${shortName}-report/index.html)\n` +
  `- [Relatório executivo HTML](../reports/${shortName}-executive/index.html)\n\n` +
  `## Conclusão técnica\n\n` +
  `A execução foi **${approved ? "APROVADA" : "REPROVADA"}**. ` +
  `O fluxo apresentou ${formatNumber(metrics.throughput)} req/s, P90 de ${formatNumber(metrics.p90, 0)} ms e ${metrics.failures} erro(s). ` +
  `${approved ? "Há evidência suficiente para afirmar que o critério de aceite foi satisfeito na janela observada." : "É necessária uma nova execução após tratar os critérios não atendidos."}\n`;

const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Relatório Executivo - ${title}</title>
  <style>
    :root { --navy:#10233f; --blue:#2563eb; --cyan:#06b6d4; --green:#15803d; --green-bg:#ecfdf3; --red:#b42318; --red-bg:#fff1f0; --ink:#162033; --muted:#667085; --line:#dfe5ee; --bg:#f4f7fb; --panel:#fff; }
    * { box-sizing:border-box; }
    body { margin:0; font-family:Inter,"Segoe UI",Arial,sans-serif; color:var(--ink); background:var(--bg); line-height:1.55; }
    header { color:#fff; background:linear-gradient(125deg,var(--navy),#164e63); padding:48px 24px 84px; }
    .wrap { width:min(1160px,calc(100% - 32px)); margin:auto; }
    .eyebrow { font-size:12px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; opacity:.76; }
    h1 { margin:8px 0 10px; font-size:clamp(32px,5vw,54px); line-height:1.05; }
    header p { margin:0; max-width:760px; color:#d7e5f5; }
    .decision { display:inline-flex; margin-top:24px; padding:9px 14px; border-radius:999px; font-weight:800; background:${approved ? "#dcfce7" : "#fee2e2"}; color:${approved ? "#166534" : "#991b1b"}; }
    main { margin-top:-48px; padding-bottom:56px; }
    .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
    .card,.panel { background:var(--panel); border:1px solid var(--line); border-radius:14px; box-shadow:0 12px 35px rgba(16,35,63,.08); }
    .card { padding:20px; }
    .card small { color:var(--muted); font-weight:700; text-transform:uppercase; letter-spacing:.06em; }
    .card strong { display:block; margin:10px 0 4px; font-size:29px; color:var(--navy); }
    .ok { color:var(--green); } .fail { color:var(--red); }
    .panel { margin-top:18px; padding:24px; }
    h2 { margin:0 0 16px; color:var(--navy); font-size:22px; }
    h3 { margin:22px 0 8px; color:var(--navy); font-size:16px; }
    .meta { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
    .meta div { padding:14px; border-radius:10px; background:#f8fafc; border:1px solid var(--line); }
    .meta span { display:block; color:var(--muted); font-size:12px; text-transform:uppercase; font-weight:800; }
    .meta b { display:block; margin-top:5px; font-size:14px; overflow-wrap:anywhere; }
    table { width:100%; border-collapse:collapse; font-size:14px; }
    th,td { padding:12px 10px; border-bottom:1px solid var(--line); text-align:right; white-space:nowrap; }
    th:first-child,td:first-child { text-align:left; }
    th { color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.05em; background:#f8fafc; }
    .table-scroll { overflow-x:auto; }
    .criteria { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
    .criterion { padding:16px; border-radius:10px; border:1px solid var(--line); }
    .criterion b { display:block; font-size:20px; margin:5px 0; }
    .badge { font-size:12px; font-weight:800; text-transform:uppercase; }
    .chart-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .chart { border:1px solid var(--line); border-radius:10px; padding:12px; }
    svg { width:100%; height:auto; }
    .threshold { stroke:#dc2626; stroke-width:2; stroke-dasharray:7 7; opacity:.7; }
    .axis { stroke:#94a3b8; stroke-width:1; }
    .chart-label { fill:#667085; font-size:13px; }
    ul { margin:8px 0 0; padding-left:20px; }
    code { font-family:"Cascadia Code",Consolas,monospace; font-size:12px; }
    footer { color:var(--muted); text-align:center; padding:0 20px 30px; font-size:12px; }
    @media(max-width:850px){ .grid,.criteria,.meta,.chart-grid{grid-template-columns:1fr 1fr;} }
    @media(max-width:560px){ .grid,.criteria,.meta,.chart-grid{grid-template-columns:1fr;} header{padding-top:34px;} }
  </style>
</head>
<body>
  <header>
    <div class="wrap">
      <div class="eyebrow">Quality Engineering · Performance</div>
      <h1>${title}</h1>
      <p>Validação do fluxo completo de compra de passagem no BlazeDemo, com decisão baseada em throughput HTTP, percentil 90 e integridade funcional.</p>
      <div class="decision">${approved ? "✓ APROVADO" : "✕ REPROVADO"}</div>
    </div>
  </header>
  <main class="wrap">
    <section class="grid">
      <article class="card"><small>Throughput</small><strong>${formatNumber(metrics.throughput)}</strong><span>req/s · meta ≥ 250</span></article>
      <article class="card"><small>Percentil 90</small><strong>${formatNumber(metrics.p90, 0)}</strong><span>ms · limite &lt; 2.000</span></article>
      <article class="card"><small>Taxa de erro</small><strong>${formatNumber(metrics.errorRate)}</strong><span>% · ${metrics.failures} ocorrência(s)</span></article>
      <article class="card"><small>Amostras</small><strong>${formatNumber(metrics.samples, 0)}</strong><span>${formatNumber(durationSeconds, 1)} s avaliados</span></article>
    </section>
    <section class="panel">
      <h2>Identificação e rastreabilidade</h2>
      <div class="meta">
        <div><span>ID da execução</span><b><code>${executionId}</code></b></div>
        <div><span>Início da janela</span><b>${formatDate(startedAt)}</b></div>
        <div><span>Sistema sob teste</span><b>www.blazedemo.com</b></div>
        <div><span>Janela avaliada</span><b>${escapeHtml(windowDescription)}</b></div>
        <div><span>Perfil de carga</span><b>${escapeHtml(workloadDescription)}</b></div>
        <div><span>SHA-256 do JTL</span><b><code>${sha256}</code></b></div>
      </div>
    </section>
    <section class="panel">
      <h2>Decisão por critério</h2>
      <div class="criteria">
        <article class="criterion"><span class="badge ${throughputOk ? "ok" : "fail"}">${throughputOk ? "Atendido" : "Não atendido"}</span><b>${formatNumber(metrics.throughput)} req/s</b><span>Throughput mínimo: 250 req/s</span></article>
        <article class="criterion"><span class="badge ${p90Ok ? "ok" : "fail"}">${p90Ok ? "Atendido" : "Não atendido"}</span><b>${formatNumber(metrics.p90, 0)} ms</b><span>Limite: &lt; 2.000 ms</span></article>
        <article class="criterion"><span class="badge ${errorsOk ? "ok" : "fail"}">${errorsOk ? "Atendido" : "Não atendido"}</span><b>${metrics.failures} erros</b><span>Fluxo deve concluir com sucesso</span></article>
      </div>
    </section>
    <section class="panel">
      <h2>Comportamento durante a janela</h2>
      <div class="chart-grid">
        <div class="chart"><h3>Throughput em intervalos de 5 s</h3>${makeChart(series, "throughput", 250, "#2563eb", "req/s")}</div>
        <div class="chart"><h3>P90 em intervalos de 5 s</h3>${makeChart(series, "p90", 2000, "#06b6d4", "ms")}</div>
      </div>
    </section>
    <section class="panel">
      <h2>Distribuição de latência</h2>
      <div class="table-scroll"><table><thead><tr><th>Métrica</th><th>Média</th><th>P50</th><th>P90</th><th>P95</th><th>P99</th><th>Máximo</th></tr></thead>
      <tbody><tr><td>Tempo de resposta</td><td>${formatNumber(metrics.mean, 0)} ms</td><td>${formatNumber(metrics.p50, 0)} ms</td><td>${formatNumber(metrics.p90, 0)} ms</td><td>${formatNumber(metrics.p95, 0)} ms</td><td>${formatNumber(metrics.p99, 0)} ms</td><td>${formatNumber(metrics.max, 0)} ms</td></tr></tbody></table></div>
    </section>
    <section class="panel">
      <h2>Detalhamento por endpoint</h2>
      <div class="table-scroll"><table><thead><tr><th>Endpoint</th><th>Amostras</th><th>req/s</th><th>Média</th><th>P90</th><th>P95</th><th>P99</th><th>Erros</th></tr></thead><tbody>${endpointHtml(endpointRows)}</tbody></table></div>
    </section>
    <section class="panel">
      <h2>Leitura técnica</h2>
      <h3>Metodologia</h3>
      <ul><li>Somente os quatro samplers HTTP do fluxo foram contabilizados.</li><li>O Transaction Controller foi excluído para evitar inflação artificial da vazão.</li><li>${mode === "load" ? "O ramp-up foi removido da janela decisória." : "Somente a sustentação do pico foi usada na decisão."}</li><li>O P90 usa o método nearest-rank.</li></ul>
      <h3>Riscos e limitações</h3>
      <ul><li>Ambiente público e latência de rede estão incluídos no resultado.</li><li>Foi utilizado um único gerador, sem telemetria do servidor.</li><li>A aprovação é válida para esta execução e este perfil; não representa capacidade máxima.</li></ul>
      <h3>Conclusão</h3>
      <p>A execução foi <strong>${approved ? "aprovada" : "reprovada"}</strong>: ${formatNumber(metrics.throughput)} req/s, P90 de ${formatNumber(metrics.p90, 0)} ms e ${metrics.failures} erro(s). ${approved ? "Os critérios foram satisfeitos simultaneamente na janela observada." : "Um ou mais critérios exigem tratamento e nova execução."}</p>
    </section>
  </main>
  <footer>Relatório gerado automaticamente a partir do JTL · ${formatDate(Date.now())}</footer>
</body>
</html>`;

if (optionMap.output) {
  const outputPath = path.resolve(optionMap.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown, "utf8");
}
if (optionMap.html) {
  const htmlPath = path.resolve(optionMap.html);
  fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
  fs.writeFileSync(htmlPath, html, "utf8");
}

console.log(markdown);
process.exitCode = approved ? 0 : 1;
