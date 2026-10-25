package oficina.demonstracoes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import oficina.dominio.Chamado;
import oficina.dominio.Chamado.Prioridade;
import oficina.dominio.Chamado.Status;
import oficina.dominio.EventoPagamento;
import oficina.dominio.Pedido;
import oficina.dominio.RegistroLog;
import oficina.dominio.RegistroLog.Nivel;
import oficina.dominio.Servico;
import oficina.dominio.Usuario;

/** Dados fictícios e determinísticos; cada chamada cria uma coleção independente. */
public final class DadosOficina {
    public static final Servico AUTENTICACAO = new Servico("autenticacao", "Identidade");
    public static final Servico PEDIDOS = new Servico("pedidos", "Comércio");
    public static final Servico PAGAMENTOS = new Servico("pagamentos", "Financeiro");
    public static final Servico NOTIFICACOES = new Servico("notificacoes", "Relacionamento");

    private DadosOficina() { }

    public static List<Chamado> chamados() {
        return List.of(
                new Chamado(101, "Checkout retorna erro 500", "Pagamentos", Prioridade.CRITICA, Status.ABERTO),
                new Chamado(102, "Ajustar texto da página de ajuda", "Portal", Prioridade.BAIXA, Status.ABERTO),
                new Chamado(103, "Corrigir conciliação duplicada", "Pagamentos", Prioridade.ALTA, Status.RESOLVIDO),
                new Chamado(104, "Login bloqueado após renovação", "Identidade", Prioridade.CRITICA, Status.ABERTO),
                new Chamado(105, "Atualizar versão do driver JDBC", "Plataforma", Prioridade.MEDIA, Status.EM_ATENDIMENTO),
                new Chamado(106, "Lentidão no cálculo de frete", "Pedidos", Prioridade.ALTA, Status.ABERTO));
    }

    public static List<Pedido> pedidosAguardandoPagamento() {
        return List.of(
                new Pedido("PED-101", "Ana", new BigDecimal("129.90"), Pedido.Status.AGUARDANDO_PAGAMENTO),
                new Pedido("PED-102", "Bruno", new BigDecimal("79.90"), Pedido.Status.AGUARDANDO_PAGAMENTO),
                new Pedido("PED-103", "Clara", new BigDecimal("89.90"), Pedido.Status.AGUARDANDO_PAGAMENTO),
                new Pedido("PED-104", "Diego", new BigDecimal("59.90"), Pedido.Status.AGUARDANDO_PAGAMENTO));
    }

    public static List<EventoPagamento> eventosPagamento() {
        EventoPagamento primeiro = new EventoPagamento(401, "PED-101", new BigDecimal("129.90"));
        return List.of(primeiro,
                new EventoPagamento(402, "PED-102", new BigDecimal("79.90")),
                primeiro, // A mesma mensagem é entregue novamente: o consumidor deve ignorá-la.
                new EventoPagamento(404, "PED-999", new BigDecimal("49.90")),
                new EventoPagamento(405, "PED-103", new BigDecimal("89.90")),
                new EventoPagamento(406, "PED-104", new BigDecimal("59.90")));
    }

    public static List<Usuario> usuarios() {
        return List.of(new Usuario(1, "Ana", "ana@aurora.invalid", true),
                new Usuario(2, "Bruno", "bruno@aurora.invalid", false),
                new Usuario(3, "Clara", "clara@aurora.invalid", true));
    }

    public static List<RegistroLog> logs() {
        return List.of(
                new RegistroLog(Instant.parse("2026-10-25T12:00:30Z"), Nivel.ERRO, PAGAMENTOS, "Timeout no gateway"),
                new RegistroLog(Instant.parse("2026-10-25T12:00:00Z"), Nivel.INFO, PEDIDOS, "Pedido recebido"),
                new RegistroLog(Instant.parse("2026-10-25T12:00:30Z"), Nivel.ERRO, AUTENTICACAO, "Token expirado"),
                new RegistroLog(Instant.parse("2026-10-25T12:01:00Z"), Nivel.INFO, PEDIDOS, "Pedido confirmado"),
                new RegistroLog(Instant.parse("2026-10-25T12:00:45Z"), Nivel.AVISO, PAGAMENTOS, "Gateway com resposta lenta"));
    }
}
