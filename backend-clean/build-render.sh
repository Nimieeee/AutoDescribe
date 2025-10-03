#!/bin/bash

# Render build script for AutoDescribe backend
echo "🚀 Starting Render build for AutoDescribe backend..."

# Set environment
export NODE_ENV=production

# Clean any existing builds
echo "🧹 Cleaning previous builds..."
rm -rf dist
rm -rf node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Verify critical dependencies
echo "🔍 Verifying dependencies..."
if ! npm list @types/pg > /dev/null 2>&1; then
    echo "❌ @types/pg not found, installing..."
    npm install @types/pg@^8.10.7 --save
fi

if ! npm list @jest/globals > /dev/null 2>&1; then
    echo "❌ @jest/globals not found, installing..."
    npm install @jest/globals@^30.0.0 --save
fi

# Build the application (excluding test files)
echo "🏗️ Building TypeScript application..."
npx tsc -p tsconfig.prod.json

echo "✅ Build completed successfully!"

# Verify build output
if [ -f "dist/server.js" ]; then
    echo "✅ Server build verified: dist/server.js exists"
else
    echo "❌ Build failed: dist/server.js not found"
    exit 1
fi