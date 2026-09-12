# Relatório Executivo - Teste de Pico

> **Decisão: APROVADO.** Todos os critérios foram atendidos simultaneamente na janela avaliada.

## Identificação

| Campo | Valor |
| --- | --- |
| ID da execução | `SPIKE-20260912T005042Z` |
| Sistema sob teste | `https://www.blazedemo.com` |
| Cenário | Compra de passagem aérea com confirmação de sucesso |
| Início da janela | 11/09/2026, 21:50:42 |
| Janela avaliada | fase 03 de sustentação do pico |
| Perfil de carga | 150 usuários no pico; alvo de 270 req/s; sustentação por 60 segundos |
| Evidência SHA-256 | `cd98c1c469c9ce2d5fde5989bb0d12e28363b69df07977cdf33161cd0a80564b` |

## Critérios de aceitação

| Critério | Resultado | Limite | Situação |
| --- | ---: | ---: | --- |
| Throughput HTTP | 264,42 req/s | >= 250 req/s | **Atendido** |
| Percentil 90 | 468 ms | < 2.000 ms | **Atendido** |
| Erros funcionais/técnicos | 0 (0,00%) | 0 | **Atendido** |

## Indicadores consolidados

| Requisições | Duração | Média | P50 | P90 | P95 | P99 | Máximo |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 15.986 | 60,456 s | 348 ms | 314 ms | 468 ms | 526 ms | 714 ms | 3.741 ms |

## Resultado por endpoint

| Endpoint | Amostras | Throughput | Média | P90 | P95 | P99 | Erros |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| GET Home | 4.043 | 66,88 req/s | 348 ms | 476 ms | 538 ms | 727 ms | 0 |
| POST Search Flights | 4.032 | 66,69 req/s | 348 ms | 462 ms | 523 ms | 699 ms | 0 |
| POST Choose Flight | 3.988 | 65,97 req/s | 348 ms | 465 ms | 522 ms | 746 ms | 0 |
| POST Confirm Purchase | 3.923 | 64,89 req/s | 347 ms | 467 ms | 525 ms | 687 ms | 0 |

## Metodologia e rastreabilidade

- Foram considerados somente os quatro samplers HTTP do fluxo de compra.
- O sampler sintético do Transaction Controller foi excluído para não inflar a vazão.
- Aquecimento, subida e recuperação foram excluídos; a decisão usa somente a sustentação do pico.
- O P90 foi calculado pelo método nearest-rank sobre os tempos decorridos da janela.
- As assertions do JMeter validaram as respostas e a confirmação da compra.

## Riscos e limitações

- Resultado pontual obtido contra um ambiente público e dependente da rede do gerador.
- Execução realizada a partir de um único gerador de carga, sem telemetria do servidor.
- O teste comprova o aceite nesta execução; não determina sozinho a capacidade máxima do sistema.

## Evidências

- [Resultado bruto JTL](spike-test-results.jtl)
- [Dashboard técnico do JMeter](../reports/spike-test-report/index.html)
- [Relatório executivo HTML](../reports/spike-test-executive/index.html)

## Conclusão técnica

A execução foi **APROVADA**. O fluxo apresentou 264,42 req/s, P90 de 468 ms e 0 erro(s). Há evidência suficiente para afirmar que o critério de aceite foi satisfeito na janela observada.
