# Documentacao Tecnica dos Projetos de QA

Este documento consolida a explicacao tecnica dos tres projetos criados no repositorio, com foco em apresentacao para entrevista tecnica de QA.

Projetos abordados:

- Automacao Web com Playwright: busca de artigos no Blog do Agi.
- Automacao de API com Java, RestAssured e JUnit 5: Dog API.
- Testes de Performance com Apache JMeter: fluxo de compra no BlazeDemo.

## Visao Geral

Os tres projetos foram criados com a mesma premissa: entregar automacoes simples, profissionais, executaveis e faceis de manter.

A ideia nao foi criar uma arquitetura grande demais, mas sim demonstrar criterio tecnico: separacao de responsabilidades, asserts objetivos, configuracao clara, documentacao util e possibilidade de execucao em ambiente local ou CI.

Cada projeto cobre um tipo diferente de teste:

- Web UI: valida comportamento do usuario em uma interface real.
- API: valida contrato, status code, estrutura e comportamento positivo/negativo de endpoints publicos.
- Performance: valida capacidade, estabilidade e tempo de resposta sob carga controlada.

---

# 1. Projeto Web - Blog do Agi

## Objetivo

O objetivo deste projeto e automatizar a funcionalidade de busca de artigos do Blog do Agi.

Site alvo:

```text
https://blogdoagi.com.br/
```

Funcionalidade testada:

```text
Busca de artigos acessada pela lupa no canto superior direito.
```

O teste tambem considera que o site pode redirecionar de:

```text
blogdoagi.com.br
```

para:

```text
blog.agibank.com.br
```

Essa decisao evita falha falsa caso o dominio principal redirecione para o dominio atual do blog.

## Stack Utilizada

- Node.js
- JavaScript
- Playwright
- GitHub Actions

## Estrutura

```text
pages/
└── blogPage.js

tests/
└── blog-search.spec.js

playwright.config.js
package.json
README.md
.github/workflows/playwright.yml
```

## Decisao de Arquitetura

Foi utilizado Page Object Model de forma simples.

A classe `BlogPage` centraliza acoes e validacoes relacionadas ao blog:

- abrir a pagina;
- aceitar cookies se aparecerem;
- executar busca;
- validar URL da busca;
- validar resultados relacionados;
- validar ausencia de resultados.

Essa separacao deixa o teste mais legivel. O arquivo de teste descreve o comportamento esperado, enquanto detalhes de interacao ficam no Page Object.

Exemplo do ganho:

```javascript
await blogPage.open();
await blogPage.searchFor(termoBuscado);
await blogPage.expectResultsRelatedTo(termoBuscado);
```

Esse estilo facilita a leitura por pessoas tecnicas e nao tecnicas.

## Seletores

Foram priorizados seletores resilientes:

- `getByRole`
- `getByPlaceholder`
- texto visivel
- estrutura sem depender de classes dinamicas

Isso reduz fragilidade, porque classes CSS podem mudar por refatoracao visual, enquanto roles, placeholders e textos visiveis tendem a representar melhor o comportamento do usuario.

## Cenarios Cobertos

### Cenario 1: Buscar termo existente

Termo usado:

```text
FGTS
```

Validacoes:

- a busca redireciona para uma URL com o parametro `s=FGTS`;
- o titulo da pagina contem o termo buscado;
- existe pelo menos um artigo visivel;
- o primeiro titulo de artigo contem o termo `FGTS`.

Motivo tecnico:

Nao validamos quantidade fixa de resultados, pois o conteudo de um blog muda com o tempo. Validar quantidade exata seria fragil.

### Cenario 2: Buscar termo inexistente

Termo usado:

```text
termoqaautomatizadoinexistente123
```

Validacoes:

- a busca redireciona para uma URL com o termo pesquisado;
- o sistema exibe mensagem adequada de ausencia de resultados.

Motivo tecnico:

Esse cenario valida comportamento negativo e garante que o sistema responde de forma controlada quando nao encontra conteudo.

## Configuracao do Playwright

O arquivo `playwright.config.js` define:

- browser Chromium;
- timeout de testes;
- retries em CI;
- screenshots apenas em falha;
- videos apenas em falha por padrao;
- trace na primeira retentativa;
- relatorio HTML.

Tambem foi criada uma opcao para gravar video quando desejado:

```powershell
$env:PLAYWRIGHT_VIDEO='on'; npm test
```

## Pipeline

O GitHub Actions executa:

- checkout do repositorio;
- setup do Node.js;
- instalacao das dependencias;
- instalacao dos browsers do Playwright;
- execucao dos testes;
- upload do relatorio como artifact.

## O que falar na entrevista

Eu explicaria assim:

> Neste projeto eu foquei em validar a funcionalidade critica de busca usando Playwright com JavaScript. Usei Page Object Model de forma simples para separar comportamento de implementacao, sem criar uma arquitetura artificial. Os seletores priorizam role, placeholder e texto visivel, porque sao mais proximos da experiencia real do usuario e menos acoplados ao CSS. Tambem tratei o redirecionamento de dominio para evitar falso negativo. Os asserts sao objetivos e evitam depender de quantidade fixa de artigos, ja que o conteudo do blog pode mudar.

---

# 2. Projeto API - Dog API

## Objetivo

O objetivo deste projeto e validar endpoints publicos da Dog API, cobrindo cenarios positivos e negativos.

Base URL:

```text
https://dog.ceo/api
```

## Stack Utilizada

- Java 17
- Maven
- JUnit 5
- RestAssured
- AssertJ
- Allure Report
- GitHub Actions

## Estrutura

```text
dog-api-tests/
├── src/test/java/br/com/qa/config/
│   └── ApiConfig.java
├── src/test/java/br/com/qa/client/
│   └── DogApiClient.java
├── src/test/java/br/com/qa/tests/
│   └── DogApiTest.java
├── pom.xml
└── README.md
```

## Decisao de Arquitetura

O projeto foi dividido em tres responsabilidades:

### config

Classe:

```text
ApiConfig
```

Responsavel por centralizar:

- base URL;
- content type JSON;
- configuracoes comuns do RestAssured.

Motivo:

Evita repeticao em todos os testes e facilita manutencao se a base URL ou headers mudarem.

### client

Classe:

```text
DogApiClient
```

Responsavel por encapsular as chamadas:

- `getAllBreeds()`
- `getImagesByBreed(String breed)`
- `getRandomImage()`

Motivo:

Os testes nao precisam conhecer detalhes de path ou montagem da chamada. Eles ficam focados nas validacoes.

### tests

Classe:

```text
DogApiTest
```

Responsavel por executar os cenarios e validar respostas.

Motivo:

Mantem o teste claro, com asserts objetivos e legiveis.

## Endpoints Cobertos

### GET /breeds/list/all

Valida a listagem de todas as racas.

Asserts:

- status code `200`;
- campo `status` igual a `success`;
- campo `message` nao nulo;
- lista/mapa de racas nao vazio;
- existencia de racas conhecidas como `hound`, `retriever` ou `bulldog`.

Motivo tecnico:

A resposta desse endpoint retorna um objeto em que as chaves sao racas e os valores sao sub-racas. Por isso, a validacao correta e tratar `message` como um `Map<String, List<String>>`.

Nao foi validada a quantidade exata de racas, porque a API publica pode evoluir.

### GET /breed/hound/images

Valida consulta de imagens de uma raca valida.

Asserts:

- status code `200`;
- campo `status` igual a `success`;
- campo `message` como lista;
- lista nao vazia;
- primeira imagem comeca com `https://`;
- URL contem `images.dog.ceo`.

Motivo tecnico:

Validamos formato e dominio esperado, mas sem depender de uma imagem especifica. Isso evita fragilidade, pois a lista pode mudar.

### GET /breeds/image/random

Valida imagem aleatoria.

Asserts:

- status code `200`;
- campo `status` igual a `success`;
- campo `message` nao vazio;
- URL comeca com `https://`;
- URL contem `images.dog.ceo`.

Motivo tecnico:

Como a imagem e aleatoria, seria incorreto validar valor exato. O teste valida o contrato e o padrao esperado da resposta.

### GET /breed/racainexistenteqa/images

Valida comportamento negativo para raca inexistente.

Asserts:

- status code `404`;
- campo `status` igual a `error`;
- campo `message` nao vazio;
- mensagem indica que a raca nao foi encontrada.

Motivo tecnico:

Esse cenario garante que a API trata entrada invalida de forma adequada, retornando erro controlado e mensagem compreensivel.

## Allure Report

O projeto foi configurado com Allure JUnit 5.

O Allure ajuda a gerar um relatorio mais apresentavel, com:

- suites;
- status dos testes;
- tempo de execucao;
- falhas;
- historico se integrado em pipeline.

Comandos:

```bash
mvn clean test
mvn allure:report
```

## Pipeline

O GitHub Actions:

- usa Ubuntu;
- configura Java 17;
- usa cache do Maven;
- executa `mvn clean test`;
- gera Allure Report;
- publica Surefire Reports e Allure como artifacts.

## O que falar na entrevista

Eu explicaria assim:

> Neste projeto eu usei Java 17 com RestAssured, JUnit 5 e AssertJ para validar contrato e comportamento da Dog API. Separei configuracao, client e testes para evitar repeticao e manter a leitura simples. Os testes validam status code, campos obrigatorios, estrutura da resposta e regras de negocio basicas. Como a API e publica e os dados podem variar, eu evitei asserts frageis como quantidade fixa de racas ou URL exata de imagem. Tambem inclui um cenario negativo para validar o comportamento quando a raca nao existe.

---

# 3. Projeto Performance - BlazeDemo com JMeter

## Objetivo

O objetivo deste projeto e validar o comportamento de performance do fluxo de compra de passagem aerea no BlazeDemo.

URL alvo:

```text
https://www.blazedemo.com
```

Cenario funcional:

```text
Compra de passagem aerea com sucesso.
```

## Criterio de Aceitacao

A aplicacao deve suportar:

- 250 requisicoes por segundo;
- percentil 90 abaixo de 2 segundos;
- baixa taxa de erro, idealmente 0%.

No JMeter, 250 requisicoes por segundo equivalem a:

```text
250 req/s * 60 = 15000 samples/min
```

Por isso o Constant Throughput Timer foi configurado com:

```text
15000 samples por minuto
```

## Stack Utilizada

- Apache JMeter
- Java
- Scripts `.sh` para Linux/Mac
- Scripts `.bat` para Windows

## Estrutura

```text
blazedemo-performance-tests/
├── jmeter/
│   ├── blazedemo-load-test.jmx
│   └── blazedemo-spike-test.jmx
├── data/
│   └── passengers.csv
├── results/
│   ├── load-test-summary.md
│   └── spike-test-summary.md
├── reports/
│   └── .gitkeep
├── scripts/
│   ├── run-load-test.sh
│   ├── run-spike-test.sh
│   ├── run-load-test.bat
│   └── run-spike-test.bat
├── README.md
└── .gitignore
```

## Fluxo Simulado

O JMeter executa o fluxo real da aplicacao:

### 1. Acessar home

```text
GET /
```

Validacao:

```text
Welcome to the Simple Travel Agency!
```

### 2. Pesquisar passagem

```text
POST /reserve.php
```

Parametros:

```text
fromPort=Paris
toPort=Buenos Aires
```

Validacao:

```text
Flights from Paris to Buenos Aires
```

### 3. Escolher voo

```text
POST /purchase.php
```

O plano extrai da resposta anterior:

- `flight`
- `price`
- `airline`

Essa etapa usa correlacao com Regex Extractor.

Motivo tecnico:

Em testes de performance, nao e boa pratica hardcodar valores dinamicos quando eles sao retornados pela tela anterior. A correlacao deixa o fluxo mais proximo de um usuario real.

### 4. Confirmar compra

```text
POST /confirmation.php
```

Dados enviados a partir de:

```text
data/passengers.csv
```

Campos:

- `inputName`
- `address`
- `city`
- `state`
- `zipCode`
- `cardType`
- `creditCardNumber`
- `creditCardMonth`
- `creditCardYear`
- `nameOnCard`
- `rememberMe`

### 5. Validar sucesso

Assertion final:

```text
Thank you for your purchase today!
```

Essa assertion garante que o teste nao mede apenas HTTP 200, mas tambem sucesso funcional do fluxo.

## Componentes JMeter Usados

### HTTP Request Defaults

Centraliza:

```text
Protocol: https
Server Name: www.blazedemo.com
```

Motivo:

Evita repetir protocolo e host em todos os samplers.

### HTTP Cookie Manager

Mantem comportamento mais proximo de navegador, controlando cookies por usuario virtual.

### HTTP Cache Manager

Simula cache HTTP e evita comportamento totalmente artificial.

### Header Manager

Define headers basicos como:

```text
Accept
Content-Type
```

### CSV Data Set Config

Lê massa de dados de passageiros a partir do arquivo CSV.

Motivo:

Evita dados hardcoded no plano e facilita manutencao.

### Constant Throughput Timer

Controla a vazao alvo.

No teste de carga:

```text
throughput=15000 samples/min
```

No teste de pico:

```text
peakThroughput=15000 samples/min
```

### Response Assertion

Valida pontos funcionais importantes:

- home carregada;
- reserva retornou voos;
- tela de compra carregou;
- compra foi confirmada com sucesso.

### Listeners

Foram mantidos listeners minimos.

Nao foi incluido View Results Tree, porque ele consome memoria e impacta execucoes de carga.

## Teste de Carga

Arquivo:

```text
jmeter/blazedemo-load-test.jmx
```

Objetivo:

Sustentar a vazao de 250 req/s durante uma janela de execucao.

Parametros:

- `threads`
- `rampUp`
- `duration`
- `throughput`

Padroes:

```text
threads=100
rampUp=120
duration=300
throughput=15000
```

Comando Windows:

```bat
scripts\run-load-test.bat
```

Comando Linux/Mac:

```bash
./scripts/run-load-test.sh
```

## Teste de Pico

Arquivo:

```text
jmeter/blazedemo-spike-test.jmx
```

Objetivo:

Simular aumento rapido de carga ate o pico de 250 req/s.

Fases:

- aquecimento com baixa carga;
- subida rapida;
- sustentacao curta no pico;
- reducao da carga.

Parametros principais:

- `warmupThreads`
- `spikeThreads`
- `cooldownThreads`
- `warmupDuration`
- `spikeRampUp`
- `peakDuration`
- `cooldownDuration`
- `warmupThroughput`
- `peakThroughput`
- `cooldownThroughput`

Comando Windows:

```bat
scripts\run-spike-test.bat
```

Comando Linux/Mac:

```bash
./scripts/run-spike-test.sh
```

## Relatorios

Os scripts geram:

```text
results/*.jtl
reports/*/index.html
```

O `.jtl` contem os dados brutos.

O HTML e o dashboard do JMeter, usado para analise.

## Como concluir se passou ou falhou

No relatorio HTML do JMeter, observar:

- Throughput;
- Percentil 90;
- Tempo medio;
- Erros;
- Total de amostras.

Regra de aprovacao:

```text
Throughput >= 250 req/s
Percentil 90 < 2000 ms
Taxa de erro baixa, preferencialmente 0%
```

Se qualquer uma dessas condicoes nao for atendida, o teste deve ser considerado reprovado ou inconclusivo, dependendo da evidencia.

## Ponto importante: req/s nao e igual a compras/s

O criterio fala em requisicoes por segundo.

Uma compra completa possui multiplas requisicoes:

- home;
- pesquisa;
- escolha do voo;
- confirmacao.

Portanto:

```text
250 requisicoes por segundo nao significa 250 compras por segundo.
```

Se cada iteracao possui 4 requisicoes principais, entao a quantidade de compras por segundo sera menor que a quantidade total de requisicoes por segundo.

Essa explicacao e importante para evitar uma interpretacao errada do criterio de aceite.

## Execucao de Validacao Realizada

Foi feita uma execucao curta para validar:

- carregamento dos planos;
- fluxo funcional;
- assertions;
- geracao de `.jtl`;
- geracao de relatorio HTML.

Essa execucao curta nao deve ser usada como evidencia do criterio de 250 req/s.

Para evidencia oficial, e necessario executar com os parametros completos e preencher:

- `results/load-test-summary.md`
- `results/spike-test-summary.md`

## O que falar na entrevista

Eu explicaria assim:

> No projeto de performance eu modelei o fluxo real de compra no BlazeDemo usando JMeter em modo non-GUI. O plano acessa a home, pesquisa uma rota, escolhe um voo retornado pela aplicacao e confirma a compra com dados de passageiro vindos de CSV. Usei correlacao para capturar os dados dinamicos do voo, como flight, price e airline, em vez de deixar tudo fixo. Tambem adicionei assertions para garantir sucesso funcional, principalmente a mensagem final de confirmacao da compra. Para controlar a vazao, usei Constant Throughput Timer configurado para 15000 samples por minuto, que equivale a 250 requisicoes por segundo. Os resultados devem ser avaliados pelo relatorio HTML do JMeter, observando throughput, percentil 90, taxa de erro e total de amostras.

---

# Comparativo Tecnico dos Tres Projetos

## Tipos de risco cobertos

### Web

Cobre risco de quebra na jornada visual do usuario:

- botao de busca;
- campo de busca;
- redirecionamento;
- exibicao de resultados;
- ausencia de resultados.

### API

Cobre risco de quebra de contrato:

- status code incorreto;
- estrutura inesperada;
- campo obrigatorio ausente;
- comportamento incorreto em erro;
- retorno invalido para dados conhecidos.

### Performance

Cobre risco de degradacao sob carga:

- tempo de resposta alto;
- throughput insuficiente;
- aumento de erros;
- falha funcional durante carga;
- incapacidade de sustentar pico.

## Boas praticas demonstradas

- Projetos separados por objetivo.
- README especifico por projeto.
- Pipelines para Web e API.
- Scripts multiplataforma no projeto de performance.
- Page Object Model simples no projeto Web.
- Client API separado no projeto de API.
- Configuracao centralizada.
- Assertions objetivas.
- Evitar dependencia de dados volateis.
- Relatorios e evidencias preparados.
- Sem mocks quando o objetivo e validar integracao real.
- Sem excesso de abstracao.

## Como defender as escolhas tecnicas

### Por que nao validar quantidade exata de resultados?

Porque tanto blog quanto APIs publicas podem mudar seus dados. Validar quantidade exata geraria falso negativo. O melhor e validar estrutura, presenca de dados e padroes esperados.

### Por que usar Page Object?

Para separar interacao com a pagina da regra do teste. Isso melhora manutencao e legibilidade.

### Por que usar RestAssured?

Porque e uma biblioteca madura para testes de API em Java, com boa integracao com JUnit e leitura clara das respostas.

### Por que usar AssertJ?

Porque deixa os asserts mais expressivos e legiveis.

### Por que usar JMeter em non-GUI?

Porque execucao GUI consome mais recurso e nao e recomendada para carga. Non-GUI e o modo adequado para teste de performance e pipeline.

### Por que usar Constant Throughput Timer?

Porque o criterio exige vazao em requisicoes por segundo. O timer permite configurar uma meta de throughput em samples por minuto.

### Por que nao declarar que passou no teste de performance?

Porque criterio de performance precisa de evidencia real: ambiente, duracao, throughput, percentil, taxa de erro e relatorio. Sem execucao oficial, seria tecnicamente incorreto afirmar aprovacao.

---

# Roteiro Curto para Apresentacao

Uma forma objetiva de apresentar:

> Eu organizei o repositorio em tres frentes de qualidade: Web, API e Performance. No projeto Web, automatizei a busca do Blog do Agi com Playwright, usando Page Object Model simples e seletores resilientes. No projeto de API, usei Java 17, RestAssured, JUnit 5 e AssertJ para validar contrato e comportamento da Dog API, incluindo cenarios positivos e negativos. No projeto de performance, modelei no JMeter o fluxo completo de compra do BlazeDemo, com correlacao de dados do voo, massa via CSV, assertions funcionais e scripts non-GUI para gerar JTL e relatorio HTML.

> Minha preocupacao principal foi evitar testes frageis. Por isso nao validei quantidade fixa de artigos, racas ou imagens. Validei comportamento, estrutura e padroes esperados. Tambem separei responsabilidades sem exagerar na arquitetura, porque em teste tecnico o avaliador precisa conseguir entender e executar rapidamente.

> Para performance, deixei claro que 250 req/s significa requisicoes por segundo, nao compras por segundo. Como uma compra tem varias requisicoes, a analise deve ser feita pelo throughput do JMeter e pelo percentil 90 no relatorio HTML. A aprovacao depende de throughput maior ou igual a 250 req/s, p90 abaixo de 2 segundos e baixa taxa de erro.

---

# Perguntas que Podem Aparecer na Entrevista

## Por que voce escolheu esses cenarios Web?

Porque cobrem o caminho feliz da busca e o comportamento de ausencia de resultados. Sao cenarios pequenos, mas relevantes para a funcionalidade alvo.

## Como voce evitaria flakiness no Playwright?

Usando auto-wait do Playwright, seletores por role/texto, asserts com timeout, evitando sleeps fixos e validando comportamento observavel.

## O que voce faria se o Blog do Agi mudasse o layout?

Primeiro avaliaria se a funcionalidade mudou ou apenas o HTML. Como os seletores usam roles e textos, a chance de quebra por CSS e menor. Se o nome acessivel ou texto mudar, atualizaria o Page Object sem alterar todos os testes.

## Por que existe um client na automacao de API?

Para encapsular chamadas HTTP e deixar os testes focados em validacao. Isso reduz duplicacao de paths e facilita manutencao.

## Como voce lidou com dados variaveis na Dog API?

Evitei asserts de valores exatos em dados que podem mudar. Validei contrato, estrutura, status e padroes de URL.

## Como voce sabe se o teste de performance passou?

Pelo relatorio HTML do JMeter. Preciso observar throughput, percentil 90 e taxa de erro. O teste passa se atingir pelo menos 250 req/s, p90 menor que 2000 ms e baixa taxa de erro.

## Por que nao usar View Results Tree no JMeter?

Porque ele consome memoria e impacta execucao de carga. Para carga real, o correto e executar em non-GUI e analisar `.jtl` e dashboard HTML.

## O Constant Throughput Timer garante 250 req/s?

Nao garante sozinho. Ele tenta controlar a vazao. Para atingir 250 req/s, tambem preciso de threads suficientes, maquina adequada, rede estavel e capacidade do servidor.

## O que voce faria se o throughput ficasse abaixo de 250 req/s?

Investigaria se o gargalo esta no cliente de carga ou na aplicacao. Aumentaria threads gradualmente, monitoraria CPU/memoria/rede da maquina executora, avaliaria erros e tempos de resposta, e repetiria a execucao com ambiente controlado.

## O que voce faria se o p90 ficasse acima de 2 segundos?

Analisaria quais samplers estao mais lentos, se a lentidao ocorre durante ramp-up, pico ou sustentacao, e verificaria se ha aumento de erros. Tambem separaria tempo medio, p90, p95 e throughput para entender degradacao.

---

# Conclusao Geral

Os projetos demonstram uma abordagem completa de QA:

- validacao funcional Web;
- validacao de contrato e comportamento de API;
- validacao de performance sob carga e pico.

O ponto mais importante e que os testes foram criados com foco em manutencao e confiabilidade, sem depender de dados rigidos demais e sem arquitetura desnecessaria.

Em uma entrevista, a melhor forma de defender esse trabalho e mostrar que cada decisao teve uma razao:

- seletores resilientes no Web;
- separacao entre config/client/tests na API;
- correlacao, assertions e non-GUI no JMeter;
- relatorios e pipelines para evidencia;
- cuidado para nao declarar sucesso de performance sem execucao real.
