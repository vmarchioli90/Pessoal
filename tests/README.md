# Testes Web — Blog do Agi

Suíte Playwright que valida a busca de conteúdo do Blog do Agi pela perspectiva do usuário. O endereço configurado é `https://blogdoagi.com.br`; o redirecionamento atual para `https://blog.agibank.com.br` é aceito explicitamente.

## Tecnologias

- JavaScript em módulos CommonJS;
- Node.js 20 no CI;
- Playwright Test 1.61.1 conforme `package-lock.json`;
- Chromium com perfil `Desktop Chrome`.

## Objetivo e cobertura

| Cenário | Ação | Validações principais |
| --- | --- | --- |
| Busca com resultado | Pesquisar por `FGTS` | URL de busca, título com o termo e ao menos um artigo relacionado |
| Busca sem resultado | Pesquisar por termo deliberadamente inexistente | URL de busca e mensagem de ausência de resultados |

A suíte não fixa quantidade, posição ou lista completa de artigos porque o conteúdo editorial é dinâmico. As assertions continuam verificando o resultado funcional observado pelo usuário.

## Status da validação

Na validação de 13/09/2026, o runner iniciou corretamente os 2 cenários com o mesmo comando do CI, porém ambos foram bloqueados pela condição atual do serviço externo. O Blog do Agi redirecionou para `blog.agibank.com.br`, exibiu a página sem o conteúdo esperado e manteve oculto o campo `input[name="s"]` depois do clique na lupa. O navegador também registrou erro JavaScript do site: `$scope.imagesLoaded is not a function`.

Conforme decisão desta entrega, o teste Web foi preservado exatamente como estava. Não foram adicionados atalhos de navegação, manipulação do DOM, remoção de assertions ou retries extras para fabricar aprovação. Screenshots, vídeos, traces e o relatório HTML ficam disponíveis nos artifacts da execução com falha. Quando o serviço externo voltar a entregar a interface corretamente, a suíte deve ser reexecutada para obter a decisão funcional final.

## Estrutura

```text
pages/blogPage.js          # Page Object, locators e ações da página
tests/blog-search.spec.js  # Cenários e assertions
playwright.config.js       # Browser, timeouts, evidências e reportes
package.json               # Comandos npm
```

O Page Object concentra a interação com a página. Cada teste recebe uma página isolada do Playwright, sem depender de ordem ou estado compartilhado. A lupa é localizada por role; o campo e o conteúdo usam atributos e estruturas estáveis do HTML. Não há esperas fixas.

## Instalação e execução

Pré-requisitos: Node.js 18 ou superior e npm.

```bash
npm ci
npx playwright install chromium
```

Mesmo comando utilizado pelo CI:

```bash
npm test
```

Comandos equivalentes e auxiliares:

```bash
npm run test:web
npm run test:headed
npm run report
```

## Configuração e evidências

O arquivo `playwright.config.js` define Chromium como projeto, timeout de 30 segundos, relatório HTML e evidências de falha. Em CI, a execução usa um worker e até duas novas tentativas para produzir diagnóstico de instabilidade; localmente não há repetição automática.

- Relatório HTML local: `playwright-report/index.html`;
- screenshots: somente em falhas;
- traces: na primeira repetição em CI;
- vídeos: retidos em falhas por padrão; com `PLAYWRIGHT_VIDEO=on`, são gravados em todas as execuções.

`playwright-report/`, `test-results/` e `blob-report/` são artefatos locais e permanecem no `.gitignore`. O workflow publica `playwright-report/` como artifact mesmo quando a suíte falha.

## CI/CD

O workflow [`.github/workflows/playwright.yml`](../.github/workflows/playwright.yml) executa em `push` e `pull_request` para `main` ou `master`:

1. prepara Node.js 20 e o cache npm;
2. instala dependências com `npm ci`;
3. instala Chromium e dependências do sistema;
4. executa `npm test`;
5. publica o relatório Playwright por 7 dias.

## Limitações conhecidas

A suíte depende de um site público. Alterações legítimas de domínio, acessibilidade, textos ou marcação podem exigir manutenção dos locators. Uma falha por mudança de interface deve ser corrigida com base no comportamento atual do site, sem remover assertions de negócio ou ocultar o erro com esperas arbitrárias.
