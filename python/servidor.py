"""Apresentação local: serve os arquivos web e executa os mesmos exemplos do terminal."""

import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit
import webbrowser

RAIZ = Path(__file__).resolve().parents[1]
CATALOGO = json.loads((RAIZ / "web/aulas.json").read_text(encoding="utf-8"))
EXEMPLOS = {exemplo["id"]: exemplo for exemplo in CATALOGO}
ARQUIVOS = {
    "/": ("web/index.html", "text/html"),
    "/app.js": ("web/app.js", "text/javascript"),
    "/aula.js": ("web/aula.js", "text/javascript"),
    "/visuais.js": ("web/visuais.js", "text/javascript"),
    "/style.css": ("web/style.css", "text/css"),
}


def ler_fonte(referencia):
    arquivo = referencia["arquivo"]
    codigo = (RAIZ / arquivo).read_text(encoding="utf-8")
    linhas = codigo.splitlines()
    if arquivo.endswith(".java"):
        declaracao_pacote = re.search(r"^\s*package\s+([\w.$]+)\s*;", codigo, re.MULTILINE)
        local_tipo = "Pacote"
        local_nome = declaracao_pacote.group(1) if declaracao_pacote else "(pacote padrão)"
    elif arquivo.endswith(".py"):
        local_tipo = "Módulo"
        local_nome = Path(arquivo).with_suffix("").as_posix().replace("/", ".")
    else:
        local_tipo = "Arquivo"
        local_nome = arquivo
    simbolo = referencia.get("simbolo")
    inicio, fim = 0, len(linhas)
    if simbolo:
        nome = re.escape(simbolo)
        if arquivo.endswith(".py"):
            padrao = rf"^(?:def|class)\s+{nome}\b"
        else:
            padrao = rf"^\s*(?:public|private|protected)\b.*\b{nome}\s*\("
        candidatos = [i for i, linha in enumerate(linhas) if re.search(padrao, linha)]
        if not candidatos:
            candidatos = [i for i, linha in enumerate(linhas) if simbolo in linha]
        if not candidatos:
            raise ValueError(f"Símbolo {simbolo} não encontrado em {arquivo}.")
        inicio = candidatos[0]
        if arquivo.endswith(".py"):
            fim = inicio + 1
            while fim < len(linhas):
                linha = linhas[fim]
                if linha and not linha[0].isspace() and not linha.startswith("#"):
                    break
                fim += 1
        else:
            nivel, abriu = 0, False
            fim = inicio
            while fim < len(linhas):
                linha = re.sub(r'"(?:\\.|[^"\\])*"', '""', linhas[fim]).split("//", 1)[0]
                if "{" in linha:
                    abriu = True
                nivel += linha.count("{") - linha.count("}")
                fim += 1
                if (abriu and nivel == 0) or (not abriu and ";" in linha):
                    break
    while fim > inicio and not linhas[fim - 1].strip():
        fim -= 1
    foco = referencia.get("destaque")
    linha_foco = None
    if foco:
        correspondencias = [indice + 1 for indice, linha in enumerate(linhas[inicio:fim], start=inicio)
                            if foco in linha]
        if len(correspondencias) != 1:
            raise ValueError(f"O destaque {foco!r} deve corresponder a uma linha em {arquivo}.")
        linha_foco = correspondencias[0]
    return {"arquivo": arquivo, "simbolo": simbolo or "Visão da classe",
            "localTipo": local_tipo, "localNome": local_nome,
            "inicio": inicio + 1, "fim": fim, "trecho": linhas[inicio:fim], "codigo": codigo,
            "linhaFoco": linha_foco}


def codigo_da_etapa(exemplo, etapa):
    if etapa == 0:
        referencias = exemplo["codigoInicial"]
    elif etapa == -1:
        referencias = exemplo["codigoFinal"]
    elif 1 <= etapa <= len(exemplo["etapas"]):
        referencias = exemplo["etapas"][etapa - 1]["codigo"]
    else:
        raise ValueError("Etapa de código inexistente.")
    return [ler_fonte(referencia) for referencia in referencias]


def separar_etapas(saida):
    """Aproveita os marcadores de etapa que Java e Python já imprimem."""
    etapas = [{"numero": 0, "titulo": "Antes de começar", "linhas": []}]
    for linha in saida.splitlines():
        if linha.strip().startswith("━") or re.match(r"^  \d{2}  ", linha):
            continue
        marcador = re.match(r"^  (\d+)\. (.+)$", linha)
        if marcador:
            etapas.append({
                "numero": int(marcador[1]), "titulo": marcador[2], "linhas": [],
            })
        else:
            etapas[-1]["linhas"].append(linha)
    for etapa in etapas:
        etapa["linhas"] = "\n".join(etapa["linhas"]).strip("\n")
    return etapas


def executar_exemplo(numero, parametros):
    if numero not in EXEMPLOS:
        raise ValueError("Exemplo inexistente.")
    opcoes = []
    permitidos = {"min_samples": (1, 8), "min_cluster_size": (2, 9)} if numero == 10 else {}
    if set(parametros) - set(permitidos):
        raise ValueError("Parâmetro desconhecido para este exemplo.")
    for nome, valores in parametros.items():
        minimo, maximo = permitidos[nome]
        if len(valores) != 1 or not valores[0].isdigit():
            raise ValueError("Informe um único número inteiro para " + nome + ".")
        valor = int(valores[0])
        if not minimo <= valor <= maximo:
            raise ValueError(f"{nome} deve estar entre {minimo} e {maximo}.")
        opcoes.extend(["--" + nome.replace("_", "-"), str(valor)])
    ambiente = {
        **os.environ,
        "OFICINA_CORES": "nunca",
        "OFICINA_PYTHON": sys.executable,
        "PYTHONIOENCODING": "utf-8",
    }
    comando = [
        "java", "-Dfile.encoding=UTF-8", f"-Doficina.raiz={RAIZ}",
        "-cp", f"{RAIZ / '.build' / 'classes'}{os.pathsep}{RAIZ / 'lib' / '*'}",
        "oficina.Main", str(numero), *opcoes,
    ]
    resultado = subprocess.run(
        comando, cwd=RAIZ, env=ambiente, capture_output=True,
        text=True, encoding="utf-8", timeout=120, check=False,
    )
    if resultado.returncode:
        raise RuntimeError(resultado.stderr.strip() or resultado.stdout.strip()
                           or "O exemplo não terminou corretamente.")
    resposta = {"etapas": separar_etapas(resultado.stdout), "saida": resultado.stdout}
    if numero in (1, 2, 3, 4, 6, 9, 11, 12):
        visual = subprocess.run(
            comando[:-1] + ["--dados", str(numero)], cwd=RAIZ, env=ambiente,
            capture_output=True, text=True, encoding="utf-8", timeout=120, check=False,
        )
        if visual.returncode:
            raise RuntimeError(visual.stderr.strip() or "Não foi possível preparar os dados visuais.")
        resposta["visual"] = json.loads(visual.stdout)
        if numero == 12:
            resposta["visual"]["entrada"] = json.loads(
                (RAIZ / "dados/paginas.json").read_text(encoding="utf-8"))
    return resposta


class OficinaHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        rota = urlsplit(self.path)
        try:
            if rota.path == "/api/exemplos":
                self.enviar_json(CATALOGO)
            elif rota.path == "/api/paginas":
                self.enviar_json(json.loads((RAIZ / "dados/paginas.json").read_text(encoding="utf-8")))
            elif re.fullmatch(r"/api/exemplos/\d+", rota.path):
                numero = int(rota.path.rsplit("/", 1)[-1])
                if numero not in EXEMPLOS:
                    self.enviar_json({"erro": "Exemplo inexistente."}, 404)
                    return
                self.enviar_json(executar_exemplo(
                    numero, parse_qs(rota.query, keep_blank_values=True, max_num_fields=4)))
            elif re.fullmatch(r"/api/codigo/\d+", rota.path):
                exemplo = EXEMPLOS.get(int(rota.path.rsplit("/", 1)[-1]))
                if exemplo is None:
                    self.enviar_json({"erro": "Exemplo inexistente."}, 404)
                    return
                parametros = parse_qs(rota.query, keep_blank_values=True, max_num_fields=1)
                if set(parametros) - {"etapa"}:
                    raise ValueError("Parâmetro de código desconhecido.")
                if "etapa" in parametros:
                    self.enviar_json(codigo_da_etapa(exemplo, int(parametros["etapa"][0])))
                else:
                    self.enviar_json([ler_fonte({"arquivo": arquivo}) for arquivo in exemplo["fontes"]])
            elif rota.path in ARQUIVOS:
                arquivo, tipo = ARQUIVOS[rota.path]
                self.enviar((RAIZ / arquivo).read_bytes(), tipo)
            else:
                self.enviar_json({"erro": "Página inexistente."}, 404)
        except ValueError as erro:
            self.enviar_json({"erro": str(erro)}, 400)
        except subprocess.TimeoutExpired:
            self.enviar_json({"erro": "O exemplo excedeu dois minutos. Tente executar pelo terminal."}, 504)
        except (OSError, RuntimeError) as erro:
            self.enviar_json({"erro": str(erro)}, 500)

    def enviar_json(self, conteudo, status=200):
        self.enviar(json.dumps(conteudo, ensure_ascii=False).encode("utf-8"),
                    "application/json", status)

    def enviar(self, conteudo, tipo, status=200):
        try:
            self.send_response(status)
            self.send_header("Content-Type", tipo + "; charset=utf-8")
            self.send_header("Content-Length", str(len(conteudo)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(conteudo)
        except (BrokenPipeError, ConnectionResetError):
            # A troca de exemplo pode cancelar a requisição anterior no navegador.
            pass

    def log_message(self, formato, *argumentos):
        # As etapas ficam no navegador; evita poluir o terminal a cada recurso aberto.
        pass


def main():
    parser = argparse.ArgumentParser(description="Apresentação local da oficina.")
    parser.add_argument("--porta", type=int, default=8000)
    parser.add_argument("--sem-abrir", action="store_true")
    argumentos = parser.parse_args()
    if not 1 <= argumentos.porta <= 65535:
        parser.error("A porta deve estar entre 1 e 65535.")
    try:
        servidor = ThreadingHTTPServer(("127.0.0.1", argumentos.porta), OficinaHandler)
    except OSError as erro:
        parser.exit(2, f"Não foi possível abrir a porta: {erro}\nUse --porta 8001 para escolher outra.\n")
    endereco = f"http://127.0.0.1:{servidor.server_port}"
    print(f"\nOficina no navegador: {endereco}\nCtrl+C encerra o servidor local.\n", flush=True)
    if not argumentos.sem_abrir:
        webbrowser.open(endereco)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nOficina encerrada.")
    finally:
        servidor.server_close()


if __name__ == "__main__":
    main()
