# Documentação técnica dos testes

Este documento consolida arquitetura, estratégia e decisões das automações Web, API e performance. Os comandos operacionais e evidências estão nos READMEs de cada frente.

## 1. Web — Blog do Agi

### Arquitetura

```text
pages/blogPage.js          # Page Object, locators e ações
tests/blog-search.spec.js  # Dois cenários e assertions
playwright.config.js       # Browser, timeouts e evidências
```

O Page Object concentra a interação e mantém os testes orientados a comportamento. A estrutura é propositalmente pequena: uma única página não justifica camadas adicionais.

### Cobertura e confiabilidade

- busca por `FGTS`: URL, título e ao menos um artigo relacionado;
- busca por termo inexistente: URL e mensagem de ausência de resultados;
- suporte explícito ao redirecionamento de `blogdoagi.com.br` para `blog.agibank.com.br`;
- locators semânticos e auto-wait do Playwright, sem sleeps fixos;
- contexto isolado por teste;
- screenshot em falha, trace na primeira repetição e relatório HTML.

O conteúdo editorial é dinâmico. Por isso, a suíte não fixa quantidade ou ordenação dos resultados, mas preserva as assertions de negócio. Consulte o [README Web](tests/README.md).

## 2. API — Dog API

### Arquitetura

```text
dog-api-tests/
|-- src/test/java/br/com/qa/config/ApiConfig.java
|-- src/test/java/br/com/qa/client/DogApiClient.java
|-- src/test/java/br/com/qa/tests/DogApiTest.java
|-- src/test/resources/schemas/
`-- pom.xml
```

- `ApiConfig` resolve a Base URL e cria a especificação comum do RestAssured;
- `DogApiClient` encapsula caminhos, parâmetros e chamadas;
- `DogApiTest` descreve seis comportamentos, incluindo três execuções parametrizadas por raça;
- os schemas mantêm os contratos independentes do código Java.

A Base URL segue a prioridade: System Property `baseUrl`, variável `DOG_API_BASE_URL` e fallback `https://dog.ceo/api`.

### Cobertura

- `GET /breeds/list/all`: HTTP 200, sucesso, coleção não vazia e raça conhecida;
- `GET /breed/{breed}/images`: três raças, HTTP 200, sucesso, coleção e URLs válidas;
- `GET /breeds/image/random`: HTTP 200, sucesso e URL válida;
- raça inexistente: HTTP 404, status e mensagem de erro coerentes;
- `GET /breed/hound/list`: coleção não vazia de sub-raças;
- `GET /breed/hound/images/random`: imagem aleatória pertencente à raça.

Todas as oito execuções verificam `Content-Type`, status HTTP, JSON Schema e conteúdo. Contrato e comportamento são validados separadamente, pois uma estrutura válida não garante regra funcional correta. Dados legitimamente dinâmicos, como quantidade de raças e URL exata de imagem, não são congelados. Consulte o [README da API](dog-api-tests/README.md).

## 3. Performance — BlazeDemo

### Critério e regra de decisão

O critério oficial é:

```text
throughput HTTP total >= 250 req/s
P90 < 2.000 ms
```

O script de validação adiciona `erros = 0` como gate interno de qualidade. Essa condição adicional não é confundida com o limite numérico do enunciado.

O P90, e não o tempo máximo, determina o critério de latência. Assim, o máximo isolado de 3.741 ms observado no pico não invalida o P90 de 468 ms. Erros de protocolo, conexão, assertion ou fluxo continuam reprovando o gate interno.

### Jornada e correlação

Cada iteração produz quatro requisições:

1. `GET /` — página inicial;
2. `POST /reserve.php` — pesquisa de voos;
3. `POST /purchase.php` — seleção do voo;
4. `POST /confirmation.php` — confirmação da compra.

Response Assertions validam conteúdo em todas as etapas. `flight`, `price` e `airline` são correlacionados entre respostas, e os passageiros vêm de CSV.

O throughput é calculado sobre os quatro samples HTTP; o Transaction Controller é excluído. Portanto, requisições por segundo não equivalem a compras por segundo.

### Modelos e janela de análise

O teste de carga usa 150 threads, ramp-up de 30 segundos, duração de 300 segundos e alvo de 16.200 samples/min (270 req/s). A análise descarta o ramp-up.

O pico é dividido em aquecimento, subida rápida, sustentação e recuperação. A decisão considera exclusivamente o grupo `03 Peak Sustain`: 150 threads, ramp-up de 1 segundo, duração de 60 segundos e alvo de 16.200 samples/min. Incluir aquecimento ou recuperação diluiria a métrica de pico.

O script `evaluate-performance.js` filtra os quatro samplers, calcula volume, throughput, média, percentis, máximo e erros, aplica o gate e registra SHA-256 do JTL.

### Evidência registrada em 11/09/2026

| Cenário | Samples | Throughput | P90 | Erros | Decisão |
| --- | ---: | ---: | ---: | ---: | --- |
| Carga | 72.545 | 268,58 req/s | 460 ms | 0,00% | Aprovado |
| Pico — sustentação | 15.986 | 264,42 req/s | 468 ms | 0,00% | Aprovado |

JTLs, resumos Markdown, relatórios executivos e dashboards JMeter estão versionados em `blazedemo-performance-tests/results/` e `blazedemo-performance-tests/reports/`. Eles não são ignorados pelo Git. Consulte o [README de performance](blazedemo-performance-tests/README.md).

## 4. CI/CD e evidências

Os workflows em `.github/workflows/` são acionados por push e pull request para `main` ou `master`:

- `playwright.yml`: prepara Node.js 20, instala Chromium, executa `npm test` e publica `playwright-report/`;
- `api-tests.yml`: prepara Java 17, executa `mvn -f dog-api-tests/pom.xml test` e publica Surefire e Allure Results;
- `performance-validation.yml`: valida JMXs e shell scripts, recalcula carga e pico a partir dos JTLs e publica os resumos.

O workflow de performance não dispara carga. Uma execução recorrente em serviço público seria inadequada e não teria ambiente suficientemente controlado; por isso o CI valida os artefatos já produzidos.

## 5. Limitações e manutenção

- Web e API dependem de serviços públicos e podem refletir indisponibilidade ou mudanças externas;
- locators só devem ser alterados após confirmar mudança real da interface;
- schemas devem mudar apenas diante de alteração legítima do contrato;
- testes de performance devem registrar parâmetros, janela e ambiente da execução;
- um resultado de performance demonstra o comportamento da janela observada, não capacidade universal;
- falhas não devem ser ocultadas com remoção de assertions, aumento arbitrário de tolerâncias ou repetição indiscriminada.

O fluxo de entrega usa `develop` para implementação e validação e `main` como versão estável, sem branches adicionais neste exercício.
