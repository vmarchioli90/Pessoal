# Blog do Agi - Testes Automatizados com Playwright

Projeto de automacao web criado para validar a funcionalidade de busca de artigos do Blog do Agi.

O alvo dos testes e a busca acessada pela lupa no canto superior direito do site:

https://blogdoagi.com.br/

Os testes tambem consideram o redirecionamento do dominio `blogdoagi.com.br` para `blog.agibank.com.br`, caso ele aconteca durante a execucao.

## Tecnologias utilizadas

- Node.js
- JavaScript
- Playwright
- GitHub Actions

## Cenarios cobertos

- Buscar por um termo existente, como `FGTS`, validando que a pagina retorna resultados relacionados.
- Buscar por um termo inexistente, como `termoqaautomatizadoinexistente123`, validando que o sistema apresenta uma mensagem adequada para ausencia de resultados.

## Pre-requisitos

- Node.js 18 ou superior
- npm
- Git

O projeto pode ser executado em Windows, Linux e MacOS.

## Instalacao

Clone o repositorio e instale as dependencias:

```bash
npm install
```

Instale os navegadores usados pelo Playwright:

```bash
npx playwright install
```

## Execucao dos testes

Para executar os testes em modo headless:

```bash
npm test
```

## Execucao em modo headed

Para acompanhar a execucao no navegador:

```bash
npm run test:headed
```

## Relatorio

Apos a execucao, abra o relatorio HTML do Playwright com:

```bash
npm run report
```

## GitHub Actions

O workflow esta configurado em `.github/workflows/playwright.yml`.

Ele executa os testes automaticamente em:

- `push` nas branches `main` e `master`
- `pull_request` para as branches `main` e `master`

O relatorio HTML do Playwright e publicado como artefato da execucao, mesmo quando algum teste falha.

## Estrutura do projeto

```text
.
├── .github/
│   └── workflows/
│       └── playwright.yml
├── pages/
│   └── blogPage.js
├── tests/
│   └── blog-search.spec.js
├── .gitignore
├── package.json
├── playwright.config.js
└── README.md
```
