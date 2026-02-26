#!/bin/bash

# Configuration
PROD_URL="https://streetpolynews.com"
OLD_PROJECT="duldhllwapsjytdzpjfz"
NEW_PROJECT="cjodbnsjggslngnzwxsv"

echo "🔍 Starting Production Bundle Audit..."
echo "Target: $PROD_URL"
echo "Expected Project ID: $NEW_PROJECT"
echo "Forbidden Project ID: $OLD_PROJECT"
echo "----------------------------------------"

# 1. Fetch the main HTML to find the current bundle filename
echo "1. Fetching main page to identify JS bundle..."
MAIN_HTML=$(curl -s "$PROD_URL")
BUNDLE_PATH=$(echo "$MAIN_HTML" | grep -o 'src="/assets/[^"]*"' | head -n 1 | cut -d'"' -f2)

if [ -z "$BUNDLE_PATH" ]; then
  echo "❌ Failed to find JS bundle in main page HTML."
  exit 1
fi

echo "✅ Found bundle: $BUNDLE_PATH"
BUNDLE_URL="$PROD_URL$BUNDLE_PATH"

# 2. Fetch the bundle content
echo "2. Fetching bundle content..."
BUNDLE_CONTENT=$(curl -s "$BUNDLE_URL")

if [ -z "$BUNDLE_CONTENT" ]; then
  echo "❌ Failed to fetch bundle content from $BUNDLE_URL"
  exit 1
fi

# 3. Check for OLD project ID
echo "3. Checking for OLD project ID ($OLD_PROJECT)..."
if echo "$BUNDLE_CONTENT" | grep -q "$OLD_PROJECT"; then
  echo "❌ FAIL: Old project ID found in bundle!"
  echo "   This indicates the build environment variables were not updated or cache was not cleared."
else
  echo "✅ PASS: Old project ID not found."
fi

# 4. Check for NEW project ID
echo "4. Checking for NEW project ID ($NEW_PROJECT)..."
if echo "$BUNDLE_CONTENT" | grep -q "$NEW_PROJECT"; then
  echo "✅ PASS: New project ID found in bundle."
else
  echo "❌ FAIL: New project ID NOT found in bundle!"
  echo "   The build might be missing the VITE_SUPABASE_URL environment variable."
fi

echo "----------------------------------------"
echo "Audit Complete."
