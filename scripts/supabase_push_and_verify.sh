#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ENV_FILE:-${REPO_DIR}/.env.local}"
SKIP_LOCAL_RESET="${SKIP_LOCAL_RESET:-0}"

usage() {
  cat <<'EOF'
Usage: scripts/supabase_push_and_verify.sh [options]

Options:
  --skip-local-reset     Skip local migration verification (docker/local db check).
  --env-file <path>      Load env vars from this file (default: .env.local).
  --project-ref <ref>    Override Supabase project ref.
  --help                 Show this help message.

Required env:
  SUPABASE_DB_PASSWORD   Remote database password (or set SUPABASE_DB_URL directly).

Optional env:
  SUPABASE_PROJECT_REF   Project ref if not in .env.local.
  VITE_SUPABASE_PROJECT_ID
  SUPABASE_DB_URL        Full postgres URL (takes priority over derived URL).
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-local-reset)
      SKIP_LOCAL_RESET=1
      shift
      ;;
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --project-ref)
      SUPABASE_PROJECT_REF="$2"
      shift 2
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI is not installed or not on PATH."
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
  echo "Loading environment from ${ENV_FILE}"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-${VITE_SUPABASE_PROJECT_ID:-}}"
if [[ -z "${PROJECT_REF}" ]]; then
  echo "Missing project ref. Set SUPABASE_PROJECT_REF or VITE_SUPABASE_PROJECT_ID."
  exit 1
fi

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
    echo "Missing SUPABASE_DB_PASSWORD (or set SUPABASE_DB_URL directly)."
    exit 1
  fi

  if [[ "${SUPABASE_DB_PASSWORD}" =~ [:/@?#\[\]\ ] ]]; then
    echo "SUPABASE_DB_PASSWORD contains URL-unsafe characters."
    echo "Set SUPABASE_DB_URL directly instead of deriving from password."
    exit 1
  fi

  SUPABASE_DB_URL="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"
fi

cd "$REPO_DIR"

if [[ "$SKIP_LOCAL_RESET" != "1" ]]; then
  echo "Running local migration verification (supabase db reset --local --yes)..."
  supabase db reset --local --yes
fi

echo "Pushing migrations to remote (${PROJECT_REF}) via direct DB URL..."
supabase db push --db-url "$SUPABASE_DB_URL" --yes

echo "Migration push complete."
echo "If app still errors, run a hard refresh and re-check failing REST calls."
