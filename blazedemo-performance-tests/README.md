# BlazeDemo Performance Tests

Projeto de teste tecnico de performance usando Apache JMeter para validar o fluxo de compra de passagem aerea no BlazeDemo.

URL alvo:

```text
https://www.blazedemo.com
```

## Ferramenta utilizada

- Apache JMeter
- Java
- Scripts Shell para Linux/Mac
- Scripts Batch para Windows

## Cenario testado

Fluxo de compra de passagem aerea com sucesso:

1. Acessar a home: `GET /`
2. Pesquisar passagem: `POST /reserve.php`
3. Escolher um voo valido retornado pela reserva: `POST /purchase.php`
4. Finalizar compra: `POST /confirmation.php`
5. Validar sucesso com o texto `Thank you for your purchase today!`

O plano usa correlacao para capturar `flight`, `price` e `airline` da tela de reserva antes de enviar a escolha do voo.

## Criterio de aceitacao

A aplicacao deve suportar:

- Throughput maior ou igual a 250 requisicoes por segundo.
- Percentil 90 menor que 2000 ms.
- Baixa taxa de erro, preferencialmente 0%.

No JMeter, o throughput alvo foi configurado como `15000` samples por minuto, equivalente a `250` requisicoes por segundo.

## Estrutura do projeto

```text
blazedemo-performance-tests/
├── jmeter/
│   ├── blazedemo-load-test.jmx
│   └── blazedemo-spike-test.jmx
├── data/
│   └── passengers.csv
├── results/
│   ├── load-test-summary.md
│   └── spike-test-summary.md
├── reports/
│   └── .gitkeep
├── scripts/
│   ├── run-load-test.sh
│   ├── run-spike-test.sh
│   ├── run-load-test.bat
│   └── run-spike-test.bat
├── README.md
└── .gitignore
```

## Pre-requisitos

- Java instalado.
- Apache JMeter instalado.
- Comando `jmeter` disponivel no `PATH` (inclua `%JMETER_HOME%\\bin` ou `$JMETER_HOME/bin` no `PATH`, se utilizar essa variavel).

Valide a instalacao:

```bash
java -version
jmeter --version
```

## Teste de carga

Arquivo:

```text
jmeter/blazedemo-load-test.jmx
```

Objetivo:

- Sustentar 250 requisicoes por segundo.
- Usar ramp-up progressivo.
- Executar por 5 minutos por padrao.

Configuracoes principais por propriedades:

- `threads`: quantidade de threads virtuais. Padrao: `100`
- `rampUp`: tempo de subida em segundos. Padrao: `120`
- `duration`: duracao em segundos. Padrao: `300`
- `throughput`: vazao em samples por minuto. Padrao: `15000`

Linux/Mac:

```bash
chmod +x scripts/run-load-test.sh
./scripts/run-load-test.sh
```

Windows:

```bat
scripts\run-load-test.bat
```

Exemplo sobrescrevendo parametros no Linux/Mac:

```bash
THREADS=150 RAMP_UP=180 DURATION=600 THROUGHPUT=15000 ./scripts/run-load-test.sh
```

Exemplo sobrescrevendo parametros no Windows:

```bat
set THREADS=150
set RAMP_UP=180
set DURATION=600
set THROUGHPUT=15000
scripts\run-load-test.bat
```

## Teste de pico

Arquivo:

```text
jmeter/blazedemo-spike-test.jmx
```

Objetivo:

- Simular aquecimento com baixa carga.
- Subir rapidamente ate o pico.
- Sustentar curto periodo com 250 requisicoes por segundo.
- Reduzir a carga apos o pico.

Configuracoes principais por propriedades:

- `warmupThreads`: threads no aquecimento. Padrao: `20`
- `spikeThreads`: threads no pico. Padrao: `100`
- `cooldownThreads`: threads na reducao. Padrao: `20`
- `warmupDuration`: duracao do aquecimento. Padrao: `60`
- `spikeRampUp`: subida rapida em segundos. Padrao: `15`
- `peakDuration`: sustentacao no pico. Padrao: `60`
- `cooldownDuration`: duracao da reducao. Padrao: `60`
- `warmupThroughput`: throughput do aquecimento em samples/min. Padrao: `3000`
- `peakThroughput`: throughput de pico em samples/min. Padrao: `15000`
- `cooldownThroughput`: throughput da reducao em samples/min. Padrao: `3000`

Linux/Mac:

```bash
chmod +x scripts/run-spike-test.sh
./scripts/run-spike-test.sh
```

Windows:

```bat
scripts\run-spike-test.bat
```

## Relatorios

Os scripts executam o JMeter em modo non-GUI, geram o `.jtl` em `results/` e o relatorio HTML em `reports/`.

Teste de carga:

```text
results/load-test-results.jtl
reports/load-test-report/index.html
```

Teste de pico:

```text
results/spike-test-results.jtl
reports/spike-test-report/index.html
```

## Como interpretar os resultados

No relatorio HTML do JMeter, observe principalmente:

- Throughput.
- Percentil 90.
- Tempo medio.
- Erros.
- Total de amostras.

Para concluir que o criterio foi atendido, use a aba de estatisticas do relatorio HTML e valide:

- O throughput geral ficou maior ou igual a 250 req/s.
- O percentil 90 ficou abaixo de 2000 ms.
- A taxa de erro ficou baixa, idealmente 0%.
- A assertion da confirmacao de compra nao apresentou falhas.

## Explicacao importante sobre req/s

O criterio fala em 250 requisicoes por segundo.

Como o fluxo de compra possui multiplas requisicoes por iteracao, a quantidade de compras por segundo nao e igual a quantidade de requisicoes por segundo. Uma iteracao completa executa chamadas para home, reserva, escolha do voo e confirmacao da compra.

Por isso, a avaliacao deve ser feita pelo throughput de requisicoes/samples apresentado pelo JMeter, nao pela quantidade de compras concluidas por segundo.

## Relatorio de execucao

Os resultados da execucao real ficam documentados em:

- `results/load-test-summary.md`
- `results/spike-test-summary.md`

Os resumos registram:

- Data da execucao.
- Maquina utilizada.
- Sistema operacional.
- Versao do Java.
- Versao do JMeter.
- Duracao.
- Throughput obtido.
- Percentil 90 obtido.
- Taxa de erro.
- Resultado aprovado ou reprovado.
- Evidencias.
- Motivo da conclusao.

Os valores publicados nesses arquivos vieram de uma execucao real. Resultados futuros devem substituir os dados somente depois de uma nova execucao completa e verificavel.

## Conclusao

O projeto executa testes de carga e pico contra a aplicacao real BlazeDemo. Na execucao registrada em `results/`, o P90 e a taxa de erro atenderam ao esperado, mas a meta de 250 req/s nao foi alcancada. Por isso, ambos os resultados foram classificados como reprovados de forma conservadora.

Os dashboards HTML e arquivos JTL sao gerados localmente e nao sao versionados. Os resumos Markdown preservam as metricas e a conclusao; uma nova avaliacao deve ser baseada em uma nova execucao, sem reutilizar resultados antigos.

## Consideracoes tecnicas

- Os planos usam HTTP Request Defaults com protocolo `https` e servidor `www.blazedemo.com`.
- Os planos usam HTTP Cookie Manager e HTTP Cache Manager.
- A confirmacao da compra possui Response Assertion para validar o texto de sucesso.
- Os planos foram preparados para execucao em modo non-GUI.
- Listeners pesados, como View Results Tree, nao foram adicionados aos `.jmx`.
- Os dados de passageiro ficam em `data/passengers.csv`.
- O throughput e controlado com Constant Throughput Timer.
- A API/site alvo e publico, portanto resultados podem variar por rede, maquina, horario e disponibilidade da aplicacao.
