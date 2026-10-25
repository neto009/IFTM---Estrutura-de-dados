"""Busca lexical local com TF-IDF e montagem das fontes para um contexto de RAG."""

from collections.abc import Iterable
from dataclasses import dataclass
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from terminal import Tela


@dataclass(frozen=True)
class Documento:
    id: str
    titulo: str
    texto: str


class IndiceDocumentos:
    """Indexa o texto uma vez e reutiliza a matriz esparsa para cada consulta."""

    def __init__(self, documentos: Iterable[Documento]):
        self._documentos = tuple(documentos)
        if not self._documentos:
            raise ValueError("O índice precisa de pelo menos um documento.")
        if any(not documento.texto.strip() for documento in self._documentos):
            raise ValueError("Cada documento precisa ter texto.")

        self._vetorizador = TfidfVectorizer()
        self._matriz_documentos = self._vetorizador.fit_transform(
            [documento.texto for documento in self._documentos]
        )

    @property
    def resumo_matriz(self) -> str:
        matriz = self._matriz_documentos
        return f"{matriz.format.upper()} shape={matriz.shape}, nnz={matriz.nnz} valores não nulos"

    @property
    def quantidade_termos(self) -> int:
        return len(self._vetorizador.vocabulary_)

    def buscar(self, consulta: str, k: int = 2) -> list[tuple[Documento, float]]:
        if (
            isinstance(k, bool)
            or not isinstance(k, int)
            or not 1 <= k <= len(self._documentos)
        ):
            raise ValueError("k deve estar entre 1 e o número de documentos.")
        if not isinstance(consulta, str) or not consulta.strip():
            raise ValueError("A consulta precisa conter texto.")

        vetor_consulta = self._vetorizador.transform([consulta])
        escores = cosine_similarity(vetor_consulta, self._matriz_documentos)[0]
        indices = np.argsort(-escores, kind="stable")[:k]
        return [(self._documentos[indice], float(escores[indice])) for indice in indices]


def documentos_ficticios() -> list[Documento]:
    return [
        Documento("D1", "Acompanhamento de pedidos",
                  "A pessoa acompanha a situação do pedido e consulta o prazo de entrega no portal."),
        Documento("D2", "Pagamento e situação do pedido",
                  "Depois que o pagamento é aprovado, consulte no portal a situação atual do pedido."),
        Documento("D3", "Recuperação de acesso",
                  "Para recuperar o acesso, solicite a redefinição da senha na tela de login."),
        Documento("D4", "Reembolsos",
                  "Reembolsos aprovados ficam disponíveis no histórico financeiro."),
    ]


def montar_contexto(recuperados: Iterable[tuple[Documento, float]]) -> str:
    return "\n\n".join(f"[{doc.id}] {doc.titulo}\n{doc.texto}" for doc, _ in recuperados)


def demonstrar() -> None:
    tela = Tela()
    documentos = documentos_ficticios()
    consulta = "Como vejo a situação do pedido depois que o pagamento foi aprovado?"
    indice = IndiceDocumentos(documentos)

    tela.titulo("09  RAG  |  busca textual e montagem do contexto")
    tela.objetivo("encontrar artigos de suporte relacionados à pergunta e preparar suas fontes para um contexto.")
    tela.passos("extrair termos dos artigos → vetorizar a pergunta → ordenar por cosseno → reunir os textos encontrados.")
    tela.etapa(1, "Documentos e índice")
    tela.linha(f"Base de conhecimento local: {len(documentos)} artigos de suporte fictícios.")
    tela.linha("fit_transform aprende o vocabulário e cria a matriz TF-IDF, com um artigo por linha.")
    tela.valor("Matriz TF-IDF", indice.resumo_matriz)
    tela.valor("Termos no vocabulário", indice.quantidade_termos)
    tela.dica("Linhas são artigos; colunas são termos; nnz conta os pesos não nulos armazenados.")
    tela.dica("TfidfVectorizer extrai os termos do texto; não há vetores preenchidos à mão.")

    tela.etapa(2, "Consulta e ranking")
    tela.linha(f"Pergunta: {consulta}")
    tela.linha("transform usa o mesmo vocabulário; cosine_similarity compara a pergunta com cada artigo.")
    tela.linha("argsort ordena os escores; eles são medidas de correspondência lexical, não probabilidades.")
    recuperados = indice.buscar(consulta, k=2)
    for documento, escore in recuperados:
        tela.resultado(f"{documento.id} · {documento.titulo} · cosseno {escore:.4f}")

    tela.etapa(3, "Contexto recuperado para uma etapa posterior de geração")
    for linha in montar_contexto(recuperados).splitlines():
        tela.linha(linha)
    tela.aviso("Esta oficina demonstra recuperação lexical; não chama um modelo nem gera resposta.")
    tela.dica("Em produção, construir o índice uma vez e persistir o vocabulário e a matriz.")


if __name__ == "__main__":
    demonstrar()
