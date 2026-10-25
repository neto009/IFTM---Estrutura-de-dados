#!/bin/sh
set -eu
cd "$(dirname "$0")"
mkdir -p out out-testes
javac --release 17 -encoding UTF-8 -Xlint:all -Werror -cp 'lib/*' -d out @fontes.txt
javac --release 17 -encoding UTF-8 -Xlint:all -Werror -cp 'out:lib/*' -d out-testes @fontes-testes.txt
java -cp 'out:out-testes:lib/*' org.junit.platform.console.ConsoleLauncher execute \
    --scan-class-path=out-testes --disable-banner --disable-ansi-colors --details=summary --fail-if-no-tests
OFICINA_PYTHON="${OFICINA_PYTHON:-.venv/bin/python}"
exec "$OFICINA_PYTHON" -m unittest discover -s testes -p 'test_*.py' -v
