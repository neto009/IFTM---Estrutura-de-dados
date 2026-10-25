package oficina.casos;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.PriorityQueue;
import oficina.dominio.Chamado;

/** Cada consulta devolve uma coleção nova, preservando o backlog recebido. */
public final class ConsultasChamados {
    private static final Comparator<Chamado> ORDEM_ATENDIMENTO = Comparator
            .comparingInt((Chamado chamado) -> chamado.prioridade().ordemAtendimento())
            .thenComparingLong(Chamado::id);

    private ConsultasChamados() { }

    public static List<Chamado> filtrarAbertos(List<Chamado> chamados) {
        Objects.requireNonNull(chamados, "Backlog é obrigatório.");
        return chamados.stream()
                .filter(Chamado::aguardandoAtendimento)
                .toList();
    }

    public static List<Chamado> priorizarAbertos(List<Chamado> chamados) {
        return filtrarAbertos(chamados).stream()
                .sorted(ORDEM_ATENDIMENTO)
                .toList();
    }

    public static PriorityQueue<Chamado> criarFilaDePlantao(List<Chamado> chamados) {
        PriorityQueue<Chamado> fila = new PriorityQueue<>(ORDEM_ATENDIMENTO);
        fila.addAll(filtrarAbertos(chamados));
        return fila;
    }
}
