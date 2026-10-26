"use strict";

const porId = id => document.getElementById(id);
const elemento = (tag, classe, texto) => {
  const no = document.createElement(tag);
  if (classe) no.className = classe;
  if (texto !== undefined) no.textContent = texto;
  return no;
};
let catalogo = [], exemplo, etapas = [], etapasCalculadas = [], posicao = 0;
let requisicao, dadosVisuais, versao = 0, fontesAtuais = [], indiceFonte = 0;
const etapasReveladas = new Set();
const cacheCodigo = new Map();

async function obterJson(url, sinal) {
  const resposta = await fetch(url, {signal: sinal});
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar os dados.");
  return dados;
}

function limparEtapas() {
  requisicao?.abort();
  versao++;
  etapas = []; etapasCalculadas = []; dadosVisuais = null; posicao = 0; etapasReveladas.clear();
  porId("apresentacao").hidden = true;
  porId("vazio").hidden = false;
  porId("erro").hidden = true;
  porId("executar").disabled = false;
  porId("executar").textContent = "Iniciar passo a passo →";
  porId("min-samples").disabled = false;
  porId("min-cluster-size").disabled = false;
}

function termosDeExemplosAnteriores(item) {
  return catalogo.slice(0, catalogo.indexOf(item)).flatMap(exemplo =>
    exemplo.termos.map(([termo]) => termo));
}

function selecionar(item) {
  exemplo = item;
  limparEtapas();
  const numero = catalogo.indexOf(item) + 1;
  porId("categoria").textContent = "EXEMPLO " + numero + " DE " + catalogo.length + " · " + item.grupo.toLocaleUpperCase("pt-BR") + " · " + item.linguagem;
  porId("titulo").textContent = item.titulo;
  porId("contexto").textContent = item.contexto;
  porId("estruturas").replaceChildren(...item.estruturas.map(nome => elemento("span", "chip", nome)));
  porId("parametros").hidden = item.id !== 10;
  porId("comando").textContent = "";
  porId("status").textContent = "Comece pelo problema e pelos termos. Depois, avance com a execução real.";
  const preparar = Aula.inicio(item, null, termosDeExemplosAnteriores(item));
  const iniciar = elemento("button", "primary", "Vamos resolver este problema →");
  iniciar.onclick = executar;
  preparar.append(iniciar);
  porId("vazio").replaceChildren(preparar);
  document.querySelectorAll(".example").forEach(botao =>
    botao.setAttribute("aria-current", String(Number(botao.dataset.id) === item.id)));
  history.replaceState(null, "", "#" + item.id);
}

async function executar() {
  limparEtapas();
  const minhaVersao = versao;
  requisicao = new AbortController();
  porId("executar").disabled = true;
  porId("executar").textContent = "Preparando a execução…";
  porId("status").textContent = "Executando o exemplo para acompanhar os dados reais de cada etapa.";
  porId("min-samples").disabled = true;
  porId("min-cluster-size").disabled = true;
  const parametros = new URLSearchParams();
  if (exemplo.id === 10) {
    parametros.set("min_samples", porId("min-samples").value);
    parametros.set("min_cluster_size", porId("min-cluster-size").value);
  }
  try {
    const dados = await obterJson("/api/exemplos/" + exemplo.id + "?" + parametros, requisicao.signal);
    if (minhaVersao !== versao) return;
    etapasCalculadas = dados.etapas;
    etapas = [...etapasCalculadas, {numero:-1, titulo:"Resultado final e escolha das estruturas"}];
    dadosVisuais = dados.visual || null;
    if (exemplo.id === 12) Visuais.arvore(dadosVisuais);
    porId("saida-completa").textContent = dados.saida;
    porId("apresentacao").hidden = false;
    porId("vazio").hidden = true;
    porId("executar").textContent = "Executar novamente ↺";
    porId("status").textContent = "A execução foi calculada. Vamos percorrer começo, etapas e resultado.";
    renderizarEtapa();
    porId("apresentacao").scrollIntoView({behavior:"smooth",block:"start"});
  } catch (erro) {
    if (erro.name === "AbortError" || minhaVersao !== versao) return;
    porId("erro").textContent = erro.message;
    porId("erro").hidden = false;
    porId("status").textContent = "Confira a mensagem e tente executar novamente.";
  } finally {
    if (minhaVersao === versao) {
      porId("executar").disabled = false;
      porId("min-samples").disabled = false;
      porId("min-cluster-size").disabled = false;
      if (!etapas.length) porId("executar").textContent = "Tentar novamente →";
    }
  }
}

function renderizarLinhas(texto, visual) {
  const linhas = texto.split("\n");
  const fragmento = document.createDocumentFragment(), textoExtra = [], observacoes = [];
  let temMatriz = false;
  porId("log").classList.toggle("com-visual", Boolean(visual));
  for (let i=0;i<linhas.length;i++) {
    if (/^(Entrada|Por que agora|Escolha|Saída):/.test(linhas[i].trim())) {
      while (i+1<linhas.length && /^ {6}\S/.test(linhas[i+1])) i++;
      continue; // A explicação didática está acima; a saída integral permanece disponível ao final.
    }
    const inicio = linhas[i].trim();
    if (!inicio) continue;
    const classe = inicio.startsWith("✓") ? "success" : inicio.startsWith("!") ? "warning" :
      inicio.startsWith("×") ? "danger" : inicio.startsWith("↳") ? "hint" :
      inicio.startsWith("▸") ? "section" : "";
    const linha = elemento("div", "log-line " + classe, linhas[i]);
    if (/^\s*[A-I]\s+-?\d/.test(linhas[i]) || /^\s*[A-I](?:\s+[A-I]){2,}\s*$/.test(linhas[i])) {
      linha.classList.add("matrix-line");
      temMatriz = true;
    }
    if (!visual) fragmento.append(linha);
    else if (classe === "hint") observacoes.push(linha);
    else textoExtra.push(linha);
  }
  if (visual) {
    fragmento.append(visual);
    const detalhe = elemento("details", "stage-text-output");
    detalhe.append(elemento("summary", "", "Conferir os mesmos dados em texto"), ...textoExtra);
    fragmento.append(detalhe, ...observacoes);
  }
  porId("log").replaceChildren(fragmento);
  porId("log").classList.toggle("numeric-output", temMatriz);
}

function renderizarEtapa() {
  const etapa = etapas[posicao], fim = etapa.numero === -1, inicio = etapa.numero === 0;
  const conteudo = inicio || fim ? null : exemplo.etapas[etapa.numero-1];
  const revelada = Boolean(conteudo && etapasReveladas.has(etapa.numero));
  porId("etapa-numero").textContent = inicio ? "COMEÇO · ENTENDER O PROBLEMA" : fim ? "FIM · CONECTAR O RESULTADO" :
    "ETAPA " + etapa.numero + (revelada ? " · EXPLICAR E CONFERIR" : " · PREVER ANTES DE REVELAR");
  porId("etapa-titulo").textContent = inicio ? "O que vamos resolver e por onde começar" : fim ? etapa.titulo : conteudo.titulo;
  porId("explicacao").replaceChildren(inicio ? Aula.inicio(exemplo, irParaEtapa, termosDeExemplosAnteriores(exemplo)) :
    fim ? Aula.fim(exemplo, etapasCalculadas) : revelada ? Aula.etapa(conteudo) : Aula.previsao(conteudo, () => {
      etapasReveladas.add(etapa.numero);
      renderizarEtapa();
      porId("etapa-titulo").focus({preventScroll:true});
      porId("etapa-titulo").scrollIntoView({behavior:"smooth",block:"start"});
    }));
  porId("resultado-titulo").hidden = !revelada;
  porId("log").hidden = !revelada;
  if (revelada) renderizarLinhas(etapa.linhas, Visuais.lista(exemplo.id, etapa.numero, dadosVisuais));
  const indiceExemplo = catalogo.indexOf(exemplo);
  const etapaSeguinte = inicio ? exemplo.etapas[0] : conteudo ? exemplo.etapas[etapa.numero] : null;
  const exemploSeguinte = fim ? catalogo[indiceExemplo + 1] : null;
  const nota = inicio ? {pergunta:exemplo.pergunta,resposta:"",proximo:etapaSeguinte?.titulo,
    proximoRotulo:"Primeira etapa"} :
    fim ? {pergunta:exemplo.conclusao.pergunta,resposta:exemplo.conclusao.resposta,
      proximo:exemploSeguinte?.titulo,proximoRotulo:"Próximo exemplo"} :
      {pergunta:conteudo.pergunta,resposta:conteudo.resposta,proximo:etapaSeguinte?.titulo,
        proximoRotulo:"Próxima etapa"};
  porId("pergunta-contexto").textContent = inicio ? "QUESTÃO DE ABERTURA" : fim ? "REVISÃO DO EXEMPLO" : "PERGUNTA DA ETAPA";
  porId("pergunta").textContent = nota.pergunta;
  porId("resposta").textContent = nota.resposta;
  porId("resposta-container").hidden = !nota.resposta;
  porId("painel-proximo").hidden = !nota.proximo;
  if (nota.proximo) {
    porId("proximo-label").textContent = nota.proximoRotulo;
    porId("ponte").textContent = nota.proximo;
  }
  porId("roteiro").querySelector("details").open = false;
  const indice = catalogo.indexOf(exemplo);
  porId("anterior").disabled = inicio && indice === 0;
  porId("anterior").textContent = inicio ? "← Exemplo anterior" : "← Voltar";
  porId("proximo").disabled = fim && indice === catalogo.length-1;
  porId("proximo").textContent = fim ? (indice===catalogo.length-1 ? "Oficina concluída ✓" : "Próximo exemplo →") : "Avançar →";
  porId("progresso").textContent = inicio ? "Começo" : fim ? "Resultado final" : etapa.numero + " de " + exemplo.etapas.length + " etapas";
  porId("etapas").replaceChildren(...etapas.map((item,i)=>{
    const revelada = item.numero>0 && etapasReveladas.has(item.numero);
    const rotulo = item.numero===0 ? "Começo" : item.numero===-1 ? "Resultado" : String(item.numero).padStart(2,"0")+(revelada?" ✓":"");
    const botao = elemento("button","step"+(revelada?" is-revealed":""),rotulo);
    botao.title = item.numero>0 ? exemplo.etapas[item.numero-1].titulo : item.titulo;
    if (i===posicao) botao.setAttribute("aria-current","step");
    botao.onclick=()=>irParaEtapa(i);
    return botao;
  }));
  porId("arvore").hidden = exemplo.id!==12 || !dadosVisuais || inicio || fim || !revelada;
  acompanharCodigo(etapa.numero);
}

async function mover(direcao) {
  if (!etapas.length) return;
  const destino=posicao+direcao;
  if (destino>=0 && destino<etapas.length) { irParaEtapa(destino); return; }
  const indice=catalogo.indexOf(exemplo)+direcao;
  if (indice<0 || indice>=catalogo.length) return;
  selecionar(catalogo[indice]);
  window.scrollTo({top:0,behavior:"smooth"});
  await executar();
  if (direcao<0 && etapas.length) irParaEtapa(etapas.length-1);
}

function irParaEtapa(indice) {
  posicao=indice;
  renderizarEtapa();
  porId("apresentacao").scrollIntoView({behavior:"smooth",block:"start"});
}

async function acompanharCodigo(numero) {
  const id=exemplo.id, chave=id+":"+numero;
  const referencias=numero===0?exemplo.codigoInicial:numero===-1?exemplo.codigoFinal:exemplo.etapas[numero-1].codigo;
  porId("classe-ativa").textContent=referencias.map(r=>r.arquivo.split("/").pop()+(r.simbolo?" · "+r.simbolo:"")).join("  |  ");
  fontesAtuais=[];
  porId("fontes-seletor").replaceChildren();
  porId("fonte-path").textContent=referencias[0].arquivo;
  porId("codigo-descricao").textContent="Localizando as linhas desta etapa…";
  porId("fonte-trecho").textContent="Carregando o trecho da classe…";
  porId("classe-completa").checked=false;
  try {
    if(!cacheCodigo.has(chave)) cacheCodigo.set(chave,await obterJson("/api/codigo/"+id+"?etapa="+numero));
    if(exemplo.id!==id || etapas[posicao]?.numero!==numero) return;
    fontesAtuais=cacheCodigo.get(chave);indiceFonte=0;
    porId("fontes-seletor").replaceChildren(...fontesAtuais.map((fonte,i)=>{
      const botao=elemento("button","source-tab",fonte.arquivo.split("/").pop()+" · "+fonte.simbolo);
      botao.onclick=()=>{indiceFonte=i;renderizarCodigo();};
      return botao;
    }));
    renderizarCodigo();
  } catch(erro) { if(exemplo.id===id && etapas[posicao]?.numero===numero) porId("fonte-trecho").textContent=erro.message; }
}

function renderizarCodigo() {
  const fonte=fontesAtuais[indiceFonte];
  if(!fonte)return;
  const completo=porId("classe-completa").checked;
  porId("classe-ativa").textContent=fonte.arquivo.split("/").pop()+(fonte.simbolo?" · "+fonte.simbolo:"")+
    (fonte.linhaFoco?" · linha "+fonte.linhaFoco:"");
  porId("codigo-titulo").textContent=fonte.arquivo.split("/").pop()+" · "+fonte.simbolo;
  porId("fonte-path").textContent=fonte.arquivo;
  porId("codigo-descricao").textContent=fonte.linhaFoco
    ? "Linha "+fonte.linhaFoco+" destacada: operação principal desta etapa. Trecho real entre as linhas "+fonte.inicio+" e "+fonte.fim+"."
    : "Linhas "+fonte.inicio+" a "+fonte.fim+" do arquivo real. Abra este caminho no editor para acompanhar a etapa.";
  const linhas=completo?fonte.codigo.split("\n"):fonte.trecho, primeira=completo?1:fonte.inicio;
  porId("fonte-trecho").replaceChildren(...linhas.map((texto,i)=>{
    const numero=primeira+i;
    const linha=elemento("span","code-line"+(completo&&numero>=fonte.inicio&&numero<=fonte.fim?" is-scope":"")+
      (numero===fonte.linhaFoco?" is-focus":""));
    linha.append(elemento("span","line-number",String(numero)),elemento("code","",texto||" "));
    return linha;
  }));
  const painel=porId("fonte-trecho"), foco=painel.querySelector(".is-focus")||painel.querySelector(".is-scope");
  painel.scrollTop=0;
  if(foco) painel.scrollTop=foco.getBoundingClientRect().top-painel.getBoundingClientRect().top-28;
  porId("fontes-seletor").querySelectorAll("button").forEach((b,i)=>b.setAttribute("aria-pressed",String(i===indiceFonte)));
}

porId("executar").onclick=executar;
porId("anterior").onclick=()=>mover(-1);
porId("proximo").onclick=()=>mover(1);
porId("reiniciar").onclick=()=>irParaEtapa(0);
porId("classe-completa").onchange=renderizarCodigo;
porId("ir-codigo").onclick=()=>porId("codigo").scrollIntoView({behavior:"smooth",block:"start"});
porId("copiar-path").onclick=async()=>{
  try { await navigator.clipboard.writeText(porId("fonte-path").textContent);porId("copiar-path").textContent="Caminho copiado ✓"; }
  catch { porId("codigo-descricao").textContent="Caminho: "+porId("fonte-path").textContent; }
  setTimeout(()=>porId("copiar-path").textContent="Copiar caminho",1600);
};
porId("notas-toggle").onchange=e=>document.body.classList.toggle("sem-notas",!e.target.checked);
porId("tela-cheia").onclick=async()=>{
  try { if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen(); }
  catch { porId("status").textContent="O modo de tela cheia também pode ser ativado pelo navegador."; }
};
let tamanho=18;
for(const[id,diferenca]of [["fonte-menor",-1],["fonte-maior",1]])porId(id).onclick=()=>{
  tamanho=Math.min(25,Math.max(14,tamanho+diferenca));
  document.documentElement.style.setProperty("--content-size",tamanho+"px");
};
for(const id of ["min-samples","min-cluster-size"])porId(id).onchange=()=>{
  limparEtapas();
  porId("status").textContent="Parâmetros alterados. Inicie novamente para obter e explicar a nova execução.";
};
document.addEventListener("keydown",evento=>{
  if(evento.target.closest("input,select,textarea,summary,a"))return;
  if(evento.key==="ArrowRight"||evento.key==="ArrowLeft"){evento.preventDefault();mover(evento.key==="ArrowRight"?1:-1);}
});
(async()=>{
  try {
    catalogo=await obterJson("/api/exemplos");
    porId("quantidade").textContent=catalogo.length+" exemplos · começo, etapas e resultado";
    porId("catalogo").replaceChildren();
    const grupos = new Map();
    catalogo.forEach((item,i)=>{
      if (!grupos.has(item.grupo)) {
        const secao=elemento("section","example-group");
        const lista=elemento("div","example-list");
        secao.append(elemento("h2","example-group-heading",item.grupo),lista);
        grupos.set(item.grupo,lista);
        porId("catalogo").append(secao);
      }
      const botao=elemento("button","example");botao.dataset.id=item.id;
      botao.append(elemento("span","number",String(i+1).padStart(2,"0")),elemento("span","",item.titulo));
      botao.onclick=()=>selecionar(item);
      grupos.get(item.grupo).append(botao);
    });
    selecionar(catalogo.find(item=>item.id===Number(location.hash.slice(1)))||catalogo[0]);
  } catch(erro){porId("erro").textContent=erro.message;porId("erro").hidden=false;}
})();

