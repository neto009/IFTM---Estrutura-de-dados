package oficina.dominio;

import java.util.List;

/** Contrato JSON fictício de uma API de páginas: id, title e children. */
public record PaginaApi(String id, String title, List<PaginaApi> children) {
    public PaginaApi {
        children = children == null ? List.of() : List.copyOf(children);
    }
}
