# Testes de performance — BlazeDemo

Projeto Apache JMeter para avaliar a jornada completa de compra de passagem no [BlazeDemo](https://www.blazedemo.com/) em condições de carga contínua e pico. Os planos usam correlação dinâmica, massa externa e assertions funcionais para impedir que uma resposta HTTP tecnicamente válida seja contabilizada como compra bem-sucedida quando o conteúdo esperado não estiver presente.

## Decisão executiva

| Cenário avaliado | Requisições HTTP | Janela | Throughput total | P90 | Erros | Resultado |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Carga — após ramp-up | 72.545 | 270,103 s | 268,58 req/s | 460 ms | 0,00% | **Aprovado** |
| Pico — sustentação | 15.986 | 60,456 s | 264,42 req/s | 468 ms | 0,00% | **Aprovado** |

Execuções realizadas em 11/09/2026. Evidências: [resumo de carga](results/load-test-summary.md), [resumo de pico](results/spike-test-summary.md), relatórios executivos de [carga](reports/load-test-executive/index.html) e [pico](reports/spike-test-executive/index.html), e dashboards JMeter de [carga](reports/load-test-report/index.html) e [pico](reports/spike-test-report/index.html).

## Critério de aceite e gate interno

O critério oficial recebido possui dois indicadores:

| Critério | Aceite |
| --- | ---: |
| Throughput HTTP total | >= 250 req/s |
| P90 | < 2.000 ms |
| Cenário | Compra concluída |

O fluxo também precisa chegar à confirmação de compra. Como controle de qualidade adicional, o script automatizado exige `erros = 0`. Esse terceiro requisito é um gate interno mais restritivo; não é apresentado como limite numérico do enunciado.

O P90 significa que 90% das requisições da janela avaliada responderam abaixo daquele valor. Um máximo isolado acima de 2.000 ms não reprova o critério de percentil: no pico, por exemplo, o máximo registrado foi 3.741 ms, enquanto o P90 permaneceu em 468 ms. Falhas funcionais ou HTTP, entretanto, são capturadas pelo gate interno de erro zero.

**Os dois testes satisfizeram os critérios oficiais do desafio e o gate interno de qualidade.**

### Como interpretar o throughput

Cada compra produz quatro samples HTTP. Por isso, `268,58 req/s` é a soma de todos os endpoints, e não 268,58 compras por segundo. No teste de carga, cada etapa ficou próxima de 67,14 req/s; no pico, cada etapa ficou entre 64,89 e 66,88 req/s. O `Transaction Controller` não é contado como uma quinta requisição.

## Jornada automatizada

Cada iteração executa:

1. `GET /` — abre a página inicial e valida `Welcome`;
2. `POST /reserve.php` — pesquisa Paris → Buenos Aires e valida o resultado;
3. `POST /purchase.php` — seleciona um voo e valida o formulário de compra;
4. `POST /confirmation.php` — envia os dados e valida `Thank you for your purchase today!`.

Os campos `flight`, `price` e `airline` são extraídos da resposta e reutilizados na etapa seguinte. Os passageiros vêm de [`data/passengers.csv`](data/passengers.csv). Cookie e Cache Managers preservam o comportamento de sessão, e os planos não contêm listeners pesados.

## Modelos de carga

### Carga contínua

Plano: [`jmeter/blazedemo-load-test.jmx`](jmeter/blazedemo-load-test.jmx)

- 150 usuários virtuais;
- ramp-up de 30 segundos;
- duração total de 300 segundos;
- alvo de 16.200 samples/min, equivalente a 270 req/s;
- janela de avaliação iniciada após o ramp-up, removendo a fase de crescimento;
- margem operacional de 8% sobre o mínimo de 250 req/s.

O Constant Throughput Timer limita a taxa desejada, mas não garante sua obtenção: threads, gerador, rede e servidor ainda precisam suportar a demanda.

### Pico

Plano: [`jmeter/blazedemo-spike-test.jmx`](jmeter/blazedemo-spike-test.jmx)

| Fase | Início | Threads | Ramp-up | Duração | Meta |
| --- | ---: | ---: | ---: | ---: | ---: |
| `01 Warm-up` | 0 s | 20 | 30 s | 60 s | 3.000 samples/min |
| `02 Fast Ramp` | 60 s | 150 | 15 s | 15 s | 16.200 samples/min |
| `03 Peak Sustain` | 75 s | 150 | 1 s | 60 s | 16.200 samples/min |
| `04 Cooldown` | 135 s | 20 | 15 s | 60 s | 3.000 samples/min |

O gate considera exclusivamente os samples do grupo `03 Peak Sustain`. A média da execução completa diluiria o pico com aquecimento e recuperação e, portanto, não representa o critério avaliado.

Este plano valida uma subida abrupta até a vazão nominal exigida; ele não busca o ponto de ruptura nem a capacidade máxima do BlazeDemo. Elevar o pico acima do alvo seria outro experimento, com hipótese, autorização e evidência próprias, e não é necessário para comprovar o critério deste desafio.

## Cálculo e rastreabilidade

O script [`scripts/evaluate-performance.js`](scripts/evaluate-performance.js):

1. lê o JTL em CSV;
2. mantém apenas os quatro samplers HTTP da jornada;
3. seleciona a janela pós-ramp-up para carga ou `03 Peak Sustain` para pico;
4. calcula volume, intervalo entre primeiro início e último término, throughput, média, P50, P90, P95, P99, máximo e erros;
5. aplica o critério oficial e o gate interno;
6. gera resumo Markdown e relatório executivo HTML;
7. registra SHA-256 do JTL para vincular métricas à evidência bruta.

O throughput é calculado como `quantidade de samples / duração da janela em segundos`. Percentis são calculados sobre o tempo decorrido (`elapsed`) de cada sample filtrado.

## Pré-requisitos

- Java 17 ou superior;
- Apache JMeter 5.6.3 ou compatível;
- Node.js 20 ou superior para o script de validação;
- comando `jmeter` no `PATH`.

```bash
java -version
jmeter --version
node --version
```

> Execute carga apenas contra ambientes para os quais exista autorização. O BlazeDemo é público e não oferece controle sobre infraestrutura ou concorrência externa.

## Execução

Entre na pasta:

```bash
cd blazedemo-performance-tests
```

Linux/macOS:

```bash
chmod +x scripts/run-load-test.sh scripts/run-spike-test.sh
./scripts/run-load-test.sh
./scripts/run-spike-test.sh
```

O repositório marca os dois scripts como executáveis e usa `.gitattributes` para preservar finais de linha LF em qualquer sistema operacional. O `chmod` acima permanece como alternativa para pacotes ZIP que não preservem permissões do Git.

Windows:

```bat
scripts\run-load-test.bat
scripts\run-spike-test.bat
```

Cada script executa o JMX em modo não gráfico, grava o JTL, gera o dashboard padrão do JMeter, executa a validação e retorna código diferente de zero se o gate falhar.

### Sobrescrita de parâmetros

Exemplo Linux/macOS:

```bash
THREADS=180 RAMP_UP=30 DURATION=600 THROUGHPUT=16800 ./scripts/run-load-test.sh
```

Exemplo Windows:

```bat
set THREADS=180
set RAMP_UP=30
set DURATION=600
set THROUGHPUT=16800
scripts\run-load-test.bat
```

Parâmetros de pico disponíveis: `WARMUP_THREADS`, `SPIKE_THREADS`, `COOLDOWN_THREADS`, `WARMUP_DURATION`, `SPIKE_RAMP_UP`, `PEAK_DURATION`, `COOLDOWN_DURATION`, `WARMUP_DELAY`, `SPIKE_DELAY`, `PEAK_DELAY`, `COOLDOWN_DELAY`, `WARMUP_THROUGHPUT`, `PEAK_THROUGHPUT` e `COOLDOWN_THROUGHPUT`.

Relatórios versionados podem ser abertos pela raiz em Windows, Linux ou macOS:

```bash
npm run report:performance:load
npm run report:performance:load:jmeter
npm run report:performance:spike
npm run report:performance:spike:jmeter
```

## Evidências versionadas

```text
results/
|-- load-test-results.jtl
|-- load-test-summary.md
|-- spike-test-results.jtl
`-- spike-test-summary.md

reports/
|-- load-test-executive/index.html
|-- load-test-report/index.html
|-- spike-test-executive/index.html
`-- spike-test-report/index.html
```

Os JTLs, resumos e dashboards de performance não estão no `.gitignore`: eles são versionados intencionalmente para rastreabilidade. Os arquivos `README.md` encontrados dentro dos dashboards são dependências estáticas geradas pelo JMeter e não documentação autoral deste projeto.

## Limitações e reprodução responsável

Resultados de performance dependem do gerador, rede, serviço-alvo e concorrência externa. A aprovação demonstra que o critério foi atendido na janela e no ambiente registrados; não garante capacidade universal do sistema. Uma reprovação isolada também não identifica sozinha o gargalo.

O workflow [`.github/workflows/performance-validation.yml`](../.github/workflows/performance-validation.yml) não gera carga. Ele valida o XML dos JMXs, a sintaxe dos scripts e reprocessa os JTLs existentes para confirmar o aceite em `push`, `pull_request` e execução manual. Os resumos recalculados são publicados como artifact. A carga real continua exclusivamente manual para evitar requisições automáticas contra um serviço público.

## Fluxo de branches

- `develop`: implementação e validação;
- `main`: versão estável publicada.

Depois da validação local, `develop` é integrada à `main`; não são necessárias branches adicionais para este exercício.
