"""Comparação de perfis fictícios com a função pronta do scikit-learn."""

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from terminal import Tela


def demonstrar() -> None:
    tela = Tela()
    consulta = np.array([[8, 6, 0]], dtype=float)
    nomes = ("Semana semelhante", "Equipe de pedidos", "Equipe de acesso", "Equipe de pagamentos")
    perfis = np.array([[16, 12, 0], [4, 0, 0], [0, 0, 12], [0, 6, 0]], dtype=float)

    tela.titulo("07  COSSENO  |  comparar o volume de chamados por área")
    tela.objetivo("encontrar semanas e equipes com uma distribuição de chamados parecida com a semana consultada.")
    tela.passos("representar áreas como colunas → comparar cada perfil com cosine_similarity → interpretar a proporção.")
    tela.etapa(1, "Entrada")
    tela.linha("Cada linha é um perfil; as colunas contam chamados de pedidos, pagamentos e acesso, nessa ordem.")
    tela.linha(f"Semana consultada: {consulta[0]}")
    tela.linha(f"Perfis históricos: ndarray {perfis.shape}; consulta: ndarray {consulta.shape}.")

    # Compara uma semana com perfis históricos sem implementar a fórmula do cosseno.
    similares = cosine_similarity(consulta, perfis)[0]
    tela.etapa(2, "Similaridade  |  sklearn.metrics.pairwise.cosine_similarity")
    tela.linha("Compara a consulta com cada linha e ordena da maior para a menor semelhança de proporção.")
    tela.linha("O escore compara a distribuição entre áreas, não o volume total de chamados.")
    ranking = sorted(zip(nomes, perfis, similares), key=lambda item: item[2], reverse=True)
    for posicao, (nome, perfil, similaridade) in enumerate(ranking, start=1):
        resultado = f"{posicao}º  {nome:<22} {str(perfil):18} cosseno={similaridade:6.4f}"
        if similaridade > 0:
            tela.resultado(resultado)
        else:
            tela.linha(resultado)

    tela.etapa(3, "Como interpretar")
    tela.linha("1: mesma proporção; 0: nenhum componente em comum neste conjunto de contagens.")
    tela.dica("Contagens não negativas produzem escores de 0 a 1; dados centrados podem gerar valores negativos.")


if __name__ == "__main__":
    demonstrar()
