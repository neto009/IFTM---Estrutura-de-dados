package oficina.dominio;

import java.time.Duration;
import java.util.Objects;

/** Snapshot imutável: um histórico pode guardar a referência sem sofrer alterações posteriores. */
public record ConfiguracaoAplicacao(Duration timeout, boolean logsDetalhados) {
    public ConfiguracaoAplicacao {
        Objects.requireNonNull(timeout, "Timeout é obrigatório.");
        if (timeout.isZero() || timeout.isNegative()) {
            throw new IllegalArgumentException("O timeout deve ser positivo.");
        }
    }
}
