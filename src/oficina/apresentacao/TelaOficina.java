package oficina.apresentacao;

import java.io.PrintStream;
import java.util.Objects;

/** Saída uniforme: títulos, etapas, resultados e avisos com ANSI opcional. */
public final class TelaOficina {
    private static final String RESET = "\u001B[0m";
    private static final String CIANO = "\u001B[1;36m";
    private static final String VERDE = "\u001B[1;32m";
    private static final String AMARELO = "\u001B[1;33m";
    private static final String VERMELHO = "\u001B[1;31m";
    private static final String DISCRETO = "\u001B[2;37m";

    private final PrintStream saida;
    private final boolean cores;

    private TelaOficina(PrintStream saida, boolean cores) {
        this.saida = Objects.requireNonNull(saida, "Saída é obrigatória.");
        this.cores = cores;
    }

    public static TelaOficina paraConsole(PrintStream saida) {
        String override = System.getenv("OFICINA_CORES");
        if ("nunca".equalsIgnoreCase(override)) {
            return new TelaOficina(saida, false);
        }
        boolean forced = "sempre".equalsIgnoreCase(override)
                || "1".equals(System.getenv("CLICOLOR_FORCE"));
        boolean disabled = System.getenv("NO_COLOR") != null
                || "dumb".equalsIgnoreCase(System.getenv("TERM"));
        boolean enabled = forced || (!disabled && System.console() != null);
        return new TelaOficina(saida, enabled);
    }

    public void titulo(int numero, String titulo) {
        saida.println();
        saida.println(estilo("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", CIANO));
        saida.printf("  %s  %s%n", estilo(String.format("%02d", numero), CIANO), titulo);
        saida.println(estilo("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", CIANO));
    }

    public void abertura(String titulo) {
        saida.println(estilo("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", CIANO));
        saida.println(estilo("  " + titulo, CIANO));
        saida.println(estilo("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", CIANO));
    }

    public void secao(String titulo) {
        saida.println();
        saida.println("  " + estilo("▸ " + titulo, CIANO));
    }

    public void objetivo(String descricao) {
        saida.println("  " + estilo("Objetivo:", CIANO) + " " + descricao);
    }

    public void passos(String descricao) {
        saida.println("  " + estilo("Passos:", CIANO) + " " + descricao);
    }

    public void etapa(int numero, String titulo) {
        saida.println();
        saida.println("  " + estilo(numero + ". " + titulo, CIANO));
    }

    public void linha(String texto) {
        saida.println("    " + texto);
    }

    public void explicarEtapa(String entrada, String motivo, String escolha, String resultado) {
        linha("Entrada: " + entrada);
        linha("Por que agora: " + motivo);
        linha("Escolha: " + escolha);
        linha("Saída: " + resultado);
    }

    public void valor(String rotulo, Object valor) {
        saida.printf("    %s  %s%n", estilo("%-27s".formatted(rotulo), CIANO), valor);
    }

    public void texto(String texto) {
        saida.println("  " + texto);
    }

    public void resultado(String texto) {
        saida.println("  " + estilo("✓", VERDE) + " " + texto);
    }

    public void aviso(String texto) {
        saida.println("  " + estilo("!", AMARELO) + " " + texto);
    }

    public void erro(String texto) {
        erro(saida, texto);
    }

    public void erro(PrintStream canal, String texto) {
        canal.println("  " + estilo("×", VERMELHO) + " " + texto);
    }

    public void dica(String texto) {
        saida.println("  " + estilo("↳ " + texto, DISCRETO));
    }

    public void escolha(int numero, String texto) {
        saida.printf("  %s  %s%n", estilo(String.format("%2d", numero), CIANO), texto);
    }

    public void prompt(String texto) {
        saida.print("\n  " + estilo("›", CIANO) + " " + texto);
        saida.flush();
    }

    public void encerramento() {
        saida.println();
        saida.println(estilo("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", DISCRETO));
    }

    public void evento(String componente, String estado, String identificador, String detalhe) {
        String tom = switch (estado) {
            case "APROVADO" -> VERDE;
            case "DUPLICADO" -> AMARELO;
            case "FALHA" -> VERMELHO;
            default -> CIANO;
        };
        saida.printf("    %s %s resultado=%s  %s%n", estilo("[" + componente + "]", CIANO),
                identificador, estilo(estado, tom), detalhe);
    }

    public void acao(String componente, String texto) {
        saida.printf("    %s %s%n", estilo("[" + componente + "]", CIANO), texto);
    }

    private String estilo(String texto, String cor) {
        return cores ? cor + texto + RESET : texto;
    }
}
