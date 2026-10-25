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
      if (numero === 9) return arquivo(etapa, dados);
      if (numero === 11) return banco(etapa, dados);
      return null;
    },
    arvore
  };
})();
