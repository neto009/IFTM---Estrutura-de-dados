package oficina.dominio;

import java.util.Objects;

/** Validação compartilhada dos textos obrigatórios dos exemplos. */
final class Validacoes {
    private Validacoes() { }

    static String textoObrigatorio(String valor, String campo) {
        String texto = Objects.requireNonNull(valor, campo + " é obrigatório.").strip();
        if (texto.isBlank()) {
            throw new IllegalArgumentException(campo + " não pode ficar em branco.");
        }
        return texto;
    }
}
