"""Verifica os cenários e a composição das etapas; não testa os algoritmos das bibliotecas."""

from contextlib import redirect_stdout
import io
import os
import re
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np
from hdbscan import HDBSCAN
from sklearn.metrics import adjusted_rand_score

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "python"))
import cosseno
import hdbscan_exemplo as agrupamento
import rag


class ExemplosPython(unittest.TestCase):
    def test_cosseno_exibe_perfis_conhecidos(self):
        saida = io.StringIO()
        with redirect_stdout(saida):
            cosseno.demonstrar()
        for escore in ("1.0000", "0.8000", "0.0000", "0.6000"):
            self.assertIn(f"cosseno={escore}", saida.getvalue())

    def test_rag_recupera_documentos_e_preserva_fontes(self):
        indice = rag.IndiceDocumentos(rag.documentos_ficticios())
        recuperados = indice.buscar(
            "Como vejo a situação do pedido depois que o pagamento foi aprovado?"
        )
        self.assertEqual([documento.id for documento, _ in recuperados], ["D2", "D1"])
        contexto = rag.montar_contexto(recuperados)
        self.assertLess(contexto.index("[D2]"), contexto.index("[D1]"))
        self.assertNotIn("[D3]", contexto)
        with self.assertRaises(ValueError):
            indice.buscar("Como vejo meu pedido?", k=0)

    def test_hdbscan_estruturas_intermediarias_conhecidas(self):
        dados = agrupamento.executar_etapas()
        self.assertEqual(len(dados["incidentes"]), 9)
        self.assertEqual(dados["caracteristicas"].shape, (9, 2))
        self.assertEqual(dados["pontos"].shape, (9, 2))
        self.assertEqual(dados["distancias"].shape, (9, 9))
        np.testing.assert_allclose(dados["nucleos"], np.diag(dados["alcance"]))
        self.assertGreaterEqual(dados["alcance"][7, 8] + 1e-8, max(dados["nucleos"][7:9]))
        self.assertEqual(dados["grafo"].nnz, 72)
        self.assertEqual(dados["mst"].nnz, 8)
        self.assertEqual(dados["arestas"].shape, (8, 3))
        self.assertAlmostEqual(dados["arestas"][:, 2].sum(), 4.8978, places=3)
        self.assertEqual(dados["hierarquia"].shape, (8, 4))
        self.assertEqual(dados["condensada"].dtype.names, ("parent", "child", "lambda_val", "child_size"))
        self.assertAlmostEqual(dados["estabilidades"][9], 13.8291, places=3)
        self.assertAlmostEqual(dados["estabilidades"][10], 108.6007, places=2)
        self.assertAlmostEqual(dados["estabilidades"][11], 77.7490, places=2)
        self.assertEqual(list(dados["selecionados"]), [10, 11])
        np.testing.assert_array_equal(dados["rotulos"], [0, 0, 0, 0, 1, 1, 1, 1, -1])

    def test_hdbscan_pipeline_equivale_a_api_completa_nos_64_casos(self):
        for min_samples in range(1, 9):
            for min_cluster_size in range(2, 10):
                with self.subTest(min_samples=min_samples, min_cluster_size=min_cluster_size):
                    dados = agrupamento.executar_etapas(min_samples, min_cluster_size)
                    np.testing.assert_allclose(dados["nucleos"], np.diag(dados["alcance"]))
                    referencia = HDBSCAN(
                        min_samples=min_samples, min_cluster_size=min_cluster_size,
                        algorithm="generic", approx_min_span_tree=False,
                        core_dist_n_jobs=1, cluster_selection_method="eom",
                        allow_single_cluster=False,
                    ).fit_predict(dados["pontos"])
                    self.assertEqual(adjusted_rand_score(referencia, dados["rotulos"]), 1)
                    np.testing.assert_array_equal(referencia == -1, dados["rotulos"] == -1)

    def test_hdbscan_parametros_e_etapa_isolada(self):
        np.testing.assert_array_equal(agrupamento.executar_etapas(min_cluster_size=5)["rotulos"], [-1] * 9)
        for parametros in ((0, 3), (9, 3), (2, 1), (2, 10)):
            with self.assertRaises(ValueError):
                agrupamento.executar_etapas(*parametros)
        saida = io.StringIO()
        with redirect_stdout(saida):
            agrupamento.demonstrar(etapa=5)
        self.assertIn("5. MST", saida.getvalue())
        self.assertNotIn("8. Resultado", saida.getvalue())
        saida = io.StringIO()
        with redirect_stdout(saida):
            agrupamento.demonstrar(etapa=9)
        self.assertIn("9. Comparação", saida.getvalue())
        self.assertIn("Mesma partição de incidentes: sim.", saida.getvalue())
        self.assertNotIn("8. Resultado", saida.getvalue())


class MenuJava(unittest.TestCase):
    def executar_java(self, *argumentos, entrada=None):
        ambiente = os.environ.copy()
        ambiente["OFICINA_PYTHON"] = sys.executable
        return subprocess.run(
            ["java", "-Dfile.encoding=UTF-8", "-cp", f"out{os.pathsep}lib/*",
             "oficina.Main", *argumentos],
            cwd=RAIZ, env=ambiente, input=entrada, capture_output=True, text=True,
            encoding="utf-8", timeout=60,
        )

    def test_dez_opcoes_no_menu_e_entrada_invalida(self):
        resultado = self.executar_java(entrada="invalida\n" + "".join(f"{i}\n" for i in range(1, 11)) + "0\n")
        self.assertEqual(resultado.returncode, 0, resultado.stderr)
        titulos = re.findall(
            r"(?m)^  (?:01  Backlog|02  Pedidos|03  Desfazer|04  Usuários|"
            r"05  Investigação|06  Impacto|07  COSSENO|08  Pagamentos|09  RAG|10  HDBSCAN)",
            resultado.stdout,
        )
        self.assertEqual(len(titulos), 10)
        self.assertIn("Não foi possível executar:", resultado.stdout)
        self.assertIn("Oficina encerrada.", resultado.stdout)
        self.assertIn("Top 3 abertos:", resultado.stdout)
        self.assertIn("BFS", resultado.stdout)
        self.assertIn("8. Resultado:", resultado.stdout)

    def test_eventos_preservam_ordem_e_contadores(self):
        resultado = self.executar_java("8")
        self.assertEqual(resultado.returncode, 0, resultado.stderr)
        self.assertIn("produzidos=6, processados=4, duplicados=1, falhas=1, adiamentos=3, pendentes=0, filaFalhas=1", resultado.stdout)
        marcadores = re.findall(r'\[consumidor\] id=(\d+) resultado=(\w+)', resultado.stdout)
        self.assertEqual(marcadores, [('401', 'APROVADO'), ('402', 'APROVADO'), ('401', 'DUPLICADO'),
                                      ('404', 'FALHA'), ('405', 'APROVADO'), ('406', 'APROVADO')])

    def test_parametros_python_e_erro_propagados_pelo_menu(self):
        resumo = self.executar_java("hdbscan", "--min-cluster-size", "5", "--resumo")
        self.assertEqual(resumo.returncode, 0, resumo.stderr)
        self.assertEqual(resumo.stdout.count("(ruído)"), 9)
        invalido = self.executar_java("hdbscan", "--min-samples", "0")
        self.assertEqual(invalido.returncode, 2)
        self.assertNotIn("Traceback", invalido.stderr)


if __name__ == "__main__":
    unittest.main()
