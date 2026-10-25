package oficina;

import java.math.BigDecimal;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import oficina.dominio.Chamado;
import oficina.dominio.ConfiguracaoAplicacao;
import oficina.dominio.EventoPagamento;
import oficina.dominio.Pedido;
import oficina.dominio.Usuario;

import static org.junit.jupiter.api.Assertions.*;

class DominioTest {
    @Test
    void rejeitaDadosObrigatoriosInvalidosNaCriacao() {
        assertAll(
                () -> assertThrows(IllegalArgumentException.class,
                        () -> new Chamado(0, "Bug", "Equipe", Chamado.Prioridade.ALTA, Chamado.Status.ABERTO)),
                () -> assertThrows(IllegalArgumentException.class,
                        () -> new Chamado(1, "  ", "Equipe", Chamado.Prioridade.ALTA, Chamado.Status.ABERTO)),
                () -> assertThrows(NullPointerException.class,
                        () -> new Chamado(1, "Bug", "Equipe", null, Chamado.Status.ABERTO)),
                () -> assertThrows(IllegalArgumentException.class,
                        () -> new ConfiguracaoAplicacao(Duration.ZERO, false)),
                () -> assertThrows(IllegalArgumentException.class,
                        () -> new ConfiguracaoAplicacao(Duration.ofSeconds(-1), false)),
                () -> assertThrows(IllegalArgumentException.class,
                        () -> new Usuario(1, "Ana", " ", true)),
                () -> assertThrows(IllegalArgumentException.class,
                        () -> new Pedido("PED-1", "Ana", BigDecimal.ZERO, Pedido.Status.AGUARDANDO_PAGAMENTO)),
                () -> assertThrows(IllegalArgumentException.class,
                        () -> new EventoPagamento(1, "PED-1", BigDecimal.ZERO)));
    }

    @Test
    void removeEspacosNasBordasDosTextosObrigatorios() {
        Usuario usuario = new Usuario(1, " Ana ", " ana@aurora.invalid ", true);
        assertEquals("Ana", usuario.nome());
        assertEquals("ana@aurora.invalid", usuario.email());
    }

    @Test
    void transicoesDePedidoPreservamObjetosAnteriores() {
        Pedido aguardando = pedidoAguardando();
        Pedido pago = aguardando.confirmarPagamento(new BigDecimal("129.90"));
        Pedido separando = pago.iniciarSeparacao();
        assertAll(
                () -> assertEquals(Pedido.Status.AGUARDANDO_PAGAMENTO, aguardando.status()),
                () -> assertEquals(Pedido.Status.PAGO, pago.status()),
                () -> assertEquals(Pedido.Status.EM_SEPARACAO, separando.status()),
                () -> assertThrows(IllegalStateException.class, aguardando::iniciarSeparacao),
                () -> assertThrows(IllegalStateException.class, () -> pago.confirmarPagamento(pago.total())),
                () -> assertThrows(IllegalStateException.class, separando::iniciarSeparacao));
    }

    @Test
    void comparaPagamentoPorValorSemDependerDaEscalaDecimal() {
        Pedido aguardando = pedidoAguardando();
        assertEquals(Pedido.Status.PAGO, aguardando.confirmarPagamento(new BigDecimal("129.900")).status());
        assertThrows(IllegalArgumentException.class,
                () -> aguardando.confirmarPagamento(new BigDecimal("129.91")));
        assertEquals(Pedido.Status.AGUARDANDO_PAGAMENTO, aguardando.status());
    }

    private static Pedido pedidoAguardando() {
        return new Pedido("PED-1", "Ana", new BigDecimal("129.90"), Pedido.Status.AGUARDANDO_PAGAMENTO);
    }
}
