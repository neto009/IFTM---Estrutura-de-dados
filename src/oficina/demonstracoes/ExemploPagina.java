package oficina.demonstracoes;

import java.nio.file.Path;
import java.util.List;
import oficina.apresentacao.TelaOficina;
import oficina.casos.PaginaNavegavel;
import oficina.dominio.ElementoPagina;

/** API de páginas: JSON hierárquico, List de filhos, visão linear e Map por ID. */
public final class ExemploPagina {
    private ExemploPagina() { }

    public static PaginaNavegavel carregar() {
        return PaginaNavegavel.carregar(
                Path.of(System.getProperty("oficina.raiz", ".")).resolve("dados/paginas.json"));
    }

    public static void executar(TelaOficina tela) {
        tela.objetivo("transformar uma resposta JSON de páginas em objetos navegáveis nos dois sentidos.");
        tela.passos("receber JSON → vincular o pai aos filhos → gerar a lista linear → consultar o pai por ID.");
        PaginaNavegavel pagina = carregar();

        tela.etapa(1, "Receber uma árvore JSON de uma API de páginas");
        tela.explicarEtapa("Resposta fictícia com id, title e children, inspirada em uma API de wiki.",
                "A hierarquia vem dos dados da API; precisamos entender o contrato antes de transformá-lo.",
                "Gson lê o JSON pronto em PaginaApi. Cada children é uma List<PaginaApi>.",
                "Uma raiz e suas páginas aninhadas, sem leitura ou extração de uma interface HTML.");
        tela.linha("GET /api/paginas  →  resposta local de dados/paginas.json");
        mostrar(pagina.raiz(), "", tela);

        tela.etapa(2, "Vincular o pai com um método recursivo que retorna List");
        tela.explicarEtapa("List<PaginaApi> e o ID do pai da chamada atual; a raiz começa com null.",
                "Para navegar de volta depois, cada filho precisa guardar a identidade do pai.",
                "vincularPais percorre a lista, chama a si mesmo para children e retorna List<ElementoPagina>.",
                "Um objeto raiz com filhos aninhados; cada filho recebe paiId sem referência circular.");
        tela.valor("Raiz", pagina.raiz().titulo());
        tela.valor("Filhos da raiz", ids(pagina.raiz().filhos()));
        pagina.buscarPorId("operacao").ifPresent(elemento ->
                tela.valor("Filhos de operacao", ids(elemento.filhos())));
        tela.dica("Caso base: uma lista vazia não entra no for e retorna uma lista vazia.");
        tela.dica("Na chamada dos filhos, pagina.id() se torna o paiId da próxima chamada.");

        tela.etapa(3, "Gerar a lista linear com um segundo método recursivo");
        tela.explicarEtapa("Páginas já mapeadas com titulo, paiId e List de filhos.",
                "Uma tabela ou exportação precisa percorrer todas as páginas, inclusive as aninhadas.",
                "listarPaginas usa add(pagina) e addAll(listarPaginas(pagina.filhos())): pai antes dos filhos.",
                "Uma List linear dos mesmos objetos e um Map por ID, mantendo a árvore original.");
        pagina.elementos().forEach(elemento -> tela.linha(
                "%-16s | pai=%-12s | filhos=%s".formatted(elemento.id(),
                        elemento.paiId() == null ? "(raiz)" : elemento.paiId(), ids(elemento.filhos()))));
        tela.valor("Páginas na lista", pagina.elementos().size());
        tela.dica("A recursão termina quando filhos está vazio. addAll junta o resultado de cada subárvore.");

        tela.etapa(4, "Navegar de uma página filha ao pai e ao avô");
        tela.explicarEtapa("ID incidente-451 e o índice Map<String, ElementoPagina>.",
                "A navegação de volta usa paiId, mesmo quando começamos pela lista linear.",
                "buscarPorId consulta o Map; paiDe devolve Optional porque a raiz não tem pai.",
                "incidente-451 → incidentes → operacao. As listas de filhos continuam disponíveis.");
        pagina.paiDe("incidente-451").ifPresent(pai ->
                tela.resultado("Pai de incidente-451: " + pai.id()));
        pagina.paiDe("incidente-451").flatMap(pai -> pagina.paiDe(pai.id()))
                .ifPresent(avo -> tela.resultado("Avô de incidente-451: " + avo.id()));
        pagina.paiDe(pagina.raiz().id()).ifPresentOrElse(
                pai -> tela.resultado(pai.id()), () -> tela.aviso("A raiz não tem pai: Optional.empty."));
        tela.dica("A List linear contém os mesmos objetos; ela não cria cópias das páginas.");
        tela.dica("A interface renderiza o JSON e permite expandir ramos. Ela não fornece os dados por scraping.");
    }

    private static List<String> ids(List<ElementoPagina> elementos) {
        return elementos.stream().map(ElementoPagina::id).toList();
    }

    private static void mostrar(ElementoPagina elemento, String recuo, TelaOficina tela) {
        tela.linha(recuo + elemento.titulo() + " [" + elemento.id() + "]");
        elemento.filhos().forEach(filho -> mostrar(filho, recuo + "  ", tela));
    }
}

