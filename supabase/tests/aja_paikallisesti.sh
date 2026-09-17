#!/usr/bin/env bash
# Ajaa migraatiot ja hyväksymistestin paikallisessa PostgreSQL 15+ -palvelimessa.
# Tarvitsee tyhjän tietokannan ja yhteysmerkkijonon, esim.
#   supabase/tests/aja_paikallisesti.sh "postgresql://postgres@localhost:5432/testi"
# Skripti luo Supabase-emulaation (roolit, auth-skeema), ajaa migraatiot järjestyksessä
# ja lopuksi hyväksymistestin, joka peruu omat muutoksensa.
set -euo pipefail

YHTEYS="${1:?Anna tietokannan yhteysmerkkijono ensimmäisenä argumenttina}"
HAKEMISTO="$(cd "$(dirname "$0")/.." && pwd)"

echo "== Supabase-emulaatio"
psql "$YHTEYS" -v ON_ERROR_STOP=1 -q -f "$HAKEMISTO/tests/00_supabase_emulaatio.sql"

for m in "$HAKEMISTO"/migrations/*.sql; do
  echo "== Migraatio $(basename "$m")"
  psql "$YHTEYS" -v ON_ERROR_STOP=1 -q -f "$m"
done

echo "== Hyväksymistesti"
psql "$YHTEYS" -v ON_ERROR_STOP=1 -q -t -A -f "$HAKEMISTO/tests/hyvaksymistesti.sql" 2>&1 | sed "s/^psql:.*NOTICE:  //" | grep -v "^$"
