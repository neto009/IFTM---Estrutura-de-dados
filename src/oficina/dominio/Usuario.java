package oficina.dominio;

/** Identidade estável por ID; alterações geram novos valores. Os dados são fictícios. */
public record Usuario(long id, String nome, String email, boolean ativo) {
    public Usuario {
        if (id <= 0) {
            throw new IllegalArgumentException("O ID do usuário deve ser positivo.");
        }
        nome = Validacoes.textoObrigatorio(nome, "Nome");
        email = Validacoes.textoObrigatorio(email, "E-mail");
    }

    public Usuario alterarEmail(String novoEmail) {
        return new Usuario(id, nome, novoEmail, ativo);
    }
}
