package oficina.dominio;

import java.util.List;

/** Página da aplicação: filhos aninhados e ID do pai, sem referências circulares. */
public record ElementoPagina(String id, String titulo, String paiId, List<ElementoPagina> filhos) {
    public ElementoPagina {
        id = Validacoes.textoObrigatorio(id, "ID da página");
        titulo = Validacoes.textoObrigatorio(titulo, "Título da página");
        filhos = List.copyOf(filhos);
    }
}

