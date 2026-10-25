package oficina.casos;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.NavigableMap;
import java.util.Objects;
import java.util.Optional;
import java.util.TreeMap;
import oficina.dominio.RegistroLog;

/** Vários logs podem ter o mesmo timestamp; a lista evita sobrescrever um registro. */
public final class LinhaDoTempoLogs {
    private final NavigableMap<Instant, List<RegistroLog>> registros = new TreeMap<>();

    public void registrar(RegistroLog registro) {
        Objects.requireNonNull(registro, "Registro é obrigatório.");
        registros.computeIfAbsent(registro.instante(), instante -> new ArrayList<>()).add(registro);
    }

    public List<RegistroLog> consultar(Instant inicioInclusivo, Instant fimExclusivo) {
        Objects.requireNonNull(inicioInclusivo, "Início é obrigatório.");
        Objects.requireNonNull(fimExclusivo, "Fim é obrigatório.");
        if (inicioInclusivo.isAfter(fimExclusivo)) {
            throw new IllegalArgumentException("O início não pode ser posterior ao fim.");
        }
        return registros.subMap(inicioInclusivo, true, fimExclusivo, false).values().stream()
                .flatMap(List::stream)
                .toList(); // Materializa um snapshot; não devolve a visão mutável de subMap.
    }

    public Optional<RegistroLog> ultimo() {
        return Optional.ofNullable(registros.lastEntry())
                .map(entrada -> entrada.getValue().get(entrada.getValue().size() - 1));
    }
}
