#!/bin/bash

# AutoDescribe Netlify Deployment Script
echo "🚀 Preparing AutoDescribe for Netlify deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "frontend-clean" ]; then
    print_error "frontend-clean directory not found! Please run this script from the project root."
    exit 1
fi

print_status "Building frontend for Netlify..."

# Navigate to frontend directory
cd frontend-clean

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found in frontend-clean directory!"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "npm install failed!"
    exit 1
fi

# Build the application
print_status "Building Next.js application..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed! Check the error messages above."
    exit 1
fi

# Go back to root directory
cd ..

print_success "Frontend build completed successfully!"

# Create deployment summary
cat > NETLIFY_DEPLOYMENT_SUMMARY.md << EOF
# AutoDescribe Netlify Deployment Summary

## ✅ Build Status
- Frontend built successfully
- Optimized for Netlify deployment
- Ready for production

## 🚀 Next Steps

### 1. Deploy to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Sign up/login with GitHub
3. Click "New site from Git"
4. Select your GitHub repository: \`AutoDescribe\`
5. Configure build settings:
   - **Base directory**: \`frontend-clean\`
   - **Build command**: \`npm run build\`
   - **Publish directory**: \`.next\`

### 2. Add Environment Variables
In Netlify dashboard → Site settings → Environment variables:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
\`\`\`

### 3. Deploy Backend
1. Go to [render.com](https://render.com)
2. Create Web Service from GitHub
3. Set root directory: \`backend-clean\`
4. Add environment variables
5. Deploy

## 🔗 One-Click Deploy
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Nimieeee/AutoDescribe&base=frontend-clean)

## 📊 What You Get Free
- ✅ 100GB bandwidth/month
- ✅ Unlimited personal projects  
- ✅ Automatic HTTPS/SSL
- ✅ Global CDN
- ✅ Custom domains
- ✅ Deploy previews

Generated on: $(date)
EOF

print_success "Deployment summary created: NETLIFY_DEPLOYMENT_SUMMARY.md"

echo ""
echo "🎉 AutoDescribe is ready for Netlify deployment!"
echo ""
print_status "Next steps:"
echo "  1. Push your code to GitHub (if not already done)"
echo "  2. Set up Supabase database"
echo "  3. Deploy backend to Render"
echo "  4. Deploy frontend to Netlify"
echo "  5. Configure environment variables"
echo ""
print_success "See NETLIFY_DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
print_status "One-click deploy: https://app.netlify.com/start/deploy?repository=https://github.com/Nimieeee/AutoDescribe&base=frontend-clean"