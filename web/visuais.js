/* Renderização dos dados calculados pelo Java. A interface não refaz as regras dos casos. */
const Visuais = (() => {
  function criar(tag, classe, texto) {
    const no = document.createElement(tag);
    if (classe) no.className = classe;
    if (texto !== undefined) no.textContent = texto;
    return no;
  }

  function titulo(kicker, texto) {
    const cabecalho = criar("div", "visual-heading");
    cabecalho.append(criar("span", "eyebrow", kicker), criar("h3", "", texto));
    return cabecalho;
  }

  function metricas(itens) {
    const painel = criar("div", "collection-metrics");
    for (const [valor, rotulo] of itens) {
      const item = criar("div", "collection-metric");
      item.append(criar("strong", "", String(valor)), criar("span", "", rotulo));
      painel.append(item);
    }
    return painel;
  }

  function tabela(colunas, linhas) {
    const moldura = criar("div", "data-table-wrap");
    const tabela = criar("table", "data-table");
    const cabecalho = criar("tr");
    colunas.forEach(coluna => {
      const th = criar("th", "", coluna);
      th.scope = "col";
      cabecalho.append(th);
    });
    const thead = criar("thead");
    thead.append(cabecalho);
    const corpo = criar("tbody");
    linhas.forEach(linha => {
      const tr = criar("tr");
      linha.forEach(valor => {
        const td = criar("td");
        td.append(valor instanceof Node ? valor : document.createTextNode(String(valor)));
        tr.append(td);
      });
      corpo.append(tr);
    });
    tabela.append(thead, corpo);
    moldura.append(tabela);
    return moldura;
  }

  function pipeline(operacoes) {
    const trilha = criar("div", "operation-flow");
    operacoes.forEach(operacao => trilha.append(criar("code", "", operacao)));
    return trilha;
  }

  function listaItens(valores, bruta = false, selecionados = null) {
    const lista = criar("ol", "collection-items");
    valores.forEach((valor, indice) => {
      const item = criar("li", selecionados && selecionados.includes(valor) ? "in-batch" : "");
      item.append(criar("span", "item-position", String(indice)));
      item.append(criar("code", "", bruta ? JSON.stringify(valor) : valor));
      if (bruta && !valor.trim()) item.append(criar("span", "value-badge muted", "vazia"));
      else if (bruta && indice === 0) item.append(criar("span", "value-badge", "cabeçalho"));
      else if (selecionados?.includes(valor)) item.append(criar("span", "value-badge", "no lote"));
      lista.append(item);
    });
    return lista;
  }

  function arquivo(etapa, dados) {
    const painel = criar("section", "collection-visual");
    if (etapa === 1) {
      painel.append(titulo("ENTRADA · LIST<STRING>", "Cada linha ocupa uma posição."));
      painel.append(listaItens(dados.linhas, true));
      painel.append(criar("p", "visual-caption", "Os índices começam em zero. Aspas preservam os espaços visíveis; uma string vazia continua sendo um item da lista."));
    } else if (etapa === 2) {
      painel.append(titulo("TRANSFORMAÇÃO · NOVA LISTA", "Da entrada bruta aos destinatários únicos."));
      painel.append(pipeline(["skip(1)", "strip", "filter", "lowercase", "distinct", "sorted", "toList"]));
      painel.append(metricas([[dados.linhas.length, "linhas recebidas"], [dados.destinatarios.length, "destinatários preparados"]]));
      const comparacao = criar("div", "collection-comparison");
      for (const [rotulo, valores, bruta] of [
        ["ANTES · FONTE PRESERVADA", dados.linhas, true],
        ["DEPOIS · RESULTADO DO STREAM", dados.destinatarios, false]
      ]) {
        const coluna = criar("div", "collection-column");
        coluna.append(criar("span", "eyebrow", rotulo), listaItens(valores, bruta));
        comparacao.append(coluna);
      }
      painel.append(comparacao);
      painel.append(criar("p", "visual-caption", "A nova lista tem outra finalidade. A entrada permanece disponível para auditoria ou conferência."));
    } else {
      painel.append(titulo("CONSULTA E LOTE", "Encontrar um item e selecionar uma parte."));
      painel.append(pipeline(["findFirst → Optional", "limit(2) → List"]));
      painel.append(listaItens(dados.destinatarios, false, dados.lote));
      painel.append(metricas([[dados.destinatarios.length, "itens disponíveis"], [dados.lote.length, "itens no primeiro lote"]]));
      painel.append(criar("p", "visual-caption", "O lote contém as duas primeiras posições da lista preparada. Os outros destinatários continuam na lista; nenhuma mensagem é enviada."));
    }
    return painel;
  }

  function usuariosTabela(usuarios) {
    return tabela(["ID", "Nome", "E-mail", "Situação"], usuarios.map(usuario => [
      usuario.id, usuario.nome, usuario.email,
      criar("span", "status-badge " + (usuario.ativo ? "active" : "inactive"), usuario.ativo ? "Ativo" : "Inativo")
    ]));
  }

  function banco(etapa, dados) {
    const painel = criar("section", "collection-visual");
    if (etapa === 1) {
      painel.append(titulo("FONTE · OBJETOS USUARIO", "A consulta começa com registros completos."));
      painel.append(usuariosTabela(dados.registros));
      painel.append(criar("p", "visual-caption", "Os inativos permanecem na fonte. O repositório decide quais registros devolve na consulta."));
    } else if (etapa === 2) {
      painel.append(titulo("RESULTADO · LIST<USUARIO>", "Uma página é uma parte ordenada do resultado."));
      painel.append(pipeline(["filter(ativo)", "sorted(id)", "skip(offset)", "limit(2)", "toList"]));
      const seletor = criar("div", "page-picker");
      seletor.setAttribute("aria-label", "Páginas retornadas pelo repositório");
      const estado = criar("p", "page-status");
      const conteudo = criar("div", "page-content");
      const botoes = dados.paginas.map((pagina, indice) => {
        const botao = criar("button", "page-choice", "Página " + indice + " · " + pagina.length + " itens");
        botao.onclick = () => mostrarPagina(indice);
        seletor.append(botao);
        return botao;
      });
      function mostrarPagina(indice) {
        botoes.forEach((botao, posicao) => botao.setAttribute("aria-pressed", String(posicao === indice)));
        estado.textContent = "offset " + (indice * dados.tamanhoPagina) + " · tamanho " + dados.tamanhoPagina;
        const pagina = dados.paginas[indice];
        conteudo.replaceChildren(pagina.length ? usuariosTabela(pagina) :
          criar("div", "empty-collection", "[]  Lista vazia: não há mais registros nesta página."));
      }
      painel.append(seletor, estado, conteudo);
      painel.append(criar("p", "visual-caption", "Compare as páginas: primeiro são selecionados os ativos; depois a ordem por ID e os limites definem cada resultado."));
      mostrarPagina(0);
    } else {
      painel.append(titulo("PROJEÇÃO · LIST<CONTATO>", "A resposta leva apenas os campos necessários."));
      painel.append(pipeline(["Usuario", "map → Contato(nome, email)", "toList"]));
      painel.append(tabela(["Nome", "E-mail"], dados.contatos.map(contato => [contato.nome, contato.email])));
      painel.append(metricas([[dados.registros.length, "registros preservados na fonte"], [dados.contatos.length, "contatos na resposta"]]));
      painel.append(criar("p", "visual-caption", "O backend criou objetos Contato com dois campos. O ID e a situação da conta não fazem parte dessa projeção."));
    }
    return painel;
  }


  function chamadosTabela(chamados, top = false, mostrarTitulos = false) {
    return tabela(["Posição", mostrarTitulos ? "Chamado recebido" : "ID", "Prioridade", "Situação"], chamados.map((chamado, indice) => {
      const identificacao = criar("div", "ticket-identification");
      identificacao.append(criar("strong", "", "#" + chamado.id));
      if (mostrarTitulos) identificacao.append(criar("span", "", chamado.titulo));
      return [
      indice, identificacao,
      criar("span", "priority-badge " + chamado.prioridade.toLowerCase(),
        ({CRITICA:"Crítica",ALTA:"Alta",MEDIA:"Média",BAIXA:"Baixa"})[chamado.prioridade]),
      top && indice < 3 ? "Selecionado no top 3" :
        ({ABERTO:"Aberto",EM_ATENDIMENTO:"Em atendimento",RESOLVIDO:"Resolvido"})[chamado.status]
    ]; }));
  }

  function backlog(etapa, dados) {
    const painel = criar("section", "collection-visual");
    if (etapa === 1) {
      painel.append(titulo("FONTE · ORDEM DE CHEGADA", "O primeiro registro não é o mais urgente."));
      painel.append(chamadosTabela(dados.recebidos, false, true));
      painel.append(criar("p","visual-caption","As falhas críticas 104 e 101 estão perto do fim. Observe também um resolvido e um chamado já em atendimento."));
    } else if (etapa === 2 || etapa === 3) {
      painel.append(titulo(etapa===2?"SELEÇÃO · QUEM CONTINUA?":"ORDENAÇÃO · QUEM VEM PRIMEIRO?",
        etapa===2?"Seis recebidos, quatro aguardando atendimento.":"A mesma lista de abertos, agora com outra ordem."));
      const comparacao = criar("div","collection-comparison");
      const colunas = etapa===2 ?
        [["ANTES · TODOS OS STATUS",dados.recebidos],["DEPOIS · SOMENTE ABERTOS",dados.abertos]] :
        [["ANTES · ORDEM RECEBIDA",dados.abertos],["DEPOIS · PRIORIDADE E ID",dados.priorizados]];
      colunas.forEach(([rotulo,chamados],i)=>{
        const coluna=criar("div","collection-column");
        coluna.append(criar("span","eyebrow",rotulo),chamadosTabela(chamados,etapa===3&&i===1));
        comparacao.append(coluna);
      });
      painel.append(comparacao);
      painel.append(metricas([[dados.recebidos.length,"objetos preservados na fonte"],
        [etapa===2?dados.abertos.length:3,etapa===2?"chamados abertos":"itens selecionados por limit(3)"]]));
      painel.append(criar("p","visual-caption",etapa===2?
        "Filtrar mantém a ordem relativa dos aprovados: 102, 106, 104, 101. A fonte não é apagada.":
        "sorted mudou a ordem para 101, 104, 106, 102. limit(3) apresenta apenas os três primeiros."));
    } else {
      painel.append(titulo("NOVA CHEGADA · FILA DE PRIORIDADE","O crítico 107 passa à frente de 106 e 102."));
      painel.append(pipeline(["offer(107)","Comparator","poll"]));
      const lista=criar("ol","priority-sequence");
      dados.atendimentos.forEach((chamado,i)=>{
        const item=criar("li",chamado.id===dados.novoIncidente.id?"new-arrival":"");
        item.append(criar("span","eyebrow",(i+1)+"ª RETIRADA"),
          criar("strong","","#"+chamado.id),criar("span","",chamado.prioridade));
        lista.append(item);
      });
      painel.append(lista,criar("p","visual-caption","Esta é a sequência calculada com poll. O desenho não representa a ordem interna de iteração da PriorityQueue."));
    }
    return painel;
  }

  function cartaoPedido(pedido, rotulo, destaque = false) {
    const cartao = criar("article", "queue-token" + (destaque ? " is-next" : ""));
    cartao.append(criar("span", "eyebrow", rotulo), criar("strong", "", pedido.id),
      criar("span", "", pedido.cliente), criar("small", "", statusPedido(pedido.status)));
    return cartao;
  }

  function statusPedido(status) {
    return ({PAGO:"Pago",EM_SEPARACAO:"Em separação"})[status] || status;
  }

  function trilhoFila(pedidos, proximoId) {
    const trilho = criar("div", "queue-track");
    const frente = criar("div", "queue-endpoint");
    frente.append(criar("span", "eyebrow", "FRENTE"), criar("strong", "", "próximo a sair"));
    trilho.append(frente);
    pedidos.forEach((pedido, indice) => {
      trilho.append(cartaoPedido(pedido, indice === 0 ? "HEAD · 0" : "POSIÇÃO " + indice,
        pedido.id === proximoId));
      if (indice < pedidos.length - 1) trilho.append(criar("span", "queue-arrow", "→"));
    });
    const fim = criar("div", "queue-endpoint");
    fim.append(criar("span", "eyebrow", "FUNDO"), criar("strong", "", "próximo a entrar"));
    trilho.append(fim);
    return trilho;
  }

  function fila(etapa, dados) {
    const painel = criar("section", "collection-visual");
    if (etapa < 3) {
      painel.append(titulo(etapa === 1 ? "FILA · ORDEM DE APROVAÇÃO" : "PEEK · CONSULTA SEM REMOÇÃO",
        etapa === 1 ? "Pedidos pagos aguardam no fim da fila." : "O primeiro pedido continua na frente."));
      painel.append(trilhoFila(dados.pedidosNaFila, etapa === 2 ? dados.proximo.id : null));
      painel.append(metricas([[dados.pedidosNaFila.length, "pedidos na fila"],
        [etapa === 1 ? "FIFO" : dados.proximo.id, etapa === 1 ? "primeiro a entrar, primeiro a sair" : "próximo sem consumir"]]));
      painel.append(criar("p", "visual-caption", etapa === 1
        ? "offer coloca cada novo pedido no fundo; a fila conserva a ordem de aprovação."
        : dados.reentregaIgnorada
          ? "peek não remove PED-101. A reentrega do mesmo ID foi ignorada pelo conjunto de IDs agendados."
          : "A reentrega foi aceita; confira o controle de IDs antes de avançar."));
    } else {
      painel.append(titulo("POLL · ORDEM REAL DE RETIRADA", "Cada pedido sai pela frente e muda de estado."));
      const lista = criar("ol", "queue-processed");
      dados.retirados.forEach((pedido, indice) => {
        const item = criar("li", "queue-token" + (indice === 0 ? " is-next" : ""));
        item.append(criar("span", "eyebrow", "RETIRADA " + (indice + 1)),
          criar("strong", "", pedido.id), criar("span", "", pedido.cliente),
          criar("small", "", statusPedido(pedido.status)));
        lista.append(item);
      });
      painel.append(lista, metricas([[dados.retirados.length, "pedidos processados"],
        [dados.pendentesAposProcessamento, "pedidos restantes"]]));
      painel.append(criar("p", "visual-caption", "A sequência é o resultado das chamadas a poll; a fila termina vazia."));
    }
    return painel;
  }

  function estadoConfiguracao(estado) {
    const cartao = criar("article", "state-token");
    cartao.append(criar("strong", "", (estado.timeoutMillis / 1000) + " s"),
      criar("span", "", "Diagnóstico " + (estado.logsDetalhados ? "ligado" : "desligado")));
    return cartao;
  }

  function pilha(etapa, dados) {
    const painel = criar("section", "collection-visual");
    if (etapa < 3) {
      painel.append(titulo(etapa === 1 ? "ESTADO ATUAL" : "HISTÓRICO · TOPO PRIMEIRO",
        etapa === 1 ? "A configuração também é um objeto imutável." : "O snapshot mais recente fica no topo do Deque."));
      const quadro = criar("div", "stack-layout");
      const atual = criar("section", "stack-current");
      atual.append(criar("span", "eyebrow", "CONFIGURAÇÃO EM USO"),
        estadoConfiguracao(etapa === 1 ? dados.inicial : dados.comDiagnostico));
      const historico = criar("section", "stack-history");
      historico.append(criar("span", "eyebrow", "PILHA · LIFO"));
      if (etapa === 1) {
        historico.append(criar("div", "stack-empty", "Sem snapshots anteriores"));
      } else {
        const lista = criar("ol", "stack-items");
        dados.desfeitos.forEach((estado, indice) => {
          const item = criar("li", indice === 0 ? "stack-top" : "");
          if (indice === 0) item.append(criar("span", "stack-top-label", "TOPO · PRÓXIMO A SAIR"));
          item.append(estadoConfiguracao(estado));
          lista.append(item);
        });
        historico.append(lista);
      }
      quadro.append(atual, historico);
      painel.append(quadro);
    } else {
      painel.append(titulo("POP · DESFAZER EM LIFO", "O estado mais recente é restaurado primeiro."));
      const fluxo = criar("ol", "undo-sequence");
      dados.desfeitos.forEach((estado, indice) => {
        const item = criar("li", "undo-step");
        item.append(criar("span", "eyebrow", "POP " + (indice + 1)), estadoConfiguracao(estado));
        fluxo.append(item);
      });
      painel.append(fluxo);
      const atual = criar("div", "restored-state");
      atual.append(criar("span", "eyebrow", "ESTADO FINAL · HISTÓRICO VAZIO"),
        estadoConfiguracao(dados.estadoFinal));
      painel.append(atual);
    }
    return painel;
  }

  function usuarioAssociacao(usuario, destaque = false) {
    const linha = criar("div", "map-entry" + (destaque ? " is-match" : ""));
    const chave = criar("div", "map-key");
    chave.append(criar("span", "eyebrow", "CHAVE"), criar("strong", "", String(usuario.id)));
    const valor = criar("div", "map-value");
    valor.append(criar("span", "eyebrow", "VALOR · USUARIO"), criar("strong", "", usuario.nome),
      criar("span", "", usuario.email), criar("small", "", usuario.ativo ? "Ativo" : "Inativo"));
    linha.append(chave, criar("span", "map-arrow", "→"), valor);
    return linha;
  }

  function consultaUsuario(id, usuario) {
    const linha = criar("div", "lookup-result" + (usuario ? " found" : " absent"));
    linha.append(criar("code", "lookup-key", "get(" + id + ")"), criar("span", "map-arrow", "→"),
      usuario ? criar("strong", "", usuario.nome + " · " + (usuario.ativo ? "ativo" : "inativo"))
        : criar("strong", "", "Optional.empty"));
    return linha;
  }

  function mapa(etapa, dados) {
    const painel = criar("section", "collection-visual");
    if (etapa === 1) {
      painel.append(titulo("HASHMAP · ID → USUARIO", "A chave aponta para o objeto que a aplicação consulta."));
      const entradas = criar("div", "map-entries");
      dados.cadastrados.forEach(usuario => entradas.append(usuarioAssociacao(usuario)));
      painel.append(entradas, criar("p", "visual-caption", "A ordem das linhas é apenas para leitura: HashMap não garante a ordem de apresentação."));
    } else if (etapa === 2) {
      painel.append(titulo("BUSCA POR CHAVE", "A ausência também é um resultado que a aplicação trata."));
      const consultas = criar("div", "lookup-results");
      consultas.append(consultaUsuario(dados.contaAtiva.id, dados.contaAtiva),
        consultaUsuario(dados.contaInativa.id, dados.contaInativa),
        consultaUsuario(dados.idInexistente, dados.contaInexistente));
      painel.append(consultas, criar("p", "visual-caption", "O índice encontra o valor pelo ID. A regra de negócio decide se uma conta inativa pode receber avisos."));
    } else {
      painel.append(titulo("ATUALIZAÇÃO E RESPOSTA", "O mesmo ID passa a apontar para o objeto atualizado."));
      const mudanca = criar("div", "map-update");
      mudanca.append(usuarioAssociacao(dados.contaAtiva), criar("span", "map-update-arrow", "↓ replace"),
        usuarioAssociacao(dados.anaAtualizada, true));
      painel.append(mudanca);
      const saida = criar("section", "map-list-output");
      saida.append(criar("span", "eyebrow", "LISTAGEM · ATIVOS ORDENADOS"));
      dados.contasAtivas.forEach(usuario => saida.append(usuarioAssociacao(usuario)));
      painel.append(saida, criar("p", "visual-caption", "A listagem ordenada é uma saída do repositório; não representa a ordem interna do HashMap."));
    }
    return painel;
  }

  const COORDENADAS_GRAFO = {
    autenticacao: {x:30, y:112}, pedidos: {x:260, y:22},
    pagamentos: {x:260, y:202}, notificacoes: {x:490, y:112}
  };

  function nomeServico(nome) {
    return ({autenticacao:"Autenticação",pedidos:"Pedidos",pagamentos:"Pagamentos",
      notificacoes:"Notificações"})[nome] || nome.replaceAll("_", " ");
  }

  function desenharGrafo(elementoSvg, dados, etapa, modo) {
    const ns = "http://www.w3.org/2000/svg";
    const definicoes = document.createElementNS(ns, "defs");
    const marcador = document.createElementNS(ns, "marker");
    marcador.setAttribute("id", "seta-dependencia");
    marcador.setAttribute("viewBox", "0 0 10 10");
    marcador.setAttribute("refX", "9"); marcador.setAttribute("refY", "5");
    marcador.setAttribute("markerWidth", "7"); marcador.setAttribute("markerHeight", "7");
    marcador.setAttribute("orient", "auto-start-reverse");
    const ponta = document.createElementNS(ns, "path");
    ponta.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    ponta.setAttribute("fill", "currentColor"); marcador.append(ponta); definicoes.append(marcador);
    elementoSvg.replaceChildren(definicoes);
    for (const aresta of dados.arestas) {
      const origem = aresta.fornecedor.nome, destino = aresta.consumidor.nome;
      const a = COORDENADAS_GRAFO[origem], b = COORDENADAS_GRAFO[destino];
      if (!a || !b) continue;
      const caminho = document.createElementNS(ns, "path");
      const origemEsquerda = a.x < b.x;
      const xInicio = a.x + (origemEsquerda ? 170 : 0), xFim = b.x + (origemEsquerda ? 0 : 170);
      const yInicio = a.y + 32, yFim = b.y + 32;
      caminho.setAttribute("d", `M ${xInicio} ${yInicio} C ${(xInicio+xFim)/2} ${yInicio}, ${(xInicio+xFim)/2} ${yFim}, ${xFim} ${yFim}`);
      caminho.setAttribute("class", "dependency-edge");
      caminho.setAttribute("marker-end", "url(#seta-dependencia)");
      elementoSvg.append(caminho);
    }
    const origemBusca = etapa === 3 ? "notificacoes" : "autenticacao";
    const visitados = etapa === 2
      ? [origemBusca, ...(modo === "dfs" ? dados.buscaProfundidade : dados.buscaLargura).map(servico => servico.nome)]
      : etapa === 3 ? [origemBusca] : [];
    for (const servico of dados.vertices) {
      const posicao = COORDENADAS_GRAFO[servico.nome];
      if (!posicao) continue;
      const grupo = document.createElementNS(ns, "g");
      const ordem = visitados.indexOf(servico.nome);
      grupo.setAttribute("class", "dependency-node" + (ordem >= 0 ? " visited" : "") +
        (servico.nome === origemBusca && etapa > 1 ? " origin" : ""));
      const caixa = document.createElementNS(ns, "rect");
      caixa.setAttribute("x", posicao.x); caixa.setAttribute("y", posicao.y);
      caixa.setAttribute("width", "170"); caixa.setAttribute("height", "64"); caixa.setAttribute("rx", "10");
      const nome = document.createElementNS(ns, "text");
      nome.setAttribute("x", posicao.x + 12); nome.setAttribute("y", posicao.y + 25);
      nome.setAttribute("class", "dependency-name");
      nome.textContent = nomeServico(servico.nome);
      const equipe = document.createElementNS(ns, "text");
      equipe.setAttribute("x", posicao.x + 12); equipe.setAttribute("y", posicao.y + 46);
      equipe.setAttribute("class", "dependency-team"); equipe.textContent = servico.equipe;
      grupo.append(caixa, nome, equipe);
      if (ordem >= 0 && etapa === 2) {
        const numero = document.createElementNS(ns, "text");
        numero.setAttribute("x", posicao.x + 153); numero.setAttribute("y", posicao.y + 20);
        numero.setAttribute("class", "dependency-order"); numero.textContent = String(ordem + 1);
        grupo.append(numero);
      }
      elementoSvg.append(grupo);
    }
  }

  function grafo(etapa, dados) {
    const painel = criar("section", "collection-visual graph-visual");
    painel.append(titulo(etapa === 1 ? "RELAÇÕES · DIREÇÃO DAS ARESTAS" : etapa === 2 ? "TRAVESSIA · ORDEM DE VISITA" : "ORIGEM · NOTIFICAÇÕES",
      etapa === 1 ? "A seta vai do serviço fornecedor para quem depende dele." :
        etapa === 2 ? "BFS e DFS visitam os mesmos serviços em ordens diferentes." :
          "As setas chegam a notificações; nenhuma sai dela para os fornecedores."));
    const quadro = criar("div", "dependency-board");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 680 280"); svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Grafo direcionado de dependências entre serviços");
    quadro.append(svg);
    painel.append(quadro);
    let modo = "bfs";
    const sequencia = criar("div", "graph-sequence");
    const atualizar = () => {
      desenharGrafo(svg, dados, etapa, modo);
      const ordem = etapa === 1 ? [] : etapa === 2
        ? ["autenticacao", ...(modo === "dfs" ? dados.buscaProfundidade : dados.buscaLargura).map(servico => servico.nome)]
        : ["notificacoes"];
      const passos = [];
      ordem.forEach((nome, indice) => {
        const servico = dados.vertices.find(item => item.nome === nome);
        const no = criar("span", "graph-visit" + (indice === 0 ? " origin" : ""));
        no.append(criar("small", "", indice === 0 ? "ORIGEM" : "VISITA " + indice),
          criar("strong", "", nomeServico(nome)));
        passos.push(no);
        if (indice < ordem.length - 1) passos.push(criar("span", "graph-visit-arrow", "→"));
      });
      sequencia.replaceChildren(...passos);
    };
    if (etapa === 2) {
      const acoes = criar("div", "graph-modes");
      for (const [id, rotulo] of [["bfs", "BFS · por camadas"], ["dfs", "DFS · por caminho"]]) {
        const botao = criar("button", "graph-mode", rotulo);
        botao.setAttribute("aria-pressed", String(modo === id));
        botao.onclick = () => {
          modo = id;
          acoes.querySelectorAll("button").forEach(item => item.setAttribute("aria-pressed", String(item === botao)));
          atualizar();
        };
        acoes.append(botao);
      }
      painel.append(acoes);
    }
    painel.append(sequencia);
    atualizar();
    painel.append(criar("p", "visual-caption", etapa === 3
      ? "A busca parte de notificações e segue apenas as setas de saída. Como não há nenhuma, zero fornecedores são alcançados."
      : etapa === 2
        ? "Os números nos nós e a sequência abaixo vêm dos iteradores do JGraphT nesta execução."
        : "Cada aresta do desenho veio do grafo direcionado construído pelo backend."));
    return painel;
  }

  let paginas;
  let raiz;
  let selecionada;
  const recolhidos = new Set();

  function desenharRamo(pagina) {
    const item = criar("li", "tree-item");
    const linha = criar("div", "tree-row");
    const filhos = criar("ul", "tree-branch");
    if (pagina.filhos.length) {
      const alternar = criar("button", "branch-toggle");
      function atualizar() {
        const aberto = !recolhidos.has(pagina.id);
        alternar.textContent = aberto ? "▾" : "▸";
        alternar.setAttribute("aria-expanded", String(aberto));
        alternar.setAttribute("aria-label", (aberto ? "Recolher " : "Expandir ") + pagina.titulo);
        filhos.hidden = !aberto;
      }
      alternar.onclick = () => {
        if (recolhidos.has(pagina.id)) recolhidos.delete(pagina.id);
        else recolhidos.add(pagina.id);
        atualizar();
      };
      atualizar();
      linha.append(alternar);
      pagina.filhos.forEach(filho => filhos.append(desenharRamo(filho)));
    } else {
      linha.append(criar("span", "branch-leaf", "·"));
    }
    const selecionar = criar("button", "node-label");
    selecionar.dataset.pageId = pagina.id;
    selecionar.setAttribute("aria-current", String(selecionada === pagina.id));
    selecionar.append(criar("span", "node-title", pagina.titulo), criar("code", "node-key", pagina.id));
    selecionar.onclick = () => mostrarPagina(pagina.id);
    linha.append(selecionar);
    item.append(linha);
    if (pagina.filhos.length) item.append(filhos);
    return item;
  }

  function desenharArvore() {
    const lista = criar("ul", "tree-root");
    lista.append(desenharRamo(raiz));
    document.getElementById("nos").replaceChildren(lista);
  }

  function mostrarPagina(id) {
    selecionada = id;
    const pagina = paginas.get(id);
    const caminho = [];
    let mudou = false;
    for (let atual = pagina; atual; atual = paginas.get(atual.paiId)) {
      caminho.unshift(atual.titulo);
      if (atual.id !== id && recolhidos.delete(atual.id)) mudou = true;
    }
    if (mudou) desenharArvore();
    document.getElementById("no-atual").textContent = pagina.titulo;
    document.getElementById("no-id").textContent = pagina.id;
    document.getElementById("no-pai").textContent = pagina.paiId || "(raiz: sem pai)";
    document.getElementById("no-caminho").textContent = caminho.join(" → ");
    const filhos = document.getElementById("no-filhos");
    filhos.replaceChildren(...pagina.filhos.map(filho => {
      const botao = criar("button", "child-link", filho.id);
      botao.onclick = () => mostrarPagina(filho.id);
      return botao;
    }));
    if (!pagina.filhos.length) filhos.textContent = "[]";
    const subir = document.getElementById("subir-pai");
    subir.disabled = !pagina.paiId;
    subir.onclick = () => { if (pagina.paiId) mostrarPagina(pagina.paiId); };
    document.querySelectorAll(".node-label").forEach(botao =>
      botao.setAttribute("aria-current", String(botao.dataset.pageId === id)));
  }

  function arvore(dados) {
    paginas = new Map(dados.elementos.map(pagina => [pagina.id, pagina]));
    raiz = dados.raiz;
    selecionada = raiz.id;
    recolhidos.clear();
    desenharArvore();
    mostrarPagina(raiz.id);
    document.getElementById("arvore-contagem").textContent = paginas.size + " páginas";
    document.getElementById("resposta-api").textContent = JSON.stringify(dados.entrada, null, 2);
    document.getElementById("expandir-tudo").onclick = () => {
      recolhidos.clear();
      desenharArvore();
    };
    document.getElementById("recolher-tudo").onclick = () => {
      paginas.forEach(pagina => { if (pagina.filhos.length) recolhidos.add(pagina.id); });
      selecionada = raiz.id;
      desenharArvore();
      mostrarPagina(raiz.id);
    };
  }

  return {
    lista(numero, etapa, dados) {
      if (!dados || etapa === 0) return null;
      if (numero === 1) return backlog(etapa, dados);
      if (numero === 2) return fila(etapa, dados);
      if (numero === 3) return pilha(etapa, dados);
      if (numero === 4) return mapa(etapa, dados);
      if (numero === 6) return grafo(etapa, dados);
      if (numero === 9) return arquivo(etapa, dados);
      if (numero === 11) return banco(etapa, dados);
      return null;
    },
    arvore
  };
})();
