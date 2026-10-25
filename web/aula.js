/* Material da aula: contexto, fluxos e fechamento. Os dados calculados vêm do backend. */
const Aula = (() => {
  function no(tag, classe, texto) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  function seta() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 36 32");
    svg.setAttribute("class", "flow-arrow");
    svg.setAttribute("aria-hidden", "true");
    const caminho = document.createElementNS(svg.namespaceURI, "path");
    caminho.setAttribute("d", "M3 16 H31 M23 8 L31 16 L23 24");
    caminho.setAttribute("fill", "none");
    caminho.setAttribute("stroke", "currentColor");
    caminho.setAttribute("stroke-width", "2");
    svg.append(caminho);
    return svg;
  }

  function fluxo(passos, decisao) {
    const figura = no("figure", "flowchart");
    figura.append(no("figcaption", "eyebrow", "COMO OS DADOS SE TRANSFORMAM"));
    const trilha = no("ol", "flow-track");
    passos.forEach((passo, indice) => {
      if (indice) trilha.append(seta());
      const item = no("li", "flow-node " + passo.tipo);
      item.append(no("span", "flow-label", passo.rotulo), no("p", "", passo.texto));
      trilha.append(item);
    });
    figura.append(trilha);
    if (decisao) {
      const ramificacao = no("div", "decision-flow");
      ramificacao.append(no("div", "decision-node", "◇ " + decisao.pergunta));
      const respostas = no("div", "decision-results");
      for (const [rotulo, texto] of [["SIM", decisao.sim], ["NÃO", decisao.nao]]) {
        const resultado = no("div", "decision-result");
        resultado.append(no("span", "eyebrow", rotulo), no("p", "", texto));
        respostas.append(resultado);
      }
      ramificacao.append(respostas);
      figura.append(ramificacao);
    }
    return figura;
  }

  function cartao(rotulo, texto) {
    const bloco = no("section", "lesson-fact");
    bloco.append(no("h3", "", rotulo), no("p", "", texto));
    return bloco;
  }

  function inicio(exemplo, navegar, termosAnteriores = []) {
    const painel = no("div", "lesson-intro");
    const fatos = no("div", "lesson-facts single");
    fatos.append(cartao("O objetivo", exemplo.objetivo));
    painel.append(fatos, fluxo([
      {rotulo:"Dados de entrada",texto:exemplo.entrada,tipo:"input"},
      {rotulo:"Estruturas que vamos usar",texto:exemplo.estruturas.join(" · "),tipo:"process"},
      {rotulo:"Resultado esperado",texto:exemplo.resultadoEsperado,tipo:"output"}
    ]));
    const percurso = no("section", "lesson-roadmap");
    percurso.append(no("h3", "", "O caminho deste exemplo"));
    const lista = no("ol", "roadmap-list");
    exemplo.etapas.forEach((etapa, indice) => {
      const item = no("li");
      const botao = no("button", "roadmap-step");
      botao.append(no("span", "roadmap-number", String(indice + 1).padStart(2, "0")),
        no("span", "", etapa.titulo));
      botao.disabled = !navegar;
      if (navegar) botao.onclick = () => navegar(indice + 1);
      item.append(botao);
      lista.append(item);
    });
    percurso.append(lista);
    painel.append(percurso);
    const termos = no("section", "lesson-glossary");
    const anteriores = new Set(termosAnteriores.map(termo => termo.toLocaleLowerCase("pt-BR")));
    const novos = exemplo.termos.filter(([termo]) => !anteriores.has(termo.toLocaleLowerCase("pt-BR")));
    const retomados = exemplo.termos.filter(([termo]) => anteriores.has(termo.toLocaleLowerCase("pt-BR")));
    termos.append(no("h3", "", novos.length ? `Conceitos novos · ${novos.length}` : "Conceitos deste cenário"));
    const grade = no("dl", "glossary-grid");
    novos.forEach(([termo, definicao]) => {
      const item = no("div");
      item.append(no("dt", "", termo), no("dd", "", definicao));
      grade.append(item);
    });
    termos.append(grade);
    if (retomados.length) {
      const revisar = no("details", "review-glossary");
      const quantidade = retomados.length;
      revisar.append(no("summary", "", `Retomar ${quantidade} ${quantidade === 1 ? "termo" : "termos"} apresentado${quantidade === 1 ? "" : "s"} antes`));
      const termosAnterioresLista = no("dl", "glossary-grid");
      retomados.forEach(([termo, definicao]) => {
        const item = no("div");
        item.append(no("dt", "", termo), no("dd", "", definicao));
        termosAnterioresLista.append(item);
      });
      revisar.append(termosAnterioresLista);
      termos.append(revisar);
    }
    painel.append(termos);
    return painel;
  }

  function etapa(conteudo) {
    const painel = no("div", "step-explanation");
    conteudo.explicacao.forEach(paragrafo => painel.append(no("p", "explanation-paragraph", paragrafo)));
    painel.append(fluxo([
      {rotulo:"Entrada",texto:conteudo.entrada,tipo:"input"},
      {rotulo:conteudo.estrutura,texto:conteudo.acao,tipo:"process"},
      {rotulo:"Saída",texto:conteudo.saida,tipo:"output"}
    ], conteudo.decisao));
    const motivo = no("section", "why-choice");
    motivo.append(no("strong", "", "Por que esta operação vem agora?"), no("p", "", conteudo.porQue));
    painel.append(motivo);
    if (conteudo.aprofundamento) {
      const detalhes = no("details", "deep-dive");
      detalhes.append(no("summary", "", "Explorar os detalhes desta estrutura"));
      conteudo.aprofundamento.forEach(texto => detalhes.append(no("p", "", texto)));
      painel.append(detalhes);
    }
    return painel;
  }

  function fim(exemplo, etapasCalculadas) {
    const painel = no("div", "lesson-conclusion");
    const conclusao = exemplo.conclusao;
    painel.append(fluxo([
      {rotulo:"Problema",texto:exemplo.objetivo,tipo:"input"},
      {rotulo:"Solução",texto:exemplo.estruturas.join(" · "),tipo:"process"},
      {rotulo:"Resultado",texto:conclusao.resultado,tipo:"output"}
    ]));
    const fatos = no("div", "lesson-facts");
    fatos.append(cartao("Por que funcionou", conclusao.porque),
      cartao("Onde isso aparece no trabalho", conclusao.aplicacao),
      cartao("Até onde este exemplo vai", conclusao.limite));
    painel.append(fatos);
    const conferir = no("details", "check-understanding");
    conferir.append(no("summary", "", conclusao.pergunta), no("p", "", conclusao.resposta));
    painel.append(no("h3", "", "Confira seu entendimento"), conferir);
    const evidencias = no("details", "execution-evidence");
    evidencias.append(no("summary", "", "Consultar o resultado da execução realizada"));
    const etapas = exemplo.id === 10 ? etapasCalculadas.filter(e => e.numero >= 8) : etapasCalculadas.slice(-1);
    evidencias.append(no("pre", "", etapas.map(e => e.titulo + "\n" + e.linhas).join("\n\n")));
    painel.append(evidencias);
    return painel;
  }

  return {inicio, etapa, fim};
})();
