package oficina.casos;

import com.google.gson.Gson;
import com.google.gson.JsonParseException;
import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import oficina.dominio.ElementoPagina;
import oficina.dominio.PaginaApi;

/** Lê uma resposta JSON de API e organiza os mesmos objetos em árvore, lista e índice. */
public final class PaginaNavegavel {
    private final ElementoPagina raiz;
    private final List<ElementoPagina> elementos;
    private final Map<String, ElementoPagina> porId;

    private PaginaNavegavel(PaginaApi resposta) {
        List<ElementoPagina> raizes = vincularPais(List.of(resposta), null);
        this.raiz = raizes.get(0);
        this.elementos = listarPaginas(raizes);
        this.porId = elementos.stream().collect(Collectors.toUnmodifiableMap(
                ElementoPagina::id, Function.identity()));
    }

    public static PaginaNavegavel carregar(Path arquivo) {
        try (Reader leitor = Files.newBufferedReader(arquivo, StandardCharsets.UTF_8)) {
            PaginaApi resposta = new Gson().fromJson(leitor, PaginaApi.class);
            if (resposta == null) {
                throw new IllegalArgumentException("A resposta da API precisa conter uma página raiz.");
            }
            return new PaginaNavegavel(resposta);
        } catch (IOException | JsonParseException erro) {
            throw new IllegalStateException("Não foi possível ler a resposta JSON da API.", erro);
        }
    }

    /** Para cada página, associa o pai e repete a mesma tarefa com os filhos. */
    public static List<ElementoPagina> vincularPais(List<PaginaApi> paginas, String paiId) {
        List<ElementoPagina> resultado = new ArrayList<>();
        for (PaginaApi pagina : paginas) {
            List<ElementoPagina> filhos = vincularPais(pagina.children(), pagina.id());
            resultado.add(new ElementoPagina(pagina.id(), pagina.title(), paiId, filhos));
        }
        return List.copyOf(resultado);
    }

    /** Coloca a página na lista, depois acrescenta a lista retornada pelos filhos. */
    public static List<ElementoPagina> listarPaginas(List<ElementoPagina> paginas) {
        List<ElementoPagina> resultado = new ArrayList<>();
        for (ElementoPagina pagina : paginas) {
            resultado.add(pagina);
            resultado.addAll(listarPaginas(pagina.filhos()));
        }
        return List.copyOf(resultado);
    }

    public ElementoPagina raiz() {
        return raiz;
    }

    public List<ElementoPagina> elementos() {
        return elementos;
    }

    public Optional<ElementoPagina> buscarPorId(String id) {
        return Optional.ofNullable(porId.get(id));
    }

    public Optional<ElementoPagina> paiDe(String id) {
        return buscarPorId(id).map(ElementoPagina::paiId).flatMap(this::buscarPorId);
    }
}

