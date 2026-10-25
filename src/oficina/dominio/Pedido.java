package oficina.dominio;

import java.math.BigDecimal;
import java.util.Objects;

/** Transições devolvem um novo pedido; o objeto anterior continua com seu estado original. */
public record Pedido(String id, String cliente, BigDecimal total, Status status) {
    public enum Status { AGUARDANDO_PAGAMENTO, PAGO, EM_SEPARACAO }

    public Pedido {
        id = Validacoes.textoObrigatorio(id, "ID do pedido");
        cliente = Validacoes.textoObrigatorio(cliente, "Cliente");
        Objects.requireNonNull(total, "Total é obrigatório.");
        Objects.requireNonNull(status, "Status é obrigatório.");
        if (total.signum() <= 0) {
            throw new IllegalArgumentException("O total do pedido deve ser positivo.");
        }
    }

    public Pedido confirmarPagamento(BigDecimal valorRecebido) {
        Objects.requireNonNull(valorRecebido, "Valor recebido é obrigatório.");
        if (status != Status.AGUARDANDO_PAGAMENTO) {
            throw new IllegalStateException("O pedido " + id + " não está aguardando pagamento.");
        }
        // compareTo compara valores: 129.9 e 129.90 representam o mesmo pagamento.
        if (total.compareTo(valorRecebido) != 0) {
            throw new IllegalArgumentException("Valor recebido diferente do total do pedido " + id + '.');
        }
        return new Pedido(id, cliente, total, Status.PAGO);
    }

    public Pedido iniciarSeparacao() {
        if (status != Status.PAGO) {
            throw new IllegalStateException("Somente pedidos pagos podem entrar em separação.");
        }
        return new Pedido(id, cliente, total, Status.EM_SEPARACAO);
    }
}
