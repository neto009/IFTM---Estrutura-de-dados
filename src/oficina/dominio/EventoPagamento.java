package oficina.dominio;

import java.math.BigDecimal;
import java.util.Objects;

/** ID identifica a mensagem, inclusive quando ela é entregue novamente. */
public record EventoPagamento(long id, String pedidoId, BigDecimal valor) {
    public EventoPagamento {
        if (id <= 0) {
            throw new IllegalArgumentException("O ID do evento deve ser positivo.");
        }
        pedidoId = Validacoes.textoObrigatorio(pedidoId, "ID do pedido");
        Objects.requireNonNull(valor, "Valor do pagamento é obrigatório.");
        if (valor.signum() <= 0) {
            throw new IllegalArgumentException("O valor do pagamento deve ser positivo.");
        }
    }
}
