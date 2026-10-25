package oficina.demonstracoes;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.TreeMap;
import java.util.stream.Collectors;
import oficina.apresentacao.TelaOficina;
import oficina.casos.ConsultasChamados;
import oficina.casos.DependenciasServicos;
import oficina.casos.EditorConfiguracao;
import oficina.casos.FilaSeparacao;
import oficina.casos.LinhaDoTempoLogs;
import oficina.casos.RepositorioUsuarios;
import oficina.dominio.Chamado;
import oficina.dominio.ConfiguracaoAplicacao;
import oficina.dominio.Pedido;
import oficina.dominio.RegistroLog;
import oficina.dominio.Servico;
import oficina.dominio.Usuario;

/** Exemplos práticos; regras de negócio vivem nos casos de uso e objetos de domínio. */
public final class ExemplosColecoes {
    private ExemplosColecoes() { }

    public static void listas(TelaOficina tela) {
        tela.objetivo("decidir qual chamado aberto o time deve atender primeiro.");
        tela.passos("manter o backlog → filtrar e resumir chamados → receber um incidente novo → consultar a fila por prioridade.");
        List<Chamado> backlog = new ArrayList<>(DadosOficina.chamados());
        tela.etapa(1, "Filtrar o backlog e ordenar os chamados abertos");
        tela.linha("A lista conserva todos os chamados; a triagem exclui resolvidos e itens já em atendimento.");
        tela.valor("Backlog carregado", backlog.size() + " chamados");
        tela.secao("Top 3 abertos: filter → sort por prioridade e ID → limit → map");
        ConsultasChamados.priorizarAbertos(backlog).stream().limit(3)
                .map(ExemplosColecoes::resumirChamado).forEach(tela::resultado);

        tela.etapa(2, "Contar chamados e encontrar somente o próximo");
        tela.linha("groupingBy/counting resume as prioridades; min encontra um item sem ordenar a lista toda.");
        tela.valor("Abertos por prioridade", ConsultasChamados.contarAbertosPorPrioridade(backlog));
        ConsultasChamados.proximoParaAtendimento(backlog).map(ExemplosColecoes::resumirChamado)
                .ifPresentOrElse(texto -> tela.valor("Próximo atendimento", texto),
                        () -> tela.aviso("Nenhum chamado aguardando atendimento."));
        tela.resultado("A consulta não alterou os " + backlog.size() + " itens originais.");

        tela.etapa(3, "Receber um incidente enquanto o plantão está em andamento");
        tela.linha("A PriorityQueue aplica o mesmo comparador; poll() retira o próximo chamado prioritário.");
        PriorityQueue<Chamado> filaPlantao = new PriorityQueue<>(ConsultasChamados.comparadorDeAtendimento());
        for (Chamado chamado : backlog) {
            if (chamado.aguardandoAtendimento()) {
                filaPlantao.offer(chamado);
            }
        }
        Chamado incidente = new Chamado(107, "Indisponibilidade geral de autenticação", "Identidade",
                Chamado.Prioridade.CRITICA, Chamado.Status.ABERTO);
        filaPlantao.offer(incidente);
        tela.aviso("Novo incidente crítico recebido: " + incidente.titulo());
        tela.secao("Próximos atendimentos: PriorityQueue.poll()");
        for (int posicao = 1; posicao <= 3 && !filaPlantao.isEmpty(); posicao++) {
            Chamado proximo = filaPlantao.poll();
            tela.resultado("%dº  %s".formatted(posicao, resumirChamado(proximo)));
        }
        tela.dica("ArrayList mantém o backlog para consultas; PriorityQueue entrega o próximo por prioridade.");
        tela.dica("peek() consulta em O(1); offer()/poll() custam O(log n); a iteração não é ordenada.");
        tela.dica("Para obter um item, min examina O(n) chamados; sorted ordena em O(n log n).");
    }

    public static void fila(TelaOficina tela) {
        tela.objetivo("colocar na separação apenas pedidos pagos, pela ordem em que foram aprovados.");
        tela.passos("confirmar pagamento → enfileirar cada pedido → ignorar reentrega → retirar em FIFO.");
        FilaSeparacao separacao = new FilaSeparacao();
        List<Pedido> pagos = DadosOficina.pedidosAguardandoPagamento().stream()
                .map(pedido -> pedido.confirmarPagamento(pedido.total())).toList();
        tela.etapa(1, "Confirmar pagamento e agendar para separação");
        tela.linha("confirmarPagamento cria pedidos no estado PAGO; agendar rejeita qualquer outro estado.");
        for (Pedido pedido : pagos) {
            separacao.agendar(pedido);
            tela.resultado("%s  |  %s  |  R$ %s".formatted(pedido.id(), pedido.cliente(), pedido.total()));
        }
        tela.etapa(2, "Consultar a cabeça e proteger contra uma entrega repetida");
        tela.linha("peek observa o próximo sem removê-lo; HashSet impede agendar o mesmo ID duas vezes.");
        separacao.consultarProximo().map(Pedido::id)
                .ifPresent(id -> tela.valor("Peek sem consumir", id));
        boolean reentregaAgendada = separacao.agendar(pagos.get(0));
        if (reentregaAgendada) {
            tela.aviso("PED-101 foi agendado novamente; confira a regra de deduplicação.");
        } else {
            tela.resultado("PED-101 já estava na fila; a entrega repetida foi ignorada.");
        }
        tela.etapa(3, "Retirar os pedidos na ordem FIFO");
        tela.linha("poll remove a cabeça; o pedido muda de PAGO para EM_SEPARACAO.");
        while (separacao.quantidadePendente() > 0) {
            separacao.iniciarProximo().ifPresent(pedido ->
                    tela.resultado("%s  →  %s".formatted(pedido.id(), pedido.status())));
        }
        separacao.iniciarProximo().ifPresentOrElse(pedido -> tela.texto(pedido.id()),
                () -> tela.dica("Fila vazia: Optional.empty indica ausência esperada."));
        tela.dica("Queue/ArrayDeque resolve a ordem FIFO. BigDecimal representa o valor do pedido.");
    }

    public static void pilha(TelaOficina tela) {
        tela.objetivo("alterar a configuração durante um incidente e restaurar os estados anteriores.");
        tela.passos("guardar snapshot antes de cada alteração → desfazer do estado mais recente ao mais antigo.");
        EditorConfiguracao editor = new EditorConfiguracao(new ConfiguracaoAplicacao(Duration.ofSeconds(2), false));
        tela.etapa(1, "Registrar o estado inicial");
        tela.linha("Timeout e diagnóstico formam um snapshot imutável da configuração.");
        tela.valor("Configuração", resumirConfiguracao(editor.atual()));
        editor.atualizar(new ConfiguracaoAplicacao(Duration.ofSeconds(5), false));
        tela.etapa(2, "Aplicar duas alterações");
        tela.linha("Cada mudança guarda o estado atual no topo do Deque antes de substituí-lo.");
        tela.valor("Timeout alterado", resumirConfiguracao(editor.atual()));
        editor.atualizar(new ConfiguracaoAplicacao(Duration.ofSeconds(5), true));
        tela.valor("Diagnóstico ativado", resumirConfiguracao(editor.atual()));
        tela.etapa(3, "Desfazer em LIFO");
        tela.linha("A primeira chamada recupera o snapshot mais recente; a segunda recupera o anterior.");
        editor.desfazer().map(ExemplosColecoes::resumirConfiguracao)
                .ifPresent(config -> tela.resultado("Desfez diagnóstico → " + config));
        editor.desfazer().map(ExemplosColecoes::resumirConfiguracao)
                .ifPresent(config -> tela.resultado("Desfez timeout → " + config));
        editor.desfazer().ifPresentOrElse(config -> tela.texto(resumirConfiguracao(config)),
                () -> tela.dica("Histórico vazio; a configuração original foi restaurada."));
        tela.dica("Cada entrada é um snapshot imutável; uma mudança igual não cria histórico.");
    }

    public static void mapa(TelaOficina tela) {
        tela.objetivo("consultar uma conta pelo ID e decidir se ela pode receber avisos.");
        tela.passos("indexar usuários → buscar pelo ID → tratar conta ausente/inativa → atualizar e listar ativos.");
        RepositorioUsuarios usuarios = new RepositorioUsuarios();
        List<Usuario> cadastros = DadosOficina.usuarios();
        cadastros.forEach(usuarios::cadastrar);
        tela.etapa(1, "Criar o índice em memória por ID");
        tela.linha("HashMap associa cada chave Long ao objeto Usuario; a busca não percorre a lista inteira.");
        tela.valor("Contas indexadas", cadastros.size());
        tela.etapa(2, "Consultar conta ativa ou tratar ausência");
        tela.linha("buscarPorId devolve Optional; filter libera só contas ativas e a ausência recebe uma resposta explícita.");
        usuarios.buscarPorId(1).filter(Usuario::ativo).map(Usuario::email)
                .ifPresent(email -> tela.resultado("Contato para avisos: " + email));
        String contatoInativo = usuarios.buscarPorId(2).filter(Usuario::ativo).map(Usuario::email)
                .orElse("avisos desativados");
        tela.aviso("Conta inativa: " + contatoInativo);
        usuarios.buscarPorId(999).ifPresentOrElse(usuario -> tela.texto(usuario.nome()),
                () -> tela.aviso("ID 999 ausente; uma API poderia responder 404."));

        tela.etapa(3, "Atualizar um cadastro existente e listar contas ativas");
        tela.linha("replace altera somente um ID já cadastrado; filter e sort preparam a resposta da API.");
        Usuario ana = usuarios.buscarPorId(1).orElseThrow(
                () -> new IllegalStateException("A carga de demonstração deveria conter a usuária Ana."));
        usuarios.atualizar(ana.alterarEmail("ana.suporte@aurora.invalid"));
        tela.secao("Resultado  |  contas ativas em ordem alfabética");
        usuarios.listarAtivos().stream()
                .map(usuario -> "%s  <%s>".formatted(usuario.nome(), usuario.email()))
                .forEach(tela::resultado);
        tela.dica("putIfAbsent evita IDs repetidos; a busca por chave custa O(1) em média.");
        tela.dica("O mapa fica encapsulado. Busca por chave: O(1) esperado.");
    }

    public static void arvore(TelaOficina tela) {
        tela.objetivo("investigar os logs ocorridos durante o minuto em que o gateway ficou lento.");
        tela.passos("indexar por instante → consultar [início, fim) → filtrar erros → contar por serviço.");
        LinhaDoTempoLogs logs = new LinhaDoTempoLogs();
        DadosOficina.logs().forEach(logs::registrar);
        Instant inicio = Instant.parse("2026-10-25T12:00:00Z");
        Instant fim = Instant.parse("2026-10-25T12:01:00Z");
        tela.etapa(1, "Guardar logs ordenados por instante");
        tela.linha("TreeMap ordena as chaves; List preserva vários logs que compartilham o mesmo instante.");
        List<RegistroLog> janela = logs.consultar(inicio, fim);

        tela.etapa(2, "Selecionar a janela cronológica [início, fim)");
        tela.linha("O início entra e o fim fica de fora; janelas consecutivas não repetem o registro de fronteira.");
        tela.valor("Período", inicio + " a " + fim);
        tela.valor("Registros", janela.size());
        tela.secao("Erros encontrados");
        janela.stream().filter(log -> log.nivel() == RegistroLog.Nivel.ERRO)
                .map(log -> "%s  %s  %s".formatted(log.instante(), log.servico().nome(), log.mensagem()))
                .forEach(tela::erro);
        tela.etapa(3, "Resumir volume e localizar o último log");
        tela.linha("groupingBy/counting agrega por serviço sem perder os registros originais.");
        Map<String, Long> volumes = janela.stream().collect(Collectors.groupingBy(
                log -> log.servico().nome(), TreeMap::new, Collectors.counting()));
        volumes.forEach((servico, total) -> tela.valor(servico, total));
        logs.ultimo().ifPresent(log -> tela.valor("Último registro global", log.instante()));
        tela.dica("TreeMap navega a faixa de horário; List guarda logs com timestamps iguais.");
        tela.dica("subMap escolhe a janela; flatMap combina as listas em um snapshot.");
    }

    public static void grafo(TelaOficina tela) {
        tela.objetivo("descobrir quais serviços e equipes podem ser afetados pela queda de autenticação.");
        tela.passos("modelar fornecedor → consumidor → percorrer o grafo → agrupar equipes sem repetição.");
        DependenciasServicos dependencias = new DependenciasServicos();
        dependencias.adicionarDependencia(DadosOficina.AUTENTICACAO, DadosOficina.PEDIDOS);
        dependencias.adicionarDependencia(DadosOficina.AUTENTICACAO, DadosOficina.PAGAMENTOS);
        dependencias.adicionarDependencia(DadosOficina.PEDIDOS, DadosOficina.NOTIFICACOES);
        dependencias.adicionarDependencia(DadosOficina.PAGAMENTOS, DadosOficina.NOTIFICACOES);

        List<Servico> impactados = dependencias.impactadosEmLargura(DadosOficina.AUTENTICACAO);
        tela.etapa(1, "Registrar dependências direcionadas");
        tela.linha("Uma aresta A → B significa que B depende de A; a direção determina quem é alcançado.");
        tela.linha("autenticacao → pedidos → notificacoes");
        tela.linha("autenticacao → pagamentos → notificacoes");
        tela.etapa(2, "Percorrer serviços alcançáveis e reunir equipes");
        tela.linha("BFS (busca em largura) visita por camadas; DFS (profundidade) aprofunda um caminho.");
        tela.linha("As duas buscas encontram os mesmos serviços alcançáveis, em ordens diferentes.");
        tela.valor("BFS", nomesServicos(impactados));
        tela.valor("DFS", nomesServicos(dependencias.impactadosEmProfundidade(DadosOficina.AUTENTICACAO)));
        tela.valor("Equipes sem repetição", impactados.stream().map(Servico::equipe).distinct().sorted().toList());
        tela.etapa(3, "Conferir que o impacto não percorre arestas ao contrário");
        tela.resultado("Falha apenas em notificações afeta "
                + dependencias.impactadosEmLargura(DadosOficina.NOTIFICACOES).size() + " serviços fornecedores.");
        tela.dica("Os iteradores do JGraphT tratam as visitas; BFS/DFS custam O(V + E).");
    }

    private static String resumirChamado(Chamado chamado) {
        return "#%d  %-8s  %-12s  %s".formatted(
                chamado.id(), chamado.prioridade(), chamado.equipe(), chamado.titulo());
    }

    private static String resumirConfiguracao(ConfiguracaoAplicacao configuracao) {
        return "%d ms  |  logs detalhados: %s".formatted(
                configuracao.timeout().toMillis(), configuracao.logsDetalhados() ? "sim" : "não");
    }

    private static String nomesServicos(List<Servico> servicos) {
        return servicos.stream().map(Servico::nome).collect(Collectors.joining(" → "));
    }
}
