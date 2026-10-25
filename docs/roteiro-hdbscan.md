# HDBSCAN: incidentes ServiceNow pelas estruturas de dados

Abra [hdbscan_exemplo.py](../python/hdbscan_exemplo.py), começando por
`executar_etapas`. Cada chamada recebe a estrutura produzida pela anterior.
O dicionário retornado mantém os resultados disponíveis para inspecionar no editor.

Todas as rotinas de cálculo, árvores, MST e seleção pertencem às bibliotecas.
O código do projeto organiza as chamadas e apresenta seus dados. Depois dessas oito
etapas, a etapa 9 executa a API pública `HDBSCAN.fit` sobre a mesma matriz para
comparar rótulos, probabilidades e persistências.

## 1. Registros fictícios e preparação das features

```sh
sh executar.sh hdbscan --etapa 1
```

`INCIDENTES` contém nove objetos `Incidente` congelados, com campos inspirados em
registros do ServiceNow: número, grupo de atribuição, resumo, horas para resolver e
usuários afetados. Os números e histórias são fictícios.

O agrupamento usa somente as duas features numéricas. Número, grupo e texto servem
para identificar e interpretar os registros; não são transformados em números nem
entram no HDBSCAN. `StandardScaler.fit_transform` padroniza as duas colunas e cria
`pontos`, um `numpy.ndarray` de forma `(9, 2)`. A–I relacionam cada linha da matriz
ao incidente correspondente.

**Por que começar por aqui?** A distância só faz sentido depois de escolher quais
medidas representam um incidente. `Incidente` mantém os campos de negócio legíveis;
`ndarray` fornece a matriz numérica exigida pelo cálculo. Codificar `IAM=0` e
`Pagamentos=1`, por exemplo, faria o algoritmo interpretar esses códigos como uma
distância real entre categorias. O scaler coloca horas e contagem de usuários em
escalas comparáveis.

Para uma aplicação real, avalie as features com quem conhece o processo e ajuste o
scaler no conjunto histórico; reutilize o objeto ajustado em novos lotes para manter
a mesma escala. `StandardScaler` pode ser sensível a valores extremos.

Pergunta para a turma: o que mudaria se cada ponto tivesse 100 atributos?
A representação continuaria sendo uma matriz; passaria de `(9, 2)` para `(9, 100)`.

## 2. Matriz de distâncias: consultar pares por índice

```sh
sh executar.sh hdbscan --etapa 2
```

`calcular_distancias` chama `pairwise_distances`, produzindo `(9, 9)`.
A diagonal é zero, a matriz é simétrica e cada célula contém a distância entre dois
incidentes depois da padronização.
Acesso a um par já calculado é direto, mas guardar todos os pares custa O(n²) de espaço.

**Entrada:** pontos padronizados. **Saída:** uma distância por par; a função de
alcançabilidade mútua usa esta matriz na etapa 4. Calculamos todos os pares porque
esta versão didática materializa o grafo completo e permite conferir cada peso.
Uma busca por vizinhos ou cálculo sob demanda pode evitar guardar a matriz, mas muda
a estratégia de execução e é menos simples de inspecionar neste exemplo pequeno.

Pergunta: para um milhão de amostras, caberia guardar todos os pares na memória?
Use isso para discutir por que implementações para bases grandes evitam materializações.

## 3. KDTree, arrays de nós e vetor de core distances

```sh
sh executar.sh hdbscan --etapa 3
```

`consultar_vizinhos` constrói a `KDTree` pronta do scikit-learn, com `leaf_size=2`
para que a pequena entrada também tenha divisões visíveis. A árvore particiona o
espaço 2D e mantém uma permutação para relacionar folhas às linhas originais.
Escolhemos KDTree porque os dados têm só duas dimensões e queremos inspecionar a
estrutura espacial; força bruta seria suficiente para nove incidentes, enquanto em
alta dimensão uma KDTree pode perder vantagem.

`get_arrays` fornece dados, índices dos pontos, registros dos nós e limites geométricos.
Para cada nó, o exemplo mostra os campos `idx_start`, `idx_end`, `is_leaf` e `radius`.
O intervalo `[idx_start, idx_end)` recorta o array de índices; não implica que as
linhas originais da matriz foram mudadas de lugar.
[API KDTree](https://scikit-learn.org/stable/modules/generated/sklearn.neighbors.KDTree.html).

`query` retorna uma matriz de distâncias e outra de índices. Com `min_samples=2`,
consultamos três vizinhos, incluindo o próprio ponto. A última coluna das distâncias
é o vetor de core distances; valores maiores indicam que é preciso alcançar mais
longe para encontrar vizinhos suficientes. Os índices continuam apontando para as
linhas originais, mesmo que a KDTree as reorganize internamente.

Esta árvore é uma ramificação de inspeção, não a entrada da etapa 4. A rotina de
alcançabilidade mútua calcula novamente as core distances pela matriz completa;
assim a oficina mostra o conceito sem trocar o caminho de cálculo usado depois.

Pergunta: por que guardar índices além das distâncias? A distância diz quão perto;
o índice permite localizar o ponto correspondente na matriz original.

## 4. Grafo ponderado e representação CSR

```sh
sh executar.sh hdbscan --etapa 4
```

`construir_grafo` chama `mutual_reachability` da biblioteca hdbscan. O peso de cada
par é `max(core(i), core(j), distância(i,j))`. A core distance alta do incidente I
eleva o peso de suas conexões e torna visível que ele está em uma região esparsa.
A função pronta recebe a matriz e calcula seus core distances internamente;
a consulta KDTree da etapa anterior é uma inspeção separada dos mesmos vizinhos.
Os testes conferem que esses valores coincidem nas 64 combinações de parâmetros.

**Por que agora?** Antes de buscar a árvore que conecta os chamados, ajustamos as
distâncias para considerar densidade. Sem esse ajuste, um ponto isolado poderia
parecer conectado a um grupo apenas pela distância euclidiana. A saída é uma matriz
de pesos e sua representação CSR, consumida pela MST na etapa 5.

O exemplo conserva a matriz para leitura e cria uma `csr_matrix` sem laços.
A CSR representa o grafo com três arrays:

| Array | Papel |
| --- | --- |
| `indptr` | Início e fim das entradas de cada linha nos outros dois arrays. |
| `indices` | Coluna, isto é, vizinho de cada entrada armazenada. |
| `data` | Peso da aresta correspondente. |

Neste grafo, `indptr[:3]` é `[0, 8, 16]`. A linha de A ocupa as posições `[0:8)` de
`indices` e `data`; a linha de B ocupa `[8:16)`. São 72 entradas, pois cada um dos
nove pontos tem oito vizinhos e a representação guarda ambos os sentidos.

Pergunta: CSR economiza memória aqui? O grafo é completo, portanto não há essa
garantia; a conversão serve para demonstrar a representação e a API de grafos do SciPy.
Usamos CSR porque o SciPy aceita essa matriz esparsa diretamente e seus três arrays
expõem linhas, vizinhos e pesos. Uma lista de adjacência seria natural em um grafo
esparso; neste grafo denso, ela não traz economia garantida.

## 5. MST: reduzir o grafo a oito arestas

```sh
sh executar.sh hdbscan --etapa 5
```

`construir_mst` usa `minimum_spanning_tree` do SciPy. A MST mantém todos os vértices
conectados sem ciclos e minimiza o peso total. O resultado esparso contém uma
entrada por aresta; a orientação usada para armazená-la não muda o problema
original, que é não direcionado.

Escolhemos a MST porque a hierarquia HDBSCAN desta implementação é construída a partir
das conexões de alcançabilidade mútua. Ela reduz as muitas relações do grafo a `n−1`
arestas relevantes para manter todos os incidentes conectados; passar o grafo completo
às fusões carregaria relações redundantes.

`tocoo` expõe os arrays de linhas, colunas e pesos. `numpy.column_stack` os apresenta
como um array `(8, 3)` com registros `[origem, destino, peso]`.
O peso total desta entrada padronizada é aproximadamente `4.8978`.

Pergunta: por que n−1 arestas bastam para conectar n pontos em uma árvore?
Compare visualmente as 72 entradas do grafo com as oito arestas da MST.

## 6. Lista de arestas, union-find e hierarquia

```sh
sh executar.sh hdbscan --etapa 6
```

`numpy.argsort` ordena os índices das arestas por peso. `label`, do hdbscan, recebe
as arestas ordenadas e produz o array linkage. A rotina usa union-find internamente,
com vetores para pais e tamanhos dos componentes. Essa estrutura une componentes sem
repercorrer todos os seus membros a cada aresta.
[Fonte da rotina](https://github.com/scikit-learn-contrib/hdbscan/blob/master/hdbscan/_hdbscan_linkage.pyx).

Para tornar as uniões visíveis, `inspecionar_componentes` usa a classe pronta
`DisjointSet` do SciPy nas arestas já calculadas: `merge` une dois componentes e
`subsets` mostra os grupos atuais. Essa visualização não substitui a criação do
linkage nem seleciona os clusters finais.
[API DisjointSet](https://docs.scipy.org/doc/scipy/reference/generated/scipy.cluster.hierarchy.DisjointSet.html).

O linkage tem uma linha por fusão: `[filho_a, filho_b, distância, tamanho]`.
Os IDs 0–8 são pontos; cada linha cria o nó `9 + índice_da_linha`.
O array compacto preserva a ordem das fusões e alimenta `condense_tree`; o
`DisjointSet` paralelo serve apenas para a turma acompanhar as uniões.

| Nó | Filhos | Distância | Significado |
| --- | --- | --- | --- |
| 9 | 0 e 3 | 0.0299 | A e D formam um componente de dois pontos. |
| 15 | 13 e 14 | 0.5890 | Os componentes A–D e E–H se unem. |
| 16 | 15 e 8 | 4.0621 | O ponto I se une ao componente dos outros oito. |

Leia de baixo para cima para juntar componentes; de cima para baixo para dividir
os grupos, aumentando `lambda=1/distância`. Fusões empatadas na distância
representam um mesmo nível de densidade, mesmo quando serializadas em linhas binárias.

## 7. Registros da árvore condensada e mapa de estabilidade

```sh
sh executar.sh hdbscan --etapa 7
```

`condense_tree` transforma a hierarquia em um array estruturado com campos nomeados:

| Campo | Leitura |
| --- | --- |
| `parent` | Cluster de onde o ramo ou ponto sai. |
| `child` | Ponto ou cluster filho; os IDs são reatribuídos nesta árvore. |
| `lambda_val` | Densidade `1/distância` na saída. |
| `child_size` | Quantidade de pontos que saem por essa aresta. |

Neste exemplo, IDs 0–8 ainda representam pontos. O cluster raiz é 9; os candidatos
10 e 11 representam A–D e E–H. Um registro com `child_size=1` é saída de ponto;
um registro maior representa ramo candidato.

`min_cluster_size` entra agora porque define quais ramos podem virar grupos finais.
Concentramos as informações homogêneas no array estruturado, e `compute_stability`
usa um `dict` para consultar estabilidade por ID. A seleção EOM compara cada pai com
a soma de seus descendentes; `leaf` seria uma política alternativa que prefere
candidatos nas folhas e tende a produzir grupos mais específicos.

Ramos menores que `min_cluster_size` deixam de ser candidatos. Um único ramo grande
preserva a identidade e o nascimento; dois ou mais fazem nascer novos candidatos.

`compute_stability` retorna um `dict` de ID do cluster para estabilidade bruta.
O conceito é `Σ (lambda_saída − lambda_nascimento)` para os pontos do ramo:

- I sai da raiz em `lambda≈0.2462`, o inverso da distância de separação de 4.0621.
- Os outros oito pontos formam dois ramos quando `lambda≈1.6979`.
- Estabilidade calculada para a raiz: aproximadamente `13.8291` (com precisão completa).
- Cada filho nasce em `lambda≈1.6979` e acumula estabilidade até os pontos saírem
  em valores diferentes; os resultados são aproximadamente 108.6007 e 77.7490.

`get_clusters` executa EOM usando a árvore condensada e uma cópia do mapa.
Ela compara a estabilidade de um pai com a melhor soma dos seus descendentes,
selecionando ramos sem sobreposição. A cópia preserva os valores originais,
pois a seleção altera seu mapa de trabalho. A raiz não é elegível neste exemplo.

Na prática, isso evita escolher um único limite de distância para todos os clusters:
um grupo pode ser denso e outro mais espalhado, desde que cada um seja persistente
na sua própria faixa de `lambda`. O resultado desta etapa é o conjunto de ramos que
EOM aceitou, além dos vetores de rótulos, força de pertencimento e persistência que
a etapa 8 apresenta por incidente e a etapa 9 compara com a API pública.

Estabilidade bruta e persistência normalizada são medidas diferentes; a saída mostra
ambas com seus nomes. A seleção já vem da biblioteca.

## 8. Vetor de rótulos

```sh
sh executar.sh hdbscan --etapa 8
```

Cada posição corresponde à mesma linha da matriz de entrada:
`[0, 0, 0, 0, 1, 1, 1, 1, -1]`. Na demonstração, os rótulos são exibidos com o
número do incidente ServiceNow em vez de apenas com a posição.
Os números dos grupos não têm ordem semântica. `-1` representa ruído.
I pertence apenas à raiz, excluída da seleção.

O vetor é escolhido porque mantém correspondência posicional direta com os chamados.
Ruído fica explícito como `-1`; atribuí-lo ao cluster mais próximo esconderia que ele
não pertence a nenhum ramo estável selecionado.

Para interpretar a saída operacionalmente, a demonstração volta a exibir o número do
ticket. Também resume o grupo de atribuição dos membros como contexto posterior. Esse
campo não participou do agrupamento, portanto serve para investigar os clusters, não
para dizer que o HDBSCAN previu uma categoria ou uma prioridade.

Uma saída de ponto na condensação não significa automaticamente ruído final:
um ancestral elegível selecionado pode atribuir seu rótulo ao ponto.

Para encerrar, repita com `--min-cluster-size 5 --resumo`: nenhum ramo de quatro
é candidato, só restaria a raiz excluída, e todos os nove pontos ficam como ruído.

## 9. Comparar com a API pública completa

```sh
sh executar.sh hdbscan --etapa 9
```

O exemplo constrói `HDBSCAN` com os mesmos `min_samples`, `min_cluster_size`, métrica
euclidiana, `alpha=1`, seleção EOM e exclusão da raiz. Usa `algorithm="generic"` e
`approx_min_span_tree=False` para comparar com o caminho explícito e exato da oficina.
Então chama `.fit(pontos)` e mostra lado a lado `labels_` e forças de pertencimento
(`probabilities_`) por incidente, além das persistências por grupo. Essa força não é
uma probabilidade calibrada.

Os números dos rótulos de cluster são arbitrários. A comparação primeiro os renumera
pela ordem em que aparecem e verifica a mesma composição dos grupos e os mesmos pontos
de ruído. Também compara forças de pertencimento e persistências com tolerância numérica.
Isso confirma que a sequência didática compõe as rotinas da biblioteca como esperado;
não é uma comparação de velocidade nem prova equivalência para todos os conjuntos.

Na prática, essa conferência mostra se a sequência aberta pode ser substituída pela
API `fit` sem alterar esta saída. Se rótulos, forças ou persistências divergirem,
revise features, scaler, métrica e parâmetros antes de interpretar os clusters. Em
uma aplicação que só precisa do agrupamento, use a API completa; mantenha as etapas
separadas para ensino e depuração.
