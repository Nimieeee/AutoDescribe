# AutoDescribe RAG System - Setup & Usage Guide

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **PostgreSQL 14+** - [Download here](https://www.postgresql.org/download/)
3. **Supabase Account** - [Sign up here](https://supabase.com/)
4. **Mistral AI API Key** - [Get API key here](https://console.mistral.ai/)

### 1. Environment Setup

1. **Clone and install dependencies:**
```bash
# Install backend dependencies
npm install

# Install frontend dependencies (optional)
cd frontend
npm install
cd ..
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/autodescribe
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autodescribe
DB_USER=your_username
DB_PASSWORD=your_password

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Mistral AI Configuration
MISTRAL_API_KEY=your-mistral-api-key
MISTRAL_MODEL=mistral-embed
MISTRAL_LLM_MODEL=mistral-large-latest

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 2. Database Setup

1. **Create PostgreSQL database:**
```bash
createdb autodescribe
```

2. **Start the application (it will run migrations automatically):**
```bash
npm run dev
```

The system will:
- Test database connection
- Run database migrations
- Initialize Supabase pgvector extension
- Start the server on http://localhost:3000

### 3. Verify Setup

Check if everything is working:
```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

## 📖 How to Use

### Step 1: Upload Product Data

**Option A: Using cURL**
```bash
curl -X POST http://localhost:3000/api/v1/upload \
  -F "file=@your-products.csv" \
  -F "maxRows=1000"
```

**Option B: Using the API with a CSV file**

Create a sample CSV file (`products.csv`):
```csv
sku,name,brand,breadcrumbs,color,size,weight,dimensions,material,warranty
PHONE-001,iPhone 15 Pro,Apple,Electronics > Phones > Smartphones,Black,128GB,174g,146.6x70.6x8.25mm,Titanium,1 year
LAPTOP-002,MacBook Air M2,Apple,Electronics > Computers > Laptops,Silver,13-inch,1.24kg,304x213x11.3mm,Aluminum,1 year
```

Upload it:
```bash
curl -X POST http://localhost:3000/api/v1/upload \
  -F "file=@products.csv"
```

### Step 2: Generate Product Copy

**Generate content for a product:**
```bash
curl -X POST http://localhost:3000/api/v1/generate/content \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "your-product-id",
    "content_types": ["long_description", "bullet_points"],
    "auto_generate_seo_keywords": true,
    "seo_optimization_level": "advanced"
  }'
```

**Response:**
```json
{
  "success": true,
  "content": [
    {
      "id": "content-uuid",
      "product_id": "product-uuid",
      "content_type": "long_description",
      "generated_text": "The iPhone 15 Pro represents Apple's latest innovation...",
      "status": "pending",
      "seo_keywords": ["iphone", "smartphone", "apple", "titanium"],
      "quality_metrics": {
        "attribute_coverage": 0.85,
        "readability_score": 0.78,
        "keyword_coverage": 0.92
      }
    }
  ]
}
```

### Step 3: Review and Manage Content

**Get pending content for review:**
```bash
curl http://localhost:3000/api/v1/dashboard/content/pending
```

**Approve content:**
```bash
curl -X POST http://localhost:3000/api/v1/dashboard/content/{content-id}/approve \
  -H "Content-Type: application/json" \
  -d '{
    "editor_id": "editor-123",
    "edited_text": "Improved version of the content..."
  }'
```

**Export approved content:**
```bash
curl "http://localhost:3000/api/v1/dashboard/export/approved?format=csv" \
  -o approved_content.csv
```

## 🔧 Advanced Usage

### SEO Optimization

**Generate SEO keywords for a product:**
```bash
curl -X POST http://localhost:3000/api/v1/generate/seo/keywords \
  -H "Content-Type: application/json" \
  -d '{
    "product_data": {
      "sku": "PHONE-001",
      "name": "iPhone 15 Pro",
      "brand": "Apple",
      "breadcrumbs_text": "Electronics > Phones > Smartphones",
      "attributes": {"color": "black", "size": "128gb"}
    },
    "content_type": "long_description",
    "max_keywords": 10
  }'
```

**Analyze content for SEO:**
```bash
curl -X POST http://localhost:3000/api/v1/generate/seo/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "generated_text": "Your product description here...",
      "seo_keywords": ["keyword1", "keyword2"]
    }
  }'
```

### Search and Discovery

**Search for similar products:**
```bash
curl -X POST http://localhost:3000/api/v1/generate/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "smartphone with good camera",
    "limit": 5,
    "threshold": 0.7
  }'
```

**Get similar products:**
```bash
curl http://localhost:3000/api/v1/generate/similar/{product-id}?limit=5
```

### Dashboard Management

**Get dashboard statistics:**
```bash
curl http://localhost:3000/api/v1/dashboard/stats
```

**Start a review session:**
```bash
curl -X POST http://localhost:3000/api/v1/dashboard/sessions/start \
  -H "Content-Type: application/json" \
  -d '{
    "editor_id": "editor-123",
    "product_id": "product-uuid"
  }'
```

## 🎯 Common Workflows

### Workflow 1: Bulk Product Processing

1. **Upload product data:**
```bash
curl -X POST http://localhost:3000/api/v1/upload \
  -F "file=@large-product-catalog.csv"
```

2. **Generate content for multiple products:**
```bash
# Get product list first
curl http://localhost:3000/api/v1/dashboard/products

# Generate content for each product
curl -X POST http://localhost:3000/api/v1/generate/content \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "product-1",
    "content_types": ["long_description", "bullet_points", "variant_copy"],
    "auto_generate_seo_keywords": true,
    "seo_optimization_level": "advanced"
  }'
```

3. **Review and approve content:**
```bash
# Get pending content
curl http://localhost:3000/api/v1/dashboard/content/pending

# Bulk approve
curl -X POST http://localhost:3000/api/v1/dashboard/content/bulk/approve \
  -H "Content-Type: application/json" \
  -d '{
    "content_ids": ["content-1", "content-2", "content-3"],
    "editor_id": "editor-123"
  }'
```

4. **Export final content:**
```bash
curl "http://localhost:3000/api/v1/dashboard/export/approved?format=json" \
  -o final_product_copy.json
```

### Workflow 2: Single Product Deep Dive

1. **Upload single product or use existing:**
```bash
curl -X POST http://localhost:3000/api/v1/upload \
  -F "file=@single-product.json"
```

2. **Generate optimized content:**
```bash
curl -X POST http://localhost:3000/api/v1/generate/content \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "product-uuid",
    "content_types": ["long_description"],
    "auto_generate_seo_keywords": true,
    "seo_optimization_level": "advanced",
    "use_similar_products": true,
    "brand_voice": "Professional and innovative",
    "target_audience": "Tech enthusiasts"
  }'
```

3. **Analyze and optimize:**
```bash
curl -X POST http://localhost:3000/api/v1/generate/seo/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "generated_text": "Generated content here...",
      "content_type": "long_description"
    },
    "target_keywords": ["smartphone", "camera", "battery"],
    "max_changes": 3
  }'
```

## 🐛 Troubleshooting

### Common Issues

1. **Database connection failed:**
   - Check PostgreSQL is running: `pg_ctl status`
   - Verify credentials in `.env`
   - Ensure database exists: `createdb autodescribe`

2. **Supabase connection failed:**
   - Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - Check Supabase project is active
   - Ensure pgvector extension is enabled

3. **Mistral AI API errors:**
   - Verify `MISTRAL_API_KEY` is correct
   - Check API quota and billing
   - Ensure model names are correct

4. **File upload fails:**
   - Check file size (default limit: 10MB)
   - Verify file format (CSV/JSON only)
   - Ensure required fields (sku, name) are present

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

Check system status:
```bash
curl http://localhost:3000/api/v1/generate/status
```

## 📊 Monitoring

### Health Checks

- **Application health:** `GET /health`
- **RAG service status:** `GET /api/v1/generate/status`
- **Database stats:** `GET /api/v1/dashboard/stats`

### Logs

Logs are written to:
- Console (development)
- `logs/app.log` (all logs)
- `logs/error.log` (errors only)

## 🚀 Production Deployment

For production deployment:

1. **Set environment:**
```env
NODE_ENV=production
LOG_LEVEL=info
```

2. **Build and start:**
```bash
npm run build
npm start
```

3. **Use process manager:**
```bash
npm install -g pm2
pm2 start dist/index.js --name autodescribe
```

4. **Set up reverse proxy (nginx):**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

That's it! You now have a fully functional AutoDescribe RAG System for AI-powered product copy generation! 🎉