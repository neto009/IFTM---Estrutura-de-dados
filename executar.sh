#!/bin/sh
set -eu
cd "$(dirname "$0")"
if [ ! -f lib/jgrapht-core-1.5.2.jar ]; then
    printf '%s\n' 'Dependências ausentes. Execute: sh preparar.sh' >&2
    exit 2
fi
mkdir -p out
javac --release 17 -encoding UTF-8 -cp 'lib/*' -d out @fontes.txt
exec java -Dfile.encoding=UTF-8 -cp 'out:lib/*' oficina.Main "$@"
