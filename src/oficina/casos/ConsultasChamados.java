package oficina.casos;

import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import oficina.dominio.Chamado;
import oficina.dominio.Chamado.Prioridade;

/** Consultas sem efeitos colaterais: filtrar e ordenar não alteram o backlog recebido. */
public final class ConsultasChamados {
    private static final Comparator<Chamado> ORDEM_ATENDIMENTO = Comparator
            .comparingInt((Chamado chamado) -> chamado.prioridade().ordemAtendimento())
            .thenComparingLong(Chamado::id);

    private ConsultasChamados() { }

    public static Comparator<Chamado> comparadorDeAtendimento() {
        return ORDEM_ATENDIMENTO;
    }

    public static List<Chamado> priorizarAbertos(List<Chamado> chamados) {
        return List.copyOf(Objects.requireNonNull(chamados, "Backlog é obrigatório.")).stream()
                .filter(Chamado::aguardandoAtendimento)
                .sorted(ORDEM_ATENDIMENTO)
                .toList(); // Resultado não modificável e elementos imutáveis.
    }

    public static Optional<Chamado> proximoParaAtendimento(List<Chamado> chamados) {
        return List.copyOf(Objects.requireNonNull(chamados, "Backlog é obrigatório.")).stream()
                .filter(Chamado::aguardandoAtendimento)
                .min(ORDEM_ATENDIMENTO); // O(n), sem ordenar tudo para obter um único chamado.
    }

    public static Map<Prioridade, Long> contarAbertosPorPrioridade(List<Chamado> chamados) {
        return List.copyOf(Objects.requireNonNull(chamados, "Backlog é obrigatório.")).stream()
                .filter(Chamado::aguardandoAtendimento)
                .collect(Collectors.groupingBy(Chamado::prioridade,
                        () -> new EnumMap<>(Prioridade.class), Collectors.counting()));
    }
}
