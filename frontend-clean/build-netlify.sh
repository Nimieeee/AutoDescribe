#!/bin/bash

# Netlify build script for AutoDescribe
echo "🚀 Starting Netlify build for AutoDescribe..."

# Set environment
export NODE_ENV=production

# Clean any existing builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies with clean cache
echo "📦 Installing dependencies..."
npm ci --prefer-offline --no-audit

# Verify critical dependencies
echo "🔍 Verifying dependencies..."
if ! npm list tailwindcss > /dev/null 2>&1; then
    echo "❌ tailwindcss not found, installing..."
    npm install tailwindcss@^3.3.0 --save
fi

if ! npm list postcss > /dev/null 2>&1; then
    echo "❌ postcss not found, installing..."
    npm install postcss@^8 --save
fi

if ! npm list autoprefixer > /dev/null 2>&1; then
    echo "❌ autoprefixer not found, installing..."
    npm install autoprefixer@^10.0.1 --save
fi

# Build the application
echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"