package oficina;

import com.google.gson.GsonBuilder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Map;
import java.util.Scanner;
import oficina.demonstracoes.ExemplosColecoes;
import oficina.demonstracoes.ExemplosPython;
import oficina.demonstracoes.ExemplosListas;
import oficina.demonstracoes.ExemploPagina;
import oficina.demonstracoes.ProcessamentoEventos;
import oficina.apresentacao.TelaOficina;

/** Menu de aplicações práticas de estruturas prontas em Java e bibliotecas Python. */
public final class Main {
    private static final String[] TITULOS = {
        "Backlog de bugs: List, Stream e prioridades", "Pedidos pagos: Queue e FIFO",
        "Desfazer configurações: Deque e snapshots", "Usuários por ID: HashMap e Optional",
        "Investigação de incidente: TreeMap e logs", "Impacto entre serviços: grafo direcionado",
        "Cosseno em Python: scikit-learn", "Pagamentos por eventos: fila, idempotência e falhas",
        "Arquivo de destinatários: List e Stream", "HDBSCAN em Python: estruturas do algoritmo",
        "Consulta de banco simulada: List e paginação", "API de páginas: árvore, recursão, List e Map"
    };
    private static final TelaOficina TELA = TelaOficina.paraConsole(System.out);

    private Main() { }

    public static void main(String[] argumentos) {
        try {
            if (argumentos.length == 0) {
                abrirMenu();
            } else if (argumentos[0].equals("--ajuda") || argumentos[0].equals("-h")) {
                imprimirAjuda();
            } else if (argumentos[0].equals("--dados")) {
                imprimirDados(argumentos);
            } else {
                executarComando(argumentos);
            }
        } catch (IllegalArgumentException | IllegalStateException erro) {
            TELA.erro(System.err, erro.getMessage());
            System.err.println("Use sh executar.sh --ajuda para ver as opções.");
            System.exit(2);
        }
    }

    private static void abrirMenu() {
        Scanner entrada = new Scanner(System.in, StandardCharsets.UTF_8);
        while (true) {
            TELA.abertura("OFICINA  |  ESTRUTURAS DE DADOS NA PRÁTICA");
            TELA.dica("✓ resultado  ! atenção  ↳ estrutura ou observação");
            for (int i = 0; i < TITULOS.length; i++) {
                TELA.escolha(i + 1, TITULOS[i]);
            }
            TELA.texto("todos  Executar todas as demonstrações");
            TELA.texto(" 0  Sair");
            TELA.prompt("Escolha uma demonstração: ");
            if (!entrada.hasNextLine()) {
                return;
            }
            String comando = entrada.nextLine().trim();
            if (comando.equals("0")) {
                TELA.resultado("Oficina encerrada.");
                return;
            }
            try {
                executarComando(new String[] {comando});
            } catch (IllegalArgumentException | IllegalStateException erro) {
                TELA.erro("Não foi possível executar: " + erro.getMessage());
            }
            TELA.encerramento();
        }
    }

    private static void executarComando(String[] argumentos) {
        String escolha = argumentos[0];
        int numero = 0;
        boolean todos = escolha.equals("todos");
        if (!todos) {
            try {
                numero = switch (escolha) {
                    case "hdbscan" -> 10;
                    case "cosseno" -> 7;
                    case "arquivo" -> 9;
                    case "banco" -> 11;
                    case "pagina" -> 12;
                    default -> Integer.parseInt(escolha);
                };
            } catch (NumberFormatException erro) {
                throw new IllegalArgumentException("Informe 1 a 12, todos, arquivo, banco, pagina, cosseno ou hdbscan.");
            }
            if (numero < 1 || numero > TITULOS.length) {
                throw new IllegalArgumentException("Informe um número de 1 a " + TITULOS.length + '.');
            }
        }
        if (argumentos.length > 1 && !todos && numero != 10) {
            throw new IllegalArgumentException("As opções adicionais são exclusivas de hdbscan/10 ou todos.");
        }
        String[] opcoes = Arrays.copyOfRange(argumentos, 1, argumentos.length);
        if (todos) {
            for (int i = 1; i <= TITULOS.length; i++) {
                executar(i, opcoes);
            }
        } else {
            executar(numero, opcoes);
        }
    }

    private static void executar(int numero, String[] opcoes) {
        if (numero != 7 && numero != 10) {
            TELA.titulo(numero, TITULOS[numero - 1]);
        }
        switch (numero) {
            case 1 -> ExemplosColecoes.listas(TELA);
            case 2 -> ExemplosColecoes.fila(TELA);
            case 3 -> ExemplosColecoes.pilha(TELA);
            case 4 -> ExemplosColecoes.mapa(TELA);
            case 5 -> ExemplosColecoes.arvore(TELA);
            case 6 -> ExemplosColecoes.grafo(TELA);
            case 7 -> ExemplosPython.executar("cosseno", new String[0]);
            case 8 -> ProcessamentoEventos.executar(TELA);
            case 9 -> ExemplosListas.arquivo(TELA);
            case 10 -> ExemplosPython.executar("hdbscan", opcoes);
            case 11 -> ExemplosListas.banco(TELA);
            case 12 -> ExemploPagina.executar(TELA);
            default -> throw new IllegalArgumentException("Demonstração inexistente.");
        }
        TELA.encerramento();
    }

    private static void imprimirAjuda() {
        TELA.abertura("COMO EXECUTAR");
        TELA.secao("Demonstrações");
        TELA.linha("sh executar.sh                     Abre a oficina no navegador");
        TELA.linha("sh executar.sh terminal            Abre o menu do terminal");
        TELA.linha("sh executar.sh 1                   Executa uma demonstração");
        TELA.linha("sh executar.sh todos              Executa todas");
        TELA.linha("sh executar.sh arquivo | banco    Listas de arquivo e consulta simulada");
        TELA.linha("sh executar.sh pagina             Árvore de página e navegação ao pai");
        TELA.linha("sh executar.sh cosseno | hdbscan  Executa exemplos Python");
        TELA.linha("sh executar.sh web                Abre a apresentação local no navegador");
        TELA.secao("Opções do HDBSCAN");
        TELA.linha("--debug       Oito etapas e comparação final (padrão)");
        TELA.linha("--resumo      Entrada, rótulos e comparação com a API completa");
        TELA.linha("--etapa N     Exibe etapa 1 a 8 ou comparação 9");
        TELA.linha("--min-samples N      Vizinhos externos, de 1 a 8 (padrão: 2)");
        TELA.linha("--min-cluster-size N De 2 a 9 (padrão: 3)");
    }

    /** Dados calculados pelos mesmos casos de uso, serializados por uma biblioteca pronta. */
    private static void imprimirDados(String[] argumentos) {
        if (argumentos.length != 2) {
            throw new IllegalArgumentException("--dados requer um número de exemplo.");
        }
        Object dados = switch (Integer.parseInt(argumentos[1])) {
            case 1 -> ExemplosColecoes.carregarBacklog();
            case 2 -> ExemplosColecoes.carregarFila();
            case 3 -> ExemplosColecoes.carregarPilha();
            case 4 -> ExemplosColecoes.carregarMapa();
            case 6 -> ExemplosColecoes.carregarGrafo();
            case 9 -> ExemplosListas.carregarArquivo();
            case 11 -> ExemplosListas.consultarBanco();
            case 12 -> {
                var pagina = ExemploPagina.carregar();
                yield Map.of("raiz", pagina.raiz(), "elementos", pagina.elementos());
            }
            default -> throw new IllegalArgumentException("Dados visuais indisponíveis para este exemplo.");
        };
        System.out.println(new GsonBuilder().serializeNulls().create().toJson(dados));
    }
}
