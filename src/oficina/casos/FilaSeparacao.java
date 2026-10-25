package oficina.casos;

import java.util.ArrayDeque;
import java.util.HashSet;
import java.util.Objects;
import java.util.Optional;
import java.util.Queue;
import java.util.Set;
import oficina.dominio.Pedido;

/** Regra da aplicação sobre uma Queue pronta; a coleção fica encapsulada. */
public final class FilaSeparacao {
    private final Queue<Pedido> pendentes = new ArrayDeque<>();
    private final Set<String> idsAgendados = new HashSet<>();

    public boolean agendar(Pedido pedido) {
        Objects.requireNonNull(pedido, "Pedido é obrigatório.");
        if (pedido.status() != Pedido.Status.PAGO) {
            throw new IllegalStateException("Somente pedidos pagos podem ser agendados.");
        }
        if (!idsAgendados.add(pedido.id())) {
            return false; // Uma nova entrega do mesmo pedido não duplica o trabalho.
        }
        pendentes.offer(pedido);
        return true;
    }

    public Optional<Pedido> consultarProximo() {
        return Optional.ofNullable(pendentes.peek());
    }

    public Optional<Pedido> iniciarProximo() {
        return Optional.ofNullable(pendentes.poll()).map(Pedido::iniciarSeparacao);
    }

    public int quantidadePendente() {
        return pendentes.size();
    }
}
