# Oficina: estruturas de dados na prática com Java e Python

Exemplos pequenos de sistemas corporativos fictícios para pessoas com conhecimentos
básicos de lógica. O foco é escolher e usar estruturas prontas, acompanhar seus dados
e entender onde elas ajudam: não há implementações próprias de listas, filas, mapas,
árvores, buscas em grafos, cosseno ou HDBSCAN.

Java apresenta as coleções do JDK e o JGraphT. Python apresenta cosseno, recuperação
de documentos e o HDBSCAN **dividido em etapas com as estruturas intermediárias**.
O menu Java abre todos os exemplos; os exemplos Python também executam separadamente.

Os cenários Java usam objetos de domínio imutáveis, regras de negócio e consultas
com `Stream` e `Optional`. O [roteiro Java](docs/roteiro-java.md) relaciona cada
recurso da linguagem a uma necessidade do desenvolvimento diário.

## Preparação

Pré-requisitos: **JDK 17+** e **Python 3.10–3.13**; recomendado Python 3.13.
Abra esta pasta no editor ou IDE. Os fontes Java estão em `src` e os Python em `python`.

No macOS/Linux, na raiz do projeto:

```sh
sh preparar.sh
sh executar.sh
```

`preparar.sh` reaproveita o Python compatível de `.venv` quando disponível; caso
contrário, procura Python 3.13, 3.12, 3.11 ou 3.10, nessa ordem. Para escolher outro
interpretador: `OFICINA_PYTHON=python3.13 sh preparar.sh`.
A preparação instala as versões de [requirements.txt](requirements.txt) no ambiente
local `.venv` e baixa JGraphT 1.5.2, suas dependências e JUnit 5.11.4
(Console Standalone 1.11.4) para `lib`. JUnit é usado apenas nos testes.
Não instala ferramentas ou pacotes no Python global.

**A preparação exige internet para baixar os pacotes; as demonstrações executam
offline depois disso.** Prepare as máquinas antes da oficina. Não há broker,
serviço em nuvem, API externa ou modelo a baixar durante os exemplos.

No Windows, execute com um Python compatível, por exemplo:

```powershell
py -3.13 preparar.py
javac --release 17 -encoding UTF-8 -cp "lib/*" -d out "@fontes.txt"
java -Dfile.encoding=UTF-8 -cp "out;lib/*" oficina.Main
```

### Execução direta

```sh
sh executar.sh 1
sh executar.sh todos
sh executar.sh cosseno
sh executar.sh rag
sh executar.sh hdbscan --debug
sh executar.sh hdbscan --etapa 3
sh executar.sh hdbscan --etapa 6
sh executar.sh hdbscan --min-cluster-size 5 --resumo
```

No menu, escolha `1` a `10`, `todos` ou `0` para sair. Cada exemplo cria seus próprios
dados, podendo ser repetido e executado em qualquer ordem. Opções adicionais vão
apenas com `hdbscan`, `10` ou `todos`.

### Leitura do terminal

Os exemplos usam títulos, etapas numeradas, recuos e marcas visuais para separar
entradas, resultados e avisos. As cores ANSI são ativadas automaticamente em um
terminal compatível. Para escolher o comportamento:

```sh
OFICINA_CORES=sempre sh executar.sh       # força as cores
OFICINA_CORES=nunca sh executar.sh        # desativa as cores
NO_COLOR=1 sh executar.sh                 # padrão de desativação de cores
```

Ao redirecionar a saída para um arquivo ou pipe, as cores ficam desligadas por
padrão para preservar o texto limpo. `NO_COLOR` desativa as cores automáticas;
`OFICINA_CORES=sempre` permite ativá-las explicitamente, e `OFICINA_CORES=nunca`
desativa mesmo em um terminal colorido.

Para executar **somente Python**, sem compilar Java:

```sh
.venv/bin/python python/oficina.py cosseno
.venv/bin/python python/oficina.py rag
.venv/bin/python python/oficina.py hdbscan --debug
.venv/bin/python python/oficina.py hdbscan --etapa 5
```

No Windows, substitua `.venv/bin/python` por `.venv\Scripts\python.exe`.

Para compilar Java manualmente no macOS/Linux, na raiz do projeto:

```sh
javac --release 17 -encoding UTF-8 -cp 'lib/*' -d out @fontes.txt
java -Dfile.encoding=UTF-8 -cp 'out:lib/*' oficina.Main
```

O menu procura o Python em `.venv`; `OFICINA_PYTHON` permite escolher um interpretador
com as dependências instaladas. Execute os comandos manuais na raiz do projeto.
`executar.sh` também funciona se chamado a partir de outra pasta.

## Exemplos práticos

| Menu | Problema fictício | Estruturas e operações prontas |
| --- | --- | --- |
| 1 | Priorizar bugs abertos para o plantão | `List<Chamado>`, `filter`, `sorted`, `min`, `groupingBy`, `EnumMap` e `PriorityQueue` para novos incidentes. |
| 2 | Separar pedidos pagos em ordem de aprovação | `Queue<Pedido>`/`ArrayDeque`, `HashSet` para deduplicar IDs, transições de estado e retorno `Optional`. |
| 3 | Desfazer ajustes de timeout e diagnóstico | `Deque<ConfiguracaoAplicacao>`, snapshots imutáveis e restauração real do estado. |
| 4 | Consultar usuários por ID e listar ativos | `HashMap<Long, Usuario>`, `putIfAbsent`, `replace`, `Optional.filter/map/ifPresentOrElse` e listagem com stream. |
| 5 | Investigar erros em uma janela de tempo | `NavigableMap<Instant, List<RegistroLog>>`, `computeIfAbsent`, `subMap`, `flatMap` e agregação por serviço. |
| 6 | Identificar impacto de uma falha entre serviços | Grafo direcionado do JGraphT, BFS/DFS e equipes afetadas com `map/distinct/sorted`. |
| 7 | Comparar volume de chamados por área | Arrays NumPy de contagens não negativas e `cosine_similarity`, em Python. |
| 8 | Aplicar pagamentos com entregas repetidas e falhas | `ArrayBlockingQueue`, `HashMap` de pedidos, `HashSet` de eventos aplicados, fila de falhas e contadores. |
| 9 | Recuperar artigos para contexto de RAG | `TfidfVectorizer`, matriz esparsa CSR, cosseno e ranking com `numpy.argsort`. |
| 10 | Agrupar perfis 2D e identificar ruído | KDTree, matrizes, grafo CSR, MST, union-find, hierarquia, árvore condensada e mapa de estabilidade. |

O código dos cenários Java está em
[ExemplosColecoes.java](src/oficina/demonstracoes/ExemplosColecoes.java) e
[ProcessamentoEventos.java](src/oficina/demonstracoes/ProcessamentoEventos.java).
[ExemplosPython.java](src/oficina/demonstracoes/ExemplosPython.java) apenas inicia o
processo Python; não realiza cálculos de similaridade ou agrupamento em Java.

### Organização e práticas Java

| Pasta | Responsabilidade |
| --- | --- |
| `src/oficina/dominio` | `record` e `enum` com dados, validações e transições de estado. |
| `src/oficina/casos` | Regras de aplicação usando coleções prontas, sem impressão no console. |
| `src/oficina/demonstracoes` | Dados fictícios, apresentação e orquestração dos exemplos. |
| `testes/java/oficina` | Testes JUnit de regras, cenários de erro e preservação do estado. |

Os exemplos mostram `Objects.requireNonNull`, `Comparator`, referências de método,
coleções encapsuladas e retornos de listas não modificáveis. `Optional` representa
ausência no retorno de consultas; dados inválidos são rejeitados na entrada.
Streams filtram, transformam e agregam; comandos que alteram estado usam métodos
explícitos. Os exemplos usam `BigDecimal` para valores e `Instant`/`Duration` para tempo.

### Complexidades para discutir

- `ArrayList`: acesso por índice O(1), inclusão ao final O(1) amortizado,
  busca e remoção no meio O(n).
- `ArrayDeque`: operações nas pontas O(1) amortizado; cresce conforme necessário.
- `PriorityQueue`: consulta da cabeça O(1); inserção e remoção do próximo item O(log n).
- `HashMap`: busca e atualização O(1) esperado quando as chaves se distribuem bem;
  não oferece ordem garantida. A consulta de usuários ativos ordena explicitamente
  seu resultado por nome e ID.
- `TreeMap`: busca, inclusão e remoção O(log n); o custo de percorrer uma faixa
  também depende de quantos itens ela contém.
- BFS e DFS no grafo: O(V + E), com V vértices e E arestas.
- Na investigação de logs, t é a quantidade de timestamps e k a quantidade de
  registros retornados: acesso ao índice O(log t), consulta O(log t + k).
- Cosseno de N vetores densos com d dimensões: O(N·d). O TF-IDF do RAG produz
  uma matriz esparsa; a comparação depende dos termos não nulos. Ordenar N escores
  acrescenta O(N log N).
- Neste HDBSCAN, a matriz completa exige O(n²) de espaço e a busca de distâncias
  O(n²·d); as demais etapas dependem das rotinas de árvore, ordenação e grafo das
  bibliotecas. O exemplo é para nove incidentes, sem objetivo de medir desempenho.

## HDBSCAN: abrir o algoritmo pelas estruturas

O arquivo [python/hdbscan_exemplo.py](python/hdbscan_exemplo.py) chama as rotinas de
cada etapa explicitamente com nove incidentes ServiceNow fictícios. Depois do resultado
dissecado, a etapa 9 também chama a API pública completa `HDBSCAN.fit` com os mesmos
dados e parâmetros para comparar a composição dos grupos, probabilidades e persistências.
O valor `probabilities_` representa força de pertencimento; não é uma probabilidade calibrada.

O exemplo transforma em números apenas horas de resolução e quantidade de usuários
afetados, padronizando essas duas colunas com `StandardScaler`. Número do incidente,
grupo de atribuição e resumo ficam visíveis para dar contexto, mas não entram no
agrupamento. Em produção, a escolha e a escala das features precisam refletir o processo;
o scaler ajustado no histórico deve ser reutilizado nos lotes seguintes.

```text
objetos Incidente -> features numéricas -> StandardScaler -> matriz de pontos
  -> KDTree -> vizinhos e vetor de core distances (inspeção)
  -> matriz de distâncias
  -> matriz de alcançabilidade mútua e grafo CSR
  -> MST e array de arestas
  -> arestas ordenadas e hierarquia linkage
  -> array estruturado da árvore condensada
  -> dict de estabilidades e seleção EOM
  -> vetor de rótulos
  -> comparação com HDBSCAN.fit nos mesmos pontos
```

| Etapa | Estrutura inspecionada | Função pronta utilizada |
| --- | --- | --- |
| 1 | Objetos `Incidente`, features selecionadas e `ndarray (9, 2)` padronizado | `dataclass`, `numpy.array`, `sklearn.preprocessing.StandardScaler` |
| 2 | `ndarray (9, 9)` de distâncias | `sklearn.metrics.pairwise_distances` |
| 3 | KDTree, array de nós, índices dos vizinhos e vetor de core distances | `KDTree.query` e `KDTree.get_arrays` |
| 4 | Matriz de pesos e grafo CSR com `indptr`, `indices`, `data` | `hdbscan.mutual_reachability` interna e `scipy.sparse.csr_matrix` |
| 5 | MST esparsa e array `(8, 3)` de arestas | `scipy.sparse.csgraph.minimum_spanning_tree` |
| 6 | Array linkage `(8, 4)` e componentes conexas | `hdbscan.label` interna; inspeção de uniões com `scipy.cluster.hierarchy.DisjointSet` |
| 7 | Registros `parent/child/lambda_val/child_size`, `dict` de estabilidade | `hdbscan.condense_tree`, `compute_stability`, `get_clusters` internas |
| 8 | Vetor de rótulos, com `-1` para ruído | Resultado da seleção EOM da biblioteca |
| 9 | Comparação de rótulos, probabilidades e persistências | API pública `hdbscan.HDBSCAN.fit` |

Cada etapa explica a entrada, por que a operação vem naquele ponto, o motivo da
estrutura escolhida e a saída que será usada depois. A KDTree e o `DisjointSet` são
identificados como inspeções auxiliares; não são confundidos com as entradas reais
das rotinas de alcançabilidade e linkage.

A consulta KDTree e a MST do SciPy tornam as estruturas acessíveis para a oficina;
a etapa final executa a API completa com `algorithm="generic"` e MST exata, alinhando
o caminho da biblioteca à sequência explícita. A configuração padrão da biblioteca
pode escolher estratégias otimizadas diferentes.
A função pronta `mutual_reachability` recebe a matriz e calcula os core distances
internamente. A consulta separada à KDTree expõe os vizinhos e confere os mesmos
valores; não é uma alteração oculta do cálculo da biblioteca.
A visualização com `DisjointSet` acompanha as arestas da MST já calculada e permite
ver os componentes se unindo. O linkage continua sendo construído pela biblioteca.
As rotinas internas de linkage também usam union-find com vetores de pais e tamanhos.
[Código da biblioteca](https://github.com/scikit-learn-contrib/hdbscan/blob/master/hdbscan/_hdbscan_linkage.pyx).

O [roteiro específico de HDBSCAN](docs/roteiro-hdbscan.md) explica como ler cada
estrutura, sugere perguntas para a turma e mostra as contas de estabilidade.

### Parâmetros e saída

O padrão é `min_samples=2` e `min_cluster_size=3`. Na biblioteca **hdbscan**,
`min_samples` conta vizinhos **externos**, excluindo a própria amostra. Por isso,
o valor 2 produz as mesmas core distances da convenção que conta a própria amostra
e usa 3. A KDTree é consultada com `k=min_samples+1` para incluir o próprio ponto.

```sh
# Debug completo já está ativado por padrão.
sh executar.sh hdbscan --debug

# Mostrar só uma etapa; as dependências são calculadas normalmente.
sh executar.sh hdbscan --etapa 4

# Com três vizinhos externos, a core distance considera uma vizinhança maior.
sh executar.sh hdbscan --min-samples 3

# Ramos de quatro não sobrevivem ao mínimo de cinco; a raiz é excluída.
sh executar.sh hdbscan --min-cluster-size 5 --resumo
```

`min_samples` aceita 1–8; `min_cluster_size`, 2–9. Eles são independentes.
Mais vizinhos podem tornar a densidade exigida mais conservadora; isso não garante
variação monotônica no número de grupos. O tamanho mínimo determina os ramos candidatos.
Use `--etapa` de 1 a 8 para abrir uma estrutura ou `--etapa 9` para ver só a comparação.
`--resumo` apresenta os registros, os rótulos e a comparação final.

## Roteiro sugerido de apresentação

| Tempo | Exemplos | Foco |
| --- | --- | --- |
| 5 min | Abertura | Apresentar os problemas fictícios e a escolha da estrutura pela operação necessária. |
| 15 min | 1–3 | Modelar chamados e pedidos; priorizar sem alterar a lista; separar FIFO; restaurar configuração LIFO. |
| 15 min | 4–5 | Tratar usuário ausente com Optional; consultar logs por faixa sem perder timestamps repetidos. |
| 10 min | 6 | Seguir a direção do impacto, comparar BFS/DFS e agrupar as equipes afetadas. |
| 10 min | 7 | Relacionar linhas/colunas de arrays com perfis e comparar os escores. |
| 10 min | 8 | Acompanhar fila cheia, mensagem repetida, pagamento aprovado, pedido inexistente e contadores. |
| 10 min | 9 | Inspecionar a matriz TF-IDF esparsa, comparar os artigos recuperados e ler as fontes no contexto. |
| 25 min | 10 | Percorrer as oito estruturas do HDBSCAN, comparar com a API completa e mudar um parâmetro. |

## Limitações

**Coleções e grafos:** usam APIs prontas. A árvore demonstra ordenação e faixas com
`TreeMap`; a API não expõe os nós para percursos pré/pós-ordem. O grafo de serviços
é direcionado de fornecedor para consumidor e indica impacto potencial, sem modelar
redundância ou mecanismos de contingência. A ordem dos vizinhos influencia BFS/DFS.
As classes de aplicação são usadas em uma única thread. Repositório, históricos e
índices existem apenas em memória. O cadastro verifica a presença de e-mail, sem
validação completa de endereço ou unicidade por e-mail. Os pedidos usam uma única
moeda implícita e não modelam frete, impostos, cancelamentos ou pagamentos parciais.
Fila de separação e conjuntos de IDs não têm expiração ou armazenamento persistente.

**Eventos:** produtor e consumidor se alternam em uma única thread e processo.
`ArrayBlockingQueue` tem capacidade três; `offer` retorna `false` quando cheia e o
programa consome um evento antes de tentar incluir o adiado. O evento 401 chega duas
vezes; um `HashSet` evita reaplicar o pagamento. O 404 se refere a um pedido inexistente
e fica na fila de análise. A marca de sucesso ocorre após a aplicação; falhas não
impedem nova tentativa explícita com o mesmo ID. Cada mensagem deve manter seu ID e
conteúdo entre entregas. Não há retentativa automática, persistência, broker, rede,
confirmações de entrega, replicação ou tolerância a falhas. Atualizar pedido e marcar
evento não formam uma transação; a demonstração não garante idempotência distribuída
nem entrega exatamente uma vez. Logs e contadores observam apenas essa simulação.

**Cosseno:** os vetores de contagem são fictícios, mas usam dados não negativos
plausíveis para volume por área. Cosseno mede direção relativa, não volume absoluto
nem relevância factual. Estes vetores ficam entre 0 e 1; features centralizadas podem
produzir escores negativos.

**Busca para RAG:** TF-IDF extrai termos dos textos, e a matriz CSR é criada localmente.
A busca examina todos os artigos e ordena os escores; não usa embeddings semânticos,
índice vetorial aproximado ou geração de resposta. O índice fica em memória e é
reconstruído ao iniciar o programa.
[Referência de cosseno](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.pairwise.cosine_similarity.html).
[API de TfidfVectorizer](https://scikit-learn.org/1.7/modules/generated/sklearn.feature_extraction.text.TfidfVectorizer.html).

**HDBSCAN:** usa incidentes fictícios e duas features numéricas padronizadas
(horas de resolução e usuários afetados), distância euclidiana, `alpha=1`, seleção
EOM e raiz excluída. Número, grupo e resumo são apenas contexto. Não configura outras
políticas nem predição de novas amostras. Materializa o grafo completo, o que não é
adequado para bases grandes. CSR é mostrado como representação, sem alegar economia
neste grafo denso. Não há implementação própria nem substituição por DBSCAN.

Para abrir as etapas, são chamadas funções **internas** de `hdbscan`, cujas APIs
podem mudar; por isso as versões estão fixadas. O linkage pode serializar empates
em fusões binárias na mesma distância, sem criar novos níveis de densidade.
Os IDs da árvore condensada são diferentes dos IDs do linkage e dos rótulos finais.
O exemplo mostra estabilidade bruta e persistência normalizada separadamente.
Os testes de integração comparam o pipeline aberto com a API completa nos 64 pares
válidos de parâmetros deste conjunto; isso não certifica equivalência para todos os dados.

## Saída esperada e verificações

A [saída completa](docs/saida-esperada.txt) corresponde a `sh executar.sh todos`.
Resultados principais:

- Backlog: próximos chamados 101, 104 e 106; a lista original mantém seis objetos.
- Fila: PED-101 a PED-104 iniciam separação em FIFO; reagendar o mesmo ID retorna `false`.
- Configuração: 2000 ms/diagnóstico desligado -> 5000 ms/desligado -> 5000 ms/ligado;
  desfazer restaura 5000 ms/desligado e depois 2000 ms/desligado.
- Usuários ativos: Ana e Clara; ID 999 ausente é tratado por `Optional`.
- Logs: quatro registros na janela `[12:00:00Z, 12:01:00Z)`, incluindo dois no mesmo
  instante 12:00:30Z; dois registros têm nível ERRO.
- Impacto da autenticação: pedidos, pagamentos e notificações; falha apenas em
  notificações não alcança serviços fornecedores.
- Cosseno: semana semelhante 1.0000; perfil de pedidos 0.8000; perfil de pagamentos 0.6000.
- Busca TF-IDF: os artigos D2 e D1 aparecem primeiro para a pergunta sobre situação e pagamento do pedido.
- Eventos: `produzidos=6, processados=4, duplicados=1, falhas=1, adiamentos=3, pendentes=0, filaFalhas=1`.
- HDBSCAN: INC0010451–INC0010454 no grupo 0; INC0010521–INC0010524 no grupo 1;
  INC0010899 como ruído. A API completa produz a mesma partição, probabilidades e
  persistências. A MST tem oito arestas; peso total aproximado 4.8978.

Para compilar com avisos tratados como erro, executar JUnit e conferir a integração
com os exemplos Python:

```sh
sh verificar.sh
```

No Windows, após compilar os fontes Java com os comandos acima:

```powershell
javac --release 17 -encoding UTF-8 -cp "out;lib/*" -d out-testes "@fontes-testes.txt"
java -cp "out;out-testes;lib/*" org.junit.platform.console.ConsoleLauncher execute --scan-class-path=out-testes --disable-banner --fail-if-no-tests
.venv\Scripts\python.exe -m unittest discover -s testes -p "test_*.py" -v
```

Os testes Java verificam validações, transições de estado, priorização, restauração,
deduplicação, cadastros, snapshots, janelas temporais, direção/ciclos no grafo e
contadores. Os testes de integração verificam ranking/contexto, as dez opções do menu,
parâmetros, estruturas intermediárias do HDBSCAN e equivalência com a API completa.
São testes dos exemplos e de sua integração; não reimplementam os algoritmos das bibliotecas.
