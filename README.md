# Projetos de QA Automation

Repositorio com tres projetos de teste tecnico de QA:

- Automacao Web com Playwright para o Blog do Agi.
- Automacao de API com Java, RestAssured, JUnit 5 e Allure para a Dog API.
- Testes de Performance com Apache JMeter para o BlazeDemo.

O objetivo e manter cada projeto simples, organizado e facil de executar pelo avaliador.

## Execucao rapida pela raiz

Instale as dependencias Node.js do projeto Web:

```bash
npm install
npx playwright install
```

Execute os testes Web:

```bash
npm run test:web
```

Execute os testes Web com navegador aberto:

```bash
npm run test:headed
```

Execute os testes de API:

```bash
npm run test:api
```

Execute Web + API:

```bash
npm run test:all
```

Execute o teste de carga JMeter:

```bash
npm run test:performance:load
```

Execute o teste de pico JMeter:

```bash
npm run test:performance:spike
```

Abra os relatorios:

```bash
npm run report
npm run report:api
npm run report:performance:load
npm run report:performance:spike
```

## Pre-requisitos

Para o projeto Web:

- Node.js 18 ou superior
- npm

Para o projeto API:

- Java 17
- Maven

Para o projeto Performance:

- Java instalado, preferencialmente Java 17
- Apache JMeter instalado
- `jmeter` disponivel no `PATH` ou `JMETER_HOME` configurado

## Projetos

### Web - Blog do Agi

Pasta/arquivos principais:

```text
pages/
tests/
playwright.config.js
```

Site alvo:

```text
https://blogdoagi.com.br/
```

Cenarios cobertos:

- Buscar por um termo existente, como `FGTS`, validando resultados relacionados.
- Buscar por um termo inexistente, como `termoqaautomatizadoinexistente123`, validando mensagem de ausencia de resultados.

O teste considera o redirecionamento de `blogdoagi.com.br` para `blog.agibank.com.br`.

Documentacao especifica do projeto Web esta neste README porque ele fica na raiz do repositorio.

### API - Dog API

Pasta:

```text
dog-api-tests/
```

Base URL:

```text
https://dog.ceo/api
```

Endpoints cobertos:

- `GET /breeds/list/all`
- `GET /breed/{breed}/images`
- `GET /breeds/image/random`

Documentacao especifica:

```text
dog-api-tests/README.md
```

### Performance - BlazeDemo

Pasta:

```text
blazedemo-performance-tests/
```

URL alvo:

```text
https://www.blazedemo.com
```

Planos JMeter:

- `jmeter/blazedemo-load-test.jmx`
- `jmeter/blazedemo-spike-test.jmx`

Documentacao especifica:

```text
blazedemo-performance-tests/README.md
```

## Relatorios

Web Playwright:

```bash
npm run report
```

API Allure:

```bash
npm run report:api
```

Performance JMeter:

```bash
npm run report:performance:load
npm run report:performance:spike
```

## GitHub Actions

Workflows configurados:

```text
.github/workflows/playwright.yml
.github/workflows/api-tests.yml
```

O workflow Web executa os testes Playwright.

O workflow API executa os testes Java com Maven e gera artefatos de relatorio.

## Documentacao tecnica

Existe uma documentacao consolidada para apresentacao tecnica dos tres projetos:

```text
DOCUMENTACAO_TECNICA_DOS_TESTES.md
```

Ela explica arquitetura, decisoes tecnicas, cenarios, metricas, boas praticas e pontos para defender em entrevista.

## Estrutura geral

```text
.
├── .github/
│   └── workflows/
├── blazedemo-performance-tests/
├── dog-api-tests/
├── pages/
├── tests/
├── DOCUMENTACAO_TECNICA_DOS_TESTES.md
├── package.json
├── playwright.config.js
└── README.md
```
