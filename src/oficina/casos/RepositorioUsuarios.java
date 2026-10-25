package oficina.casos;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import oficina.dominio.Usuario;

/** Repositório concreto em memória, suficiente para explicar a aplicação de um mapa. */
public final class RepositorioUsuarios {
    private final Map<Long, Usuario> usuariosPorId = new HashMap<>();

    public void cadastrar(Usuario usuario) {
        Objects.requireNonNull(usuario, "Usuário é obrigatório.");
        if (usuariosPorId.putIfAbsent(usuario.id(), usuario) != null) {
            throw new IllegalArgumentException("Já existe um usuário com ID " + usuario.id() + '.');
        }
    }

    public Optional<Usuario> buscarPorId(long id) {
        return Optional.ofNullable(usuariosPorId.get(id));
    }

    public void atualizar(Usuario usuario) {
        Objects.requireNonNull(usuario, "Usuário é obrigatório.");
        if (usuariosPorId.replace(usuario.id(), usuario) == null) {
            throw new IllegalArgumentException("Usuário não encontrado: " + usuario.id());
        }
    }

    public List<Usuario> listarAtivos() {
        return usuariosPorId.values().stream()
                .filter(Usuario::ativo)
                .sorted(Comparator.comparing(Usuario::nome).thenComparingLong(Usuario::id))
                .toList();
    }
}
