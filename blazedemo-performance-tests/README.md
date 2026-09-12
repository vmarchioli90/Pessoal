# Testes de performance - BlazeDemo

Automação em Apache JMeter para validar o fluxo completo de compra de passagem aérea no [BlazeDemo](https://www.blazedemo.com/).

## Resultado atual

| Cenário | Throughput avaliado | P90 | Erros | Resultado |
| --- | ---: | ---: | ---: | --- |
| Carga | 268,58 req/s | 460 ms | 0,00% | **Aprovado** |
| Pico | 264,42 req/s | 468 ms | 0,00% | **Aprovado** |

Critério de aceite: **pelo menos 250 requisições por segundo**, **P90 abaixo de 2.000 ms** e fluxo concluído sem erro.

Os números acima vêm das execuções reais de 11/09/2026. Consulte os [resumos em Markdown](results/) e os dashboards HTML de [carga](reports/load-test-report/index.html) e [pico](reports/spike-test-report/index.html).

## Cenário automatizado

Cada iteração executa e valida a jornada:

1. `GET /` - acessa a página inicial.
2. `POST /reserve.php` - pesquisa voos de Paris para Buenos Aires.
3. `POST /purchase.php` - seleciona um voo retornado pela pesquisa.
4. `POST /confirmation.php` - envia os dados do passageiro.
5. Confirma a mensagem `Thank you for your purchase today!`.

O plano correlaciona dinamicamente os campos `flight`, `price` e `airline`. Os dados do passageiro são lidos de [`data/passengers.csv`](data/passengers.csv).

## Estratégia de carga

### Teste de carga

- 150 usuários virtuais.
- Ramp-up de 30 segundos.
- Duração total de 5 minutos.
- Alvo de 16.200 samples/min, equivalente a 270 req/s.
- Margem de 8% sobre o aceite para reduzir oscilações abaixo de 250 req/s.
- Avaliação somente da janela estável após o ramp-up.

### Teste de pico

- Aquecimento com carga reduzida.
- Subida rápida para 150 usuários.
- Sustentação do pico por 60 segundos com alvo de 270 req/s.
- Retorno controlado à carga reduzida.
- Avaliação somente do grupo `03 Peak Sustain`.

A média da execução inteira do teste de pico não representa o critério, pois inclui aquecimento e recuperação. O gate considera exclusivamente a janela de sustentação.

## Pré-requisitos

- Java 17 ou superior.
- Apache JMeter 5.6.3 ou compatível.
- Node.js 18 ou superior, usado para avaliar o arquivo JTL.
- Comando `jmeter` disponível no `PATH`.

Confira o ambiente:

```bash
java -version
jmeter --version
node --version
```

> Execute testes de carga somente em ambientes para os quais você tenha autorização.

## Como executar

Entre na pasta do projeto:

```bash
cd blazedemo-performance-tests
```

### Linux ou macOS

```bash
chmod +x scripts/*.sh
./scripts/run-load-test.sh
./scripts/run-spike-test.sh
```

### Windows

```bat
scripts\run-load-test.bat
scripts\run-spike-test.bat
```

Ao final, cada script:

1. gera o resultado bruto `.jtl`;
2. cria o dashboard HTML do JMeter;
3. calcula throughput, P90 e erros na janela correta;
4. atualiza o resumo Markdown;
5. retorna código diferente de zero se o critério não for atendido.

## Configuração opcional

As propriedades podem ser sobrescritas por variáveis de ambiente.

Exemplo no Linux/macOS:

```bash
THREADS=180 RAMP_UP=30 DURATION=600 THROUGHPUT=16800 ./scripts/run-load-test.sh
```

Exemplo no Windows:

```bat
set THREADS=180
set RAMP_UP=30
set DURATION=600
set THROUGHPUT=16800
scripts\run-load-test.bat
```

Principais valores do teste de pico:

| Variável | Padrão | Finalidade |
| --- | ---: | --- |
| `WARMUP_THREADS` | 20 | Usuários no aquecimento |
| `SPIKE_THREADS` | 150 | Usuários na subida e sustentação |
| `PEAK_DURATION` | 60 | Duração da janela de pico, em segundos |
| `PEAK_THROUGHPUT` | 16200 | Meta do pico em samples/min |
| `COOLDOWN_THREADS` | 20 | Usuários na recuperação |

## Evidências versionadas

```text
results/
├── load-test-results.jtl
├── load-test-summary.md
├── spike-test-results.jtl
└── spike-test-summary.md

reports/
├── load-test-report/index.html
└── spike-test-report/index.html
```

Os relatórios e arquivos JTL fazem parte do repositório para permitir auditoria dos resultados apresentados.

## Estrutura do projeto

```text
blazedemo-performance-tests/
├── data/                 # Massa de dados
├── jmeter/               # Planos de carga e pico
├── reports/              # Dashboards HTML versionados
├── results/              # JTL e resumos versionados
├── scripts/              # Execução e gate de aceite
└── README.md
```

## Gitflow adotado

- `main`: versão estável e entregue.
- `develop`: integração das alterações.
- `feature/performance-acceptance`: ajuste dos planos e gate de aceite.
- `feature/version-performance-reports`: versionamento das evidências.
- `docs/performance-readme`: documentação.

As branches de trabalho são integradas em `develop`; após a validação, `develop` é promovida para `main`.

## Decisão do aceite

O script [`evaluate-performance.js`](scripts/evaluate-performance.js) avalia apenas os quatro samplers HTTP do fluxo. O teste é aprovado somente quando as três condições forem verdadeiras ao mesmo tempo:

```text
throughput >= 250 req/s
P90 < 2000 ms
erros = 0
```

Essa regra evita aprovar a execução usando média de tempo de resposta, throughput diluído por ramp-up ou samples sintéticos do Transaction Controller.
