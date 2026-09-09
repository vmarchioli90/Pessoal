# Teste Técnico QA - Dog API

Automação de testes dos endpoints públicos da Dog API com validações funcionais e de contrato.

## Tecnologias

- Java 17
- Maven
- JUnit 5
- RestAssured
- RestAssured JSON Schema Validator
- AssertJ
- Allure Report

## Endpoints e cenários

- `GET /breeds/list/all`: lista de raças disponíveis.
- `GET /breed/{breed}/images`: imagens de uma raça válida.
- `GET /breeds/image/random`: imagem aleatória.
- `GET /breed/{breed}/images`: erro para raça inexistente.

As assertions funcionais verificam status HTTP, valores e comportamento. Os schemas em `src/test/resources/schemas/` complementam essas assertions validando estrutura, propriedades obrigatórias, tipos, coleções e URLs.

## Configuração da Base URL

A configuração fica centralizada em `ApiConfig` e segue esta prioridade:

1. System Property Maven `baseUrl`;
2. variável de ambiente `DOG_API_BASE_URL`;
3. fallback `https://dog.ceo/api`.

Isso permite executar a mesma suíte contra outro ambiente sem alterar o código.

## Execução

Pré-requisitos: Java 17 ou superior e Maven.

Com a URL padrão:

```bash
mvn clean test
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

## Relatórios

O Maven gera resultados em:

- `target/surefire-reports/`
- `target/allure-results/`

Para gerar ou abrir o relatório Allure:

```bash
mvn allure:report
mvn allure:serve
```

## CI/CD

O workflow `.github/workflows/api-tests.yml` executa a suíte com Java 17 em pushes e pull requests e publica os relatórios Surefire como artifact.
