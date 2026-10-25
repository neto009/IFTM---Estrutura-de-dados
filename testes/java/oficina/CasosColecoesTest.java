package oficina;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import oficina.casos.ConsultasChamados;
import oficina.casos.DependenciasServicos;
import oficina.casos.EditorConfiguracao;
import oficina.casos.FilaSeparacao;
import oficina.casos.LinhaDoTempoLogs;
import oficina.casos.RepositorioUsuarios;
import oficina.demonstracoes.DadosOficina;
import oficina.dominio.Chamado;
import oficina.dominio.ConfiguracaoAplicacao;
import oficina.dominio.Pedido;
import oficina.dominio.RegistroLog;
import oficina.dominio.Servico;
import oficina.dominio.Usuario;

import static org.junit.jupiter.api.Assertions.*;

class CasosColecoesTest {
    @Test
    void triagemFiltraPriorizaEDesempataSemAlterarBacklog() {
        List<Chamado> backlog = new ArrayList<>(DadosOficina.chamados());
        List<Chamado> copia = List.copyOf(backlog);
        List<Chamado> triagem = ConsultasChamados.priorizarAbertos(backlog);

        assertEquals(List.of(101L, 104L, 106L, 102L), triagem.stream().map(Chamado::id).toList());
        assertEquals(copia, backlog);
        assertEquals(101L, ConsultasChamados.proximoParaAtendimento(backlog).orElseThrow().id());
        assertEquals(Map.of(Chamado.Prioridade.CRITICA, 2L, Chamado.Prioridade.ALTA, 1L,
                Chamado.Prioridade.BAIXA, 1L), ConsultasChamados.contarAbertosPorPrioridade(backlog));
        assertThrows(UnsupportedOperationException.class, triagem::clear);
    }

    @Test
    void proximoChamadoRespeitaIdNoEmpateERepresentaAusencia() {
        List<Chamado> backlog = List.of(
                new Chamado(20, "Segundo", "Equipe", Chamado.Prioridade.ALTA, Chamado.Status.ABERTO),
                new Chamado(10, "Primeiro", "Equipe", Chamado.Prioridade.ALTA, Chamado.Status.ABERTO));
        assertEquals(10L, ConsultasChamados.proximoParaAtendimento(backlog).orElseThrow().id());
        assertTrue(ConsultasChamados.proximoParaAtendimento(List.of()).isEmpty());
        assertTrue(ConsultasChamados.contarAbertosPorPrioridade(List.of()).isEmpty());
    }

    @Test
    void filaSoAgendaPagosERespeitaOrdemDeAprovacao() {
        FilaSeparacao fila = new FilaSeparacao();
        Pedido aguardando = DadosOficina.pedidosAguardandoPagamento().get(0);
        assertThrows(IllegalStateException.class, () -> fila.agendar(aguardando));
        assertEquals(0, fila.quantidadePendente());
        List<Pedido> pagos = DadosOficina.pedidosAguardandoPagamento().stream()
                .map(pedido -> pedido.confirmarPagamento(pedido.total())).toList();
        pagos.forEach(fila::agendar);
        assertEquals(pagos.get(0), fila.consultarProximo().orElseThrow());
        assertEquals(4, fila.quantidadePendente());
        for (Pedido pago : pagos) {
            Pedido iniciado = fila.iniciarProximo().orElseThrow();
            assertEquals(pago.id(), iniciado.id());
            assertEquals(Pedido.Status.EM_SEPARACAO, iniciado.status());
            assertEquals(Pedido.Status.PAGO, pago.status());
        }
        assertTrue(fila.iniciarProximo().isEmpty());
        assertTrue(fila.consultarProximo().isEmpty());
    }

    @Test
    void filaNaoDuplicaTrabalhoMesmoDepoisDeConsumirPedido() {
        FilaSeparacao fila = new FilaSeparacao();
        Pedido aguardando = DadosOficina.pedidosAguardandoPagamento().get(0);
        Pedido pago = aguardando.confirmarPagamento(aguardando.total());
        assertTrue(fila.agendar(pago));
        assertFalse(fila.agendar(pago));
        assertEquals(1, fila.quantidadePendente());
        fila.iniciarProximo();
        assertFalse(fila.agendar(pago));
        assertTrue(fila.iniciarProximo().isEmpty());
    }

    @Test
    void desfazerRestauraEstadoLifoSemGuardarComandosSemMudanca() {
        ConfiguracaoAplicacao inicial = new ConfiguracaoAplicacao(Duration.ofSeconds(2), false);
        ConfiguracaoAplicacao timeoutMaior = new ConfiguracaoAplicacao(Duration.ofSeconds(5), false);
        ConfiguracaoAplicacao diagnostico = new ConfiguracaoAplicacao(Duration.ofSeconds(5), true);
        EditorConfiguracao editor = new EditorConfiguracao(inicial);
        assertFalse(editor.atualizar(new ConfiguracaoAplicacao(Duration.ofSeconds(2), false)));
        assertTrue(editor.desfazer().isEmpty());
        assertTrue(editor.atualizar(timeoutMaior));
        assertTrue(editor.atualizar(diagnostico));
        assertFalse(editor.atualizar(diagnostico));
        assertEquals(timeoutMaior, editor.desfazer().orElseThrow());
        assertEquals(timeoutMaior, editor.atual());
        assertEquals(inicial, editor.desfazer().orElseThrow());
        assertTrue(editor.desfazer().isEmpty());
        assertEquals(inicial, editor.atual());
    }

    @Test
    void cadastroNaoSobrescreveOutroUsuarioComMesmoId() {
        RepositorioUsuarios usuarios = new RepositorioUsuarios();
        Usuario ana = DadosOficina.usuarios().get(0);
        usuarios.cadastrar(ana);
        assertThrows(IllegalArgumentException.class,
                () -> usuarios.cadastrar(new Usuario(ana.id(), "Outra pessoa", "outra@aurora.invalid", true)));
        assertEquals(ana, usuarios.buscarPorId(ana.id()).orElseThrow());
    }

    @Test
    void atualizacaoNaoCriaUsuarioAusenteEMantemOriginalImutavel() {
        RepositorioUsuarios usuarios = new RepositorioUsuarios();
        Usuario ana = DadosOficina.usuarios().get(0);
        assertThrows(IllegalArgumentException.class, () -> usuarios.atualizar(ana));
        assertTrue(usuarios.buscarPorId(ana.id()).isEmpty());
        usuarios.cadastrar(ana);
        usuarios.atualizar(ana.alterarEmail("ana.novo@aurora.invalid"));
        assertEquals("ana.novo@aurora.invalid", usuarios.buscarPorId(ana.id()).orElseThrow().email());
        assertEquals("ana@aurora.invalid", ana.email());
    }

    @Test
    void listagemDeAtivosOrdenaERetornaSnapshot() {
        RepositorioUsuarios usuarios = new RepositorioUsuarios();
        // A ordem de cadastro é propositalmente diferente da ordem de apresentação.
        usuarios.cadastrar(DadosOficina.usuarios().get(2));
        usuarios.cadastrar(DadosOficina.usuarios().get(1));
        usuarios.cadastrar(DadosOficina.usuarios().get(0));
        List<Usuario> ativos = usuarios.listarAtivos();
        assertEquals(List.of("Ana", "Clara"), ativos.stream().map(Usuario::nome).toList());
        assertThrows(UnsupportedOperationException.class, ativos::clear);
        usuarios.atualizar(new Usuario(1, "Ana", "ana@aurora.invalid", false));
        assertEquals(2, ativos.size());
        assertEquals(1, usuarios.listarAtivos().size());
    }

    @Test
    void logsPreservamHorariosRepetidosEJanelaComFimExclusivo() {
        LinhaDoTempoLogs logs = new LinhaDoTempoLogs();
        DadosOficina.logs().forEach(logs::registrar);
        Instant inicio = Instant.parse("2026-10-25T12:00:00Z");
        Instant fim = Instant.parse("2026-10-25T12:01:00Z");
        List<RegistroLog> janela = logs.consultar(inicio, fim);
        assertEquals(4, janela.size());
        assertEquals(inicio, janela.get(0).instante());
        assertEquals(2, janela.stream().filter(log -> log.instante().equals(inicio.plusSeconds(30))).count());
        assertTrue(janela.stream().noneMatch(log -> log.instante().equals(fim)));
        assertEquals(fim, logs.ultimo().orElseThrow().instante());
        assertTrue(logs.consultar(inicio, inicio).isEmpty());
        assertThrows(IllegalArgumentException.class, () -> logs.consultar(fim, inicio));
    }

    @Test
    void consultaDeLogsNaoExpoeVisaoMutavelDaArvore() {
        LinhaDoTempoLogs logs = new LinhaDoTempoLogs();
        Instant instante = Instant.parse("2026-10-25T12:00:00Z");
        logs.registrar(new RegistroLog(instante, RegistroLog.Nivel.INFO, DadosOficina.PEDIDOS, "Primeiro"));
        List<RegistroLog> snapshot = logs.consultar(instante, instante.plusSeconds(1));
        logs.registrar(new RegistroLog(instante, RegistroLog.Nivel.INFO, DadosOficina.PEDIDOS, "Segundo"));
        assertEquals(1, snapshot.size());
        assertEquals(2, logs.consultar(instante, instante.plusSeconds(1)).size());
        assertThrows(UnsupportedOperationException.class, snapshot::clear);
        assertTrue(new LinhaDoTempoLogs().ultimo().isEmpty());
    }

    @Test
    void impactoSegueDirecaoEVisitaServicoCompartilhadoUmaVez() {
        DependenciasServicos dependencias = dependencias();
        List<Servico> afetados = dependencias.impactadosEmLargura(DadosOficina.AUTENTICACAO);
        assertEquals(List.of(DadosOficina.PEDIDOS, DadosOficina.PAGAMENTOS, DadosOficina.NOTIFICACOES), afetados);
        assertEquals(Set.copyOf(afetados), Set.copyOf(dependencias.impactadosEmProfundidade(DadosOficina.AUTENTICACAO)));
        assertTrue(dependencias.impactadosEmLargura(DadosOficina.NOTIFICACOES).isEmpty());
        assertThrows(UnsupportedOperationException.class, afetados::clear);
        assertThrows(IllegalArgumentException.class,
                () -> dependencias.impactadosEmLargura(new Servico("inexistente", "Outra equipe")));
    }

    @Test
    void grafoComCicloNaoRepeteVisitasNemIncluiOrigemComoImpactada() {
        DependenciasServicos dependencias = dependencias();
        dependencias.adicionarDependencia(DadosOficina.NOTIFICACOES, DadosOficina.AUTENTICACAO);
        List<Servico> afetados = dependencias.impactadosEmLargura(DadosOficina.AUTENTICACAO);
        assertEquals(3, afetados.size());
        assertEquals(3, Set.copyOf(afetados).size());
        assertFalse(afetados.contains(DadosOficina.AUTENTICACAO));
    }

    private static DependenciasServicos dependencias() {
        DependenciasServicos dependencias = new DependenciasServicos();
        dependencias.adicionarDependencia(DadosOficina.AUTENTICACAO, DadosOficina.PEDIDOS);
        dependencias.adicionarDependencia(DadosOficina.AUTENTICACAO, DadosOficina.PAGAMENTOS);
        dependencias.adicionarDependencia(DadosOficina.PEDIDOS, DadosOficina.NOTIFICACOES);
        dependencias.adicionarDependencia(DadosOficina.PAGAMENTOS, DadosOficina.NOTIFICACOES);
        return dependencias;
    }
}
