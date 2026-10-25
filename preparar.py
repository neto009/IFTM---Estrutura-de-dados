"""Instala as dependências locais uma vez; as demonstrações depois funcionam offline."""

from pathlib import Path
import subprocess
import sys
from urllib.request import urlopen
import venv

RAIZ = Path(__file__).resolve().parent
ARTEFATOS_JAVA = (
    ("com/google/code/gson/gson/2.13.2", "gson-2.13.2.jar"),
    ("com/google/errorprone/error_prone_annotations/2.41.0", "error_prone_annotations-2.41.0.jar"),
    ("org/jgrapht/jgrapht-core/1.5.2", "jgrapht-core-1.5.2.jar"),
    ("org/jheaps/jheaps/0.14", "jheaps-0.14.jar"),
    ("org/apfloat/apfloat/1.10.1", "apfloat-1.10.1.jar"),
)


def preparar():
    if sys.version_info < (3, 10):
        versao = f"{sys.version_info.major}.{sys.version_info.minor}"
        raise SystemExit(f"Python {versao} não é compatível. Use Python 3.10 ou superior; recomendado: Python 3.13.")
    ambiente = RAIZ / ".venv"
    python = ambiente / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
    if not python.exists():
        venv.EnvBuilder(with_pip=True).create(ambiente)
    subprocess.run(
        [str(python), "-m", "pip", "install", "--disable-pip-version-check",
         "--no-cache-dir", "--only-binary=:all:", "-r", str(RAIZ / "requirements.txt")],
        check=True,
    )
    bibliotecas = RAIZ / "lib"
    bibliotecas.mkdir(exist_ok=True)
    for caminho, nome in ARTEFATOS_JAVA:
        destino = bibliotecas / nome
        if destino.exists():
            continue
        url = f"https://repo.maven.apache.org/maven2/{caminho}/{nome}"
        print(f"Baixando {nome} do Maven Central...", flush=True)
        with urlopen(url, timeout=60) as resposta:
            conteudo = resposta.read()
        temporario = destino.with_suffix(".jar.part")
        temporario.write_bytes(conteudo)
        temporario.replace(destino)
    print("Ambiente preparado. Abra a oficina: sh executar.sh")


if __name__ == "__main__":
    preparar()
