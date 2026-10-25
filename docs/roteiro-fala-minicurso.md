# Roteiro de fala — Estruturas de dados no mundo real

Minicurso de Solange Brasileiro · 20 slides

Os dados são fictícios e as demonstrações usam estruturas prontas das bibliotecas. Sugestão: abra este roteiro ao lado do arquivo de slides.

## 01 · Abertura

Apresente a ideia central: a estrutura de dados é uma decisão que aparece em tarefas cotidianas de sistemas grandes. Explique que os exemplos são pequenos e fictícios para deixar visível a escolha por trás do código.

**No projeto:** README.md

## 02 · Quem conduz

Apresente sua mini bio: Software Engineer no Banco Bradesco, time BIA Tech, com atuação em backend, sistemas distribuídos e IA Generativa. Seu foco em soluções para o ciclo de pós-desenvolvimento conecta fundamentos da computação a desafios de grande escala.

## 03 · Mapa

Explique a progressão. Primeiro, a ordem e o acesso aos dados. Depois, eventos e relações entre serviços. Por fim, representações numéricas para similaridade, recuperação e agrupamento. A turma precisa apenas de lógica básica; não precisa conhecer os algoritmos internos das bibliotecas.

**No projeto:** README.md

## 04 · Escolha pela operação

Antes de escolher a classe, pergunte: inserir, remover, localizar por chave, priorizar, buscar uma faixa ou percorrer relações? Depois considere custo, ordem garantida, volume, mutabilidade e concorrência. Essa pergunta reaparece em todos os exemplos.

**No projeto:** README.md · docs/roteiro-java.md

## 05 · Lista e prioridade

Em ExemplosColecoes.listas, ArrayList mantém o backlog e a consulta não altera os dados originais. filter retira resolvidos e chamados já em atendimento; sorted ordena por prioridade e ID; limit(3) escolhe a amostra. Para encontrar apenas um próximo item, min custa O(n); ordenar todos custa O(n log n). PriorityQueue usa peek O(1), offer/poll O(log n), e sua iteração não está ordenada.

**No projeto:** src/oficina/demonstracoes/ExemplosColecoes.java · src/oficina/casos/ConsultasChamados.java

## 06 · Fila e pilha

Em FilaSeparacao, somente pedidos pagos entram na fila. Queue/ArrayDeque preserva FIFO; HashSet impede agendar o mesmo ID novamente. consultarProximo usa peek e iniciarProximo usa poll, devolvendo Optional.empty quando a fila está vazia. No EditorConfiguracao, o Deque funciona como pilha LIFO: cada alteração guarda um snapshot imutável; desfazer usa pop.

**No projeto:** src/oficina/casos/FilaSeparacao.java · src/oficina/casos/EditorConfiguracao.java

## 07 · Mapa de usuários

RepositorioUsuarios mantém um HashMap privado, indexado por Long. putIfAbsent protege IDs repetidos; replace só muda um cadastro existente. buscarPorId devolve Optional. O chamador pode filtrar conta ativa e mapear para email. O mapa não garante ordem; listarAtivos ordena explicitamente o resultado.

**No projeto:** src/oficina/casos/RepositorioUsuarios.java · src/oficina/demonstracoes/ExemplosColecoes.java

## 08 · Árvore e janela temporal

LinhaDoTempoLogs usa NavigableMap/TreeMap com Instant como chave e List<RegistroLog> como valor. Os dados de demonstração chegam fora de ordem e há dois registros em 12:00:30. subMap(start,true,end,false) inclui o início, exclui o fim e depois flatMap combina as listas. O resultado é um snapshot, não uma visão mutável do mapa. A janela retorna quatro registros, dois erros.

**No projeto:** src/oficina/casos/LinhaDoTempoLogs.java · src/oficina/demonstracoes/DadosOficina.java

## 09 · Eventos e idempotência

ProcessamentoEventos simula produtor e consumidor em uma thread com fila ArrayBlockingQueue de capacidade 3. O evento 401 é entregue duas vezes; HashSet reconhece a reaplicação. O 404 aponta para PED-999, inexistente, e segue para uma fila de falhas. O exemplo conta seis entregas: quatro aplicadas, uma duplicada, uma falha e três adiamentos. Marcar o ID depois do sucesso permite que uma falha não bloqueie tentativa futura, mas Map/Set em memória não são transacionais nem persistentes.

**No projeto:** src/oficina/demonstracoes/ProcessamentoEventos.java · src/oficina/casos/ConsumidorPagamentos.java

## 10 · Grafo de dependências

DependenciasServicos usa um grafo direcionado do JGraphT. Uma aresta A→B significa que B depende de A. BFS visita por camadas; DFS aprofunda um caminho; ambos identificam os mesmos alcançáveis em ordens diferentes, O(V+E). Notificações aparece uma vez apesar dos dois caminhos; buscar a partir dela não alcança seus fornecedores.

**No projeto:** src/oficina/casos/DependenciasServicos.java · src/oficina/demonstracoes/DadosOficina.java

## 11 · Vetores e cosseno

Em python/cosseno.py, a consulta [8,6,0] representa pedidos, pagamentos e acesso. O perfil “Semana semelhante” [16,12,0] tem o dobro do volume, mas a mesma proporção: cosseno 1. Os perfis de pedidos e pagamentos têm 0.8 e 0.6; acesso é 0. O escore compara direção/distribuição, não o volume total, não é causalidade nem probabilidade.

**No projeto:** python/cosseno.py

## 12 · RAG e busca lexical

python/rag.py cria um índice TF-IDF dos artigos, com matriz CSR esparsa. A pergunta é transformada com o mesmo vocabulário; cosseno calcula escore e argsort escolhe os melhores. Para a pergunta do exemplo, D2 (“Pagamento e situação do pedido”) e D1 (“Acompanhamento de pedidos”) aparecem primeiro. montar_contexto reúne textos para uma geração posterior, que não está implementada neste repositório.

**No projeto:** python/rag.py

## 13 · HDBSCAN: entrada

python/hdbscan_exemplo.py cria dataclass Incidente com número, grupo, resumo, horas e usuários. Só horas e usuários viram features. A matriz é padronizada com StandardScaler para não comparar escalas brutas distintas; A–I mantêm o vínculo com tickets. O scaler deve ser ajustado no histórico e reutilizado em lotes reais; extremos podem influenciá-lo.

**No projeto:** python/hdbscan_exemplo.py · docs/roteiro-hdbscan.md

## 14 · HDBSCAN: distâncias e KDTree

Etapa 2 materializa pairwise_distances com shape (9,9), simétrica e diagonal zero; o custo de espaço é O(n²). Etapa 3 consulta KDTree com k=min_samples+1: a biblioteca conta os vizinhos externos, então k=3 inclui o próprio ponto e dois vizinhos. A distância final é a core distance. A para I mede 4.708; core(I)=4.0621 contra core(A)=0.0299. A consulta é para inspeção; mutual_reachability recalcula os valores da matriz.

**No projeto:** python/hdbscan_exemplo.py · docs/saida-esperada.txt

## 15 · HDBSCAN: alcançabilidade mútua

Etapa 4 chama mutual_reachability da biblioteca. Para A–D, d=0.016, core(A)=0.0299 e core(D)=0.016, então o peso vira 0.0299. A matriz ponderada é convertida em CSR: indptr delimita linhas, indices lista vizinhos e data armazena pesos. Sem laços há 72 entradas dirigidas (dois sentidos por cada par). O grafo é completo, então CSR aqui não promete economia de memória; o formato facilita a entrada da MST do SciPy.

**No projeto:** python/hdbscan_exemplo.py · docs/roteiro-hdbscan.md

## 16 · HDBSCAN: MST

Etapa 5 passa o grafo CSR a minimum_spanning_tree. O grafo não direcionado tem 36 pares possíveis; a MST guarda n−1=8 arestas, sem ciclos, preservando conectividade e minimizando o peso total, 4.8978. A ligação B–G (0.5890) une as duas regiões densas; F–I (4.0621) é o elo mais caro. A visão COO vira array [origem,destino,peso].

**No projeto:** python/hdbscan_exemplo.py · docs/saida-esperada.txt

## 17 · HDBSCAN: hierarquia

Etapa 6 ordena arestas da MST por peso e passa o array à rotina label do hdbscan. O linkage registra filho A, filho B, distância e tamanho. A–D, B e C formam um componente; E–H, F e G formam outro; os grupos se unem em 0.5890, e I entra por último, em 4.0621. A biblioteca usa union-find para o linkage. DisjointSet do SciPy é apenas uma visualização auxiliar das componentes.

**No projeto:** python/hdbscan_exemplo.py · docs/saida-esperada.txt

## 18 · HDBSCAN: árvore condensada e EOM

Etapa 7 condense_tree remove candidatos abaixo de min_cluster_size=3. O array estruturado registra parent, child, lambda_val e child_size. lambda=1/distância; a estabilidade soma os intervalos em que cada ponto permanece no ramo. O dict dá 13.8291 para a raiz, 108.6007 para A–D e 77.7490 para E–H. EOM compara a raiz com a soma dos descendentes e seleciona os dois filhos; allow_single_cluster=False exclui a raiz. Persistência normalizada (0.871 e 0.623) não é a mesma medida que estabilidade bruta.

**No projeto:** python/hdbscan_exemplo.py · docs/roteiro-hdbscan.md

## 19 · Resultado final do HDBSCAN

Etapa 8 alinha rótulos às linhas: A–D (IAM) recebem 0, E–H (pagamentos) recebem 1 e I/INC0010899 (Plataforma) recebe -1, ruído. Os valores 0 e 1 são IDs arbitrários, não categorias de negócio. Etapa 9 executa a API pública HDBSCAN.fit com parâmetros alinhados e compara partição, forças de pertencimento e persistência. Neste conjunto coincidem; isso não é benchmark nem prova equivalência universal. p é força de pertencimento, não probabilidade calibrada. Com min_cluster_size=5, os grupos de quatro são descartados e os nove pontos ficam como ruído.

**No projeto:** python/hdbscan_exemplo.py · docs/roteiro-hdbscan.md

## 20 · Integração e encerramento

Retome o fio do minicurso: a estrutura organiza uma operação; logs e contadores mostram o que aconteceu; grafos e índices ajudam na investigação; recuperação prepara contexto. O código é local e didático, não conecta broker, nuvem, API ou modelo externo. Sugestões para demonstração: sh executar.sh 1; sh executar.sh 8; sh executar.sh hdbscan --etapa 1; sh executar.sh hdbscan --etapa 9. Termine perguntando qual operação é crítica no sistema real da turma.

**No projeto:** README.md · docs/roteiro-java.md · docs/roteiro-hdbscan.md
