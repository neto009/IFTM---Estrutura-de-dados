"""Títulos e marcas ANSI consistentes para os exemplos Python."""

import os
import sys
from textwrap import wrap

CIANO = "\033[1;36m"
VERDE = "\033[1;32m"
AMARELO = "\033[1;33m"
CINZA = "\033[2;37m"
RESET = "\033[0m"


def cores_ativas():
    modo = os.getenv("OFICINA_CORES", "").lower()
    if modo == "nunca":
        return False
    if modo == "sempre" or os.getenv("CLICOLOR_FORCE") == "1":
        return True
    return "NO_COLOR" not in os.environ and sys.stdout.isatty() and os.getenv("TERM", "") != "dumb"


class Tela:
    def __init__(self):
        self._cores = cores_ativas()

    def estilo(self, texto, cor):
        return f"{cor}{texto}{RESET}" if self._cores else texto

    def titulo(self, texto):
        print()
        print(self.estilo("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", CIANO))
        print(self.estilo(f"  {texto}", CIANO))
        print(self.estilo("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", CIANO))

    def etapa(self, numero, texto):
        print(f"\n  {self.estilo(f'{numero}. {texto}', CIANO)}")

    def explicacao(self, rotulo, texto):
        largura = 80 - len(rotulo) - 6
        linhas = wrap(texto, width=largura, break_long_words=False, break_on_hyphens=False)
        self.linha(f"{self.estilo(rotulo + ':', CIANO)} {linhas[0]}")
        for linha in linhas[1:]:
            self.linha("  " + linha)

    def explicar_etapa(self, *, entrada, motivo, escolha, saida):
        """Imprime o raciocínio da etapa com quebras de linha legíveis no terminal."""
        for rotulo, texto in (
            ("Entrada", entrada),
            ("Por que agora", motivo),
            ("Escolha", escolha),
            ("Saída", saida),
        ):
            self.explicacao(rotulo, texto)

    def objetivo(self, texto):
        print(f"  {self.estilo('Objetivo:', CIANO)} {texto}")

    def passos(self, texto):
        print(f"  {self.estilo('Passos:', CIANO)} {texto}")

    def linha(self, texto):
        print(f"    {texto}")

    def valor(self, rotulo, valor):
        print(f"    {self.estilo(f'{rotulo:<30}', CIANO)} {valor}")

    def resultado(self, texto):
        print(f"  {self.estilo('✓', VERDE)} {texto}")

    def aviso(self, texto):
        print(f"  {self.estilo('!', AMARELO)} {texto}")

    def dica(self, texto):
        print(f"  {self.estilo('↳ ' + texto, CINZA)}")
