#!/usr/bin/env bash
set -euo pipefail

PROJECT_REF="${PROJECT_REF:-cjodbnsjggslngnzwxsv}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI is not installed or not on PATH."
  exit 1
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "SUPABASE_ACCESS_TOKEN is not set. Export it before running this script."
  exit 1
fi

echo "Logging in to Supabase CLI..."
supabase login --token "$SUPABASE_ACCESS_TOKEN"

cd "$REPO_DIR"

if [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "Linking project ${PROJECT_REF} with explicit DB password..."
  supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
else
  echo "Linking project ${PROJECT_REF}..."
  echo "If prompted, enter the remote DB password."
  supabase link --project-ref "$PROJECT_REF"
fi

echo "Pushing migrations to linked project..."
supabase db push --yes

echo "Migration push complete."
echo "Next: run SQL from supabase/scripts/verify_admin_spine.sql in Supabase SQL editor."
