package oficina.casos;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import oficina.dominio.Usuario;

/** Simula a resposta paginada de uma consulta; não abre conexão com banco de dados. */
public final class ConsultaUsuarios {
    private final List<Usuario> registros;

    public ConsultaUsuarios(List<Usuario> registros) {
        this.registros = List.copyOf(Objects.requireNonNull(registros, "Registros são obrigatórios."));
    }

    public List<Usuario> listarAtivos(int pagina, int tamanho) {
        if (pagina < 0 || tamanho < 1) {
            throw new IllegalArgumentException("Página deve ser >= 0 e tamanho deve ser >= 1.");
        }
        return registros.stream()
                .filter(Usuario::ativo)
                .sorted(Comparator.comparingLong(Usuario::id))
                .skip((long) pagina * tamanho)
                .limit(tamanho)
                .toList();
    }
}
