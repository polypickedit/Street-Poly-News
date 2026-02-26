#!/bin/bash
# update_vercel_env.sh
# Usage: ./update_vercel_env.sh
# Requires Vercel CLI (npx vercel) to be logged in (run 'npx vercel login' first if needed)

# Exit on error
set -e

echo "🚀 Updating Vercel Production Environment Variables..."

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "❌ Missing VITE_SUPABASE_ANON_KEY in shell environment."
  echo "   Export it first, then rerun this script."
  exit 1
fi

# Function to add env var using npx vercel
add_env() {
  local key=$1
  local value=$2
  echo "Setting $key..."
  # Remove existing if present to avoid conflicts
  npx vercel env rm "$key" production -y || true
  # Add new value
  echo -n "$value" | npx vercel env add "$key" production
}

# The Variables
add_env "EXPECTED_SUPABASE_PROJECT_REF" "cjodbnsjggslngnzwxsv"
add_env "VITE_SUPABASE_URL" "https://cjodbnsjggslngnzwxsv.supabase.co"
add_env "VITE_SUPABASE_ANON_KEY" "$VITE_SUPABASE_ANON_KEY"
add_env "VITE_SUPABASE_PUBLISHABLE_KEY" "$VITE_SUPABASE_ANON_KEY"
add_env "VITE_CANONICAL_HOST" "streetpolynews.com"
add_env "VITE_CANONICAL_PROTOCOL" "https"

echo "✅ Environment variables updated."
echo "🔄 Triggering redeploy..."
npx vercel deploy --prod
