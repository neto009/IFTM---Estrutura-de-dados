package oficina.casos;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Objects;
import java.util.Optional;
import oficina.dominio.ConfiguracaoAplicacao;

/** A pilha guarda os estados anteriores, e desfazer restaura a configuração de fato. */
public final class EditorConfiguracao {
    private final Deque<ConfiguracaoAplicacao> historico = new ArrayDeque<>();
    private ConfiguracaoAplicacao atual;

    public EditorConfiguracao(ConfiguracaoAplicacao inicial) {
        atual = Objects.requireNonNull(inicial, "Configuração inicial é obrigatória.");
    }

    public boolean atualizar(ConfiguracaoAplicacao nova) {
        Objects.requireNonNull(nova, "Nova configuração é obrigatória.");
        if (atual.equals(nova)) {
            return false; // Um comando sem mudança não cria uma entrada inútil no histórico.
        }
        historico.push(atual);
        atual = nova;
        return true;
    }

    public Optional<ConfiguracaoAplicacao> desfazer() {
        if (historico.isEmpty()) {
            return Optional.empty();
        }
        atual = historico.pop();
        return Optional.of(atual);
    }

    public ConfiguracaoAplicacao atual() {
        return atual;
    }
}
