"""Entrada independente dos exemplos Python; também é chamada pelo menu Java."""

import argparse
import sys


def main():
    parser = argparse.ArgumentParser(description="Exemplos práticos com bibliotecas Python.")
    exemplos = parser.add_subparsers(dest="exemplo", required=True)
    exemplos.add_parser("cosseno", help="Comparar perfis com cosine_similarity.")
    exemplos.add_parser("rag", help="Recuperar documentos e montar contexto.")
    agrupamento = exemplos.add_parser("hdbscan", help="Dissecar o HDBSCAN e comparar com a API completa.")
    agrupamento.add_argument("--min-samples", type=int, choices=range(1, 9), default=2,
                             help="Quantidade de vizinhos externos (padrão: 2).")
    agrupamento.add_argument("--min-cluster-size", type=int, choices=range(2, 10), default=3)
    exibicao = agrupamento.add_mutually_exclusive_group()
    exibicao.add_argument("--debug", dest="debug", action="store_true", help="Oito etapas e comparação final (padrão).")
    exibicao.add_argument("--resumo", dest="debug", action="store_false", help="Entrada, rótulos e comparação.")
    exibicao.add_argument("--etapa", type=int, choices=range(1, 10), help="Exibir uma etapa (1 a 8) ou a comparação (9).")
    agrupamento.set_defaults(debug=True)
    argumentos = parser.parse_args()
    try:
        if argumentos.exemplo == "cosseno":
            from cosseno import demonstrar
            demonstrar()
        elif argumentos.exemplo == "rag":
            from rag import demonstrar
            demonstrar()
        else:
            from hdbscan_exemplo import demonstrar
            demonstrar(argumentos.min_samples, argumentos.min_cluster_size,
                      argumentos.debug, argumentos.etapa)
    except ImportError as erro:
        parser.exit(2, f"Dependência ausente ou incompatível: {erro}\nExecute: sh preparar.sh\n")
    except ValueError as erro:
        parser.error(str(erro))


if __name__ == "__main__":
    sys.exit(main())
