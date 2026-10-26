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

    public record DadosBacklog(List<Chamado> recebidos, List<Chamado> abertos,
                               List<Chamado> priorizados, Chamado novoIncidente,
                               List<Chamado> atendimentos) { }

    public record DadosFila(List<Pedido> pedidosNaFila, Pedido proximo,
                            boolean reentregaIgnorada, List<Pedido> retirados,
                            int pendentesAposProcessamento, boolean filaVaziaDevolveuAusencia) { }

    public record EstadoConfiguracao(long timeoutMillis, boolean logsDetalhados) { }

    public record DadosPilha(EstadoConfiguracao inicial, EstadoConfiguracao comTimeoutMaior,
                             EstadoConfiguracao comDiagnostico, List<EstadoConfiguracao> desfeitos,
                             EstadoConfiguracao estadoFinal) { }

    public record DadosMapa(List<Usuario> cadastrados, Usuario contaAtiva, Usuario contaInativa,
                            long idInexistente, Usuario contaInexistente, Usuario anaAtualizada,
                            List<Usuario> contasAtivas) { }

    public record DadosGrafo(List<Servico> vertices, List<DependenciasServicos.Aresta> arestas,
                             List<Servico> buscaLargura, List<Servico> buscaProfundidade,
                             List<Servico> impactoPartindoDeNotificacoes) { }

    public static DadosBacklog carregarBacklog() {
        List<Chamado> recebidos = DadosOficina.chamados();
        List<Chamado> abertos = ConsultasChamados.filtrarAbertos(recebidos);
        List<Chamado> priorizados = ConsultasChamados.priorizarAbertos(recebidos);
        Chamado novo = new Chamado(107, "Indisponibilidade geral de autenticação", "Identidade",
                Chamado.Prioridade.CRITICA, Chamado.Status.ABERTO);
        PriorityQueue<Chamado> fila = ConsultasChamados.criarFilaDePlantao(recebidos);
        fila.offer(novo);
        List<Chamado> atendimentos = new ArrayList<>();
        while (!fila.isEmpty()) {
            atendimentos.add(fila.poll());
        }
        return new DadosBacklog(recebidos, abertos, priorizados, novo, List.copyOf(atendimentos));
    }

    public static DadosFila carregarFila() {
        List<Pedido> pagos = DadosOficina.pedidosAguardandoPagamento().stream()
                .map(pedido -> pedido.confirmarPagamento(pedido.total())).toList();
        FilaSeparacao separacao = new FilaSeparacao();
        pagos.forEach(separacao::agendar);
        Pedido proximo = separacao.consultarProximo().orElse(null);
        boolean reentregaIgnorada = !separacao.agendar(pagos.get(0));
        List<Pedido> retirados = new ArrayList<>();
        while (separacao.quantidadePendente() > 0) {
            separacao.iniciarProximo().ifPresent(retirados::add);
        }
        boolean filaVaziaDevolveuAusencia = separacao.iniciarProximo().isEmpty();
        return new DadosFila(pagos, proximo, reentregaIgnorada, List.copyOf(retirados),
                separacao.quantidadePendente(), filaVaziaDevolveuAusencia);
    }

    public static DadosPilha carregarPilha() {
        EditorConfiguracao editor = new EditorConfiguracao(
                new ConfiguracaoAplicacao(Duration.ofSeconds(2), false));
        EstadoConfiguracao inicial = estadoConfiguracao(editor.atual());
        ConfiguracaoAplicacao comTimeoutMaior = new ConfiguracaoAplicacao(Duration.ofSeconds(5), false);
        editor.atualizar(comTimeoutMaior);
        EstadoConfiguracao timeoutAtualizado = estadoConfiguracao(editor.atual());
        ConfiguracaoAplicacao comDiagnostico = new ConfiguracaoAplicacao(Duration.ofSeconds(5), true);
        editor.atualizar(comDiagnostico);
        EstadoConfiguracao diagnosticoAtualizado = estadoConfiguracao(editor.atual());

        List<EstadoConfiguracao> desfeitos = new ArrayList<>();
        while (true) {
            var anterior = editor.desfazer();
            if (anterior.isEmpty()) {
                break;
            }
            desfeitos.add(estadoConfiguracao(anterior.orElseThrow()));
        }
        return new DadosPilha(inicial, timeoutAtualizado, diagnosticoAtualizado,
                List.copyOf(desfeitos), estadoConfiguracao(editor.atual()));
    }

    public static DadosMapa carregarMapa() {
        List<Usuario> cadastrados = DadosOficina.usuarios();
        RepositorioUsuarios repositorio = new RepositorioUsuarios();
        cadastrados.forEach(repositorio::cadastrar);
        Usuario ativa = repositorio.buscarPorId(1).orElse(null);
        Usuario inativa = repositorio.buscarPorId(2).orElse(null);
        long idInexistente = 999;
        Usuario inexistente = repositorio.buscarPorId(idInexistente).orElse(null);
        repositorio.buscarPorId(1).ifPresent(ana ->
                repositorio.atualizar(ana.alterarEmail("ana.suporte@aurora.invalid")));
        Usuario anaAtualizada = repositorio.buscarPorId(1).orElse(null);
        return new DadosMapa(cadastrados, ativa, inativa, idInexistente, inexistente,
                anaAtualizada, repositorio.listarAtivos());
    }

    public static DadosGrafo carregarGrafo() {
        DependenciasServicos dependencias = new DependenciasServicos();
        dependencias.adicionarDependencia(DadosOficina.AUTENTICACAO, DadosOficina.PEDIDOS);
        dependencias.adicionarDependencia(DadosOficina.AUTENTICACAO, DadosOficina.PAGAMENTOS);
        dependencias.adicionarDependencia(DadosOficina.PEDIDOS, DadosOficina.NOTIFICACOES);
        dependencias.adicionarDependencia(DadosOficina.PAGAMENTOS, DadosOficina.NOTIFICACOES);
        return new DadosGrafo(dependencias.vertices(), dependencias.arestas(),
                dependencias.impactadosEmLargura(DadosOficina.AUTENTICACAO),
                dependencias.impactadosEmProfundidade(DadosOficina.AUTENTICACAO),
                dependencias.impactadosEmLargura(DadosOficina.NOTIFICACOES));
    }

    public static void listas(TelaOficina tela) {
        DadosBacklog dados = carregarBacklog();
        tela.objetivo("organizar chamados que chegaram fora de ordem sem apagar o backlog original.");
        tela.passos("observar a lista → filtrar abertos → ordenar por prioridade → atender novas chegadas.");

        tela.etapa(1, "Receber uma lista que ainda não está organizada para atendimento");
        tela.explicarEtapa("Seis chamados na ordem em que chegaram à aplicação.",
                "A posição na lista não representa urgência: um ajuste de texto chegou antes de uma falha crítica.",
                "List<Chamado> mantém os objetos e a ordem recebida; cada posição pode ser percorrida.",
                "Uma fonte preservada para comparar com as consultas seguintes.");
        dados.recebidos().stream().map(ExemplosColecoes::resumirChamado).forEach(tela::linha);
        tela.valor("Ordem recebida", dados.recebidos().stream().map(Chamado::id).toList());

        tela.etapa(2, "Separar somente os chamados que aguardam atendimento");
        tela.explicarEtapa("A lista completa, incluindo resolvidos e itens em atendimento.",
                "O plantão deve escolher entre os que ainda estão ABERTOS.",
                "filter testa cada objeto; toList materializa uma nova List com os aprovados pelo predicado.",
                "IDs 102, 106, 104 e 101, ainda na ordem recebida.");
        dados.abertos().stream().map(ExemplosColecoes::resumirChamado).forEach(tela::resultado);
        tela.valor("Fonte / resultado", dados.recebidos().size() + " / " + dados.abertos().size());

        tela.etapa(3, "Ordenar a nova lista e escolher os três primeiros");
        tela.explicarEtapa("Os quatro chamados abertos, ainda sem ordem de urgência.",
                "Críticos devem vir antes dos altos e baixos; o ID desempata prioridades iguais.",
                "sorted usa um Comparator explícito; limit(3) seleciona a parte que será apresentada.",
                "Ordem 101, 104, 106 e 102; os três primeiros são 101, 104 e 106.");
        tela.valor("Antes", dados.abertos().stream().map(Chamado::id).toList());
        tela.valor("Depois", dados.priorizados().stream().map(Chamado::id).toList());
        dados.priorizados().stream().limit(3).map(ExemplosColecoes::resumirChamado).forEach(tela::resultado);
        tela.dica("A consulta conserva a fonte original: filtrar e ordenar não apagaram seus seis chamados.");

        tela.etapa(4, "Receber um incidente novo durante o plantão");
        tela.explicarEtapa("Os abertos e um novo chamado crítico, ID 107.",
                "Quando novas tarefas chegam continuamente, precisamos retirar a próxima pela mesma regra.",
                "PriorityQueue é uma fila pronta por prioridade: offer insere e poll retira o próximo.",
                "A ordem de retirada é 101, 104, 107, 106 e 102. O novo crítico fica antes dos menos urgentes.");
        tela.aviso("Chegou: " + resumirChamado(dados.novoIncidente()));
        dados.atendimentos().stream().map(ExemplosColecoes::resumirChamado).forEach(tela::resultado);
        tela.dica("A visualização mostra a sequência obtida com poll, não a ordem interna de iteração da fila.");
        tela.dica("List serve à consulta do conjunto; PriorityQueue serve à retirada contínua do próximo.");
    }

    public static void fila(TelaOficina tela) {
        tela.objetivo("colocar na separação apenas pedidos pagos, pela ordem em que foram aprovados.");
        tela.passos("confirmar pagamento → enfileirar cada pedido → ignorar reentrega → retirar em FIFO.");
        DadosFila dados = carregarFila();
        tela.etapa(1, "Confirmar pagamento e agendar para separação");
        tela.linha("confirmarPagamento cria pedidos no estado PAGO; agendar rejeita qualquer outro estado.");
        for (Pedido pedido : dados.pedidosNaFila()) {
            tela.resultado("%s  |  %s  |  R$ %s".formatted(pedido.id(), pedido.cliente(), pedido.total()));
        }
        tela.etapa(2, "Consultar a cabeça e proteger contra uma entrega repetida");
        tela.linha("peek observa o próximo sem removê-lo; HashSet impede agendar o mesmo ID duas vezes.");
        tela.valor("Peek sem consumir", dados.proximo().id());
        if (!dados.reentregaIgnorada()) {
            tela.aviso("PED-101 foi agendado novamente; confira a regra de deduplicação.");
        } else {
            tela.resultado("PED-101 já estava na fila; a entrega repetida foi ignorada.");
        }
        tela.etapa(3, "Retirar os pedidos na ordem FIFO");
        tela.linha("poll remove a cabeça; o pedido muda de PAGO para EM_SEPARACAO.");
        dados.retirados().forEach(pedido ->
                tela.resultado("%s  →  %s".formatted(pedido.id(), pedido.status())));
        if (dados.filaVaziaDevolveuAusencia()) {
            tela.dica("Fila vazia: Optional.empty indica ausência esperada.");
        }
        tela.dica("Queue/ArrayDeque resolve a ordem FIFO. BigDecimal representa o valor do pedido.");
    }

    public static void pilha(TelaOficina tela) {
        tela.objetivo("alterar a configuração durante um incidente e restaurar os estados anteriores.");
        tela.passos("guardar snapshot antes de cada alteração → desfazer do estado mais recente ao mais antigo.");
        DadosPilha dados = carregarPilha();
        tela.etapa(1, "Registrar o estado inicial");
        tela.linha("Timeout e diagnóstico formam um snapshot imutável da configuração.");
        tela.valor("Configuração", resumirConfiguracao(dados.inicial()));
        tela.etapa(2, "Aplicar duas alterações");
        tela.linha("Cada mudança guarda o estado atual no topo do Deque antes de substituí-lo.");
        tela.valor("Timeout alterado", resumirConfiguracao(dados.comTimeoutMaior()));
        tela.valor("Diagnóstico ativado", resumirConfiguracao(dados.comDiagnostico()));
        tela.etapa(3, "Desfazer em LIFO");
        tela.linha("A primeira chamada recupera o snapshot mais recente; a segunda recupera o anterior.");
        for (int i = 0; i < dados.desfeitos().size(); i++) {
            String alteracao = i == 0 ? "diagnóstico" : "timeout";
            tela.resultado("Desfez %s → %s".formatted(alteracao, resumirConfiguracao(dados.desfeitos().get(i))));
        }
        tela.dica("Histórico vazio; configuração atual: " + resumirConfiguracao(dados.estadoFinal()));
        tela.dica("Cada entrada é um snapshot imutável; uma mudança igual não cria histórico.");
    }

    public static void mapa(TelaOficina tela) {
        tela.objetivo("consultar uma conta pelo ID e decidir se ela pode receber avisos.");
        tela.passos("indexar usuários → buscar pelo ID → tratar conta ausente/inativa → atualizar e listar ativos.");
        DadosMapa dados = carregarMapa();
        tela.etapa(1, "Criar o índice em memória por ID");
        tela.linha("HashMap associa cada chave Long ao objeto Usuario; a busca não percorre a lista inteira.");
        tela.valor("Contas indexadas", dados.cadastrados().size());
        tela.etapa(2, "Consultar conta ativa ou tratar ausência");
        tela.linha("buscarPorId devolve Optional; filter libera só contas ativas e a ausência recebe uma resposta explícita.");
        if (dados.contaAtiva() != null && dados.contaAtiva().ativo()) {
            tela.resultado("Contato para avisos: " + dados.contaAtiva().email());
        }
        String contatoInativo = dados.contaInativa() != null && dados.contaInativa().ativo()
                ? dados.contaInativa().email() : "avisos desativados";
        tela.aviso("Conta inativa: " + contatoInativo);
        if (dados.contaInexistente() == null) {
            tela.aviso("ID " + dados.idInexistente() + " ausente; uma API poderia responder 404.");
        }

        tela.etapa(3, "Atualizar um cadastro existente e listar contas ativas");
        tela.linha("replace altera somente um ID já cadastrado; filter e sort preparam a resposta da API.");
        tela.secao("Resultado  |  contas ativas em ordem alfabética");
        dados.contasAtivas().stream()
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
        DadosGrafo dados = carregarGrafo();
        tela.etapa(1, "Registrar dependências direcionadas");
        tela.linha("Uma aresta A → B significa que B depende de A; a direção determina quem é alcançado.");
        dados.arestas().forEach(aresta -> tela.linha(
                aresta.fornecedor().nome() + " → " + aresta.consumidor().nome()));
        tela.etapa(2, "Percorrer serviços alcançáveis e reunir equipes");
        tela.linha("BFS (busca em largura) visita por camadas; DFS (profundidade) aprofunda um caminho.");
        tela.linha("As duas buscas encontram os mesmos serviços alcançáveis, em ordens diferentes.");
        tela.valor("BFS", nomesServicos(dados.buscaLargura()));
        tela.valor("DFS", nomesServicos(dados.buscaProfundidade()));
        tela.valor("Equipes sem repetição", dados.buscaLargura().stream()
                .map(Servico::equipe).distinct().sorted().toList());
        tela.etapa(3, "Conferir que o impacto não percorre arestas ao contrário");
        tela.resultado("Falha apenas em notificações afeta "
                + dados.impactoPartindoDeNotificacoes().size() + " serviços fornecedores.");
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

    private static EstadoConfiguracao estadoConfiguracao(ConfiguracaoAplicacao configuracao) {
        return new EstadoConfiguracao(configuracao.timeout().toMillis(), configuracao.logsDetalhados());
    }

    private static String resumirConfiguracao(EstadoConfiguracao configuracao) {
        return "%d ms  |  logs detalhados: %s".formatted(
                configuracao.timeoutMillis(), configuracao.logsDetalhados() ? "sim" : "não");
    }

    private static String nomesServicos(List<Servico> servicos) {
        return servicos.stream().map(Servico::nome).collect(Collectors.joining(" → "));
    }
}
