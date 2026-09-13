# Testes de API — Dog API

Suíte de testes funcionais e de contrato para os endpoints públicos da [Dog API](https://dog.ceo/dog-api/). O projeto usa Java 17, Maven, JUnit 5, RestAssured, AssertJ, JSON Schema e Allure.

## Tecnologias

- Java 17;
- JUnit 5.10.2;
- RestAssured e JSON Schema Validator 5.4.0;
- AssertJ 3.25.3;
- Allure JUnit 5 2.27.0;
- Maven Surefire 3.2.5.

## Objetivo e cobertura

| Cenário | Endpoint | Resultado validado |
| --- | --- | --- |
| Listar raças | `GET /breeds/list/all` | HTTP 200, sucesso, coleção não vazia e raça conhecida |
| Listar imagens de hound | `GET /breed/hound/images` | HTTP 200, sucesso, coleção não vazia e URLs HTTPS do domínio esperado |
| Obter imagem aleatória | `GET /breeds/image/random` | HTTP 200, sucesso e URL de imagem válida |
| Consultar raça inexistente | `GET /breed/racainexistenteqa/images` | HTTP 404, status de erro e mensagem coerente |

Cada resposta também é validada por um JSON Schema específico. Os contratos cobrem propriedades obrigatórias, tipos, coleções, formato URI, valores permitidos de `status` e ausência de propriedades inesperadas no objeto raiz. A validação de contrato complementa as assertions funcionais; não as substitui.

## Estrutura

```text
dog-api-tests/
|-- src/test/java/br/com/qa/config/ApiConfig.java
|-- src/test/java/br/com/qa/client/DogApiClient.java
|-- src/test/java/br/com/qa/tests/DogApiTest.java
|-- src/test/resources/schemas/              # Quatro contratos JSON
|-- scripts/generate-api-report-pt.js        # Relatório executivo em português
`-- pom.xml
```

- `ApiConfig`: resolve a Base URL e configura o RestAssured;
- `DogApiClient`: encapsula caminhos, parâmetros e chamadas HTTP;
- `DogApiTest`: mantém os quatro cenários e suas assertions;
- `schemas`: mantém os contratos desacoplados do código Java.

## Configuração da Base URL

A resolução ocorre em um único ponto, nesta ordem de prioridade:

1. System Property `baseUrl`;
2. variável de ambiente `DOG_API_BASE_URL`;
3. fallback `https://dog.ceo/api`.

Isso permite direcionar a mesma suíte a outro ambiente sem editar o código.

## Execução

Pré-requisitos: Java 17 ou superior e Maven.

Pela pasta `dog-api-tests`:

```bash
mvn clean test
```

Mesmo comando utilizado pelo CI, a partir da raiz do repositório:

```bash
mvn -f dog-api-tests/pom.xml test
```

Com System Property:

```bash
mvn clean test -DbaseUrl=https://dog.ceo/api
```

Com variável de ambiente no PowerShell:

```powershell
$env:DOG_API_BASE_URL = "https://dog.ceo/api"
mvn clean test
```

## Relatórios e evidências

Após a execução, o Maven gera:

- `target/surefire-reports/`: resultados XML e texto consumidos pelo CI;
- `target/allure-results/`: dados detalhados para o Allure.

Relatório Allure:

```bash
mvn allure:report
mvn allure:serve
```

Relatório executivo em português, após a suíte:

```bash
node scripts/generate-api-report-pt.js
```

O arquivo é criado em `target/site/api-report-pt/index.html`. Todos esses diretórios são artefatos reproduzíveis e permanecem ignorados pelo Git; o CI publica os relatórios Surefire por 7 dias.

O gerador mantém a ocorrência mais recente de cada cenário quando `target/allure-results/` contém dados acumulados, evitando duplicar testes de execuções locais anteriores. O Allure bruto continua disponível para investigação detalhada.

## CI/CD

O workflow [`.github/workflows/api-tests.yml`](../.github/workflows/api-tests.yml) executa em `push` e `pull_request` para `main` ou `master`:

1. prepara Java 17 (Temurin) e o cache Maven;
2. executa `mvn -f dog-api-tests/pom.xml test`;
3. publica `dog-api-tests/target/surefire-reports/` mesmo em caso de falha.

## Limitações

A suíte depende de uma API pública. Indisponibilidade, limitação de requisições ou mudança legítima de contrato pode produzir falhas externas ao código. Quantidades de raças e URLs exatas não são congeladas, pois são dados dinâmicos; status, formato e regras funcionais continuam sendo validados.
