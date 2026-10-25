#!/bin/sh
set -eu
cd "$(dirname "$0")"
if [ -n "${OFICINA_PYTHON:-}" ]; then
    exec "$OFICINA_PYTHON" preparar.py
fi

if [ -x .venv/bin/python ] && .venv/bin/python -c 'import sys; raise SystemExit(sys.version_info < (3, 10))'; then
    exec .venv/bin/python preparar.py
fi

for interpretador in python3.13 python3.12 python3.11 python3.10 python3; do
    if command -v "$interpretador" >/dev/null 2>&1 \
            && "$interpretador" -c 'import sys; raise SystemExit(sys.version_info < (3, 10))' 2>/dev/null; then
        exec "$interpretador" preparar.py
    fi
done

printf '%s\n' 'Python 3.10+ não encontrado. Instale uma versão compatível ou defina OFICINA_PYTHON.' >&2
exit 2
