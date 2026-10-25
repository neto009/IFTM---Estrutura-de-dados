# 🧩 Estruturas de dados na prática

**Uma oficina em Java e Python apresentada na própria página web.**

A página conduz cada cenário do problema ao resultado: explica os termos, desenha o fluxo de cada etapa, executa o exemplo e destaca a classe e o método para acompanhar no editor. Os dados são fictícios; as coleções e os algoritmos usam bibliotecas prontas.

## 🚀 Abrir a oficina

Pré-requisitos: **JDK 17+** e **Python 3.10–3.13**. Python 3.13 é recomendado.

Na pasta do projeto, no macOS/Linux:

~~~sh
sh preparar.sh
sh executar.sh
~~~

O navegador abre em **http://127.0.0.1:8000**. Mantenha o terminal aberto; <code>Ctrl+C</code> encerra o servidor.

A preparação instala as dependências Python em <code>.venv</code> e baixa os JARs necessários para <code>lib</code>. Precisa de internet apenas nessa preparação. Os exemplos depois funcionam localmente.

Se o computador não tem o comando <code>python</code>, o script procura <code>python3</code> e suas versões compatíveis. Para escolher:

~~~sh
OFICINA_PYTHON=python3.13 sh preparar.sh
~~~

Para usar outra porta, sem abrir o navegador automaticamente:

~~~sh
sh executar.sh web --porta 8001 --sem-abrir
~~~

## 🎓 Como acompanhar a apresentação

1. **Começo:** leia o problema, o objetivo, os dados recebidos e os termos essenciais.
2. **Etapas:** acompanhe entrada → operação → saída no fluxograma e compare os dados da execução.
3. **Código:** a faixa “Acompanhe no código” mostra o arquivo e o método. Use “Ver trecho” para consultar as linhas reais; copie o caminho para abrir no editor.
4. **Resultado:** relacione o resultado à estrutura escolhida e confira a pergunta final.
5. **Próximo exemplo:** avance pelo botão da própria página; a sequência também está no menu lateral.

As teclas ← e → navegam entre etapas. A página oferece aumento de texto, tela cheia, conceitos, perguntas e acesso à classe completa.

O cálculo acontece ao iniciar o exemplo. A navegação revela os resultados no ritmo da aula. Ao alterar parâmetros do HDBSCAN, execute novamente para obter a nova saída.

## 🗺️ Percurso e código principal

| Ordem na página | Problema | Arquivo principal |
| --- | --- | --- |
| 1 | Organizar chamados recebidos fora de ordem | [ConsultasChamados.java](src/oficina/casos/ConsultasChamados.java) |
| 2 | Importar e limpar linhas de um arquivo | [ImportacaoEmails.java](src/oficina/casos/ImportacaoEmails.java) |
| 3 | Consultar usuários em páginas e projetar contatos | [ConsultaUsuarios.java](src/oficina/casos/ConsultaUsuarios.java) |
| 4 | Separar pedidos pagos em FIFO | [FilaSeparacao.java](src/oficina/casos/FilaSeparacao.java) |
| 5 | Desfazer configurações em LIFO | [EditorConfiguracao.java](src/oficina/casos/EditorConfiguracao.java) |
| 6 | Encontrar usuários pelo ID | [RepositorioUsuarios.java](src/oficina/casos/RepositorioUsuarios.java) |
| 7 | Investigar uma janela de logs | [LinhaDoTempoLogs.java](src/oficina/casos/LinhaDoTempoLogs.java) |
| 8 | Transformar JSON de páginas em árvore e lista | [PaginaNavegavel.java](src/oficina/casos/PaginaNavegavel.java) |
| 9 | Descobrir impacto entre serviços | [DependenciasServicos.java](src/oficina/casos/DependenciasServicos.java) |
| 10 | Comparar perfis por cosseno | [cosseno.py](python/cosseno.py) |
| 11 | Processar pagamentos repetidos e com falhas | [ConsumidorPagamentos.java](src/oficina/casos/ConsumidorPagamentos.java) |
| 12 | Observar estruturas dentro do HDBSCAN | [hdbscan_exemplo.py](python/hdbscan_exemplo.py) |

Os números acima representam a ordem didática da página. Os comandos opcionais do terminal conservam seus identificadores próprios.

## 🧱 Organização do projeto

~~~text
src/oficina/
├── dominio/          Objetos, identidades e estados
├── casos/            Operações da aplicação com coleções prontas
├── demonstracoes/    Dados e apresentação dos cenários
├── apresentacao/     Formatação do terminal
└── Main.java         Entrada usada pelo servidor e pelo terminal

python/               Cosseno, HDBSCAN e servidor local
web/                  Página, fluxos, visualizações e aulas.json
dados/                destinatarios.csv e paginas.json
preparar.sh           Preparar dependências
executar.sh           Compilar Java e abrir a oficina
~~~

- [web/aulas.json](web/aulas.json) é a fonte única do material didático: problemas, definições, explicações, fluxos, perguntas, resultados e referências de código.
- [web/aula.js](web/aula.js) apresenta o começo, os fluxos das etapas e o fechamento.
- [web/visuais.js](web/visuais.js) desenha os dados calculados pelo backend.
- [python/servidor.py](python/servidor.py) serve a página e chama os exemplos; os trechos de código são lidos dos arquivos reais.

Os diretórios <code>.build</code>, <code>.venv</code> e os JARs de <code>lib</code> são gerados para executar o projeto. <code>requirements.txt</code> define as dependências Python.

Após alterar as aulas ou o código do servidor, reinicie a oficina. Alterações Java são compiladas por <code>executar.sh</code>.

## 🔬 HDBSCAN como estudo de estruturas

O exemplo usa nove incidentes fictícios no estilo ServiceNow. Só horas de resolução e usuários afetados entram no cálculo; número, resumo e equipe servem para interpretação posterior.

A página acompanha objetos, matriz numérica, distâncias, KDTree, grafo CSR, MST, hierarquia, árvore condensada, mapa de estabilidade e vetor de rótulos. A última etapa compara com a API completa <code>HDBSCAN.fit</code>.

Os parâmetros padrão são <code>min_samples=2</code> e <code>min_cluster_size=3</code>. A interface explica como cada estrutura prepara a etapa seguinte. O grafo completo é uma escolha para tornar a amostra pequena inspecionável; as versões estão fixadas porque algumas rotinas usadas são internas.

## 🧰 Terminal opcional

~~~sh
sh executar.sh terminal          # Menu do terminal
sh executar.sh todos             # Todos os exemplos em texto
sh executar.sh arquivo           # Importação de linhas
sh executar.sh banco             # Consulta simulada
sh executar.sh pagina            # Árvore JSON
sh executar.sh cosseno
sh executar.sh hdbscan --etapa 5
sh executar.sh hdbscan --min-cluster-size 5 --resumo
~~~

As cores são automáticas no terminal. Para escolher:

~~~sh
OFICINA_CORES=sempre sh executar.sh 1
OFICINA_CORES=nunca sh executar.sh 1
~~~

### Windows

Prepare as dependências, compile e abra o servidor no PowerShell:

~~~powershell
py -3.13 preparar.py
$fontesOficina = Get-ChildItem src -Recurse -Filter *.java | ForEach-Object FullName
javac --release 17 -encoding UTF-8 -cp "lib/*" -d .build/classes $fontesOficina
.venv\Scripts\python.exe python\servidor.py
~~~

## 📚 Bibliotecas

Java usa coleções do JDK, Gson para JSON e JGraphT para grafos. Python usa NumPy, SciPy, scikit-learn e hdbscan. Não há banco real, broker ou serviço externo na demonstração.

As regras dos exemplos mostram records, validações, <code>Objects</code>, Streams, <code>Optional</code>, comparadores e coleções prontas. O mapeamento recursivo de páginas é código da aplicação; as estruturas permanecem as das bibliotecas.

