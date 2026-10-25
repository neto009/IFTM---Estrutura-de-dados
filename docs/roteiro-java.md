# Java no dia a dia: roteiro pelos exemplos

Os cenários partem de problemas comuns de desenvolvimento: triagem de bugs,
processamento de pedidos, configuração de uma aplicação, consultas, investigação
de incidentes e consumo de mensagens. Os dados e sistemas são fictícios.

Comece com `sh executar.sh 1`. Leia somente os arquivos do caso em apresentação;
os exemplos são independentes e não exigem entender todo o projeto de uma vez.

## Como ler a organização

```text
Main: escolha da demonstração
  -> demonstracoes: dados e apresentação
  -> casos: regra da aplicação usando coleções prontas
  -> dominio: dados, validações e transições
```

As classes de `casos` não imprimem mensagens. A apresentação transforma os resultados
em texto. Assim, os testes verificam as regras diretamente, sem depender do console.
Não há interface de repositório sem outra implementação, framework ou coleção própria.

## 1. Backlog: objetos, ordenação e streams

Abra [Chamado](../src/oficina/dominio/Chamado.java), depois
[ConsultasChamados](../src/oficina/casos/ConsultasChamados.java).

Um chamado tem ID, título, equipe, prioridade e status. `enum` limita os valores
aceitos; o construtor valida os dados; `record` representa o valor sem setters.
Prioridade tem uma ordem de atendimento explícita. Alterar a declaração do enum
não deve mudar silenciosamente a regra de prioridade.

Na consulta, acompanhe:

```java
chamados.stream()
        .filter(Chamado::aguardandoAtendimento)
        .sorted(ORDEM_ATENDIMENTO)
        .toList();
```

Somente abertos entram na triagem. Críticos vêm primeiro; o ID desempata. A apresentação
aplica `limit(3)` e `map` para montar os resumos. O backlog original continua com seis
objetos, incluindo os resolvidos ou já em atendimento.

`contarAbertosPorPrioridade` usa `groupingBy/counting` com `EnumMap`. A chave do mapa
é um conjunto conhecido de prioridades. Não há acumulador externo sendo alterado
por uma lambda. Para obter só o próximo chamado, `min` evita ordenar a coleção toda.

Depois da consulta ao backlog, um incidente crítico chega durante o plantão. A
`PriorityQueue` usa o mesmo comparador de prioridade e ID para decidir qual chamado
sai primeiro. `offer` incorpora a nova ocorrência; `poll` entrega o próximo trabalho.
Sua iteração não é ordenada, por isso o exemplo consome a fila com `poll`.
O laço verifica `isEmpty` antes de chamar `poll`, que retorna `null` quando a fila
está vazia. A fila FIFO de pedidos trata essa ausência com `Optional` na camada do caso.
Na separação de pedidos, a necessidade é diferente: manter a ordem de chegada, então
a estrutura é `ArrayDeque` com comportamento FIFO.

Perguntas: por que um incidente crítico novo passa à frente de um chamado de prioridade
baixa? Como desempatar dois bugs críticos de forma reproduzível? Se só precisamos do
próximo chamado, `min` evita ordenar a lista inteira?

## 2. Fila: uma regra de negócio sobre a coleção

```sh
sh executar.sh 2
```

Abra [Pedido](../src/oficina/dominio/Pedido.java) e
[FilaSeparacao](../src/oficina/casos/FilaSeparacao.java).

O pedido valida as transições `AGUARDANDO_PAGAMENTO -> PAGO -> EM_SEPARACAO`.
`confirmarPagamento` e `iniciarSeparacao` retornam novos objetos, mantendo os valores
anteriores. A fila aceita somente pagos e usa `HashSet` para agendar cada ID uma vez
durante a execução. `Queue`/`ArrayDeque` fornecem as operações FIFO.

`consultarProximo` usa `peek`; `iniciarProximo` usa `poll` e transforma o pedido para
o estado de separação. Ambos retornam `Optional<Pedido>`: estar vazia é esperado.

Os valores usam `new BigDecimal("129.90")`. Strings decimais preservam o valor definido
no exemplo. `compareTo` compara o valor numérico do pagamento; `equals` também considera
a escala e não atende a essa regra de negócio.

Perguntas: por que não usar `double` para esse valor? O que fazer se o mesmo pedido
chegar duas vezes? É correto colocar na fila um pedido ainda sem pagamento?

## 3. Pilha: desfazer restaura o estado

```sh
sh executar.sh 3
```

Abra [EditorConfiguracao](../src/oficina/casos/EditorConfiguracao.java).
O campo `atual` é a configuração usada; o `Deque` guarda snapshots anteriores.
Uma atualização diferente executa `push(atual)` e troca o estado. Desfazer usa `pop`
e restaura a configuração, até retornar ao timeout inicial de dois segundos.

O histórico não recebe entradas quando a nova configuração é igual à atual.
A configuração usa `Duration`, evitando a dúvida entre segundos e milissegundos.
Histórico vazio devolve `Optional.empty()` e preserva o estado.

Os componentes deste record são imutáveis. Um record que recebesse uma lista mutável
precisaria protegê-la, por exemplo com uma cópia no construtor; `record` por si só não
transforma os objetos referenciados em valores profundamente imutáveis.

Pergunta: o que ocorreria se todas as posições do histórico apontassem para um objeto
mutável que fosse alterado a cada comando?

## 4. Mapa: consulta por ID e Optional

```sh
sh executar.sh 4
```

Abra [RepositorioUsuarios](../src/oficina/casos/RepositorioUsuarios.java).
O `HashMap` fica privado. O chamador recebe um usuário imutável ou uma lista de resultados,
sem conseguir alterar o armazenamento diretamente.

- `putIfAbsent` implementa a regra de rejeitar ID repetido no cadastro.
- `replace` atualiza somente um cadastro existente.
- `buscarPorId` devolve `Optional<Usuario>` para distinguir encontrado e ausente.
- `listarAtivos` filtra e ordena explicitamente por nome/ID antes de `toList`.

Na apresentação:

```java
usuarios.buscarPorId(1)
        .filter(Usuario::ativo)
        .map(Usuario::email)
        .ifPresent(email -> tela.resultado("Contato para avisos: " + email));
```

`ifPresentOrElse` trata o ID ausente, como faria um endpoint ao decidir responder 404.
Aqui a demonstração é de console; não há servidor HTTP. `orElse` serve para o texto
constante de fallback. `orElseThrow` aparece quando a carga conhecida da demonstração
deveria conter uma usuária obrigatória.

`Optional` comunica uma ausência válida no retorno de um método. Para coleções vazias,
retorne a própria coleção vazia. Parâmetros e campos do domínio não são `Optional`.
Evite encadear `isPresent` e `get` quando `map`, `filter` ou um consumidor expressam
a intenção. `orElseGet` cabe quando o fallback precisa ser calculado somente na ausência;
`orElse` avalia seu argumento mesmo quando há valor.
[API Optional do JDK 17](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Optional.html).

Perguntas: um ID ausente deve sempre lançar exceção? Atualizar deveria criar um cadastro?
O cliente da classe consegue modificar os usuários por meio da lista retornada?

## 5. Árvore: investigação de incidente por janela de tempo

```sh
sh executar.sh 5
```

Abra [LinhaDoTempoLogs](../src/oficina/casos/LinhaDoTempoLogs.java).
O índice é `NavigableMap<Instant, List<RegistroLog>>`, implementado por `TreeMap`.
Uma chave só poderia guardar um valor; a lista preserva vários logs do mesmo instante.
`computeIfAbsent` cria a lista apenas quando o timestamp ainda não existe.

`subMap(inicio, true, fim, false)` usa a janela **[início, fim)**. O final exclusivo
permite consultar janelas consecutivas sem repetir um registro na fronteira.
`flatMap(List::stream)` transforma as listas da faixa em um único fluxo de registros.
O `toList` materializa um snapshot não modificável, em vez de expor a visão viva de `subMap`.

A entrada está fora de ordem e contém dois logs às 12:00:30Z. A consulta conserva ambos
e devolve quatro registros antes de 12:01:00Z. A apresentação filtra os dois erros e
agrupa a contagem por serviço. `Instant` e a saída em UTC tornam a reprodução independente
do fuso configurado na máquina. São horários fixos de exemplo.

Perguntas: o que se perderia usando `Map<Instant, RegistroLog>`? Por que o fim da janela
é exclusivo? O que mudaria se a consulta devolvesse a visão do mapa diretamente?

## 6. Grafo: impacto potencial entre serviços

```sh
sh executar.sh 6
```

Abra [DependenciasServicos](../src/oficina/casos/DependenciasServicos.java).
Cada vértice é um objeto `Servico`, com nome e equipe. A direção é **fornecedor -> consumidor**.
Autenticação fornece uma capacidade a pedidos e pagamentos; esses dois alcançam notificações.

Os iteradores do JGraphT executam BFS/DFS e controlam as visitas. O serviço de notificações
é compartilhado, mas aparece uma vez. A origem fica fora da lista de serviços impactados.
Partir de notificações não alcança autenticação: o impacto não segue as arestas ao contrário.

`map(Servico::equipe).distinct().sorted()` produz uma lista das equipes a avisar.
É uma consulta sobre os resultados; a demonstração não envia avisos externos.

Os vértices e as chaves precisam manter `equals/hashCode` estáveis enquanto estão
nas coleções. Aqui os records usam componentes imutáveis. Nome e equipe participam
da igualdade de `Servico`; não há atualização de topologia ou identidade durante a busca.
[Contrato de chaves de Map](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Map.html).

Perguntas: a direção representa quem chama quem ou a propagação do impacto? Como muda
a consulta se invertermos as arestas? Por que BFS pode ser útil ao começar a investigação?

## 8. Eventos: duplicidade, falha e idempotência local

```sh
sh executar.sh 8
```

Abra [ConsumidorPagamentos](../src/oficina/casos/ConsumidorPagamentos.java), depois
[ProcessamentoEventos](../src/oficina/demonstracoes/ProcessamentoEventos.java).

| Estrutura | Responsabilidade |
| --- | --- |
| `ArrayBlockingQueue<EventoPagamento>` | Fila de entrada com capacidade três; sinaliza falta de espaço. |
| `HashMap<String, Pedido>` | Consulta do pedido pelo ID. |
| `HashSet<Long>` | IDs de mensagens aplicadas com sucesso. |
| `ArrayDeque<EventoPagamento>` | Mensagens com falha para análise. |

O evento 401 chega duas vezes. A primeira entrega altera o pedido para PAGO; a segunda
é identificada pelo ID e não reaplica o pagamento. O evento 404 aponta para PED-999,
que não existe: a falha fica disponível para análise.

Marcar o ID **depois do sucesso** permite tentar novamente uma mensagem cujo pagamento
falhou. O consumidor devolve um `Resultado` com enum e detalhe, sem imprimir nada;
a apresentação registra o log e atualiza os contadores.

No total: seis entregas, quatro aprovadas, uma duplicada, uma falha, três adiamentos
pela fila cheia e nenhum pendente. A conservação é:

```text
produzidos = processados + duplicados + falhas + pendentes
```

O fluxo é sequencial; o laço explicita a ordem e os efeitos colaterais.
Em um serviço real, persistir estado e garantir atomicidade entre pagamento e marcação
do evento exigiria outra solução. O Set em memória não oferece idempotência distribuída,
não é transacional e perde o histórico quando o processo termina. Não há retentativa automática.

Perguntas: se marcássemos o ID antes de uma operação que falha, poderíamos perder uma
tentativa válida? O que acontece se o processo cair entre atualizar o pedido e marcar o evento?

## Práticas para destacar durante a leitura

| Prática | Onde aparece e por quê |
| --- | --- |
| Nomes de intenção | `confirmarPagamento`, `iniciarSeparacao`, `contarAbertosPorPrioridade`. |
| Invariantes na construção | `Objects.requireNonNull`, textos obrigatórios, IDs e valores positivos. |
| Records e enums | Dados imutáveis e estados/prioridades conhecidos, evitando strings soltas. |
| Responsabilidades pequenas | Objetos validam, casos de uso operam, demonstrações apresentam. |
| Encapsulamento | Coleções privadas; resultados não expõem mapas ou visões internas modificáveis. |
| Comparadores explícitos | Prioridade e ID no backlog; nome e ID na listagem de usuários. |
| Consultas com streams | `filter`, `map`, `sorted`, `min`, `flatMap`, `distinct`, `groupingBy`. |
| Comandos explícitos | Atualizar configuração, consumir mensagem e registrar pagamento. |
| Ausência explícita | `Optional` no retorno de consultas; listas vazias para consultas múltiplas. |
| Tipos adequados | `BigDecimal`, `Instant` e `Duration` carregam a intenção do valor. |
| Testes de comportamento | JUnit cobre estado, ausências, duplicidade, janelas e erros de negócio. |

Streams não armazenam os dados; são uma forma de consultar e transformar uma fonte.
Evite modificar a coleção de origem ou contadores externos durante uma consulta.
`for`/`while` continuam apropriados quando a sequência dos comandos é relevante.
[Contrato de streams](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/stream/package-summary.html).

`Objects.requireNonNull` protege o contrato na entrada. Uma ausência esperada de busca
é um caso diferente, comunicado por `Optional`.
[API Objects](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Objects.html).

## Testes para acompanhar

```sh
sh verificar.sh
```

[DominioTest](../testes/java/oficina/DominioTest.java) cobre as invariantes e transições.
[CasosColecoesTest](../testes/java/oficina/CasosColecoesTest.java) cobre triagem, fila,
histórico, usuários, logs e grafo.
[ConsumoPagamentosTest](../testes/java/oficina/ConsumoPagamentosTest.java) cobre
idempotência, rejeição de pagamentos e contadores. Os testes de integração existentes
também executam o menu e conferem os exemplos Python.
