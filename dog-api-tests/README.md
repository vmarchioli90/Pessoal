# Teste Técnico QA - Dog API

Projeto de automação de testes de API para validar endpoints públicos da Dog API.

## Tecnologias utilizadas

- Java 17
- Maven
- JUnit 5
- RestAssured
- AssertJ
- Allure Report
- GitHub Actions

## Endpoints testados

- GET /breeds/list/all
- GET /breed/{breed}/images
- GET /breeds/image/random

## Cenários cobertos

- Listagem de todas as raças disponíveis
- Consulta de imagens por raça válida
- Consulta de imagem aleatória
- Consulta de imagens por raça inexistente

## Pré-requisitos

- Java 17 ou superior
- Maven instalado

## Como executar os testes

mvn clean test

## Como gerar o relatório Allure

mvn allure:serve

## Pipeline

Os testes são executados automaticamente via GitHub Actions a cada push ou pull request.