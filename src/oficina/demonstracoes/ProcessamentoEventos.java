package oficina.demonstracoes;

import java.util.Objects;
import java.util.Queue;
import java.util.concurrent.ArrayBlockingQueue;
import oficina.apresentacao.TelaOficina;
import oficina.casos.ConsumidorPagamentos;
import oficina.dominio.EventoPagamento;

/** Orquestração sequencial: fila limitada, pagamento idempotente e mensagens com falha. */
public final class ProcessamentoEventos {
    public record Contadores(int produzidos, int processados, int duplicados, int falhas,
                             int adiamentos, int pendentes, int filaFalhas) { }

    private static final class Metricas {
        int processados;
        int duplicados;
        int falhas;
    }

    private ProcessamentoEventos() { }

    public static Contadores executar(TelaOficina tela) {
        Objects.requireNonNull(tela, "Tela é obrigatória.");
        tela.objetivo("processar pagamentos e mostrar como a fila reage a duplicatas, falta de espaço e pedidos inexistentes.");
        tela.passos("enfileirar até 3 eventos → liberar espaço quando cheia → validar cada pagamento → conferir os contadores.");
        tela.etapa(1, "Receber eventos em uma fila limitada");
        tela.linha("ArrayBlockingQueue guarda no máximo 3; esta simulação alterna produtor e consumidor em uma thread.");
        Queue<EventoPagamento> fila = new ArrayBlockingQueue<>(3);
        ConsumidorPagamentos consumidor = new ConsumidorPagamentos(DadosOficina.pedidosAguardandoPagamento());
        Metricas metricas = new Metricas();
        int produzidos = 0;
        int adiamentos = 0;
        // Comandos com efeitos colaterais usam um laço explícito, sem mutação dentro de stream.
        for (EventoPagamento evento : DadosOficina.eventosPagamento()) {
            if (!fila.offer(evento)) {
                adiamentos++;
                tela.aviso("Fila cheia; adiar id=" + evento.id() + " e liberar uma posição.");
                consumirProximo(fila, consumidor, metricas, tela);
                fila.add(evento);
            }
            produzidos++;
            tela.acao("produtor", "id=%d  pedido=%s  pendentes=%d".formatted(
                    evento.id(), evento.pedidoId(), fila.size()));
        }
        tela.etapa(2, "Processar os eventos que restaram na fila");
        tela.linha("APROVADO altera o pedido; DUPLICADO não repete o pagamento; FALHA vai para análise.");
        while (!fila.isEmpty()) {
            consumirProximo(fila, consumidor, metricas, tela);
        }
        tela.etapa(3, "Resultado: contadores e eventos pendentes de análise");
        Contadores contadores = new Contadores(produzidos, metricas.processados, metricas.duplicados,
                metricas.falhas, adiamentos, fila.size(), consumidor.eventosComFalha().size());
        tela.resultado("produzidos=%d, processados=%d, duplicados=%d, falhas=%d, adiamentos=%d, pendentes=%d, filaFalhas=%d"
                .formatted(contadores.produzidos(), contadores.processados(), contadores.duplicados(),
                        contadores.falhas(), contadores.adiamentos(), contadores.pendentes(), contadores.filaFalhas()));
        tela.valor("Eventos recebidos", contadores.produzidos());
        tela.valor("Pagamentos aplicados", contadores.processados());
        tela.valor("Mensagens duplicadas", contadores.duplicados());
        tela.valor("Falhas / fila de análise", contadores.falhas() + " / " + contadores.filaFalhas());
        tela.valor("Adiados / pendentes", contadores.adiamentos() + " / " + contadores.pendentes());
        tela.linha("Fila de análise: " + consumidor.eventosComFalha().stream()
                .map(evento -> "id=" + evento.id() + " pedido=" + evento.pedidoId()).toList());
        tela.dica("HashMap indexa pedidos; HashSet reconhece IDs aplicados; ArrayDeque retém falhas.");
        tela.dica("Recebidos = aplicados + duplicados + falhas + pendentes.");
        tela.dica("A fila de análise conserva o evento com falha para inspeção; esta demo não faz retentativa automática.");
        tela.aviso("Os estados são locais ao processo e desaparecem ao reiniciar.");
        return contadores;
    }

    private static void consumirProximo(Queue<EventoPagamento> fila, ConsumidorPagamentos consumidor,
                                       Metricas metricas, TelaOficina tela) {
        EventoPagamento evento = fila.remove();
        ConsumidorPagamentos.Resultado resultado = consumidor.processar(evento);
        switch (resultado.status()) {
            case APROVADO -> metricas.processados++;
            case DUPLICADO -> metricas.duplicados++;
            case FALHA -> metricas.falhas++;
        }
        tela.evento("consumidor", resultado.status().name(), "id=" + evento.id(), resultado.detalhe());
    }
}
