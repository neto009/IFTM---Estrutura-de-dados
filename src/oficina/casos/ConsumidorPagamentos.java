package oficina.casos;

import java.util.ArrayDeque;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Queue;
import java.util.Set;
import oficina.dominio.EventoPagamento;
import oficina.dominio.Pedido;

/** Idempotência local: a mesma mensagem aprovada não aplica o pagamento uma segunda vez. */
public final class ConsumidorPagamentos {
    public enum Status { APROVADO, DUPLICADO, FALHA }

    public record Resultado(Status status, String detalhe) {
        public Resultado {
            Objects.requireNonNull(status, "Status é obrigatório.");
            Objects.requireNonNull(detalhe, "Detalhe é obrigatório.");
        }
    }

    private final Map<String, Pedido> pedidosPorId = new HashMap<>();
    private final Set<Long> eventosAprovados = new HashSet<>();
    private final Queue<EventoPagamento> falhas = new ArrayDeque<>();

    public ConsumidorPagamentos(Collection<Pedido> pedidos) {
        for (Pedido pedido : List.copyOf(Objects.requireNonNull(pedidos, "Pedidos são obrigatórios."))) {
            if (pedidosPorId.putIfAbsent(pedido.id(), pedido) != null) {
                throw new IllegalArgumentException("Pedido duplicado na carga inicial: " + pedido.id());
            }
        }
    }

    public Resultado processar(EventoPagamento evento) {
        Objects.requireNonNull(evento, "Evento é obrigatório.");
        if (eventosAprovados.contains(evento.id())) {
            return new Resultado(Status.DUPLICADO, "mensagem já aplicada; pagamento preservado");
        }
        try {
            Pedido pedido = buscarPedido(evento.pedidoId()).orElseThrow(
                    () -> new IllegalArgumentException("pedido inexistente: " + evento.pedidoId()));
            Pedido atualizado = pedido.confirmarPagamento(evento.valor());
            pedidosPorId.put(atualizado.id(), atualizado);
            // Marca somente após a aplicação: uma falha não impede uma tentativa posterior.
            eventosAprovados.add(evento.id());
            return new Resultado(Status.APROVADO, "pedido=" + atualizado.id() + " status=" + atualizado.status());
        } catch (IllegalArgumentException | IllegalStateException erroDeNegocio) {
            falhas.offer(evento);
            return new Resultado(Status.FALHA, erroDeNegocio.getMessage());
        }
    }

    public Optional<Pedido> buscarPedido(String id) {
        return Optional.ofNullable(pedidosPorId.get(Objects.requireNonNull(id, "ID é obrigatório.")));
    }

    public List<EventoPagamento> eventosComFalha() {
        return List.copyOf(falhas);
    }
}
