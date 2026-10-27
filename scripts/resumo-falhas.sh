#!/usr/bin/env bash
# Junta as falhas de um log do `node --test` numa anotação de erro do GitHub Actions.
# A anotação aparece no resumo da execução, sem precisar abrir o log inteiro.
# Uso: bash scripts/resumo-falhas.sh e2e.log "Título"
log="$1"
titulo="${2:-Falhas}"
resumo=$(grep -E '^not ok|^ +error:|^ +[+-] |^ +0: ' "$log" | head -n 80 | sed 's/%/%25/g' | awk '{ printf "%s%%0A", $0 }')
echo "::error title=${titulo}::${resumo:-sem detalhes; veja o log}"
