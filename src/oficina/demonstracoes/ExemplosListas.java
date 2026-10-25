package oficina.demonstracoes;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import oficina.apresentacao.TelaOficina;
import oficina.casos.ConsultaUsuarios;
import oficina.casos.ImportacaoEmails;
import oficina.dominio.Usuario;

/** Listas vindas de arquivo e de uma consulta: a mesma execução alimenta console e visualização. */
public final class ExemplosListas {
    private ExemplosListas() { }

    public record DadosArquivo(List<String> linhas, List<String> destinatarios, List<String> lote) { }

    public record Contato(String nome, String email) { }

    public record DadosConsulta(List<Usuario> registros, List<List<Usuario>> paginas,
                                List<Contato> contatos, int tamanhoPagina) { }

    public static DadosArquivo carregarArquivo() {
        try {
            Path raiz = Path.of(System.getProperty("oficina.raiz", "."));
            List<String> linhas = Files.readAllLines(
                    raiz.resolve("dados/destinatarios.csv"), StandardCharsets.UTF_8);
            List<String> destinatarios = ImportacaoEmails.preparar(linhas);
            return new DadosArquivo(List.copyOf(linhas), destinatarios,
                    destinatarios.stream().limit(2).toList());
        } catch (IOException erro) {
            throw new IllegalStateException("Não foi possível ler os destinatários.", erro);
        }
    }

    public static DadosConsulta consultarBanco() {
        List<Usuario> registros = List.of(
                new Usuario(1, "Ana", "ana@aurora.invalid", true),
                new Usuario(2, "Bruno", "bruno@aurora.invalid", false),
                new Usuario(3, "Clara", "clara@aurora.invalid", true),
                new Usuario(4, "Diego", "diego@aurora.invalid", true),
                new Usuario(5, "Elisa", "elisa@aurora.invalid", false),
                new Usuario(6, "Fábio", "fabio@aurora.invalid", true));
        ConsultaUsuarios consulta = new ConsultaUsuarios(registros);
        List<List<Usuario>> paginas = List.of(
                consulta.listarAtivos(0, 2), consulta.listarAtivos(1, 2), consulta.listarAtivos(2, 2));
        List<Contato> contatos = paginas.get(0).stream()
                .map(usuario -> new Contato(usuario.nome(), usuario.email())).toList();
        return new DadosConsulta(registros, paginas, contatos, 2);
    }

    public static void arquivo(TelaOficina tela) {
        DadosArquivo dados = carregarArquivo();
        tela.objetivo("converter linhas recebidas em uma lista organizada de destinatários, pronta para formar lotes.");
        tela.passos("List<String> bruta → limpeza e deduplicação → consulta com Optional → lote de dois itens.");

        tela.etapa(1, "Observar a lista exatamente como chegou do arquivo");
        tela.explicarEtapa("Um arquivo de uma coluna: cabeçalho, e-mails, espaços, linha vazia e repetições.",
                "Sem observar a entrada, podemos confundir quantidade de linhas com quantidade de destinatários.",
                "Files.readAllLines entrega List<String>. O índice mostra a posição; cada string mantém o texto da linha.",
                "Oito linhas nesta amostra. Ler não remove cabeçalho, espaços ou duplicatas.");
        for (int i = 0; i < dados.linhas().size(); i++) {
            tela.linha("linha %d  |  [%s]".formatted(i + 1, dados.linhas().get(i)));
        }
        tela.dica("Os colchetes tornam os espaços visíveis. [] representa uma linha vazia.");

        tela.etapa(2, "Preparar uma nova lista, sem modificar a entrada");
        tela.explicarEtapa("List<String> bruta com valores que ainda não podem virar um lote.",
                "A rotina precisa de um destinatário por posição, sem cabeçalho, vazios ou entregas repetidas.",
                "skip(1) remove o cabeçalho; strip e filter limpam; lowercase normaliza; distinct deduplica; sorted ordena.",
                "toList materializa quatro destinatários. A lista original continua disponível para conferência.");
        dados.destinatarios().forEach(tela::resultado);
        tela.valor("Linhas de entrada", dados.linhas().size());
        tela.valor("Destinatários preparados", dados.destinatarios().size());
        tela.dica("ANA e ana só se tornam iguais depois da normalização: a ordem das operações importa.");
        tela.dica("Stream é o processamento; List é a coleção materializada por toList.");

        tela.etapa(3, "Consultar um contato e separar o primeiro lote");
        tela.explicarEtapa("Lista organizada de quatro destinatários.",
                "Uma consulta procura um item; um lote limita quantos itens seguem para a próxima operação.",
                "findFirst retorna Optional. limit(2).toList() devolve uma lista com até dois itens.",
                "Ana é encontrada, a consulta inexistente fica vazia e o lote contém Ana e Bruno.");
        dados.destinatarios().stream().filter(email -> email.startsWith("ana@")).findFirst()
                .ifPresent(email -> tela.resultado("Contato encontrado: " + email));
        dados.destinatarios().stream().filter(email -> email.startsWith("inexistente@")).findFirst()
                .ifPresentOrElse(tela::resultado, () -> tela.aviso("Contato ausente: Optional.empty."));
        tela.valor("Primeiro lote", dados.lote());
        tela.dica("O cenário prepara dados; ele não envia mensagens nem valida endereços.");
        tela.dica("O arquivo tem uma coluna simples. CSV geral exige um parser pronto.");
        tela.dica("Para arquivos grandes, discuta Files.lines com try-with-resources e consumo em lotes.");
    }

    public static void banco(TelaOficina tela) {
        DadosConsulta dados = consultarBanco();
        tela.objetivo("acompanhar registros que viram uma List<Usuario> paginada e depois uma resposta para a interface.");
        tela.passos("seis registros → filtrar ativos e ordenar por ID → páginas de dois → projetar nome e e-mail.");

        tela.etapa(1, "Identificar os registros e o contrato da consulta");
        tela.explicarEtapa("Seis objetos Usuario, com ID, nome, e-mail e indicação de conta ativa.",
                "Nem todo registro da fonte deve aparecer na resposta: Bruno e Elisa estão inativos.",
                "O repositório simulado recebe um snapshot com List.copyOf e devolve List<Usuario>.",
                "Uma fonte em memória e um contrato de consulta. Nenhum SQL ou conexão real é executado.");
        tela.linha("SQL equivalente: SELECT id, nome, email, ativo FROM usuarios WHERE ativo = true ORDER BY id LIMIT 2 OFFSET 0");
        dados.registros().forEach(usuario -> tela.linha("%d  |  %-6s  |  %s".formatted(
                usuario.id(), usuario.nome(), usuario.ativo() ? "ATIVO" : "INATIVO")));
        tela.valor("Registros na fonte", dados.registros().size());

        tela.etapa(2, "Filtrar e ordenar antes de dividir em páginas");
        tela.explicarEtapa("Seis registros; página começando em zero; tamanho de página igual a dois.",
                "Filtrar antes evita páginas incompletas; ordenar por um ID único torna a divisão previsível.",
                "filter(ativo) → sorted(id) → skip(pagina * tamanho) → limit(tamanho) → toList.",
                "Página 0: Ana e Clara. Página 1: Diego e Fábio. Página 2: lista vazia, sem erro.");
        for (int i = 0; i < dados.paginas().size(); i++) {
            tela.valor("Página %d | offset %d".formatted(i, i * 2),
                    dados.paginas().get(i).stream().map(Usuario::nome).toList());
        }
        tela.dica("Limitar aos dois primeiros registros antes de filtrar deixaria só Ana, apesar dos outros ativos.");

        tela.etapa(3, "Projetar os campos que a interface precisa");
        tela.explicarEtapa("A primeira página: List<Usuario> com Ana e Clara.",
                "Uma resposta de contatos precisa apenas de nome e e-mail; não precisa expor todos os campos.",
                "map cria Contato(nome, email), um DTO de dois campos; toList materializa a lista de resposta.",
                "Dois contatos apresentados. Os seis registros originais permanecem na fonte.");
        dados.contatos().stream()
                .map(contato -> contato.nome() + " <" + contato.email() + ">")
                .forEach(tela::resultado);
        tela.valor("Fonte preservada", dados.registros().size() + " usuários");
        tela.dica("Em um banco real, filtro, ordenação e paginação devem ser executados pela consulta.");
        tela.dica("Esta simulação esclarece o contrato List<Usuario>; não mede desempenho de banco.");
        tela.dica("Tabelas em mudança exigem discutir consistência, índices e paginação por cursor.");
    }
}

