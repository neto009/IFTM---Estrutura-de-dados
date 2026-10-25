package oficina;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.Test;
import oficina.casos.ConsumidorPagamentos;
import oficina.casos.ConsumidorPagamentos.Status;
import oficina.demonstracoes.DadosOficina;
import oficina.demonstracoes.ProcessamentoEventos;
import oficina.dominio.EventoPagamento;
import oficina.dominio.Pedido;

import static org.junit.jupiter.api.Assertions.*;

class ConsumoPagamentosTest {
    @Test
    void mensagemRepetidaNaoReaplicaPagamento() {
        ConsumidorPagamentos consumidor = consumidor();
        EventoPagamento evento = DadosOficina.eventosPagamento().get(0);
        assertEquals(Status.APROVADO, consumidor.processar(evento).status());
        Pedido pago = consumidor.buscarPedido(evento.pedidoId()).orElseThrow();
        assertEquals(Status.DUPLICADO, consumidor.processar(evento).status());
        assertSame(pago, consumidor.buscarPedido(evento.pedidoId()).orElseThrow());
        assertEquals(Pedido.Status.PAGO, pago.status());
        assertTrue(consumidor.eventosComFalha().isEmpty());
    }

    @Test
    void falhaDeValorNaoBloqueiaTentativaPosteriorComMesmoId() {
        ConsumidorPagamentos consumidor = consumidor();
        EventoPagamento incorreto = new EventoPagamento(401, "PED-101", new BigDecimal("1.00"));
        assertEquals(Status.FALHA, consumidor.processar(incorreto).status());
        assertEquals(Pedido.Status.AGUARDANDO_PAGAMENTO, consumidor.buscarPedido("PED-101").orElseThrow().status());
        assertEquals(Status.APROVADO, consumidor.processar(DadosOficina.eventosPagamento().get(0)).status());
        assertEquals(List.of(incorreto), consumidor.eventosComFalha());
    }

    @Test
    void pedidoInexistenteVaiParaFilaDeAnaliseSemCriarPedido() {
        ConsumidorPagamentos consumidor = consumidor();
        EventoPagamento evento = new EventoPagamento(404, "PED-999", new BigDecimal("49.90"));
        assertEquals(Status.FALHA, consumidor.processar(evento).status());
        assertTrue(consumidor.buscarPedido("PED-999").isEmpty());
        List<EventoPagamento> falhas = consumidor.eventosComFalha();
        assertEquals(List.of(evento), falhas);
        assertThrows(UnsupportedOperationException.class, falhas::clear);
    }

    @Test
    void outroEventoNaoPodePagarPedidoJaPago() {
        ConsumidorPagamentos consumidor = consumidor();
        consumidor.processar(DadosOficina.eventosPagamento().get(0));
        EventoPagamento outroId = new EventoPagamento(499, "PED-101", new BigDecimal("129.90"));
        assertEquals(Status.FALHA, consumidor.processar(outroId).status());
        assertEquals(Pedido.Status.PAGO, consumidor.buscarPedido("PED-101").orElseThrow().status());
    }

    @Test
    void simulacaoContabilizaTodasAsEntregasMesmoComDuplicidadeEFalha() {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        ProcessamentoEventos.Contadores contadores;
        try (PrintStream saida = new PrintStream(buffer, true, StandardCharsets.UTF_8)) {
            contadores = ProcessamentoEventos.executar(saida);
        }
        assertEquals(new ProcessamentoEventos.Contadores(6, 4, 1, 1, 3, 0, 1), contadores);
        assertEquals(contadores.produzidos(), contadores.processados() + contadores.duplicados()
                + contadores.falhas() + contadores.pendentes());
        assertTrue(buffer.toString(StandardCharsets.UTF_8).contains("id=404 resultado=FALHA pedido inexistente: PED-999"));
    }

    @Test
    void cargaInicialRejeitaPedidosComIdsRepetidos() {
        Pedido pedido = DadosOficina.pedidosAguardandoPagamento().get(0);
        assertThrows(IllegalArgumentException.class, () -> new ConsumidorPagamentos(List.of(pedido, pedido)));
    }

    private static ConsumidorPagamentos consumidor() {
        return new ConsumidorPagamentos(DadosOficina.pedidosAguardandoPagamento());
    }
}
