#!/bin/sh
set -eu
cd "$(dirname "$0")"
if [ ! -f lib/jgrapht-core-1.5.2.jar ] || [ ! -f lib/gson-2.13.2.jar ] \
        || [ ! -f lib/error_prone_annotations-2.41.0.jar ]; then
    printf '%s\n' 'Dependências ausentes. Execute: sh preparar.sh' >&2
    exit 2
fi
mkdir -p .build/classes
find src -type f -name '*.java' -exec javac --release 17 -encoding UTF-8 -cp 'lib/*' -d .build/classes {} +
if [ "$#" -eq 0 ] || [ "${1:-}" = "web" ]; then
    if [ "$#" -gt 0 ]; then shift; fi
    exec "${OFICINA_PYTHON:-.venv/bin/python}" python/servidor.py "$@"
fi
if [ "${1:-}" = "terminal" ]; then shift; fi
exec java -Dfile.encoding=UTF-8 -cp '.build/classes:lib/*' oficina.Main "$@"
