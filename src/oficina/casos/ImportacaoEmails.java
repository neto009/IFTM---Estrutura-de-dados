package oficina.casos;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

/** Limpa um arquivo didático de uma coluna, sem enviar mensagens ou validar e-mails. */
public final class ImportacaoEmails {
    private ImportacaoEmails() { }

    public static List<String> preparar(List<String> linhas) {
        Objects.requireNonNull(linhas, "Linhas são obrigatórias.");
        if (linhas.isEmpty() || !linhas.get(0).strip().equals("email")) {
            throw new IllegalArgumentException("A primeira linha do arquivo deve ser email.");
        }
        return linhas.stream()
                .skip(1)                         // O cabeçalho não é um destinatário.
                .map(String::strip)
                .filter(email -> !email.isBlank())
                .map(email -> email.toLowerCase(Locale.ROOT))
                .distinct()                      // A normalização vem antes da deduplicação.
                .sorted()
                .toList();
    }
}
