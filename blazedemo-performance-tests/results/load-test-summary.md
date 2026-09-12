# Relatório Executivo - Teste de Carga

> **Decisão: APROVADO.** Todos os critérios foram atendidos simultaneamente na janela avaliada.

## Identificação

| Campo | Valor |
| --- | --- |
| ID da execução | `LOAD-20260912T004423Z` |
| Sistema sob teste | `https://www.blazedemo.com` |
| Cenário | Compra de passagem aérea com confirmação de sucesso |
| Início da janela | 11/09/2026, 21:44:23 |
| Janela avaliada | fase estável após 30 segundos de ramp-up |
| Perfil de carga | 150 usuários; alvo de 270 req/s; execução total de 5 minutos |
| Evidência SHA-256 | `2da32e2becd38662a1e0d6938c7962a8ea2e901d641631b27cd17c6791179a09` |

## Critérios de aceitação

| Critério | Resultado | Limite | Situação |
| --- | ---: | ---: | --- |
| Throughput HTTP | 268,58 req/s | >= 250 req/s | **Atendido** |
| Percentil 90 | 460 ms | < 2.000 ms | **Atendido** |
| Erros funcionais/técnicos | 0 (0,00%) | 0 | **Atendido** |

## Indicadores consolidados

| Requisições | Duração | Média | P50 | P90 | P95 | P99 | Máximo |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 72.545 | 270,103 s | 343 ms | 318 ms | 460 ms | 507 ms | 616 ms | 1.266 ms |

## Resultado por endpoint

| Endpoint | Amostras | Throughput | Média | P90 | P95 | P99 | Erros |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| GET Home | 18.136 | 67,14 req/s | 336 ms | 452 ms | 498 ms | 603 ms | 0 |
| POST Search Flights | 18.135 | 67,14 req/s | 344 ms | 460 ms | 507 ms | 616 ms | 0 |
| POST Choose Flight | 18.138 | 67,15 req/s | 344 ms | 463 ms | 508 ms | 618 ms | 0 |
| POST Confirm Purchase | 18.136 | 67,14 req/s | 346 ms | 466 ms | 514 ms | 626 ms | 0 |

## Metodologia e rastreabilidade

- Foram considerados somente os quatro samplers HTTP do fluxo de compra.
- O sampler sintético do Transaction Controller foi excluído para não inflar a vazão.
- O ramp-up foi excluído; a decisão usa somente a fase estável.
- O P90 foi calculado pelo método nearest-rank sobre os tempos decorridos da janela.
- As assertions do JMeter validaram as respostas e a confirmação da compra.

## Riscos e limitações

- Resultado pontual obtido contra um ambiente público e dependente da rede do gerador.
- Execução realizada a partir de um único gerador de carga, sem telemetria do servidor.
- O teste comprova o aceite nesta execução; não determina sozinho a capacidade máxima do sistema.

## Evidências

- [Resultado bruto JTL](load-test-results.jtl)
- [Dashboard técnico do JMeter](../reports/load-test-report/index.html)
- [Relatório executivo HTML](../reports/load-test-executive/index.html)

## Conclusão técnica

A execução foi **APROVADA**. O fluxo apresentou 268,58 req/s, P90 de 460 ms e 0 erro(s). Há evidência suficiente para afirmar que o critério de aceite foi satisfeito na janela observada.
