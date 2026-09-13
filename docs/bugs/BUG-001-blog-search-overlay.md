# BUG-001 - Lupa não abre o campo de busca do Blog do Agi

## Resumo

Ao acessar o Blog do Agi e clicar na lupa do cabeçalho, o overlay de pesquisa não é aberto. O formulário permanece no DOM, porém o campo `input[name="s"]` continua sem área visível e não pode ser utilizado pelo usuário.

## Classificação

| Campo | Valor |
| --- | --- |
| Tipo | Defeito funcional em serviço externo |
| Severidade | Alta - bloqueia a funcionalidade de busca pela interface |
| Prioridade sugerida | Alta |
| Ambiente observado | Produção pública |
| Data da última reprodução | 13/09/2026 |
| URL inicial | `https://blogdoagi.com.br/` |
| URL após redirecionamento | `https://blog.agibank.com.br/` |

## Pré-condição

Utilizar um navegador Chromium em sessão limpa e possuir acesso à internet.

## Passos para reproduzir

1. Acessar `https://blogdoagi.com.br/`.
2. Aguardar o redirecionamento para `https://blog.agibank.com.br/`.
3. Clicar na lupa de pesquisa no cabeçalho.
4. Observar a área em que o formulário deveria ser exibido.

## Resultado esperado

O overlay de pesquisa deve abrir, o campo de busca deve ficar visível e o usuário deve conseguir informar um termo e enviar o formulário.

## Resultado observado

- o clique é realizado no elemento correto, identificado como `a.astra-search-icon[role="button"]`;
- o formulário existe no DOM, mas `input[name="s"]` permanece oculto;
- a URL recebe apenas o fragmento `#`;
- o navegador registra o erro JavaScript `$scope.imagesLoaded is not a function`;
- os dois cenários Playwright falham no `expect(...).toBeVisible()` de `pages/blogPage.js`.

## Impacto

Usuários não conseguem iniciar uma busca pelo cabeçalho. A mesma condição bloqueia os dois cenários Web automatizados e mantém o workflow Playwright vermelho.

## Evidências

- relatório HTML, screenshot, vídeo e trace publicados no artifact `playwright-report` do [run reproduzido no GitHub Actions](https://github.com/vmarchioli90/teste-tecnico-qa-agibank/actions/runs/34735741087);
- execução local com `CI=true npm test` reproduzindo a falha nos dois cenários;
- busca por URL (`?s=FGTS`) continua respondendo, isolando o defeito na abertura do formulário.

## Observação de QA

O teste foi mantido sem `.skip`, remoção de assertion, manipulação de DOM ou navegação alternativa. Dessa forma, a automação continua sinalizando corretamente o defeito real da interface em vez de produzir um falso resultado verde.
