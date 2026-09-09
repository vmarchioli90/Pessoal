# Relatório do Teste de Pico

## Configuração da execução

- Data: 09/09/2026
- Ambiente gerador: execução local em Windows 11
- Java: 17.0.19
- JMeter: 5.6.3
- Plano: `jmeter/blazedemo-spike-test.jmx`
- Aquecimento: 20 threads por 60 segundos
- Subida ao pico: 100 threads em 15 segundos
- Sustentação do pico: 100 threads por 60 segundos
- Recuperação: 20 threads por 60 segundos
- Throughput alvo no pico: 15.000 amostras/minuto (250 req/s)

## Resultados observados

Execução completa:

- Requisições HTTP: 22.300
- Throughput geral: 114,32 req/s
- Percentil 90 geral: 406 ms
- Taxa de erro: 0,00%

Janela de sustentação do pico, calculada apenas com os quatro samplers HTTP e sem contar o Transaction Controller:

- Requisições HTTP: 14.619
- Duração observada: 60,427 segundos
- Throughput: 241,93 req/s
- Percentil 90: 420 ms
- Tempo médio: 315 ms
- Taxa de erro: 0,00%
- Resultado: **Reprovado**

## Conclusão

Durante o pico, o percentil 90 permaneceu abaixo de 2.000 ms e não houve erros. O throughput de 241,93 req/s, porém, ficou abaixo da meta mínima de 250 req/s. Portanto, esta execução não demonstra o atendimento integral do critério de aceitação.

A média da execução completa não deve ser usada como throughput do pico, pois inclui aquecimento, subida e recuperação. Uma nova execução deve considerar a capacidade do gerador, threads disponíveis e condições de rede.

## Evidências geradas

- Dados brutos locais: `results/spike-test-results.jtl`
- Dashboard local: `reports/spike-test-report/index.html`

Os artefatos acima são gerados pelos scripts e ignorados pelo Git. Este resumo versionado registra as métricas obtidas na execução real.
