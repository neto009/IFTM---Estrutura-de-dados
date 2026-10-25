package oficina.dominio;

/** Vértice imutável: nome e equipe participam do equals/hashCode gerado pelo record. */
public record Servico(String nome, String equipe) {
    public Servico {
        nome = Validacoes.textoObrigatorio(nome, "Nome do serviço");
        equipe = Validacoes.textoObrigatorio(equipe, "Equipe responsável");
    }
}
