#!/bin/bash
# update_vercel_env.sh
# Usage: ./update_vercel_env.sh
# Requires Vercel CLI (npx vercel) to be logged in (run 'npx vercel login' first if needed)

# Exit on error
set -e

echo "🚀 Updating Vercel Production Environment Variables..."

# Load .env.local if it exists
if [ -f .env.local ]; then
  echo "📄 Loading .env.local..."
  set -a
  source .env.local
  set +a
fi

if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "❌ Missing VITE_SUPABASE_URL in shell environment."
  exit 1
fi

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
  
  # Remove existing individually to handle different environments cleanly
  npx vercel env rm "$key" production -y || true
  npx vercel env rm "$key" preview -y || true
  npx vercel env rm "$key" development -y || true
  
  # Add new value to production
  echo -n "$value" | npx vercel env add "$key" production
}

# The Variables
if [ -n "$EXPECTED_SUPABASE_PROJECT_REF" ]; then
  add_env "EXPECTED_SUPABASE_PROJECT_REF" "$EXPECTED_SUPABASE_PROJECT_REF"
fi

add_env "VITE_SUPABASE_URL" "$VITE_SUPABASE_URL"
add_env "VITE_SUPABASE_ANON_KEY" "$VITE_SUPABASE_ANON_KEY"
add_env "VITE_SUPABASE_PUBLISHABLE_KEY" "$VITE_SUPABASE_ANON_KEY"
add_env "VITE_CANONICAL_HOST" "streetpolynews.com"
add_env "VITE_CANONICAL_PROTOCOL" "https"

echo "✅ Environment variables updated."
echo "🔄 Triggering redeploy..."
npx vercel deploy --prod
