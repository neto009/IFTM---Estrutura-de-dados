import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const OUT = path.resolve('docs');
const PHOTO_PATH = process.env.SOLANGE_PHOTO_PATH ? path.resolve(process.env.SOLANGE_PHOTO_PATH) : '';
const PHOTO_EXT = PHOTO_PATH ? path.extname(PHOTO_PATH).slice(1).toLowerCase() : '';
if (PHOTO_PATH && !['jpg','jpeg','png'].includes(PHOTO_EXT)) throw new Error('A foto deve estar em JPG ou PNG.');
const W = 1600, H = 900, EMU = 7620;
const C = {
  bg: '111436', bg2: '191D49', card: '1D2454', card2: '252C63', ink: 'F7F3E8',
  muted: 'C0C5DC', quiet: '858DB7', gold: 'F4BA58', aqua: '59D6C5', coral: 'F17C98',
  lime: 'B2DF78', dark: '0C1029', stroke: '3A427A'
};
const slides = [];
const notes = [];
function rect(s,x,y,w,h,fill,opts={}) { s.blocks.push({type:'rect',x,y,w,h,fill,stroke:opts.stroke||'none',sw:opts.sw||0,r:opts.r??18,alpha:opts.alpha??100000}); }
function photo(s,x,y,w,h,file){ s.blocks.push({type:'image',x,y,w,h,file,ext:path.extname(file).slice(1).toLowerCase()}); }
function txt(s,x,y,w,h,text,opts={}) { s.blocks.push({type:'text',x,y,w,h,text,fs:opts.fs||26,color:opts.color||C.ink,bold:opts.bold||false,font:opts.font||'Aptos',align:opts.align||'left',valign:opts.valign||'top',lh:opts.lh||1.14,tracking:opts.tracking||0}); }
function rule(s,x,y,w,color=C.stroke,h=2) { rect(s,x,y,w,h,color,{r:0}); }
function pill(s,x,y,w,label,color=C.gold) {
  rect(s,x,y,w,34,C.card2,{r:17,stroke:color,sw:1,alpha:100000});
  txt(s,x+13,y+2,w-26,30,label,{fs:16,color,bold:true,align:'center',valign:'middle'});
}
function card(s,x,y,w,h,{fill=C.card,accent=C.aqua,label='',title='',body='',titleFs=27,bodyFs=21}={}) {
  rect(s,x,y,w,h,fill,{r:22,stroke:C.stroke,sw:1});
  rect(s,x,y,8,h,accent,{r:4});
  let cursor=y+22;
  if(label){ txt(s,x+28,cursor,w-55,22,label.toUpperCase(),{fs:15,color:accent,bold:true}); cursor+=31; }
  if(title){ const th=title.includes('\n')?64:54; txt(s,x+28,cursor,w-55,th,title,{fs:titleFs,bold:true,lh:1.05}); cursor+=th+8; }
  if(body){ const bh=y+h-16-cursor; if(bh>10) txt(s,x+28,cursor,w-55,bh,body,{fs:bodyFs,color:C.muted,lh:1.18}); }
}
function codeBox(s,x,y,w,h,label,code,accent=C.aqua,fs=20){
  rect(s,x,y,w,h,C.dark,{r:16,stroke:C.stroke,sw:1});
  txt(s,x+22,y+14,w-44,23,label.toUpperCase(),{fs:14,color:accent,bold:true});
  txt(s,x+22,y+46,w-44,h-58,code,{fs,font:'Menlo',color:C.ink,lh:1.32});
}
function metric(s,x,y,w,h,value,label,accent=C.aqua){
  rect(s,x,y,w,h,C.card2,{r:17,stroke:C.stroke,sw:1});
  txt(s,x+15,y+4,w-30,h*0.46,value,{fs:29,color:accent,bold:true,align:'center',valign:'middle'});
  txt(s,x+15,y+h*0.55,w-30,h*0.34,label,{fs:14,color:C.muted,bold:true,align:'center',valign:'middle'});
}

function base(kicker,title,subtitle='') {
  const s={kicker,title,subtitle,blocks:[]};
  rect(s,0,0,W,H,C.bg,{r:0});
  // Quiet, outlined squares echo the supplied reference palette.
  for (const [x,y,size] of [[1370,35,48],[1450,92,42],[1516,25,30],[1402,153,28],[1535,165,50],[1318,106,25]]) {
    rect(s,x,y,size,size,'none',{r:0,stroke:C.stroke,sw:2,alpha:36000});
  }
  pill(s,96,49,Math.min(420,Math.max(150,kicker.length*10+42)),kicker,C.aqua);
  txt(s,96,104,1400,78,title,{fs:title.length>56?40:title.length>48?44:title.length>40?48:54,bold:true,lh:1.02});
  if(subtitle) txt(s,98,187,1360,42,subtitle,{fs:subtitle.length>110?18:subtitle.length>90?20:23,color:C.muted});
  rule(s,96,824,1408,C.stroke,1);
  txt(s,96,841,800,24,'ESTRUTURAS DE DADOS  ·  SOLANGE BRASILEIRO',{fs:14,color:C.quiet,bold:true});
  txt(s,1440,837,64,28,String(slides.length+1).padStart(2,'0'),{fs:17,color:C.quiet,bold:true,align:'right'});
  slides.push(s); return s;
}
function addNote(title, content, files='') { notes.push({title,content,files}); }

// 01 — Capa
{
  const s={kicker:'MINICURSO  ·  UBERLÂNDIA',title:'',subtitle:'',blocks:[]};
  rect(s,0,0,W,H,C.bg,{r:0});
  for(let row=0;row<6;row++) for(let col=0;col<8;col++) {
    const x=980+col*82+(row%2)*28, y=40+row*82;
    const size=(row+col)%3===0?48:32;
    rect(s,x,y,size,size,'none',{r:0,stroke:C.stroke,sw:2,alpha:(row+col)%3===0?30000:20000});
  }
  // Graphic: structures become connected parts of a system.
  rect(s,1040,252,420,360,C.bg2,{r:32,stroke:C.stroke,sw:1});
  txt(s,1082,283,330,28,'UM SISTEMA, VÁRIAS FORMAS DE ACESSAR',{fs:15,color:C.aqua,bold:true});
  const nodes=[['LISTA',1078,365,C.gold],['FILA',1265,365,C.aqua],['GRAFO',1168,495,C.coral]];
  for(const [label,x,y,col] of nodes){rect(s,x,y,150,70,C.card2,{r:18,stroke:col,sw:2});txt(s,x,y+5,150,58,label,{fs:22,color:col,bold:true,align:'center',valign:'middle'});}
  rule(s,1228,398,37,C.quiet,3); txt(s,1232,386,28,30,'›',{fs:28,color:C.quiet,bold:true,align:'center'});
  rule(s,1196,437,3,C.quiet,45); txt(s,1183,465,30,30,'⌄',{fs:24,color:C.quiet,bold:true,align:'center'});
  txt(s,96,95,700,30,'MINICURSO  ·  INSTITUTO FEDERAL  ·  UBERLÂNDIA',{fs:18,color:C.aqua,bold:true});
  txt(s,96,232,850,188,'Estruturas de dados\nno mundo real',{fs:76,bold:true,lh:1.0});
  txt(s,100,445,790,92,'Do backlog à busca por similaridade —\ncom exemplos de sistemas corporativos.',{fs:29,color:C.muted,lh:1.22});
  rule(s,100,609,550,C.stroke,2);
  txt(s,100,646,600,42,'SOLANGE BRASILEIRO',{fs:29,bold:true});
  txt(s,100,696,720,40,'Software Engineer  ·  Banco Bradesco  ·  BIA Tech',{fs:21,color:C.gold,bold:true});
  txt(s,100,817,620,24,'FUNDAMENTOS  →  SISTEMAS  →  IA',{fs:16,color:C.quiet,bold:true});
  slides.push(s);
  addNote('Abertura','Apresente a ideia central: a estrutura de dados é uma decisão que aparece em tarefas cotidianas de sistemas grandes. Explique que os exemplos são pequenos e fictícios para deixar visível a escolha por trás do código.','README.md');
}
// 02 — Ministrante
{
  const s=base('QUEM CONDUZ','Solange Brasileiro','Fundamentos de computação ligados aos desafios de sistemas corporativos.');
  rect(s,96,278,430,438,C.card,{r:28,stroke:C.stroke,sw:1});
  rect(s,191,302,240,278,C.bg2,{r:22,stroke:C.aqua,sw:2});
  if (PHOTO_PATH) photo(s,191,302,240,278,PHOTO_PATH);
  else { rect(s,268,350,86,86,C.quiet,{r:43}); rect(s,236,444,150,90,C.quiet,{r:44}); txt(s,202,540,218,28,'FOTO DA MINISTRANTE',{fs:15,color:C.aqua,bold:true,align:'center',valign:'middle'}); }
  txt(s,136,606,350,34,'SOLANGE BRASILEIRO',{fs:25,bold:true,align:'center'});
  txt(s,136,651,350,30,'Software Engineer · Banco Bradesco',{fs:17,color:C.muted,align:'center'});
  pill(s,232,681,158,'BIA TECH',C.gold);
  card(s,575,278,430,204,{accent:C.gold,label:'ATUAÇÃO',title:'Backend e sistemas distribuídos',body:'Decisões de dados e fluxo entre serviços.',titleFs:24,bodyFs:18});
  card(s,1030,278,474,204,{accent:C.aqua,label:'FOCO',title:'IA generativa',body:'Recuperação, contexto e uso responsável de informação.',titleFs:25,bodyFs:18});
  card(s,575,510,929,206,{accent:C.coral,label:'ESPECIALIDADE',title:'Soluções para o pós-desenvolvimento',body:'Conectar fundamentos da computação a desafios corporativos de grande escala.',titleFs:27,bodyFs:20});
  addNote('Quem conduz','Apresente sua mini bio: Software Engineer no Banco Bradesco, time BIA Tech, com atuação em backend, sistemas distribuídos e IA Generativa. Seu foco em soluções para o ciclo de pós-desenvolvimento conecta fundamentos da computação a desafios de grande escala.','');
}
// 03 — Percurso
{
  const s=base('MAPA DO MINICURSO','Da coleção em memória à decisão de IA','Pré-requisito: lógica básica de programação.');
  const xs=[96,568,1040], ws=432;
  card(s,xs[0],310,ws,320,{accent:C.gold,label:'1 · FUNDAMENTOS',title:'Organizar o trabalho',body:'Listas e prioridade\nFilas e pilhas\nMapas e árvores',titleFs:27,bodyFs:22});
  card(s,xs[1],310,ws,320,{accent:C.aqua,label:'2 · SISTEMAS',title:'Conectar componentes',body:'Mensageria e eventos\nGrafos de dependência\nBusca e observabilidade',titleFs:27,bodyFs:22});
  card(s,xs[2],310,ws,320,{accent:C.coral,label:'3 · IA APLICADA',title:'Comparar e agrupar',body:'Vetores e cosseno\nRAG com recuperação lexical\nHDBSCAN por etapas',titleFs:27,bodyFs:22});
  txt(s,96,682,1408,44,'Em cada tema: problema  →  estrutura  →  operação  →  resultado  →  limite',{fs:24,color:C.ink,bold:true,align:'center',valign:'middle'});
  addNote('Mapa','Explique a progressão. Primeiro, a ordem e o acesso aos dados. Depois, eventos e relações entre serviços. Por fim, representações numéricas para similaridade, recuperação e agrupamento. A turma precisa apenas de lógica básica; não precisa conhecer os algoritmos internos das bibliotecas.','README.md');
}
// 04 — Escolha
{
  const s=base('ANTES DO CÓDIGO','Qual operação precisa ser simples e previsível?','A regra de acesso orienta a estrutura; o cenário orienta a regra.');
  const items=[
    ['CHEGOU PRIMEIRO','retirar na mesma ordem','Queue · FIFO',C.gold],
    ['QUAL É O ID?','achar sem varrer a lista','HashMap · chave → valor',C.aqua],
    ['QUAL É A JANELA?','percorrer do início ao fim','TreeMap · subMap',C.coral],
    ['QUEM DEPENDE DE QUEM?','seguir conexões direcionadas','Grafo · BFS / DFS',C.lime]
  ];
  items.forEach((a,i)=>{const x=96+(i%2)*728,y=294+Math.floor(i/2)*212;rect(s,x,y,680,184,C.card,{r:22,stroke:C.stroke,sw:1});pill(s,x+24,y+22,50,String(i+1).padStart(2,'0'),a[3]);txt(s,x+96,y+22,545,36,a[0],{fs:17,color:a[3],bold:true});txt(s,x+96,y+62,545,42,a[1],{fs:25,bold:true});txt(s,x+96,y+119,545,34,a[2],{fs:20,color:C.muted});});
  txt(s,96,746,1408,36,'Uma aplicação costuma combinar estruturas diferentes no mesmo fluxo.',{fs:21,color:C.gold,bold:true,align:'center'});
  addNote('Escolha pela operação','Antes de escolher a classe, pergunte: inserir, remover, localizar por chave, priorizar, buscar uma faixa ou percorrer relações? Depois considere custo, ordem garantida, volume, mutabilidade e concorrência. Essa pergunta reaparece em todos os exemplos.','README.md · docs/roteiro-java.md');
}
// 05 — Lista e prioridade
{
  const s=base('FUNDAMENTO · LISTA','Backlog e prioridade são papéis diferentes','A lista conserva o conjunto; a fila de prioridade entrega o próximo chamado.');
  rect(s,96,282,640,384,C.card,{r:22,stroke:C.stroke,sw:1});
  txt(s,126,304,570,30,'BACKLOG · ARRAYLIST',{fs:16,color:C.gold,bold:true});
  const rows=[['#101','CRÍTICA','Checkout retorna erro 500'],['#104','CRÍTICA','Login bloqueado'],['#106','ALTA','Lentidão no frete'],['#102','BAIXA','Texto da página de ajuda']];
  rows.forEach((r,i)=>{const yy=354+i*65;if(i)rule(s,126,yy-10,570,C.stroke,1);txt(s,128,yy,62,27,r[0],{fs:20,bold:true});txt(s,201,yy,112,27,r[1],{fs:15,color:i<2?C.coral:i===2?C.gold:C.muted,bold:true});txt(s,321,yy,365,31,r[2],{fs:17,color:C.muted});});
  rect(s,772,282,732,384,C.bg2,{r:22,stroke:C.stroke,sw:1});
  txt(s,806,304,650,30,'PRÓXIMOS · PRIORITYQUEUE',{fs:16,color:C.aqua,bold:true});
  txt(s,806,351,650,36,'CRÍTICA primeiro; ID desempata',{fs:23,bold:true});
  const top=[['1','#101 · checkout'],['2','#104 · login'],['3','#107 · autenticação']];
  top.forEach((a,i)=>{const x=806+i*211;rect(s,x,415,190,76,i===0?C.card2:C.card,{r:16,stroke:i===2?C.gold:C.stroke,sw:1});txt(s,x+10,422,32,28,a[0],{fs:16,color:i===2?C.gold:C.aqua,bold:true,align:'center'});txt(s,x+46,422,134,54,a[1],{fs:16,bold:true,valign:'middle'});});
  txt(s,806,522,630,57,'O incidente #107 chega durante o plantão e entra na ordem pela mesma regra.',{fs:18,color:C.muted});
  pill(s,806,594,130,'peek · olhar',C.aqua);pill(s,948,594,130,'poll · retirar',C.gold);pill(s,1090,594,216,'offer · enfileirar',C.coral);
  codeBox(s,96,690,1408,102,'NA CONSULTA DO BACKLOG','filter(abertos)  →  sorted(prioridade, ID)  →  limit(3)',C.aqua,21);
  addNote('Lista e prioridade','Em ExemplosColecoes.listas, ArrayList mantém o backlog e a consulta não altera os dados originais. filter retira resolvidos e chamados já em atendimento; sorted ordena por prioridade e ID; limit(3) escolhe a amostra. Para encontrar apenas um próximo item, min custa O(n); ordenar todos custa O(n log n). PriorityQueue usa peek O(1), offer/poll O(log n), e sua iteração não está ordenada.','src/oficina/demonstracoes/ExemplosColecoes.java · src/oficina/casos/ConsultasChamados.java');
}
// 06 — Fila e pilha
{
  const s=base('FUNDAMENTO · FILA / PILHA','A posição de entrada define a próxima ação','Queue modela chegada; Deque também pode modelar o histórico de desfazer.');
  rect(s,96,282,680,430,C.card,{r:22,stroke:C.stroke,sw:1});
  pill(s,126,307,108,'FIFO',C.aqua);txt(s,250,311,475,30,'PEDIDOS NA ORDEM DE APROVAÇÃO',{fs:16,color:C.aqua,bold:true});
  const qx=[130,323,516];['PED-101','PED-102','PED-103'].forEach((v,i)=>{rect(s,qx[i],390,165,62,C.card2,{r:14,stroke:i===0?C.aqua:C.stroke,sw:1});txt(s,qx[i],396,165,50,v,{fs:17,bold:true,align:'center',valign:'middle'});});
  txt(s,130,468,570,35,'peek() consulta  ·  poll() remove a cabeça',{fs:18,color:C.muted});
  txt(s,130,516,580,46,'PAGO  →  EM_SEPARACAO',{fs:22,color:C.ink,bold:true});
  txt(s,130,600,580,46,'ArrayDeque + HashSet para evitar ID repetido.',{fs:17,color:C.quiet});
  rect(s,824,282,680,430,C.card,{r:22,stroke:C.stroke,sw:1});
  pill(s,854,307,108,'LIFO',C.gold);txt(s,980,311,475,30,'DESFAZER CONFIGURAÇÃO',{fs:16,color:C.gold,bold:true});
  [['TOPO','logs detalhados = sim'],['','timeout = 5 s'],['BASE','timeout = 2 s']].forEach((a,i)=>{const y=378+i*67;rect(s,984,y,370,52,i===0?C.card2:C.bg2,{r:12,stroke:i===0?C.gold:C.stroke,sw:1});txt(s,1001,y+5,334,42,a[1],{fs:18,color:i===0?C.gold:C.muted,bold:i===0,valign:'middle'});});
  txt(s,854,603,590,40,'push(snapshot)  →  pop() restaura o anterior',{fs:18,color:C.muted});
  addNote('Fila e pilha','Em FilaSeparacao, somente pedidos pagos entram na fila. Queue/ArrayDeque preserva FIFO; HashSet impede agendar o mesmo ID novamente. consultarProximo usa peek e iniciarProximo usa poll, devolvendo Optional.empty quando a fila está vazia. No EditorConfiguracao, o Deque funciona como pilha LIFO: cada alteração guarda um snapshot imutável; desfazer usa pop.','src/oficina/casos/FilaSeparacao.java · src/oficina/casos/EditorConfiguracao.java');
}
// 07 — HashMap
{
  const s=base('FUNDAMENTO · MAPA','Um ID leva direto ao registro que você precisa','HashMap indexa; Optional comunica ausência sem confundir com erro.');
  rect(s,96,286,720,430,C.card,{r:22,stroke:C.stroke,sw:1});
  txt(s,128,310,650,30,'CHAVE  →  VALOR',{fs:16,color:C.aqua,bold:true});
  [['1','Ana · ativa'],['2','Bruno · inativo'],['3','Clara · ativa']].forEach((a,i)=>{const y=365+i*70;rect(s,132,y,82,48,C.card2,{r:12,stroke:C.aqua,sw:1});txt(s,132,y+3,82,40,a[0],{fs:20,color:C.aqua,bold:true,align:'center',valign:'middle'});txt(s,240,y+6,420,36,a[1],{fs:22,valign:'middle'});});
  codeBox(s,858,286,646,208,'BUSCAR SEM EXIBIR O MAPA','usuarios.buscarPorId(1)\n  .filter(Usuario::ativo)\n  .map(Usuario::email)',C.gold,18);
  card(s,858,520,646,196,{accent:C.coral,label:'REGRAS DO REPOSITÓRIO',title:'ID repetido é recusado',body:'putIfAbsent cadastra; replace atualiza somente quem existe.',titleFs:22,bodyFs:17});
  txt(s,128,651,630,35,'Busca por chave: O(1) esperado · ordem não garantida',{fs:17,color:C.muted});
  addNote('Mapa de usuários','RepositorioUsuarios mantém um HashMap privado, indexado por Long. putIfAbsent protege IDs repetidos; replace só muda um cadastro existente. buscarPorId devolve Optional. O chamador pode filtrar conta ativa e mapear para email. O mapa não garante ordem; listarAtivos ordena explicitamente o resultado.','src/oficina/casos/RepositorioUsuarios.java · src/oficina/demonstracoes/ExemplosColecoes.java');
}
// 08 — TreeMap
{
  const s=base('FUNDAMENTO · ÁRVORE ORDENADA','Uma linha do tempo permite consultar uma faixa','TreeMap ordena timestamps; List guarda vários logs no mesmo instante.');
  rect(s,96,286,1408,142,C.card,{r:22,stroke:C.stroke,sw:1});
  rule(s,172,361,1250,C.quiet,3);
  const ts=[['12:00:00','pedido recebido',200,C.aqua],['12:00:30','timeout / token expirado',620,C.coral],['12:00:45','gateway lento',1060,C.gold],['12:01:00','pedido confirmado',1370,C.quiet]];
  ts.forEach(a=>{rect(s,a[2]-8,352,18,18,a[3],{r:9});txt(s,a[2]-95,306,190,28,a[0],{fs:16,color:C.ink,bold:true,align:'center'});txt(s,a[2]-130,382,260,32,a[1],{fs:15,color:a[3],align:'center'});});
  rect(s,172,447,1186,9,C.gold,{r:4,alpha:32000});
  txt(s,96,484,530,43,'CONSULTA  [12:00:00, 12:01:00)',{fs:22,color:C.gold,bold:true});
  metric(s,96,548,230,112,'4','registros na janela',C.aqua);metric(s,346,548,230,112,'2','erros encontrados',C.coral);
  codeBox(s,635,484,869,176,'OPERAÇÃO','subMap(inicio, true, fim, false)\nTreeMap<Instant, List<RegistroLog>>',C.aqua,19);
  txt(s,96,690,1408,44,'O fim exclusivo evita repetir o registro de fronteira em janelas consecutivas. Custo: O(log t + k).',{fs:19,color:C.muted,align:'center'});
  addNote('Árvore e janela temporal','LinhaDoTempoLogs usa NavigableMap/TreeMap com Instant como chave e List<RegistroLog> como valor. Os dados de demonstração chegam fora de ordem e há dois registros em 12:00:30. subMap(start,true,end,false) inclui o início, exclui o fim e depois flatMap combina as listas. O resultado é um snapshot, não uma visão mutável do mapa. A janela retorna quatro registros, dois erros.','src/oficina/casos/LinhaDoTempoLogs.java · src/oficina/demonstracoes/DadosOficina.java');
}
// 09 — Mensageria
{
  const s=base('SISTEMAS · EVENTOS','Fila limitada, duplicidade e falha são parte do fluxo','O consumidor precisa preservar o estado mesmo quando a entrega se repete.');
  const stages=[['PRODUTOR','401 · 402 · 401\n404 · 405 · 406',C.gold],['BUFFER','capacidade 3\nArrayBlockingQueue',C.aqua],['CONSUMIDOR','pedido por ID\nevento aplicado?',C.coral],['ESTADO','PAGO / falha\ncontadores',C.lime]];
  stages.forEach((a,i)=>{const x=96+i*360;rect(s,x,320,310,196,C.card,{r:20,stroke:C.stroke,sw:1});pill(s,x+20,338,Math.max(100,a[0].length*13),a[0],a[2]);txt(s,x+22,393,266,78,a[1],{fs:21,color:C.ink,bold:true,lh:1.35,align:'center',valign:'middle'});if(i<3)txt(s,x+312,384,45,54,'→',{fs:34,color:C.quiet,bold:true,align:'center',valign:'middle'});});
  rect(s,96,558,1408,144,C.bg2,{r:22,stroke:C.stroke,sw:1});
  metric(s,120,574,172,100,'6','entregas',C.aqua);metric(s,308,574,172,100,'4','aplicadas',C.lime);metric(s,496,574,172,100,'1','duplicada',C.gold);metric(s,684,574,172,100,'1','falha',C.coral);metric(s,872,574,172,100,'3','adiamentos',C.aqua);
  txt(s,1080,585,385,45,'401 é deduplicado.\n404 (pedido inexistente) vai à análise.',{fs:17,color:C.muted,lh:1.35});
  txt(s,96,741,1408,34,'HashSet em memória dá idempotência local; não garante transação distribuída.',{fs:19,color:C.gold,bold:true,align:'center'});
  addNote('Eventos e idempotência','ProcessamentoEventos simula produtor e consumidor em uma thread com fila ArrayBlockingQueue de capacidade 3. O evento 401 é entregue duas vezes; HashSet reconhece a reaplicação. O 404 aponta para PED-999, inexistente, e segue para uma fila de falhas. O exemplo conta seis entregas: quatro aplicadas, uma duplicada, uma falha e três adiamentos. Marcar o ID depois do sucesso permite que uma falha não bloqueie tentativa futura, mas Map/Set em memória não são transacionais nem persistentes.','src/oficina/demonstracoes/ProcessamentoEventos.java · src/oficina/casos/ConsumidorPagamentos.java');
}
// 10 — Grafo
{
  const s=base('SISTEMAS · GRAFOS','Uma aresta direcionada responde quem pode ser afetado','No exemplo: fornecedor → consumidor. A busca segue esse sentido.');
  rect(s,96,286,888,430,C.card,{r:22,stroke:C.stroke,sw:1});
  const nodes=[['autenticação',142,455,C.coral],['pedidos',432,358,C.aqua],['pagamentos',432,555,C.aqua],['notificações',736,455,C.gold]];
  nodes.forEach(n=>{rect(s,n[1],n[2],190,62,C.card2,{r:15,stroke:n[3],sw:2});txt(s,n[1]+8,n[2]+5,174,52,n[0],{fs:19,color:n[3],bold:true,align:'center',valign:'middle'});});
  txt(s,332,374,84,42,'→',{fs:32,color:C.quiet,bold:true,align:'center'});txt(s,332,565,84,42,'→',{fs:32,color:C.quiet,bold:true,align:'center'});txt(s,631,374,84,42,'→',{fs:32,color:C.quiet,bold:true,align:'center'});txt(s,631,565,84,42,'→',{fs:32,color:C.quiet,bold:true,align:'center'});
  rect(s,1024,286,480,430,C.bg2,{r:22,stroke:C.stroke,sw:1});
  pill(s,1054,312,220,'BFS · POR CAMADAS',C.aqua);txt(s,1054,367,410,44,'Falha em autenticação',{fs:25,bold:true});
  txt(s,1054,430,412,95,'alcança pedidos, pagamentos\ne notificações (uma vez)',{fs:20,color:C.muted,lh:1.35});
  rule(s,1054,546,410,C.stroke,1);txt(s,1054,570,410,42,'O(V + E)',{fs:28,color:C.gold,bold:true,font:'Menlo'});
  txt(s,1054,620,410,58,'Falha em notificações não volta\naos fornecedores.',{fs:17,color:C.quiet,lh:1.3});
  addNote('Grafo de dependências','DependenciasServicos usa um grafo direcionado do JGraphT. Uma aresta A→B significa que B depende de A. BFS visita por camadas; DFS aprofunda um caminho; ambos identificam os mesmos alcançáveis em ordens diferentes, O(V+E). Notificações aparece uma vez apesar dos dois caminhos; buscar a partir dela não alcança seus fornecedores.','src/oficina/casos/DependenciasServicos.java · src/oficina/demonstracoes/DadosOficina.java');
}
// 11 — Similaridade
{
  const s=base('IA · VETORES','Cosseno compara a proporção entre áreas','A consulta tem [pedidos, pagamentos, acesso] = [8, 6, 0].');
  rect(s,96,286,640,422,C.card,{r:22,stroke:C.stroke,sw:1});
  txt(s,128,310,570,30,'PERFIS HISTÓRICOS · LINHAS DO ARRAY',{fs:16,color:C.aqua,bold:true});
  const rows=[['Semana semelhante','[16, 12,  0]'],['Equipe de pedidos','[ 4,  0,  0]'],['Equipe de acesso','[ 0,  0, 12]'],['Equipe de pagamentos','[ 0,  6,  0]']];
  rows.forEach((r,i)=>{const y=366+i*66;if(i)rule(s,128,y-9,570,C.stroke,1);txt(s,130,y,300,31,r[0],{fs:18,color:C.muted});txt(s,448,y,240,31,r[1],{fs:19,color:C.ink,font:'Menlo',align:'right'});});
  rect(s,772,286,732,422,C.card,{r:22,stroke:C.stroke,sw:1});
  txt(s,806,310,650,30,'cosine_similarity(consulta, perfis)',{fs:18,color:C.gold,bold:true,font:'Menlo'});
  const ranks=[['Semana semelhante',1.0,C.aqua],['Equipe de pedidos',0.8,C.gold],['Equipe de pagamentos',0.6,C.coral],['Equipe de acesso',0.0,C.quiet]];
  ranks.forEach((r,i)=>{const y=370+i*67;txt(s,806,y,245,28,r[0],{fs:16,color:C.muted});rect(s,1056,y+3,286,18,C.bg2,{r:9});if(r[1])rect(s,1056,y+3,286*r[1],18,r[2],{r:9});txt(s,1353,y-2,98,30,r[1].toFixed(4),{fs:17,color:r[2],bold:true,font:'Menlo',align:'right'});});
  txt(s,806,650,652,32,'Mesma proporção → escore 1, mesmo com dobro do volume.',{fs:17,color:C.ink,bold:true});
  addNote('Vetores e cosseno','Em python/cosseno.py, a consulta [8,6,0] representa pedidos, pagamentos e acesso. O perfil “Semana semelhante” [16,12,0] tem o dobro do volume, mas a mesma proporção: cosseno 1. Os perfis de pedidos e pagamentos têm 0.8 e 0.6; acesso é 0. O escore compara direção/distribuição, não o volume total, não é causalidade nem probabilidade.','python/cosseno.py');
}
// 12 — RAG
{
  const s=base('IA · RAG','Recuperar fontes é diferente de gerar uma resposta','A oficina faz busca lexical com TF-IDF e prepara o contexto.');
  const steps=[['1 · DOCUMENTOS','D1 · pedidos\nD2 · pagamento\nD3 · acesso\nD4 · reembolso',C.gold],['2 · ÍNDICE','TF-IDF\nmatriz esparsa\nlinhas = artigos',C.aqua],['3 · CONSULTA','“Como vejo o pedido\napós o pagamento?”\ncosseno + ranking',C.coral],['4 · CONTEXTO','D2 → D1\ntítulos + textos\npara a próxima etapa',C.lime]];
  steps.forEach((a,i)=>{const x=96+i*360;rect(s,x,322,310,278,C.card,{r:20,stroke:C.stroke,sw:1});pill(s,x+21,340,140,a[0],a[2]);txt(s,x+24,395,262,142,a[1],{fs:19,color:C.ink,bold:true,lh:1.38});if(i<3)txt(s,x+312,424,44,44,'→',{fs:32,color:C.quiet,bold:true,align:'center'});});
  rect(s,96,635,1408,81,C.bg2,{r:17,stroke:C.stroke,sw:1});txt(s,122,651,1355,48,'RAG: recuperar  →  montar contexto  →  enviar ao gerador',{fs:25,color:C.ink,bold:true,align:'center',valign:'middle'});
  txt(s,96,753,1408,32,'Este repositório para na recuperação; não chama um modelo e não gera a resposta.',{fs:18,color:C.gold,bold:true,align:'center'});
  addNote('RAG e busca lexical','python/rag.py cria um índice TF-IDF dos artigos, com matriz CSR esparsa. A pergunta é transformada com o mesmo vocabulário; cosseno calcula escore e argsort escolhe os melhores. Para a pergunta do exemplo, D2 (“Pagamento e situação do pedido”) e D1 (“Acompanhamento de pedidos”) aparecem primeiro. montar_contexto reúne textos para uma geração posterior, que não está implementada neste repositório.','python/rag.py');
}
// 13 — HDBSCAN: dados e features
{
  const s=base('HDBSCAN · PREPARAR A ENTRADA','Primeiro defina o que cada ponto significa','Nove incidentes fictícios; somente duas medidas numéricas entram no agrupamento.');
  rect(s,96,286,760,432,C.card,{r:22,stroke:C.stroke,sw:1});
  txt(s,128,308,690,30,'REGISTRO DE NEGÓCIO  →  FEATURE NUMÉRICA',{fs:16,color:C.aqua,bold:true});
  const rows=[['A–D','IAM','~1 hora · 4–7 usuários',C.aqua],['E–H','Pagamentos','~5 horas · 47–55 usuários',C.gold],['I','Plataforma','24 horas · 500 usuários',C.coral]];
  rows.forEach((r,i)=>{const y=366+i*78;rect(s,130,y,58,44,r[3],{r:12});txt(s,130,y+3,58,36,r[0],{fs:18,color:C.bg,bold:true,align:'center',valign:'middle'});txt(s,212,y,190,36,r[1],{fs:19,bold:true,valign:'middle'});txt(s,404,y,395,36,r[2],{fs:17,color:C.muted,valign:'middle'});});
  txt(s,130,624,680,55,'Resumo, grupo e número identificam o chamado; não são features.',{fs:18,color:C.gold,bold:true});
  codeBox(s,900,286,604,200,'DUAS COLUNAS','[horas_para_resolver,\n usuarios_afetados]  →  StandardScaler',C.aqua,18);
  metric(s,900,516,188,112,'9 × 2','ndarray float64',C.aqua);metric(s,1098,516,188,112,'A–I','índice ↔ ticket',C.gold);metric(s,1296,516,188,112,'2–9','min_cluster_size',C.coral);
  txt(s,900,666,604,40,'Padronizar aproxima as escalas de horas e usuários.',{fs:17,color:C.muted,align:'center'});
  addNote('HDBSCAN: entrada','python/hdbscan_exemplo.py cria dataclass Incidente com número, grupo, resumo, horas e usuários. Só horas e usuários viram features. A matriz é padronizada com StandardScaler para não comparar escalas brutas distintas; A–I mantêm o vínculo com tickets. O scaler deve ser ajustado no histórico e reutilizado em lotes reais; extremos podem influenciá-lo.','python/hdbscan_exemplo.py · docs/roteiro-hdbscan.md');
}
// 14 — HDBSCAN: distâncias e KDTree
{
  const s=base('HDBSCAN · ETAPAS 2–3','Todas as distâncias; depois, a vizinhança local','A matriz vê todos os pares. A KDTree expõe os vizinhos mais próximos.');
  rect(s,96,286,664,420,C.card,{r:22,stroke:C.stroke,sw:1});
  txt(s,128,308,600,30,'PAIRWISE_DISTANCES  ·  9 × 9',{fs:16,color:C.aqua,bold:true});
  txt(s,148,363,560,118,'d(A,B) = 0.032\nd(A,I) = 4.708\nd(i,i) = 0',{fs:24,color:C.ink,font:'Menlo',lh:1.4});
  metric(s,128,541,190,112,'81','células · O(n²)',C.gold);metric(s,332,541,190,112,'0','diagonal',C.aqua);metric(s,536,541,190,112,'simétrica','A↔B',C.coral);
  rect(s,796,286,708,420,C.bg2,{r:22,stroke:C.stroke,sw:1});
  txt(s,830,308,640,30,'KDTREE.QUERY(k=3) COM min_samples=2',{fs:16,color:C.gold,bold:true});
  txt(s,830,365,620,72,'O próprio ponto + 2 vizinhos externos',{fs:22,bold:true});
  txt(s,830,453,620,93,'core(A) = 0.0299\ncore(I) = 4.0621',{fs:23,color:C.aqua,font:'Menlo',lh:1.4});
  txt(s,830,574,620,78,'I precisa alcançar bem mais longe para encontrar vizinhos: região esparsa.',{fs:18,color:C.muted,lh:1.3});
  txt(s,96,753,1408,32,'A KDTree é uma inspeção didática; a etapa seguinte calcula os core distances pela matriz.',{fs:17,color:C.quiet,align:'center'});
  addNote('HDBSCAN: distâncias e KDTree','Etapa 2 materializa pairwise_distances com shape (9,9), simétrica e diagonal zero; o custo de espaço é O(n²). Etapa 3 consulta KDTree com k=min_samples+1: a biblioteca conta os vizinhos externos, então k=3 inclui o próprio ponto e dois vizinhos. A distância final é a core distance. A para I mede 4.708; core(I)=4.0621 contra core(A)=0.0299. A consulta é para inspeção; mutual_reachability recalcula os valores da matriz.','python/hdbscan_exemplo.py · docs/saida-esperada.txt');
}
// 15 — HDBSCAN: mutual reachability e CSR
{
  const s=base('HDBSCAN · ETAPA 4','A distância ganha o contexto da densidade','Conexões em regiões esparsas ficam mais caras antes de montar a árvore.');
  rect(s,96,286,650,420,C.card,{r:22,stroke:C.stroke,sw:1});
  txt(s,128,310,570,30,'MUTUAL REACHABILITY',{fs:16,color:C.aqua,bold:true});
  txt(s,128,370,560,64,'peso(i,j) = max(core(i), core(j), d(i,j))',{fs:23,color:C.ink,bold:true,lh:1.25});
  txt(s,128,458,555,112,'A—D: distância 0.016\ncore(A) 0.0299 → peso 0.0299',{fs:20,color:C.gold,font:'Menlo',lh:1.4});
  txt(s,128,599,555,64,'A vizinhança local muda o peso da conexão.',{fs:18,color:C.muted});
  rect(s,784,286,720,420,C.card,{r:22,stroke:C.stroke,sw:1});
  txt(s,818,310,650,30,'GRAFO EM CSR  ·  scipy.sparse.csr_matrix',{fs:16,color:C.coral,bold:true});
  const labels=[['indptr','limites de cada linha'],['indices','coluna / vizinho'],['data','peso da aresta']];
  labels.forEach((a,i)=>{const y=374+i*75;rect(s,822,y,160,46,C.bg2,{r:10,stroke:C.stroke,sw:1});txt(s,832,y+4,140,38,a[0],{fs:18,color:C.aqua,bold:true,font:'Menlo',align:'center',valign:'middle'});txt(s,1002,y+4,410,38,a[1],{fs:18,color:C.muted,valign:'middle'});});
  pill(s,818,623,182,'shape (9, 9)',C.gold);pill(s,1016,623,170,'72 entradas',C.aqua);txt(s,1200,626,263,29,'grafo completo · denso',{fs:15,color:C.quiet});
  addNote('HDBSCAN: alcançabilidade mútua','Etapa 4 chama mutual_reachability da biblioteca. Para A–D, d=0.016, core(A)=0.0299 e core(D)=0.016, então o peso vira 0.0299. A matriz ponderada é convertida em CSR: indptr delimita linhas, indices lista vizinhos e data armazena pesos. Sem laços há 72 entradas dirigidas (dois sentidos por cada par). O grafo é completo, então CSR aqui não promete economia de memória; o formato facilita a entrada da MST do SciPy.','python/hdbscan_exemplo.py · docs/roteiro-hdbscan.md');
}
// 16 — HDBSCAN: MST
{
  const s=base('HDBSCAN · ETAPA 5','A MST reduz conexões sem perder a conectividade','Nove vértices precisam de apenas oito arestas para formar uma árvore.');
  rect(s,96,286,600,420,C.card,{r:22,stroke:C.stroke,sw:1});
  txt(s,128,310,530,30,'GRAFO COMPLETO  →  MST',{fs:16,color:C.aqua,bold:true});
  metric(s,128,373,190,124,'36','pares não dirigidos',C.gold);txt(s,342,405,90,45,'→',{fs:36,color:C.quiet,bold:true,align:'center'});metric(s,452,373,190,124,'8','arestas · n − 1',C.aqua);
  txt(s,128,536,510,80,'Sem ciclos. Todos os incidentes continuam conectados. Peso total = 4.8978.',{fs:20,color:C.muted,lh:1.35});
  rect(s,736,286,768,420,C.bg2,{r:22,stroke:C.stroke,sw:1});
  txt(s,770,310,690,30,'ARESTAS DA MST  ·  MENOR PARA MAIOR',{fs:16,color:C.gold,bold:true});
  const edges=[['A–D','0.0299'],['A–B','0.0321'],['E–H','0.0354'],['E–F','0.0443'],['A–C','0.0457'],['E–G','0.0593'],['B–G','0.5890'],['F–I','4.0621']];
  edges.forEach((e,i)=>{const col=i<4?0:1,row=i<4?i:i-4,x=774+col*352,y=366+row*68;txt(s,x,y,86,31,e[0],{fs:18,color:i<6?C.aqua:i===6?C.gold:C.coral,bold:true,font:'Menlo'});txt(s,x+90,y,85,31,e[1],{fs:17,color:C.muted,font:'Menlo',align:'right'});rect(s,x,y+39,Math.max(8,Math.sqrt(Number(e[1]))*36),5,i<6?C.aqua:i===6?C.gold:C.coral,{r:2});});
  addNote('HDBSCAN: MST','Etapa 5 passa o grafo CSR a minimum_spanning_tree. O grafo não direcionado tem 36 pares possíveis; a MST guarda n−1=8 arestas, sem ciclos, preservando conectividade e minimizando o peso total, 4.8978. A ligação B–G (0.5890) une as duas regiões densas; F–I (4.0621) é o elo mais caro. A visão COO vira array [origem,destino,peso].','python/hdbscan_exemplo.py · docs/saida-esperada.txt');
}
// 17 — HDBSCAN: hierarquia
{
  const s=base('HDBSCAN · ETAPA 6','Ordenar as arestas revela as fusões','Conexões curtas unem primeiro; as distantes juntam componentes maiores.');
  rect(s,96,286,780,422,C.card,{r:22,stroke:C.stroke,sw:1});
  txt(s,128,310,710,30,'LINKAGE · CADA LINHA = UMA UNIÃO',{fs:16,color:C.aqua,bold:true});
  const merges=[['A + D','0.0299'],['(A,D) + B','0.0321'],['E + H','0.0354'],['(E,H) + F','0.0443'],['(A,B,D) + C','0.0457'],['(E,F,H) + G','0.0593'],['grupo 0 + grupo 1','0.5890'],['grupos + I','4.0621']];
  merges.forEach((m,i)=>{const y=354+i*40;txt(s,132,y,310,26,m[0],{fs:16,color:i<6?C.muted:C.ink,bold:i>=6});rect(s,450,y+6,Math.max(7,Math.sqrt(Number(m[1]))*36),10,i<6?C.aqua:i===6?C.gold:C.coral,{r:5});txt(s,730,y,100,26,m[1],{fs:15,color:C.quiet,font:'Menlo',align:'right'});});
  rect(s,916,286,588,422,C.bg2,{r:22,stroke:C.stroke,sw:1});
  txt(s,950,310,520,30,'ESTRUTURA DE SAÍDA',{fs:16,color:C.gold,bold:true});
  codeBox(s,950,362,520,130,'ARRAY LINKAGE','[filho A, filho B, distância, tamanho]',C.aqua,17);
  txt(s,950,520,515,92,'label() usa union-find para unir componentes sem percorrer todos os pontos a cada fusão.',{fs:19,color:C.muted,lh:1.35});
  txt(s,950,633,515,40,'DisjointSet só ajuda a visualizar as uniões.',{fs:16,color:C.quiet});
  addNote('HDBSCAN: hierarquia','Etapa 6 ordena arestas da MST por peso e passa o array à rotina label do hdbscan. O linkage registra filho A, filho B, distância e tamanho. A–D, B e C formam um componente; E–H, F e G formam outro; os grupos se unem em 0.5890, e I entra por último, em 4.0621. A biblioteca usa union-find para o linkage. DisjointSet do SciPy é apenas uma visualização auxiliar das componentes.','python/hdbscan_exemplo.py · docs/saida-esperada.txt');
}
// 18 — HDBSCAN: condensação e seleção
{
  const s=base('HDBSCAN · ETAPA 7','A árvore condensada pergunta quais grupos persistem','min_cluster_size=3 elimina ramos pequenos; EOM compara a estabilidade.');
  rect(s,96,286,640,422,C.card,{r:22,stroke:C.stroke,sw:1});
  txt(s,128,310,580,30,'ÁRVORE CONDENSADA',{fs:16,color:C.aqua,bold:true});
  rect(s,328,366,178,54,C.card2,{r:14,stroke:C.quiet,sw:1});txt(s,328,371,178,44,'raiz 9',{fs:19,color:C.muted,bold:true,align:'center',valign:'middle'});
  txt(s,265,440,46,35,'↙',{fs:28,color:C.quiet,bold:true,align:'center'});txt(s,520,440,46,35,'↘',{fs:28,color:C.quiet,bold:true,align:'center'});
  rect(s,160,481,190,74,C.card2,{r:15,stroke:C.aqua,sw:2});txt(s,170,486,170,62,'10 · A–D\n4 pontos',{fs:18,color:C.aqua,bold:true,align:'center',valign:'middle'});
  rect(s,454,481,190,74,C.card2,{r:15,stroke:C.gold,sw:2});txt(s,464,486,170,62,'11 · E–H\n4 pontos',{fs:18,color:C.gold,bold:true,align:'center',valign:'middle'});
  txt(s,138,590,540,68,'I sai da raiz em λ=0.2462.\nOs ramos nascem em λ=1.6979.',{fs:17,color:C.muted,align:'center',lh:1.35});
  rect(s,780,286,724,422,C.card,{r:22,stroke:C.stroke,sw:1});
  txt(s,814,310,650,30,'ESTABILIDADE BRUTA · DICT POR ID',{fs:16,color:C.coral,bold:true});
  metric(s,814,363,190,116,'13.829','raiz · excluída',C.quiet);metric(s,1020,363,204,116,'108.601','grupo A–D · EOM',C.aqua);metric(s,1240,363,224,116,'77.749','grupo E–H · EOM',C.gold);
  txt(s,814,511,640,80,'EOM compara pai com soma dos descendentes: seleciona os dois filhos, sem sobreposição.',{fs:19,color:C.muted,lh:1.35});
  pill(s,814,621,245,'persistência 0.871',C.aqua);pill(s,1080,621,245,'persistência 0.623',C.gold);
  addNote('HDBSCAN: árvore condensada e EOM','Etapa 7 condense_tree remove candidatos abaixo de min_cluster_size=3. O array estruturado registra parent, child, lambda_val e child_size. lambda=1/distância; a estabilidade soma os intervalos em que cada ponto permanece no ramo. O dict dá 13.8291 para a raiz, 108.6007 para A–D e 77.7490 para E–H. EOM compara a raiz com a soma dos descendentes e seleciona os dois filhos; allow_single_cluster=False exclui a raiz. Persistência normalizada (0.871 e 0.623) não é a mesma medida que estabilidade bruta.','python/hdbscan_exemplo.py · docs/roteiro-hdbscan.md');
}
// 19 — HDBSCAN: resultado final
{
  const s=base('HDBSCAN · ETAPAS 8–9','O vetor final responde uma vez por incidente','O rótulo ocupa a mesma posição da linha na matriz de entrada.');
  rect(s,96,286,740,422,C.card,{r:22,stroke:C.stroke,sw:1});
  txt(s,128,310,650,30,'RÓTULOS NA ORDEM A–I',{fs:16,color:C.aqua,bold:true});
  txt(s,130,368,655,38,'A   B   C   D     E   F   G   H     I',{fs:19,color:C.muted,bold:true,font:'Menlo'});
  txt(s,130,415,655,54,'0   0   0   0     1   1   1   1    −1',{fs:25,color:C.ink,bold:true,font:'Menlo'});
  rect(s,130,497,285,92,C.card2,{r:16,stroke:C.aqua,sw:2});txt(s,148,508,250,72,'CLUSTER 0\n4 incidentes IAM',{fs:18,color:C.aqua,bold:true,align:'center',valign:'middle'});
  rect(s,438,497,285,92,C.card2,{r:16,stroke:C.gold,sw:2});txt(s,456,508,250,72,'CLUSTER 1\n4 incidentes de pagamento',{fs:18,color:C.gold,bold:true,align:'center',valign:'middle'});
  txt(s,130,620,620,40,'−1 = INC0010899 · ruído',{fs:18,color:C.coral,bold:true});
  rect(s,876,286,628,422,C.bg2,{r:22,stroke:C.stroke,sw:1});
  pill(s,910,310,205,'ETAPA 9 · API PÚBLICA',C.lime);
  txt(s,910,370,550,82,'HDBSCAN.fit e pipeline aberto\nproduzem a mesma partição.',{fs:22,bold:true,lh:1.3});
  txt(s,910,475,545,80,'Também coincidem forças de pertencimento e persistências neste conjunto.',{fs:18,color:C.muted,lh:1.35});
  txt(s,910,574,545,55,'p = força de pertencimento,\nnão probabilidade calibrada.',{fs:17,color:C.gold,bold:true,lh:1.3});
  txt(s,96,751,1408,35,'Com min_cluster_size=5, os ramos de quatro não sobrevivem: neste exemplo, todos viram ruído.',{fs:18,color:C.coral,bold:true,align:'center'});
  addNote('Resultado final do HDBSCAN','Etapa 8 alinha rótulos às linhas: A–D (IAM) recebem 0, E–H (pagamentos) recebem 1 e I/INC0010899 (Plataforma) recebe -1, ruído. Os valores 0 e 1 são IDs arbitrários, não categorias de negócio. Etapa 9 executa a API pública HDBSCAN.fit com parâmetros alinhados e compara partição, forças de pertencimento e persistência. Neste conjunto coincidem; isso não é benchmark nem prova equivalência universal. p é força de pertencimento, não probabilidade calibrada. Com min_cluster_size=5, os grupos de quatro são descartados e os nove pontos ficam como ruído.','python/hdbscan_exemplo.py · docs/roteiro-hdbscan.md');
}
// 20 — Integração e encerramento
{
  const s=base('INTEGRAÇÃO · PRÓXIMOS PASSOS','Cada estrutura deixa um sinal para investigar','Operar, entender o impacto e recuperar contexto fazem parte do mesmo ciclo.');
  const lanes=[
    {y:294,color:C.gold,title:'PROCESSAR',p:['evento','fila limitada','consumidor','estado / dedup']},
    {y:414,color:C.aqua,title:'INVESTIGAR',p:['falha','grafo','BFS / DFS','serviços afetados']},
    {y:534,color:C.coral,title:'RESPONDER',p:['artigos','índice TF-IDF','ranking','contexto RAG']}
  ];
  lanes.forEach(l=>{txt(s,96,l.y+18,170,30,l.title,{fs:15,color:l.color,bold:true});l.p.forEach((v,i)=>{const x=282+i*298;rect(s,x,l.y,248,66,i===3?C.card2:C.card,{r:15,stroke:i===3?l.color:C.stroke,sw:1});txt(s,x+10,l.y+4,228,58,v,{fs:17,color:i===3?l.color:C.ink,bold:i===3,align:'center',valign:'middle'});if(i<3)txt(s,x+249,l.y+9,42,46,'→',{fs:26,color:C.quiet,bold:true,align:'center',valign:'middle'});});});
  rect(s,96,652,1408,67,C.dark,{r:15});
  txt(s,122,662,1355,45,'No projeto: logs + contadores  ·  Em produção: métricas + rastros + estado persistente',{fs:18,color:C.muted,bold:true,align:'center',valign:'middle'});
  txt(s,96,731,1408,26,'EXPERIMENTE',{fs:14,color:C.quiet,bold:true,align:'center'});
  pill(s,185,758,300,'sh executar.sh 2',C.gold);pill(s,515,758,300,'sh executar.sh 8',C.aqua);pill(s,845,758,525,'sh executar.sh hdbscan --etapa 9',C.coral);
  txt(s,96,797,1408,22,'Obrigada  ·  Solange Brasileiro',{fs:15,color:C.quiet,align:'center'});
  addNote('Integração e encerramento','Retome o fio do minicurso: a estrutura organiza uma operação; logs e contadores mostram o que aconteceu; grafos e índices ajudam na investigação; recuperação prepara contexto. O código é local e didático, não conecta broker, nuvem, API ou modelo externo. Sugestões para demonstração: sh executar.sh 1; sh executar.sh 8; sh executar.sh hdbscan --etapa 1; sh executar.sh hdbscan --etapa 9. Termine perguntando qual operação é crítica no sistema real da turma.','README.md · docs/roteiro-java.md · docs/roteiro-hdbscan.md');
}

function esc(s){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');}
function color(hex,alpha=100000){return `<a:srgbClr val="${hex}"${alpha<100000?`><a:alpha val="${alpha}"/></a:srgbClr>`:'/>'}`;}
function shapeXml(b,id){
  const x=Math.round(b.x*EMU), y=Math.round(b.y*EMU), w=Math.round(b.w*EMU), h=Math.round(b.h*EMU);
  const isText=b.type==='text', geom=b.type==='rect'?(b.r===0?'rect':'roundRect'):'rect';
  const fill=isText||b.fill==='none'?'<a:noFill/>':`<a:solidFill>${color(b.fill,b.alpha??100000)}</a:solidFill>`;
  const line=b.stroke&&b.stroke!=='none'&&b.sw?`<a:ln w="${Math.round(b.sw*EMU)}"><a:solidFill>${color(b.stroke,b.alpha??100000)}</a:solidFill></a:ln>`:'<a:ln><a:noFill/></a:ln>';
  const geomXml=`<a:prstGeom prst="${geom}"><a:avLst/></a:prstGeom>`;
  const nv=`<p:nvSpPr><p:cNvPr id="${id}" name="Shape ${id}"/><p:cNvSpPr${isText?' txBox="1"':''}/><p:nvPr/></p:nvSpPr>`;
  const xfrm=`<a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm>`;
  let tx='';
  if(isText){
    const anchor=b.valign==='middle'?'ctr':b.valign==='bottom'?'b':'t';
    const paras=String(b.text).split('\n').map(line=>`<a:p><a:pPr algn="${b.align==='center'?'ctr':b.align==='right'?'r':'l'}"><a:lnSpc><a:spcPct val="${Math.round(b.lh*100000)}"/></a:lnSpc></a:pPr><a:r><a:rPr lang="pt-BR" sz="${Math.round(b.fs*75)}"${b.bold?' b="1"':''}><a:solidFill>${color(b.color)}</a:solidFill><a:latin typeface="${esc(b.font)}"/><a:ea typeface="${esc(b.font)}"/><a:cs typeface="${esc(b.font)}"/></a:rPr><a:t xml:space="preserve">${esc(line||' ')}</a:t></a:r><a:endParaRPr lang="pt-BR" sz="${Math.round(b.fs*75)}"/></a:p>`).join('');
    tx=`<p:txBody><a:bodyPr wrap="square" lIns="0" rIns="0" tIns="0" bIns="0" anchor="${anchor}"><a:normAutofit/></a:bodyPr><a:lstStyle/>${paras}</p:txBody>`;
  }
  return `<p:sp>${nv}<p:spPr>${xfrm}${geomXml}${fill}${line}</p:spPr>${tx}</p:sp>`;
}
function imageDimensions(file){
  const data=fs.readFileSync(file);
  if(data.subarray(0,8).toString('hex')==='89504e470d0a1a0a') return {w:data.readUInt32BE(16),h:data.readUInt32BE(20)};
  if(data[0]===0xff&&data[1]===0xd8){
    let p=2;
    while(p<data.length){
      if(data[p]!==0xff){p++;continue;}
      const marker=data[p+1];p+=2;
      if(marker===0xd8||marker===0xd9||(marker>=0xd0&&marker<=0xd7)) continue;
      if(p+7>=data.length) break;
      const len=data.readUInt16BE(p);
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) return {h:data.readUInt16BE(p+3),w:data.readUInt16BE(p+5)};
      p+=len;
    }
  }
  throw new Error('Não foi possível identificar as dimensões da foto.');
}
function pictureCrop(b){
  const {w,h}=imageDimensions(b.file), source=w/h, target=b.w/b.h;
  let l=0,r=0,t=0,bottom=0;
  if(source>target){const cut=(1-target/source)/2;l=Math.round(cut*100000);r=l;}
  else if(source<target){const cut=(1-source/target);t=Math.round(cut*35000);bottom=Math.round(cut*65000);}
  return `l="${l}" r="${r}" t="${t}" b="${bottom}"`;
}
function picXml(b,id){
  const x=Math.round(b.x*EMU), y=Math.round(b.y*EMU), w=Math.round(b.w*EMU), h=Math.round(b.h*EMU);
  return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="Foto de Solange" descr="Retrato da ministrante"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId2"/><a:srcRect ${pictureCrop(b)}/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom><a:ln><a:solidFill>${color(C.aqua)}</a:solidFill><a:prstDash val="solid"/></a:ln></p:spPr></p:pic>`;
}
function slideXml(s){
  const shapes=s.blocks.map((b,i)=>b.type==='image'?picXml(b,i+2):shapeXml(b,i+2)).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${shapes}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}
function htmlBlock(b){
  const pos=`left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;`;
  if(b.type==='image'){const mime=b.ext==='png'?'image/png':'image/jpeg';const data=fs.readFileSync(b.file).toString('base64');return `<img alt="Foto de Solange Brasileiro" src="data:${mime};base64,${data}" style="position:absolute;${pos}object-fit:cover;object-position:center 36%;border:2px solid #${C.aqua};border-radius:22px;box-sizing:border-box">`;}
  if(b.type==='rect') return `<div aria-hidden="true" style="position:absolute;${pos}background:${b.fill==='none'?'transparent':'#'+b.fill};border:${b.stroke&&b.stroke!=='none'&&b.sw?`${b.sw}px solid #${b.stroke}`:'0'};border-radius:${b.r===0?0:b.r}px;opacity:${(b.alpha??100000)/100000};box-sizing:border-box"></div>`;
  const family=b.font==='Menlo'?'Menlo,Consolas,monospace':'Aptos,Arial,sans-serif';
  const align=b.align==='center'?'center':b.align==='right'?'right':'left';
  const valign=b.valign==='middle'?'center':b.valign==='bottom'?'flex-end':'flex-start';
  return `<div class="fit-text" data-base-fs="${b.fs}" style="position:absolute;${pos}display:flex;min-width:0;justify-content:${align==='left'?'flex-start':align==='right'?'flex-end':'center'};align-items:${valign};white-space:pre-wrap;overflow:hidden;box-sizing:border-box;font:${b.bold?'700':'400'} ${b.fs}px/${b.lh} ${family};letter-spacing:${b.tracking}px;color:#${b.color};text-align:${align}">${esc(b.text)}</div>`;
}
function buildHtml(){
  const pageSlides=slides.map((s,i)=>`<section class="slide${i===0?' active':''}" aria-label="Slide ${i+1}: ${esc(s.title||s.kicker)}"><div class="artboard">${s.blocks.map(htmlBlock).join('')}</div></section>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Estruturas de dados no mundo real · Solange Brasileiro</title><style>
:root{color-scheme:dark;--scale:1}*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#080a20;color:#f7f3e8;font-family:Aptos,Arial,sans-serif}.slide{display:none;position:absolute;inset:0}.slide.active{display:block}.artboard{position:absolute;width:${W}px;height:${H}px;left:50%;top:50%;transform:translate(-50%,-50%) scale(var(--scale));transform-origin:center center;overflow:hidden;background:#${C.bg}}.controls{position:fixed;z-index:10;right:22px;bottom:18px;display:flex;gap:8px;align-items:center;color:#c0c5dc;font:14px Arial,sans-serif}.controls button{border:1px solid #3a427a;border-radius:10px;background:#191d49;color:#f7f3e8;padding:8px 12px;cursor:pointer}.controls button:hover{background:#252c63}.progress{position:fixed;z-index:10;left:0;bottom:0;height:4px;background:#59d6c5;transition:width .2s}.sr{position:absolute;left:-9999px}@media print{@page{size:16.667in 9.375in;margin:0}html,body{width:auto;height:auto;overflow:visible;background:#111436;-webkit-print-color-adjust:exact;print-color-adjust:exact}.slide,.slide.active{display:block;position:relative;width:1600px;height:900px;inset:auto;page-break-after:always;break-after:page}.artboard{position:relative;left:0;top:0;transform:none}.controls,.progress{display:none}}
</style></head><body><main id="deck">${pageSlides}</main><div class="progress" id="progress"></div><nav class="controls" aria-label="Controles da apresentação"><button id="prev" aria-label="Slide anterior">←</button><span id="count">1 / ${slides.length}</span><button id="next" aria-label="Próximo slide">→</button><button onclick="window.print()">Imprimir / PDF</button></nav><script>
const slides=[...document.querySelectorAll('.slide')];let index=0;function size(){document.documentElement.style.setProperty('--scale',Math.min(innerWidth/1600,innerHeight/900))}function fitSlide(s){for(const el of s.querySelectorAll('.fit-text')){const base=Number(el.dataset.baseFs);let size=base;el.style.fontSize=size+'px';for(let i=0;i<40;i++){if(el.scrollHeight<=el.clientHeight+2&&el.scrollWidth<=el.clientWidth+2)break;size-=.5;el.style.fontSize=size+'px';}}}function show(n){index=(n+slides.length)%slides.length;slides.forEach((s,i)=>s.classList.toggle('active',i===index));fitSlide(slides[index]);document.getElementById('count').textContent=(index+1)+' / '+slides.length;document.getElementById('progress').style.width=((index+1)/slides.length*100)+'%'}document.getElementById('prev').onclick=()=>show(index-1);document.getElementById('next').onclick=()=>show(index+1);addEventListener('resize',()=>{size();fitSlide(slides[index])});addEventListener('beforeprint',()=>{slides.forEach(s=>{s.style.display='block';fitSlide(s)})});addEventListener('afterprint',()=>{slides.forEach(s=>s.style.display='');show(index)});addEventListener('keydown',e=>{if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();show(index+1)}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();show(index-1)}if(e.key==='Home')show(0);if(e.key==='End')show(slides.length-1)});size();show(Math.max(0,parseInt(location.hash.slice(1),10)-1||0));
</script></body></html>`;
}
function xml(name){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${name}`;}
function pptxFiles(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'slides-'));
 const write=(name,data)=>{const p=path.join(dir,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,data);};
 write('[Content_Types].xml',xml(`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${PHOTO_PATH?`<Default Extension="${PHOTO_EXT==='jpeg'?'jpg':PHOTO_EXT}" ContentType="${PHOTO_EXT==='png'?'image/png':'image/jpeg'}"/>`:''}<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${slides.map((_,i)=>`<Override PartName="/ppt/slides/slide${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('')}</Types>`));
 write('_rels/.rels',xml(`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`));
 write('docProps/core.xml',xml(`<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Estruturas de dados no mundo real</dc:title><dc:creator>Solange Brasileiro</dc:creator><dc:subject>Minicurso de estruturas de dados</dc:subject></cp:coreProperties>`));
 write('docProps/app.xml',xml(`<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Open XML</Application><Slides>${slides.length}</Slides></Properties>`));
 write('ppt/presentation.xml',xml(`<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${slides.map((_,i)=>`<p:sldId id="${256+i}" r:id="rId${i+2}"/>`).join('')}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`));
 write('ppt/_rels/presentation.xml.rels',xml(`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>${slides.map((_,i)=>`<Relationship Id="rId${i+2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i+1}.xml"/>`).join('')}</Relationships>`));
 write('ppt/slideMasters/slideMaster1.xml',xml(`<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap accent1="59D6C5" accent2="F4BA58" accent3="F17C98" accent4="B2DF78" accent5="3A427A" accent6="252C63" bg1="111436" bg2="191D49" dk1="0C1029" dk2="111436" folHlink="F17C98" hlink="59D6C5" lt1="F7F3E8" lt2="C0C5DC" tx1="0C1029" tx2="F7F3E8"/><p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>`));
 write('ppt/slideMasters/_rels/slideMaster1.xml.rels',xml(`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`));
 write('ppt/slideLayouts/slideLayout1.xml',xml(`<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`));
 write('ppt/slideLayouts/_rels/slideLayout1.xml.rels',xml(`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`));
 write('ppt/theme/theme1.xml',xml(`<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Estruturas de dados"><a:themeElements><a:clrScheme name="Indigo"><a:dk1>${color(C.dark)}</a:dk1><a:lt1>${color(C.ink)}</a:lt1><a:dk2>${color(C.bg)}</a:dk2><a:lt2>${color(C.muted)}</a:lt2><a:accent1>${color(C.aqua)}</a:accent1><a:accent2>${color(C.gold)}</a:accent2><a:accent3>${color(C.coral)}</a:accent3><a:accent4>${color(C.lime)}</a:accent4><a:accent5>${color(C.stroke)}</a:accent5><a:accent6>${color(C.card2)}</a:accent6><a:hlink>${color(C.aqua)}</a:hlink><a:folHlink>${color(C.coral)}</a:folHlink></a:clrScheme><a:fontScheme name="Aptos"><a:majorFont><a:latin typeface="Aptos Display"/><a:ea typeface="Aptos Display"/><a:cs typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/><a:ea typeface="Aptos"/><a:cs typeface="Aptos"/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`));
 if(PHOTO_PATH){const ext=PHOTO_EXT==='jpeg'?'jpg':PHOTO_EXT;write(`ppt/media/solange.${ext}`,fs.readFileSync(PHOTO_PATH));}
 for(let i=0;i<slides.length;i++){
   write(`ppt/slides/slide${i+1}.xml`,slideXml(slides[i]));
   const photoRel=i===1&&PHOTO_PATH?`<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/solange.${PHOTO_EXT==='jpeg'?'jpg':PHOTO_EXT}"/>`:'';
   write(`ppt/slides/_rels/slide${i+1}.xml.rels`,xml(`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>${photoRel}</Relationships>`));
 }
 const out=path.join(OUT,'apresentacao-minicurso-estruturas.pptx');
 try{fs.rmSync(out,{force:true});execFileSync('zip',['-q','-X','-r',out,'.'],{cwd:dir});}finally{fs.rmSync(dir,{recursive:true,force:true});}
}
fs.writeFileSync(path.join(OUT,'apresentacao-minicurso-estruturas.html'),buildHtml());
pptxFiles();
const md=['# Roteiro de fala — Estruturas de dados no mundo real','',`Minicurso de Solange Brasileiro · ${slides.length} slides`,'','Os dados são fictícios e as demonstrações usam estruturas prontas das bibliotecas. Sugestão: abra este roteiro ao lado do arquivo de slides.','',...notes.flatMap((n,i)=>[`## ${String(i+1).padStart(2,'0')} · ${n.title}`,'',n.content,...(n.files?[``, `**No projeto:** ${n.files}`]:[]),''])].join('\n');
fs.writeFileSync(path.join(OUT,'roteiro-fala-minicurso.md'),md);
console.log(`Gerados ${slides.length} slides: PPTX, HTML interativo e roteiro de fala.`);
