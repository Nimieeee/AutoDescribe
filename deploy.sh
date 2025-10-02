#!/bin/bash

# AutoDescribe Deployment Script
echo "🚀 Starting AutoDescribe deployment preparation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "git is not installed. Please install git."
        exit 1
    fi
    
    print_success "All dependencies are installed."
}

# Build backend
build_backend() {
    print_status "Building backend..."
    cd backend-clean
    
    if [ ! -f "package.json" ]; then
        print_error "Backend package.json not found!"
        exit 1
    fi
    
    npm install
    if [ $? -ne 0 ]; then
        print_error "Backend npm install failed!"
        exit 1
    fi
    
    npm run build
    if [ $? -ne 0 ]; then
        print_error "Backend build failed!"
        exit 1
    fi
    
    cd ..
    print_success "Backend built successfully!"
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    cd frontend-clean
    
    if [ ! -f "package.json" ]; then
        print_error "Frontend package.json not found!"
        exit 1
    fi
    
    npm install
    if [ $? -ne 0 ]; then
        print_error "Frontend npm install failed!"
        exit 1
    fi
    
    npm run build
    if [ $? -ne 0 ]; then
        print_error "Frontend build failed!"
        exit 1
    fi
    
    cd ..
    print_success "Frontend built successfully!"
}

# Check environment variables
check_env_vars() {
    print_status "Checking environment variables..."
    
    # Check backend env
    if [ ! -f "backend-clean/.env" ]; then
        print_warning "Backend .env file not found. Make sure to set environment variables in your deployment platform."
    fi
    
    # Check frontend env
    if [ ! -f "frontend-clean/.env.local" ]; then
        print_warning "Frontend .env.local file not found. Make sure to set environment variables in your deployment platform."
    fi
    
    print_success "Environment check completed."
}

# Create deployment summary
create_deployment_summary() {
    print_status "Creating deployment summary..."
    
    cat > DEPLOYMENT_SUMMARY.md << EOF
# AutoDescribe Deployment Summary

## Build Status
- ✅ Backend built successfully
- ✅ Frontend built successfully
- ✅ Ready for deployment

## Deployment Options

### Option 1: Vercel + Railway (Recommended)
1. **Deploy Backend to Railway:**
   - Connect GitHub repository
   - Set root directory to \`backend-clean\`
   - Add environment variables
   - Deploy

2. **Deploy Frontend to Vercel:**
   - Connect GitHub repository  
   - Set root directory to \`frontend-clean\`
   - Add environment variables
   - Deploy

### Option 2: Netlify + Render
1. **Deploy Backend to Render:**
   - Connect GitHub repository
   - Set root directory to \`backend-clean\`
   - Add environment variables
   - Deploy

2. **Deploy Frontend to Netlify:**
   - Connect GitHub repository
   - Set root directory to \`frontend-clean\`
   - Add environment variables
   - Deploy

## Required Environment Variables

### Backend:
- \`DATABASE_URL\` - Supabase connection string
- \`MISTRAL_API_KEY\` - Your Mistral AI API key
- \`NODE_ENV=production\`
- \`PORT=3000\`

### Frontend:
- \`NEXT_PUBLIC_SUPABASE_URL\` - Your Supabase project URL
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\` - Your Supabase anon key
- \`NEXT_PUBLIC_BACKEND_URL\` - Your deployed backend URL

## Next Steps
1. Set up Supabase database
2. Deploy backend to Railway/Render
3. Deploy frontend to Vercel/Netlify
4. Configure environment variables
5. Test the deployed application

Generated on: $(date)
EOF

    print_success "Deployment summary created: DEPLOYMENT_SUMMARY.md"
}

# Main execution
main() {
    echo "🎯 AutoDescribe Deployment Preparation"
    echo "======================================"
    
    check_dependencies
    check_env_vars
    build_backend
    build_frontend
    create_deployment_summary
    
    echo ""
    echo "🎉 Deployment preparation complete!"
    echo ""
    print_success "Your AutoDescribe app is ready for deployment!"
    print_status "Next steps:"
    echo "  1. Push your code to GitHub"
    echo "  2. Set up Supabase database"
    echo "  3. Deploy backend to Railway/Render"
    echo "  4. Deploy frontend to Vercel/Netlify"
    echo "  5. Configure environment variables"
    echo ""
    print_status "See DEPLOYMENT_GUIDE.md for detailed instructions."
}

# Run main function
main