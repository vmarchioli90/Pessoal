# Documentação Técnica dos Projetos de QA

Este documento apresenta a arquitetura, a estratégia e as decisões técnicas das automações Web, API e performance deste repositório.

## Visão geral

Os projetos são independentes e cobrem riscos diferentes:

- Web: comportamento da busca de artigos pela interface do Blog do Agi.
- API: disponibilidade, comportamento e contrato das respostas da Dog API.
- Performance: capacidade e tempo de resposta do fluxo de compra do BlazeDemo.

A implementação mantém poucas camadas, responsabilidades claras e comandos reproduzíveis. Dados variáveis de serviços públicos não são validados por valores exatos quando isso causaria fragilidade.

# 1. Web - Blog do Agi

## Objetivo e ferramentas

A automação usa JavaScript, Node.js e Playwright para validar a pesquisa acessada pela lupa do blog `https://blogdoagi.com.br/`. O redirecionamento atual para `blog.agibank.com.br` é aceito explicitamente.

## Arquitetura

```text
pages/blogPage.js          # Page Object, locators, ações e validações da página
tests/blog-search.spec.js  # Cenários e dados de teste
playwright.config.js       # Browser, timeouts, evidências e relatório
```

O Page Object concentra detalhes de interação e deixa os cenários focados no comportamento esperado. A estrutura é propositalmente pequena, pois existe uma única página e não há benefício em criar novas abstrações.

## Cenários

### Busca com resultado

O termo `FGTS` valida que:

- a navegação resulta em uma URL com o parâmetro de busca;
- o título da página contém o termo;
- existe pelo menos um artigo relacionado ao termo.

A validação procura correspondência em toda a coleção de títulos. Ela não depende da quantidade de resultados nem da posição do artigo, pois o conteúdo e a ordenação do blog podem mudar.

### Busca sem resultado

Um termo deliberadamente inexistente valida que:

- a URL contém o termo pesquisado;
- a interface apresenta uma mensagem de ausência de resultados.

## Confiabilidade

- Locators por role e atributos semânticos são priorizados.
- Seletores CSS são usados apenas como alternativa para estruturas estáveis do site.
- O Playwright fornece auto-wait; não há sleeps fixos.
- Cookies são aceitos somente quando o botão está visível.
- Screenshots são mantidos em falhas e trace é coletado na primeira repetição em CI.
- Os dois testes criam páginas e Page Objects próprios, sem dependência de ordem ou estado compartilhado.

## Limitações

Os testes dependem de um site público e de seu conteúdo editorial. Mudanças de domínio, texto, acessibilidade ou estrutura dos artigos podem exigir manutenção dos locators e assertions.

# 2. API - Dog API

## Objetivo e ferramentas

A suíte usa Java 17, Maven, JUnit 5, RestAssured, AssertJ, JSON Schema e Allure para verificar endpoints de raças e imagens da Dog API.

## Arquitetura

```text
dog-api-tests/
|-- src/test/java/br/com/qa/config/ApiConfig.java
|-- src/test/java/br/com/qa/client/DogApiClient.java
|-- src/test/java/br/com/qa/tests/DogApiTest.java
|-- src/test/resources/schemas/
`-- pom.xml
```

As responsabilidades são separadas da seguinte forma:

- `ApiConfig`: resolve a Base URL e cria a especificação comum do RestAssured.
- `DogApiClient`: encapsula paths, parâmetros e chamadas HTTP.
- `DogApiTest`: descreve cenários e assertions funcionais e de contrato.
- `schemas`: mantém contratos JSON independentes do código Java.

## Configuração de ambiente

A Base URL é resolvida em um único ponto, na seguinte ordem:

1. System Property `baseUrl`;
2. variável de ambiente `DOG_API_BASE_URL`;
3. fallback `https://dog.ceo/api`.

Exemplo:

```bash
mvn clean test -DbaseUrl=https://dog.ceo/api
```

Essa decisão elimina a dependência direta de um único ambiente sem espalhar lógica de infraestrutura pelos testes.

## Cobertura funcional

### `GET /breeds/list/all`

- status `200` e `status=success`;
- mapa de raças presente e não vazio;
- presença de pelo menos uma raça conhecida.

### `GET /breed/hound/images`

- status `200` e `status=success`;
- lista de imagens presente e não vazia;
- URL HTTPS no domínio esperado.

### `GET /breeds/image/random`

- status `200` e `status=success`;
- URL de imagem não vazia, HTTPS e no domínio esperado.

### Raça inexistente

- status `404` e `status=error`;
- mensagem de erro presente e coerente.

Não são fixadas quantidades de raças, listas completas ou URLs específicas de imagens, pois esses dados podem mudar legitimamente.

## Validação de contrato

Cada resposta testada possui um JSON Schema correspondente. Os contratos validam:

- objeto raiz;
- propriedades obrigatórias;
- tipos de `message` e `status`;
- arrays e seus itens;
- objetos de raças e arrays de sub-raças;
- formato URI para imagens;
- valores permitidos para `status`;
- ausência de propriedades inesperadas no objeto raiz.

JSON Schema complementa, e não substitui, as assertions funcionais. Uma resposta pode respeitar a estrutura e ainda conter um comportamento incorreto; por isso as duas camadas são mantidas.

## Relatórios e limitações

Surefire registra o resultado técnico da execução e Allure fornece evidências detalhadas. A suíte depende de uma API pública; indisponibilidade, rate limiting ou mudanças legítimas de contrato podem causar falhas externas ao código.

# 3. Performance - BlazeDemo

## Objetivo e critério

Os planos JMeter simulam a compra bem-sucedida de uma passagem no `https://www.blazedemo.com`.

O critério de aceitação recebido é:

- throughput mínimo de 250 requisições por segundo;
- percentil 90 inferior a 2.000 ms.

A taxa de erro também é observada como indicador essencial de qualidade, embora o enunciado não determine um limite numérico específico.

## Fluxo

Cada iteração executa quatro requisições principais:

1. `GET /` - abre a página inicial;
2. `POST /reserve.php` - pesquisa voos;
3. `POST /purchase.php` - escolhe um voo;
4. `POST /confirmation.php` - conclui a compra.

Response Assertions verificam o conteúdo esperado em cada etapa. Os valores `flight`, `price` e `airline` são correlacionados da resposta de reserva. Os dados do passageiro são lidos de `data/passengers.csv`.

## Componentes e decisões

- HTTP Request Defaults centraliza protocolo e host.
- Cookie e Cache Managers aproximam o comportamento de clientes reais.
- CSV Data Set Config separa massa de teste do plano.
- Constant Throughput Timer expressa as metas em amostras por minuto.
- Response Assertions evitam considerar HTTP 200 como sucesso funcional suficiente.
- Listeners pesados não fazem parte dos planos de carga.
- Scripts `.bat` e `.sh` oferecem execução em Windows e Linux/macOS.

O alvo de 250 req/s é configurado como 15.000 amostras por minuto. Essa configuração limita a taxa desejada, mas não garante que a máquina geradora, o número de threads, a rede e o servidor conseguirão alcançá-la.

## Carga e pico

O teste de carga usa por padrão 100 threads, ramp-up de 120 segundos e duração de 300 segundos. O teste de pico divide a execução em aquecimento, subida, sustentação e recuperação, com propriedades específicas para threads, durações e throughput de cada fase.

As propriedades e os comandos completos estão no [README de performance](blazedemo-performance-tests/README.md).

## Interpretação

Requisições por segundo não são equivalentes a compras por segundo. Uma compra completa contém quatro requisições, portanto o critério deve ser avaliado sobre os samples HTTP do JMeter, sem contabilizar o Transaction Controller como uma requisição adicional.

A aprovação exige evidência real da janela relevante:

```text
throughput >= 250 req/s
P90 < 2000 ms
```

Os relatórios também devem registrar volume, média, máximo, taxa de erro, configuração usada e limitações do ambiente. Os resultados reais ficam em:

- `blazedemo-performance-tests/results/load-test-summary.md`
- `blazedemo-performance-tests/results/spike-test-summary.md`

Os dashboards HTML e arquivos JTL são gerados localmente e ignorados pelo Git por serem artefatos volumosos e reproduzíveis.

## Limitações

O BlazeDemo é público e não há controle sobre infraestrutura, concorrência externa ou disponibilidade. Uma reprovação indica que o critério não foi demonstrado naquela execução; isoladamente, não identifica se o gargalo está no servidor, na rede ou na máquina geradora.

# 4. CI/CD e evidências

Os workflows GitHub Actions são acionados em pushes e pull requests para `main` ou `master`:

- `playwright.yml`: Node.js, instalação do Chromium, testes Web e artifact do relatório Playwright.
- `api-tests.yml`: Java 17, cache Maven, testes da API e artifact dos relatórios Surefire.

Performance não é executada automaticamente. Disparar carga em um serviço público a cada commit seria inadequado e tornaria os resultados pouco controlados.

# 5. Manutenção e evolução

Pontos de manutenção esperados:

- atualizar locators Web quando houver mudança real de interface;
- revisar schemas quando o contrato da API mudar legitimamente;
- fornecer a Base URL do ambiente desejado por configuração;
- revisar massa de dados e correlações do JMeter quando o fluxo mudar;
- calibrar threads e ambiente gerador antes de uma nova execução oficial de performance;
- manter relatórios gerados fora do versionamento e resumos reais dentro do repositório.

A arquitetura atual permite essas evoluções sem introduzir um framework maior do que o escopo exige.
