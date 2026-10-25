"""Incidentes fictícios do ServiceNow analisados com HDBSCAN em etapas.

As funções internas de hdbscan são usadas para abrir o pipeline real. A versão está
fixada em requirements.txt; não há implementação própria de MST, árvores ou EOM.
Ao final, a API completa HDBSCAN é executada nos mesmos vetores para comparar saídas.
"""

from collections import Counter
from dataclasses import dataclass
import warnings

import numpy as np
from scipy.cluster.hierarchy import DisjointSet
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import minimum_spanning_tree
from sklearn.metrics import pairwise_distances
from sklearn.neighbors import KDTree
from sklearn.preprocessing import StandardScaler
from terminal import Tela

# hdbscan 0.8.41 emits this harmless warning from a LaTeX docstring on Python 3.13.
with warnings.catch_warnings():
    warnings.filterwarnings("ignore", message=r"invalid escape sequence.*", category=SyntaxWarning)
    from hdbscan import HDBSCAN
    from hdbscan._hdbscan_linkage import label
    from hdbscan._hdbscan_reachability import mutual_reachability
    from hdbscan._hdbscan_tree import condense_tree, compute_stability, get_clusters
    from hdbscan.plots import CondensedTree


@dataclass(frozen=True, slots=True)
class Incidente:
    """Recorte fictício de um registro do ServiceNow."""

    numero: str
    grupo_atribuicao: str
    resumo: str
    horas_resolucao: float
    usuarios_afetados: int


CODIGOS = tuple("ABCDEFGHI")
INCIDENTES = (
    Incidente("INC0010451", "IAM", "Falha de login após expiração de sessão", 1.0, 5),
    Incidente("INC0010452", "IAM", "Token de autenticação rejeitado", 1.2, 7),
    Incidente("INC0010453", "IAM", "MFA sem código de validação", 0.8, 4),
    Incidente("INC0010454", "IAM", "Conta bloqueada após várias tentativas", 1.1, 6),
    Incidente("INC0010521", "Pagamentos", "Checkout retorna erro 500", 5.0, 50),
    Incidente("INC0010522", "Pagamentos", "Cobrança permanece pendente", 5.2, 55),
    Incidente("INC0010523", "Pagamentos", "Webhook de pagamento atrasado", 4.8, 47),
    Incidente("INC0010524", "Pagamentos", "Conciliação não atualiza o status", 5.1, 53),
    Incidente("INC0010899", "Plataforma", "Indisponibilidade geral do portal", 24.0, 500),
)


def preparar_incidentes(incidentes=INCIDENTES):
    """Retorna features brutas, pontos padronizados e o escalador ajustado."""
    caracteristicas = np.array(
        [[incidente.horas_resolucao, incidente.usuarios_afetados]
         for incidente in incidentes],
        dtype=np.float64,
    )
    escalador = StandardScaler()
    pontos = escalador.fit_transform(caracteristicas)
    return caracteristicas, pontos, escalador


def calcular_distancias(pontos):
    """Entrada (n, 2); saída (n, n): acesso direto a cada par de pontos."""
    return pairwise_distances(pontos, metric="euclidean")


def consultar_vizinhos(pontos, min_samples):
    """KDTree pronta e duas matrizes: distâncias e índices dos vizinhos."""
    arvore = KDTree(pontos, leaf_size=2, metric="euclidean")
    # A consulta explícita inclui o próprio ponto, de distância zero, na primeira coluna.
    # A biblioteca hdbscan conta min_samples vizinhos EXTERNOS, por isso o +1.
    distancias, indices = arvore.query(pontos, k=min_samples + 1)
    return arvore, distancias, indices


def construir_grafo(distancias, min_samples):
    """Matriz de pesos por alcançabilidade mútua e o mesmo grafo em formato CSR."""
    # Esta rotina pronta calcula seus core distances internamente pela matriz.
    # A consulta KDTree separada permite inspecionar os vizinhos e conferir os mesmos valores.
    alcance = mutual_reachability(distancias.copy(), min_points=min_samples, alpha=1.0)
    sem_lacos = alcance.copy()
    np.fill_diagonal(sem_lacos, 0)
    return alcance, csr_matrix(sem_lacos)


def construir_mst(grafo):
    """SciPy retorna uma matriz esparsa; a visão COO fornece a lista de arestas."""
    mst = minimum_spanning_tree(grafo)
    coordenadas = mst.tocoo()
    arestas = np.column_stack((coordenadas.row, coordenadas.col, coordenadas.data))
    return mst, arestas


def construir_hierarquia(arestas):
    """Converte as arestas ordenadas em linhas [filho_a, filho_b, distância, tamanho]."""
    ordem = np.argsort(arestas[:, 2], kind="stable")
    ordenadas = np.ascontiguousarray(arestas[ordem], dtype=np.float64)
    return label(ordenadas)  # Rotina de linkage do próprio hdbscan.


def inspecionar_componentes(arestas, tela):
    """Usa DisjointSet pronto para visualizar as uniões das arestas já obtidas da MST."""
    componentes = DisjointSet(range(len(CODIGOS)))
    for origem, destino, peso in arestas[np.argsort(arestas[:, 2], kind="stable")]:
        componentes.merge(int(origem), int(destino))
        grupos = sorted(sorted(CODIGOS[i] for i in grupo) for grupo in componentes.subsets())
        tela.linha(f"unir {CODIGOS[int(origem)]}--{CODIGOS[int(destino)]}, peso={peso:.4f}: {grupos}")


def condensar_hierarquia(hierarquia, min_cluster_size):
    """Array estruturado: cada registro tem parent, child, lambda_val e child_size."""
    return condense_tree(hierarquia, min_cluster_size)


def selecionar_clusters(condensada):
    """Mapa de estabilidade, seleção EOM e vetores de resultados, todos da biblioteca."""
    estabilidades = compute_stability(condensada)
    # get_clusters altera o mapa de trabalho; copy preserva os valores originais para exibir.
    rotulos, probabilidades, persistencias = get_clusters(
        condensada, estabilidades.copy(), cluster_selection_method="eom", allow_single_cluster=False
    )
    # Só obtém os IDs selecionados para apresentação. Os rótulos acima já estão prontos.
    selecionados = CondensedTree(condensada, rotulos)._select_clusters()
    return estabilidades, selecionados, rotulos, probabilidades, persistencias


def executar_hdbscan_completo(pontos, min_samples=2, min_cluster_size=3):
    """Executa a API pública de ponta a ponta, com parâmetros alinhados ao pipeline aberto."""
    return HDBSCAN(
        min_samples=min_samples,
        min_cluster_size=min_cluster_size,
        metric="euclidean",
        alpha=1.0,
        algorithm="generic",
        approx_min_span_tree=False,
        core_dist_n_jobs=1,
        cluster_selection_method="eom",
        allow_single_cluster=False,
    ).fit(pontos)


def rotulos_canonicos(rotulos):
    """Normaliza números arbitrários de cluster pela primeira posição de cada grupo."""
    ids = {}
    canonicos = []
    for rotulo in rotulos:
        valor = int(rotulo)
        if valor == -1:
            canonicos.append(-1)
        else:
            ids.setdefault(valor, len(ids))
            canonicos.append(ids[valor])
    return np.asarray(canonicos, dtype=np.int64)


def persistencias_canonicas(rotulos, persistencias):
    """Alinha as persistências à ordem em que os grupos aparecem nos rótulos."""
    ids = dict.fromkeys(int(rotulo) for rotulo in rotulos if rotulo >= 0)
    return np.asarray([persistencias[cluster] for cluster in ids], dtype=np.float64)


def executar_etapas(min_samples=2, min_cluster_size=3):
    """O pipeline explícito: cada saída alimenta a etapa seguinte, sem chamar HDBSCAN.fit."""
    caracteristicas, pontos, escalador = preparar_incidentes()
    if not 1 <= min_samples < len(pontos):
        raise ValueError("min_samples deve estar entre 1 e 8 (vizinhos externos).")
    if not 2 <= min_cluster_size <= len(pontos):
        raise ValueError("min_cluster_size deve estar entre 2 e 9.")

    distancias = calcular_distancias(pontos)
    arvore_vizinhos, distancias_vizinhos, indices_vizinhos = consultar_vizinhos(pontos, min_samples)
    nucleos = distancias_vizinhos[:, -1]
    alcance, grafo = construir_grafo(distancias, min_samples)
    mst, arestas = construir_mst(grafo)
    hierarquia = construir_hierarquia(arestas)
    condensada = condensar_hierarquia(hierarquia, min_cluster_size)
    estabilidades, selecionados, rotulos, probabilidades, persistencias = selecionar_clusters(condensada)
    # dict pronto do Python: reúne as estruturas para inspeção no terminal ou no editor.
    return dict(incidentes=INCIDENTES, caracteristicas=caracteristicas,
                escalador=escalador, pontos=pontos, distancias=distancias,
                arvore_vizinhos=arvore_vizinhos,
                indices_vizinhos=indices_vizinhos,
                nucleos=nucleos, alcance=alcance, grafo=grafo, mst=mst, arestas=arestas,
                hierarquia=hierarquia, condensada=condensada, estabilidades=estabilidades,
                selecionados=selecionados, rotulos=rotulos, probabilidades=probabilidades,
                persistencias=persistencias)


def imprimir_matriz(matriz, tela):
    tela.valor("Estrutura", f"ndarray shape={matriz.shape}, dtype={matriz.dtype}")
    tela.linha("     " + "".join(f"{codigo:>7}" for codigo in CODIGOS))
    for codigo, linha in zip(CODIGOS, matriz):
        tela.linha(f"{codigo:>5}" + "".join(f"{valor:7.3f}" for valor in linha))


def demonstrar(min_samples=2, min_cluster_size=3, debug=True, etapa=None):
    tela = Tela()
    tela.titulo("10  HDBSCAN  |  incidentes fictícios do ServiceNow")
    tela.objetivo("encontrar padrões de incidentes parecidos e destacar chamados com perfil isolado.")
    tela.passos("registros → features numéricas → estruturas do HDBSCAN → rótulos → comparar com a API completa.")
    if etapa == 9:
        tela.linha("O pipeline detalhado foi calculado; agora a API completa executa para comparar as saídas.")
    elif etapa is not None:
        tela.linha("Você está vendo uma etapa isolada; a comparação com a API completa aparece na etapa 9.")
    elif debug:
        tela.linha("As etapas 1–8 abrem o pipeline; ao final, HDBSCAN.fit executa a API completa.")
    else:
        tela.linha("Este resumo mostra os registros e rótulos; a API completa roda ao final para comparação.")
    dados = executar_etapas(min_samples, min_cluster_size)

    def mostrar(numero):
        return numero == etapa if etapa is not None else debug or numero in (1, 8, 9)

    if mostrar(1):
        tela.etapa(1, "Incidentes e features: objetos → matriz ndarray")
        tela.explicar_etapa(
            entrada="Nove objetos Incidente com número, grupo, resumo, horas para resolver e usuários afetados.",
            motivo="HDBSCAN mede distâncias; primeiro precisamos definir quais atributos numéricos representam cada chamado.",
            escolha="Usamos dataclass para preservar o significado do registro e ndarray para cálculo. Só horas e usuários entram: codificar grupo ou texto como números criaria distâncias artificiais. StandardScaler evita comparar horas com contagens em escalas brutas diferentes.",
            saida="Matriz float64 (9, 2), uma linha por chamado. A–I ligam as linhas aos tickets; o scaler ajustado fica guardado.",
        )
        tela.valor("min_samples", f"{min_samples} vizinhos externos")
        tela.valor("min_cluster_size", min_cluster_size)
        tela.linha("Features usadas: horas para resolver e quantidade de usuários afetados.")
        tela.linha("Código | Número | Grupo | Horas | Usuários | Resumo")
        for codigo, incidente in zip(CODIGOS, dados["incidentes"]):
            tela.linha(
                f"{codigo} | {incidente.numero} | {incidente.grupo_atribuicao} | "
                f"{incidente.horas_resolucao:.1f} | {incidente.usuarios_afetados} | {incidente.resumo}"
            )
        tela.linha("Matriz de entrada padronizada; cada linha mantém o código do incidente acima:")
        tela.valor("ndarray", f"shape={dados['pontos'].shape}, dtype={dados['pontos'].dtype}")
        tela.valor("Médias (horas, usuários)", np.round(dados["escalador"].mean_, 2))
        tela.valor("Desvios padrão", np.round(dados["escalador"].scale_, 2))
        for codigo, incidente, ponto in zip(CODIGOS, dados["incidentes"], dados["pontos"]):
            tela.linha(f"{codigo} / {incidente.numero} = {np.round(ponto, 3)}")
        tela.dica("Dados fictícios; StandardScaler pode ser sensível a valores extremos.")
        tela.dica("Em lotes reais, ajuste o scaler no histórico e reutilize-o para manter a mesma escala.")
    if mostrar(2):
        tela.etapa(2, "Matriz de distâncias: pairwise_distances(pontos)")
        tela.explicar_etapa(
            entrada="Matriz padronizada (9, 2), com uma linha para cada incidente.",
            motivo="A próxima etapa de densidade precisa saber quão separados estão os pares, antes de corrigir essas distâncias.",
            escolha="Calculamos todos os pares uma vez: a matriz simétrica dá acesso direto e é fácil de inspecionar. Uma KDTree ou cálculo sob demanda pouparia memória em outras estratégias, mas esconderia esta representação completa; aqui o custo didático é O(n²).",
            saida="Matriz float64 (9, 9), diagonal zero e distância na célula [i,j]. mutual_reachability usa esta matriz na etapa 4.",
        )
        imprimir_matriz(dados["distancias"], tela)
        tela.dica("Cada célula [i,j] guarda uma distância. Espaço O(n²).")
    if mostrar(3):
        tela.etapa(3, "Árvore espacial e core distances: KDTree.query/get_arrays")
        tela.explicar_etapa(
            entrada="Pontos padronizados e min_samples; cada consulta procura o próprio ponto e seus vizinhos mais próximos.",
            motivo="Antes de pesar as conexões, mostramos como HDBSCAN estima a densidade local de cada incidente.",
            escolha="KDTree divide bem este espaço de duas dimensões e deixa índices, nós e limites visíveis. Para só nove pontos, força bruta seria simples; em alta dimensão, KDTree pode perder eficiência. Esta árvore é uma inspeção didática: a etapa 4 recalcula core distances a partir da matriz completa.",
            saida="Consulta retorna distâncias e índices; a última distância de cada linha é a core distance. Isso explica a densidade, mas não é entrada direta da próxima função.",
        )
        tela.linha(f"A consulta pede k={min_samples + 1}: os {min_samples} vizinhos externos mais o próprio ponto.")
        _, indices_arvore, nos, limites = dados["arvore_vizinhos"].get_arrays()
        tela.linha(f"KDTree particiona o espaço 2D. Índices dos pontos na árvore: {indices_arvore}")
        tela.linha("Nós em um array de registros: id | início | fim exclusivo | folha | raio")
        for indice, no in enumerate(nos):
            tela.linha(f"{indice:2} | {no['idx_start']:6} | {no['idx_end']:13} | {no['is_leaf']:5} | {no['radius']:.4f}")
        tela.valor("Limites dos nós", f"ndarray shape={limites.shape}")
        tela.linha("Raio descreve a extensão do nó; a árvore usa esses limites para organizar buscas espaciais.")
        tela.linha("Matriz de índices dos vizinhos; primeira coluna = o próprio ponto:")
        for codigo, indices in zip(CODIGOS, dados["indices_vizinhos"]):
            tela.linha(f"{codigo}: {indices}")
        tela.linha("Core distance: distância até o k-ésimo vizinho; representa a escala local de densidade.")
        tela.linha("O vetor abaixo é a última coluna da matriz de distâncias aos vizinhos.")
        for codigo, nucleo in zip(CODIGOS, dados["nucleos"]):
            tela.valor(codigo, f"{nucleo:.4f}")
    if mostrar(4):
        tela.etapa(4, "Grafo ponderado: mutual_reachability e scipy.sparse.csr_matrix")
        tela.explicar_etapa(
            entrada="Matriz de distâncias par a par e min_samples; a rotina obtém core distances da própria matriz.",
            motivo="Distância euclidiana sozinha pode aproximar um ponto isolado de um grupo denso. Ajustamos pesos antes de procurar conexões globais.",
            escolha="Mutual reachability usa max(core(i), core(j), distância(i,j)): conexões de regiões esparsas ficam mais caras. Guardamos a matriz para leitura e CSR para entregar o grafo à rotina de MST do SciPy. Uma lista de adjacência seria menor num grafo esparso; este exemplo é completo e denso, então CSR não promete economia.",
            saida="Matriz ponderada e grafo CSR com 72 entradas direcionadas (dois sentidos por par). A MST consome o CSR na etapa 5.",
        )
        imprimir_matriz(dados["alcance"], tela)
        grafo = dados["grafo"]
        tela.valor("Grafo CSR sem laços", f"shape={grafo.shape}, nnz={grafo.nnz} entradas não nulas")
        tela.linha("Cada par não direcionado ocupa duas posições: uma em cada sentido do grafo.")
        tela.linha(f"indptr (limites das linhas): {grafo.indptr}")
        tela.linha(f"indices (colunas das primeiras 16 entradas): {grafo.indices[:16]}")
        tela.linha(f"data (pesos dessas entradas): {np.round(grafo.data[:16], 3)}")
        tela.dica("A KDTree da etapa 3 conferiu a escala; mutual_reachability recalculou os núcleos aqui.")
    if mostrar(5):
        tela.etapa(5, "MST: scipy.sparse.csgraph.minimum_spanning_tree(grafo)")
        tela.explicar_etapa(
            entrada="Grafo CSR completo com pesos de alcançabilidade mútua.",
            motivo="A hierarquia seguinte precisa das conexões que mantêm todos os incidentes ligados pelo menor custo total.",
            escolha="MST preserva a conectividade com n−1 arestas, sem ciclos, e descarta relações redundantes. Manter todas as n(n−1) conexões no linkage aumentaria trabalho sem mudar a árvore usada por esta versão do HDBSCAN.",
            saida=f"MST esparsa com {len(CODIGOS) - 1} arestas e um array [origem, destino, peso]. label ordena essas arestas na etapa 6.",
        )
        for origem, destino, peso in dados["arestas"]:
            tela.resultado(f"{CODIGOS[int(origem)]} -- {CODIGOS[int(destino)]}: {peso:.4f}")
        tela.valor("Resumo da MST", f"{len(dados['arestas'])} arestas; peso total={dados['arestas'][:, 2].sum():.4f}")
    if mostrar(6):
        tela.etapa(6, "Hierarquia: hdbscan._hdbscan_linkage.label(arestas_ordenadas)")
        tela.explicar_etapa(
            entrada="Array de arestas da MST; ordenamos os pesos do menor para o maior.",
            motivo="Conexões curtas juntam pontos primeiro; as fusões revelam grupos em escalas de densidade progressivamente maiores.",
            escolha="label usa union-find para unir componentes sem percorrer todos os membros a cada fusão. O array linkage guarda cada união de forma compacta. DisjointSet aparece ao lado só para visualizar componentes; não produz o linkage.",
            saida="Linkage (n−1, 4): filho A, filho B, distância e tamanho do novo componente. A condensação usa essas fusões na etapa 7.",
        )
        tela.linha("nó | filho A | filho B | distância | tamanho")
        for indice, (a, b, distancia, tamanho) in enumerate(dados["hierarquia"], start=len(CODIGOS)):
            tela.linha(f"{indice:2} | {int(a):7} | {int(b):7} | {distancia:9.4f} | {int(tamanho):7}")
        tela.dica("Fusões com a mesma distância representam o mesmo nível de densidade.")
        tela.linha("Visão auxiliar das uniões com DisjointSet, independente do linkage calculado:")
        inspecionar_componentes(dados["arestas"], tela)
    if mostrar(7):
        tela.etapa(7, "Condensação: array estruturado; estabilidade: dict; seleção: EOM")
        tela.explicar_etapa(
            entrada="Linkage da etapa 6 e min_cluster_size, que define o menor grupo que pode sobreviver.",
            motivo="A hierarquia mostra fusões, mas ainda não decide quais grupos persistem. Aqui aplicamos o tamanho mínimo e comparamos a estabilidade dos ramos.",
            escolha="Array estruturado registra parent, child, lambda e tamanho; dict consulta estabilidade por ID. EOM compara a permanência do pai com a soma dos descendentes, sem um corte único de distância. leaf prefere folhas e tende a grupos menores e mais específicos.",
            saida="Árvore condensada, mapa de estabilidade e ramos EOM selecionados. get_clusters também prepara rótulos, força de pertencimento e persistência; a etapa 8 apresenta esses resultados por incidente.",
        )
        tela.linha("Chamadas prontas: condense_tree -> compute_stability -> get_clusters.")
        tela.valor("Campos do array", dados["condensada"].dtype.names)
        tela.dica("IDs são reatribuídos na condensação; não são os IDs dos nós do linkage.")
        tela.linha("parent | child | lambda=1/distância | child_size")
        for registro in dados["condensada"]:
            tela.linha(f"{registro['parent']:6} | {registro['child']:5} | {registro['lambda_val']:18.4f} | {registro['child_size']:10}")
        tela.dica("child_size=1: saída de ponto; child_size>1: ramo candidato.")
        tela.linha("Um único ramo grande mantém a identidade; dois ou mais criam filhos.")
        tela.explicacao("Lambda", "1/distância; valores maiores representam conexões em escala de densidade mais alta.")
        tela.explicacao("Estabilidade", "Soma de lambda_saída − lambda_nascimento para os pontos do ramo.")
        tela.explicacao("Leitura prática", "Estabilidade alta indica que os membros ficam juntos em uma faixa mais ampla de densidade.")
        tela.linha("Mapa dict {id_cluster: estabilidade}, calculado pela biblioteca:")
        for cluster, estabilidade in sorted(dados["estabilidades"].items()):
            status = "SELECIONADO" if cluster in dados["selecionados"] else "não selecionado"
            linha = f"{int(cluster)}: {estabilidade:.4f} ({status})"
            (tela.resultado if cluster in dados["selecionados"] else tela.linha)(linha)
        tela.dica("EOM compara o pai com a melhor soma de descendentes; a raiz é excluída.")
        tela.valor("IDs dos ramos selecionados", [int(c) for c in dados["selecionados"]])
        tela.valor("Persistências por rótulo", dados["persistencias"])
    if mostrar(8):
        tela.etapa(8, "Resultado: vetor ndarray de rótulos (-1 = ruído)")
        tela.explicar_etapa(
            entrada="Rótulo calculado para cada linha, mais a relação entre índice e número do incidente.",
            motivo="O resultado matemático só vira uma informação operacional quando conseguimos dizer quais chamados pertencem a cada grupo e quais ficaram sem grupo estável.",
            escolha="Vetor ndarray mantém o rótulo na mesma posição do ticket e permite acesso por índice. -1 preserva como ruído um ponto sem grupo estável; forçá-lo ao grupo mais próximo esconderia essa incerteza.",
            saida="Um rótulo por incidente. A etapa 9 compara este vetor com labels_ da API completa; os números 0/1 não têm significado de negócio.",
        )
        for incidente, rotulo in zip(dados["incidentes"], dados["rotulos"]):
            (tela.aviso if rotulo == -1 else tela.resultado)(
                f"{incidente.numero} → {rotulo}" + (" (ruído)" if rotulo == -1 else " (cluster)"))
        tela.linha("Leitura posterior dos grupos de atribuição; esse campo não entrou nas features:")
        for rotulo in sorted({int(valor) for valor in dados["rotulos"]}):
            membros = [incidente for incidente, valor in zip(dados["incidentes"], dados["rotulos"])
                       if int(valor) == rotulo]
            if rotulo == -1:
                tela.explicacao("Ruído para investigação", ", ".join(incidente.numero for incidente in membros))
            else:
                grupos = Counter(incidente.grupo_atribuicao for incidente in membros)
                resumo = ", ".join(f"{grupo}={total}" for grupo, total in sorted(grupos.items()))
                tela.valor(f"Contexto do cluster {rotulo}", f"{len(membros)} incidentes; grupos: {resumo}")
        tela.dica("Use esse contexto para investigar padrões; cluster não é categoria ou prioridade prevista.")
        tela.dica("Mais min_samples pode tornar a exigência de densidade mais conservadora.")
        tela.dica("min_cluster_size controla quais ramos sobrevivem; com 5, aqui todos são ruído.")

    if mostrar(9):
        tela.etapa(9, "Comparação: API completa hdbscan.HDBSCAN.fit")
        tela.explicar_etapa(
            entrada="Mesma matriz padronizada e mesmos min_samples e min_cluster_size das etapas abertas.",
            motivo="Depois de interpretar os rótulos por chamado, conferimos se montar as rotinas separadamente produziu o mesmo resultado que a API usada em uma aplicação.",
            escolha="HDBSCAN.fit executa o fluxo completo internamente. algorithm=generic e approx_min_span_tree=False alinham a estratégia exata; assim uma diferença não vem de otimizações ou MST aproximada.",
            saida="labels_ e forças de pertencimento comparados por incidente; persistências, por grupo. Se coincidem, a composição está consistente neste conjunto, mas não é benchmark nem prova universal.",
        )
        modelo = executar_hdbscan_completo(dados["pontos"], min_samples, min_cluster_size)
        rotulos_completos = modelo.labels_
        particoes_iguais = np.array_equal(
            rotulos_canonicos(dados["rotulos"]), rotulos_canonicos(rotulos_completos)
        )
        probabilidades_iguais = np.allclose(
            dados["probabilidades"], modelo.probabilities_, rtol=1e-6, atol=1e-8
        )
        persistencias_etapas = persistencias_canonicas(dados["rotulos"], dados["persistencias"])
        persistencias_api = persistencias_canonicas(rotulos_completos, modelo.cluster_persistence_)
        persistencias_iguais = np.allclose(
            persistencias_etapas, persistencias_api, rtol=1e-6, atol=1e-8
        )
        tela.explicacao("Critério", "A numeração dos grupos é arbitrária; comparamos quem ficou junto e quem virou ruído.")
        tela.explicacao("Força p", "Medida de pertencimento do HDBSCAN; não é uma probabilidade calibrada.")
        tela.linha("Número | etapas abertas | API completa; p = força de pertencimento")
        for incidente, etapa_rotulo, etapa_prob, api_rotulo, api_prob in zip(
            dados["incidentes"], dados["rotulos"], dados["probabilidades"],
            rotulos_completos, modelo.probabilities_,
        ):
            tela.linha(
                f"{incidente.numero} | {etapa_rotulo} (p={etapa_prob:.3f}) "
                f"| {api_rotulo} (p={api_prob:.3f})"
            )
        (tela.resultado if particoes_iguais else tela.aviso)(
            f"Mesma partição de incidentes: {'sim' if particoes_iguais else 'não'}."
        )
        (tela.resultado if probabilidades_iguais else tela.aviso)(
            f"Forças de pertencimento por incidente coincidem: {'sim' if probabilidades_iguais else 'não'}."
        )
        if persistencias_etapas.size:
            tela.valor("Persistência por grupo", np.round(persistencias_etapas, 3))
            tela.valor("Persistência na API", np.round(persistencias_api, 3))
        else:
            tela.explicacao("Persistência", "Nenhum cluster foi selecionado; os vetores vazios são esperados.")
        (tela.resultado if persistencias_iguais else tela.aviso)(
            f"Persistências coincidem: {'sim' if persistencias_iguais else 'não'}."
        )
        if particoes_iguais and probabilidades_iguais and persistencias_iguais:
            tela.dica("Na aplicação que só precisa agrupar, use a API HDBSCAN.fit.")
            tela.dica("Mantenha as etapas abertas para ensinar e depurar o fluxo.")
        else:
            tela.explicacao("Atenção", "Os caminhos divergiram; confira features, scaler, métrica e parâmetros antes de interpretar os grupos.")
        tela.explicacao("Limite", "A comparação confere a composição deste exemplo, não a velocidade nem todos os conjuntos de dados.")
