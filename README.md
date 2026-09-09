# Projetos de QA Automation

Repositório com três automações desenvolvidas para um teste técnico de QA:

- Web: busca de artigos no Blog do Agi com Playwright.
- API: endpoints da Dog API com Java, RestAssured, JUnit 5 e JSON Schema.
- Performance: fluxo de compra de passagem no BlazeDemo com Apache JMeter.

O projeto prioriza testes legíveis, separação de responsabilidades, configuração simples e execução reproduzível localmente ou em CI.

## Tecnologias

- Node.js 18+ e Playwright
- Java 17, Maven, JUnit 5, RestAssured, AssertJ e Allure
- JSON Schema para validação de contrato da API
- Apache JMeter para testes de carga e pico
- GitHub Actions para Web e API

## Estrutura

```text
.
|-- .github/workflows/                 # Pipelines Web e API
|-- pages/                             # Page Object do Playwright
|-- tests/                             # Cenários Web
|-- dog-api-tests/                     # Projeto Maven da Dog API
|   `-- src/test/resources/schemas/    # Contratos JSON
|-- blazedemo-performance-tests/       # Planos, scripts e resultados JMeter
|-- DOCUMENTACAO_TECNICA_DOS_TESTES.md
|-- package.json
`-- playwright.config.js
```

## Instalação

Pré-requisitos:

- Node.js 18 ou superior e npm
- Java 17 e Maven
- Apache JMeter com o diretório `bin` disponível no `PATH` para performance

Dependências Web:

```bash
npm ci
npx playwright install chromium
```

As dependências da API são resolvidas automaticamente pelo Maven.

## Execução

### Web

```bash
npm run test:web
```

Com o navegador visível:

```bash
npm run test:headed
```

### API

```bash
npm run test:api
```

Os testes usam `https://dog.ceo/api` por padrão. Outra URL pode ser fornecida, nesta ordem de prioridade:

1. System Property Maven `baseUrl`;
2. variável de ambiente `DOG_API_BASE_URL`;
3. URL padrão.

Exemplos:

```bash
cd dog-api-tests
mvn clean test -DbaseUrl=https://dog.ceo/api
```

```powershell
$env:DOG_API_BASE_URL = "https://dog.ceo/api"
mvn -f dog-api-tests/pom.xml clean test
```

Para executar Web e API pela raiz:

```bash
npm run test:all
```

### Performance

No Windows, pela raiz:

```bash
npm run test:performance:load
npm run test:performance:spike
```

No Linux/macOS:

```bash
cd blazedemo-performance-tests
chmod +x scripts/run-load-test.sh scripts/run-spike-test.sh
./scripts/run-load-test.sh
./scripts/run-spike-test.sh
```

Os valores de threads, duração, ramp-up e throughput podem ser sobrescritos por variáveis descritas no [README de performance](blazedemo-performance-tests/README.md).

Como o alvo é um ambiente público, as execuções devem ser planejadas e os resultados interpretados considerando rede, máquina geradora de carga e disponibilidade do serviço.

## Relatórios e evidências

- Web: `playwright-report/index.html`
- API: `dog-api-tests/target/surefire-reports/` e `dog-api-tests/target/allure-results/`
- Performance: `blazedemo-performance-tests/results/` e `blazedemo-performance-tests/reports/`

Comandos auxiliares:

```bash
npm run report
npm run report:api
npm run report:performance:load
npm run report:performance:spike
```

Artefatos gerados são ignorados pelo Git. Os resumos Markdown de performance permanecem versionados para registrar resultados reais e a conclusão dos critérios.

## CI/CD

Os workflows em `.github/workflows/` executam a cada push ou pull request para `main`/`master`:

- Playwright: instala o Chromium, executa os testes Web e publica o relatório HTML.
- Dog API: configura Java 17, executa os testes Maven e publica os relatórios Surefire.

## Documentação

- [Documentação técnica consolidada](DOCUMENTACAO_TECNICA_DOS_TESTES.md)
- [Dog API](dog-api-tests/README.md)
- [Performance com JMeter](blazedemo-performance-tests/README.md)
