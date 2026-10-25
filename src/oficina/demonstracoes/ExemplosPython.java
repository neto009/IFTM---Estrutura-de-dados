package oficina.demonstracoes;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** Apenas inicia o exemplo Python; cálculos e agrupamento ficam nas bibliotecas Python. */
public final class ExemplosPython {
    private ExemplosPython() { }

    public static void executar(String exemplo, String[] argumentos) {
        Path raiz = Path.of(System.getProperty("oficina.raiz", ".")).toAbsolutePath().normalize();
        boolean windows = System.getProperty("os.name").startsWith("Windows");
        Path pythonLocal = raiz.resolve(windows ? ".venv/Scripts/python.exe" : ".venv/bin/python");
        String python = System.getenv("OFICINA_PYTHON");
        if (python == null || python.isBlank()) {
            if (!Files.isRegularFile(pythonLocal)) {
                throw new IllegalStateException("Python local ausente. Execute: python3 preparar.py");
            }
            python = pythonLocal.toString();
        }
        List<String> comando = new ArrayList<>(List.of(python, "-u",
                raiz.resolve("python/oficina.py").toString(), exemplo));
        comando.addAll(Arrays.asList(argumentos));
        ProcessBuilder processo = new ProcessBuilder(comando).directory(raiz.toFile()).inheritIO();
        processo.environment().put("PYTHONIOENCODING", "utf-8");
        try {
            int codigo = processo.start().waitFor();
            if (codigo != 0) {
                throw new IllegalStateException("O exemplo Python terminou com código " + codigo + '.');
            }
        } catch (IOException erro) {
            throw new IllegalStateException("Não foi possível iniciar o Python: " + erro.getMessage(), erro);
        } catch (InterruptedException erro) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Execução Python interrompida.", erro);
        }
    }
}
