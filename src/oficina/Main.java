package oficina;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Scanner;
import oficina.demonstracoes.ExemplosColecoes;
import oficina.demonstracoes.ExemplosPython;
import oficina.demonstracoes.ProcessamentoEventos;
import oficina.apresentacao.TelaOficina;

/** Menu de aplicações práticas de estruturas prontas em Java e bibliotecas Python. */
public final class Main {
    private static final String[] TITULOS = {
        "Backlog de bugs: List, Stream e prioridades", "Pedidos pagos: Queue e FIFO",
        "Desfazer configurações: Deque e snapshots", "Usuários por ID: HashMap e Optional",
        "Investigação de incidente: TreeMap e logs", "Impacto entre serviços: grafo direcionado",
        "Cosseno em Python: scikit-learn", "Pagamentos por eventos: fila, idempotência e falhas",
        "Contexto RAG em Python: busca lexical TF-IDF", "HDBSCAN em Python: biblioteca hdbscan"
    };
    private static final TelaOficina TELA = TelaOficina.paraConsole(System.out);

    private Main() { }

    public static void main(String[] argumentos) {
        try {
            if (argumentos.length == 0) {
                abrirMenu();
            } else if (argumentos[0].equals("--ajuda") || argumentos[0].equals("-h")) {
                imprimirAjuda();
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
                    case "rag" -> 9;
                    default -> Integer.parseInt(escolha);
                };
            } catch (NumberFormatException erro) {
                throw new IllegalArgumentException("Informe 1 a 10, todos, cosseno, rag ou hdbscan.");
            }
            if (numero < 1 || numero > 10) {
                throw new IllegalArgumentException("Informe um número de 1 a 10.");
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
        if (numero <= 6 || numero == 8) {
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
            case 9 -> ExemplosPython.executar("rag", new String[0]);
            case 10 -> ExemplosPython.executar("hdbscan", opcoes);
            default -> throw new IllegalArgumentException("Demonstração inexistente.");
        }
        TELA.encerramento();
    }

    private static void imprimirAjuda() {
        TELA.abertura("COMO EXECUTAR");
        TELA.secao("Demonstrações");
        TELA.linha("sh executar.sh                     Abre o menu");
        TELA.linha("sh executar.sh 1                   Executa uma demonstração");
        TELA.linha("sh executar.sh todos              Executa todas");
        TELA.linha("sh executar.sh cosseno | rag      Executa Python diretamente");
        TELA.secao("Opções do HDBSCAN");
        TELA.linha("--debug       Oito etapas e comparação final (padrão)");
        TELA.linha("--resumo      Entrada, rótulos e comparação com a API completa");
        TELA.linha("--etapa N     Exibe etapa 1 a 8 ou comparação 9");
        TELA.linha("--min-samples N      Vizinhos externos, de 1 a 8 (padrão: 2)");
        TELA.linha("--min-cluster-size N De 2 a 9 (padrão: 3)");
    }
}
