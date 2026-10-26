package oficina.casos;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;
import org.jgrapht.Graph;
import org.jgrapht.graph.DefaultDirectedGraph;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.traverse.BreadthFirstIterator;
import org.jgrapht.traverse.DepthFirstIterator;
import oficina.dominio.Servico;

/** Aresta fornecedor -> consumidor: partir de uma falha alcança quem pode ser afetado. */
public final class DependenciasServicos {
    public record Aresta(Servico fornecedor, Servico consumidor) { }

    private final Graph<Servico, DefaultEdge> grafo = new DefaultDirectedGraph<>(DefaultEdge.class);

    public void adicionarDependencia(Servico fornecedor, Servico consumidor) {
        Objects.requireNonNull(fornecedor, "Serviço fornecedor é obrigatório.");
        Objects.requireNonNull(consumidor, "Serviço consumidor é obrigatório.");
        grafo.addVertex(fornecedor);
        grafo.addVertex(consumidor);
        grafo.addEdge(fornecedor, consumidor);
    }

    public List<Servico> impactadosEmLargura(Servico origem) {
        validarOrigem(origem);
        return coletar(new BreadthFirstIterator<>(grafo, origem)).stream()
                .filter(servico -> !servico.equals(origem))
                .toList();
    }

    public List<Servico> impactadosEmProfundidade(Servico origem) {
        validarOrigem(origem);
        return coletar(new DepthFirstIterator<>(grafo, origem)).stream()
                .filter(servico -> !servico.equals(origem))
                .toList();
    }

    public List<Servico> vertices() {
        return grafo.vertexSet().stream()
                .sorted(Comparator.comparing(Servico::nome))
                .toList();
    }

    public List<Aresta> arestas() {
        return grafo.edgeSet().stream()
                .map(aresta -> new Aresta(grafo.getEdgeSource(aresta), grafo.getEdgeTarget(aresta)))
                .sorted(Comparator.comparing((Aresta aresta) -> aresta.fornecedor().nome())
                        .thenComparing(aresta -> aresta.consumidor().nome()))
                .toList();
    }

    private void validarOrigem(Servico origem) {
        Objects.requireNonNull(origem, "Origem é obrigatória.");
        if (!grafo.containsVertex(origem)) {
            throw new IllegalArgumentException("Serviço não registrado: " + origem.nome());
        }
    }

    private static List<Servico> coletar(Iterator<Servico> percurso) {
        List<Servico> servicos = new ArrayList<>();
        percurso.forEachRemaining(servicos::add); // A busca e a detecção de ciclos pertencem ao JGraphT.
        return servicos;
    }
}
