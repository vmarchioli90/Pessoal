# Relatório do Teste de Carga

## Configuração da execução

- Data: 09/09/2026
- Ambiente gerador: execução local em Windows 11
- Java: 17.0.19
- JMeter: 5.6.3
- Plano: `jmeter/blazedemo-load-test.jmx`
- Duração configurada: 300 segundos
- Threads: 100
- Ramp-up: 120 segundos
- Throughput alvo: 15.000 amostras/minuto (250 req/s)

## Resultados observados

- Requisições HTTP: 62.187
- Throughput geral: 207,05 req/s
- Percentil 90: 427 ms
- Tempo médio: 313,67 ms
- Taxa de erro: 0,00%
- Resultado: **Reprovado**

## Conclusão

O percentil 90 permaneceu abaixo do limite de 2.000 ms e não houve erros. Entretanto, o throughput observado foi 207,05 req/s, abaixo da meta mínima de 250 req/s. Portanto, esta execução não demonstra o atendimento integral do critério de aceitação.

O Constant Throughput Timer define uma taxa desejada, mas não garante que ela seja alcançada. Uma nova execução deve revisar a capacidade da máquina geradora, o número de threads e as condições de rede antes de atribuir o limite observado ao serviço.

## Evidências geradas

- Dados brutos locais: `results/load-test-results.jtl`
- Dashboard local: `reports/load-test-report/index.html`

Os artefatos acima são gerados pelos scripts e ignorados pelo Git. Este resumo versionado registra as métricas obtidas na execução real.
