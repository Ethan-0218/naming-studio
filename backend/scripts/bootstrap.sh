#!/usr/bin/env bash
# Bootstrap: generate derived SQLite databases from source data.
# Run from the backend/ directory with the virtualenv activated:
#   cd backend && source .venv/bin/activate && bash scripts/bootstrap.sh
set -e
cd "$(dirname "$0")/.."

echo "[1/2] Building name_hanja_combinations.sqlite3..."
python -m scripts.build_hanja_combinations

echo "[2/2] Building scored_combinations.sqlite3..."
python -m scripts.build_scored_combinations

echo "Done. Both databases generated."
