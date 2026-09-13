# Teste técnico de QA

[![Playwright Tests](https://github.com/vmarchioli90/teste-tecnico-qa-agibank/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/vmarchioli90/teste-tecnico-qa-agibank/actions/workflows/playwright.yml)
[![Dog API Tests](https://github.com/vmarchioli90/teste-tecnico-qa-agibank/actions/workflows/api-tests.yml/badge.svg?branch=main)](https://github.com/vmarchioli90/teste-tecnico-qa-agibank/actions/workflows/api-tests.yml)
[![Performance Evidence](https://github.com/vmarchioli90/teste-tecnico-qa-agibank/actions/workflows/performance-validation.yml/badge.svg?branch=main)](https://github.com/vmarchioli90/teste-tecnico-qa-agibank/actions/workflows/performance-validation.yml)

Repositório com três frentes independentes de automação: testes Web do Blog do Agi, testes de API da Dog API e testes de performance do fluxo de compra do BlazeDemo. A documentação prioriza execução reproduzível, evidências rastreáveis e critérios de aprovação explícitos.

## Visão executiva

| Frente | Objetivo | Stack | Situação documentada |
| --- | --- | --- | --- |
| Web | Validar buscas com e sem resultados no Blog do Agi | Playwright, JavaScript, Node.js | 2 cenários automatizados |
| API | Validar comportamento e contrato da Dog API | Java 17, Maven, JUnit 5, RestAssured, JSON Schema | 8 execuções automatizadas no CI |
| Performance | Validar a jornada de compra do BlazeDemo sob carga e pico | JMeter 5.6.3, Node.js | Carga e pico aprovados nas evidências de 11/09/2026 |

Resultado de performance registrado:

| Cenário | Throughput HTTP total | P90 | Erros | Decisão |
| --- | ---: | ---: | ---: | --- |
| Carga | 268,58 req/s | 460 ms | 0,00% | Aprovado |
| Pico — sustentação | 264,42 req/s | 468 ms | 0,00% | Aprovado |

O critério oficial é `throughput >= 250 req/s` e `P90 < 2.000 ms`. O gate automatizado acrescenta `erros = 0` como requisito interno de qualidade. O throughput representa a soma das quatro requisições HTTP da jornada, não compras concluídas por segundo.

## Estrutura

```text
.
|-- .github/workflows/                 # Pipelines Web, API e validação de performance
|-- pages/                             # Page Object do Blog do Agi
|-- tests/                             # Cenários e documentação Web
|-- scripts/                           # Utilitários multiplataforma da raiz
|-- dog-api-tests/                     # Projeto Maven da Dog API
|-- blazedemo-performance-tests/       # JMX, scripts e evidências de performance
|-- DOCUMENTACAO_TECNICA_DOS_TESTES.md
|-- package.json
|-- playwright.config.js
|-- .nvmrc
`-- LICENSE
```

## Pré-requisitos

- Node.js 20 ou superior e npm;
- Java 17 e Maven;
- Chromium do Playwright para os testes Web;
- Apache JMeter 5.6.3 ou compatível no `PATH` somente para novas execuções de performance.

Instalação Web:

```bash
npm ci
npx playwright install chromium
```

As dependências da API são resolvidas pelo Maven.

## Execução rápida

Web — mesmo comando do CI:

```bash
npm test
```

API — mesmo comando do CI, executado pela raiz:

```bash
mvn -f dog-api-tests/pom.xml test
```

Web e API em sequência:

```bash
npm run test:all
```

Performance no Windows:

```bat
npm run test:performance:load
npm run test:performance:spike
```

Uma nova carga contra serviço público só deve ser disparada com autorização e ambiente controlado. Consulte parâmetros, metodologia e comandos Linux/macOS no [README de performance](blazedemo-performance-tests/README.md).

## Relatórios e evidências

- Web: `playwright-report/index.html`, gerado localmente e publicado como artifact pelo CI;
- API: `dog-api-tests/target/surefire-reports/` e `dog-api-tests/target/allure-results/`, gerados localmente e publicados separadamente pelo CI;
- Performance: arquivos JTL, resumos Markdown e dashboards HTML em [`blazedemo-performance-tests/results/`](blazedemo-performance-tests/results/) e [`blazedemo-performance-tests/reports/`](blazedemo-performance-tests/reports/).

Os artefatos locais de Web e API são ignorados pelo Git. As evidências históricas de performance estão deliberadamente versionadas para permitir a conferência dos números apresentados.

```bash
npm run report
npm run report:api
npm run report:performance:load
npm run report:performance:spike
```

Os comandos acima abrem o relatório correspondente em Windows, Linux ou macOS.

## CI/CD e branches

Os workflows são acionados por `push` e `pull_request` direcionados a `main` ou `master`:

- [`playwright.yml`](.github/workflows/playwright.yml): Node.js 20, Chromium, `npm test` e relatório Playwright;
- [`api-tests.yml`](.github/workflows/api-tests.yml): Java 17, cache Maven, `mvn -f dog-api-tests/pom.xml test`, Surefire e Allure Results;
- [`performance-validation.yml`](.github/workflows/performance-validation.yml): valida JMXs e scripts e recalcula o aceite a partir dos JTLs versionados, sem gerar nova carga.

O fluxo do repositório usa apenas:

- `develop`: desenvolvimento e validação dos ajustes;
- `main`: versão estável publicada no GitHub.

Performance não gera carga automaticamente no CI para evitar requisições recorrentes contra um serviço público. O pipeline valida de forma segura os planos e as evidências existentes. O histórico recente adota Conventional Commits; commits antigos são preservados para não reescrever o histórico público.

## Documentação por frente

- [Web — Blog do Agi](tests/README.md)
- [API — Dog API](dog-api-tests/README.md)
- [Performance — BlazeDemo](blazedemo-performance-tests/README.md)
- [Decisões técnicas consolidadas](DOCUMENTACAO_TECNICA_DOS_TESTES.md)
- [Licença MIT](LICENSE)
