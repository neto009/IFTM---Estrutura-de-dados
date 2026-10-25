package oficina.dominio;

import java.time.Instant;
import java.util.Objects;

/** Instant representa um instante absoluto; a saída usa UTC para ser reproduzível. */
public record RegistroLog(Instant instante, Nivel nivel, Servico servico, String mensagem) {
    public enum Nivel { INFO, AVISO, ERRO }

    public RegistroLog {
        Objects.requireNonNull(instante, "Instante é obrigatório.");
        Objects.requireNonNull(nivel, "Nível é obrigatório.");
        Objects.requireNonNull(servico, "Serviço é obrigatório.");
        mensagem = Validacoes.textoObrigatorio(mensagem, "Mensagem");
    }
}
