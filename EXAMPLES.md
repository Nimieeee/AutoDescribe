# AutoDescribe RAG System - Examples & Use Cases

## 📝 Sample Data Files

### Sample CSV File (`sample-products.csv`)
```csv
sku,name,brand,breadcrumbs,color,size,weight,dimensions,material,warranty,features
PHONE-001,iPhone 15 Pro,Apple,Electronics > Phones > Smartphones,Black,128GB,174g,146.6x70.6x8.25mm,Titanium,1 year,A17 Pro chip Face ID 5G
LAPTOP-002,MacBook Air M2,Apple,Electronics > Computers > Laptops,Silver,13-inch,1.24kg,304x213x11.3mm,Aluminum,1 year,M2 chip Retina display 18h battery
WATCH-003,Apple Watch Series 9,Apple,Electronics > Wearables > Smartwatches,Midnight,45mm,38.7g,45x38x10.7mm,Aluminum,1 year,S9 chip Always-On display GPS
HEADPHONES-004,AirPods Pro 2nd Gen,Apple,Electronics > Audio > Headphones,White,One Size,5.3g,30.9x21.8x24mm,Plastic,1 year,H2 chip Active Noise Cancellation Spatial Audio
TABLET-005,iPad Air 5th Gen,Apple,Electronics > Tablets > iPads,Blue,64GB,461g,247.6x178.5x6.1mm,Aluminum,1 year,M1 chip Liquid Retina display Apple Pencil support
```

### Sample JSON File (`sample-products.json`)
```json
[
  {
    "sku": "SHOE-001",
    "name": "Nike Air Max 270",
    "brand": "Nike",
    "breadcrumbs": "Fashion > Shoes > Athletic Shoes",
    "color": "Black/White",
    "size": "US 10",
    "weight": "300g",
    "dimensions": "32x12x11cm",
    "material": "Mesh and synthetic leather",
    "category": "Athletic Footwear",
    "features": "Air Max cushioning, Breathable mesh upper, Rubber outsole"
  },
  {
    "sku": "JACKET-002", 
    "name": "Patagonia Better Sweater Fleece Jacket",
    "brand": "Patagonia",
    "breadcrumbs": "Fashion > Outerwear > Fleece Jackets",
    "color": "Navy Blue",
    "size": "Medium",
    "weight": "450g",
    "material": "100% recycled polyester fleece",
    "sustainability": "Fair Trade Certified",
    "features": "Full-zip design, Raglan sleeves, Zippered handwarmer pockets"
  }
]
```

## 🚀 Complete Usage Examples

### Example 1: E-commerce Product Catalog

**Step 1: Upload your product catalog**
```bash
curl -X POST http://localhost:3000/api/v1/upload \
  -F "file=@sample-products.csv" \
  -F "maxRows=1000"
```

**Response:**
```json
{
  "success": true,
  "job_id": "job_1704067200_abc123",
  "message": "Successfully processed 5 out of 5 rows (100.0% success rate)",
  "report": {
    "summary": "Successfully processed 5 out of 5 rows (100.0% success rate)",
    "details": {
      "totalRows": 5,
      "validRows": 5,
      "errorRows": 0,
      "successRate": 100
    },
    "data": [
      {
        "sku": "PHONE-001",
        "name": "iPhone 15 Pro",
        "brand": "Apple",
        "breadcrumbs_text": "Electronics > Phones > Smartphones",
        "attributes": {
          "color": "black",
          "size": "128gb",
          "weight": "174 grams",
          "dimensions": "146.6 × 70.6 × 8.25 millimeters"
        },
        "additional_text": "material: Titanium; warranty: 1 year; features: A17 Pro chip Face ID 5G"
      }
    ]
  }
}
```

**Step 2: Generate comprehensive product copy**
```bash
curl -X POST http://localhost:3000/api/v1/generate/content \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PHONE-001",
    "content_types": ["long_description", "bullet_points", "variant_copy"],
    "auto_generate_seo_keywords": true,
    "seo_optimization_level": "advanced",
    "brand_voice": "Premium and innovative",
    "target_audience": "Tech enthusiasts and professionals"
  }'
```

**Response:**
```json
{
  "success": true,
  "content": [
    {
      "id": "content-uuid-1",
      "content_type": "long_description",
      "generated_text": "Experience the pinnacle of smartphone innovation with the iPhone 15 Pro in sophisticated Black. Powered by the revolutionary A17 Pro chip, this premium device delivers unparalleled performance in a stunning titanium design. The 128GB storage provides ample space for your digital life, while advanced features like Face ID and 5G connectivity keep you secure and connected. Measuring just 146.6 × 70.6 × 8.25mm and weighing only 174 grams, the iPhone 15 Pro combines powerful technology with elegant portability. Backed by Apple's comprehensive 1-year warranty, this smartphone represents the perfect fusion of cutting-edge innovation and premium craftsmanship.",
      "seo_keywords": ["iphone 15 pro", "smartphone", "apple", "titanium", "a17 pro chip", "face id", "5g", "128gb"],
      "quality_metrics": {
        "attribute_coverage": 0.92,
        "readability_score": 0.78,
        "keyword_coverage": 0.88,
        "seo_optimization_score": 0.85
      }
    },
    {
      "id": "content-uuid-2", 
      "content_type": "bullet_points",
      "generated_text": "• Revolutionary A17 Pro chip delivers exceptional performance and efficiency\n• Premium titanium construction offers durability and sophisticated aesthetics\n• Advanced Face ID technology provides secure and convenient authentication\n• 5G connectivity ensures lightning-fast data speeds and seamless streaming\n• 128GB storage capacity accommodates extensive media libraries and applications\n• Compact 174g design maintains portability without compromising functionality\n• Comprehensive 1-year warranty provides peace of mind and quality assurance",
      "seo_keywords": ["a17 pro chip", "titanium", "face id", "5g connectivity", "128gb storage"],
      "quality_metrics": {
        "attribute_coverage": 0.89,
        "readability_score": 0.82,
        "keyword_coverage": 0.91
      }
    }
  ]
}
```

### Example 2: Fashion Retailer Workflow

**Step 1: Upload fashion products**
```bash
curl -X POST http://localhost:3000/api/v1/upload \
  -F "file=@fashion-products.json"
```

**Step 2: Generate SEO-optimized copy for athletic shoes**
```bash
curl -X POST http://localhost:3000/api/v1/generate/content \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "SHOE-001",
    "content_types": ["long_description"],
    "seo_keywords": ["nike air max", "athletic shoes", "running shoes", "comfortable sneakers"],
    "brand_voice": "Energetic and performance-focused",
    "target_audience": "Athletes and fitness enthusiasts",
    "additional_instructions": "Emphasize comfort, performance, and style"
  }'
```

**Step 3: Analyze and optimize the generated content**
```bash
curl -X POST http://localhost:3000/api/v1/generate/seo/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "id": "content-uuid",
      "generated_text": "Step into superior comfort and performance with the Nike Air Max 270 in classic Black/White. These athletic shoes feature revolutionary Air Max cushioning technology that delivers exceptional impact absorption and energy return with every stride. The breathable mesh upper ensures optimal ventilation during intense workouts, while the synthetic leather overlays provide durability and support. Designed for athletes and fitness enthusiasts, these running shoes combine cutting-edge performance technology with iconic Nike style. The rubber outsole offers superior traction across various surfaces, making these comfortable sneakers perfect for training, running, or everyday wear.",
      "content_type": "long_description",
      "seo_keywords": ["nike air max", "athletic shoes", "running shoes", "comfortable sneakers"]
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "keyword_coverage": 1.0,
    "optimization_score": 0.87,
    "suggestions": {
      "missing_keywords": [],
      "overused_keywords": [],
      "keyword_placement_suggestions": {
        "title": [],
        "description": ["air max cushioning", "breathable mesh"],
        "bullets": []
      },
      "readability_improvements": [],
      "length_recommendations": {}
    },
    "keyword_analysis": {
      "found_keywords": ["nike air max", "athletic shoes", "running shoes", "comfortable sneakers"],
      "missing_keywords": [],
      "keyword_density": {
        "nike air max": 2.1,
        "athletic shoes": 1.4,
        "running shoes": 1.4,
        "comfortable sneakers": 1.4
      }
    }
  }
}
```

### Example 3: Review and Approval Workflow

**Step 1: Get pending content for review**
```bash
curl http://localhost:3000/api/v1/dashboard/content/pending?limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "content-uuid-1",
        "product_id": "product-uuid-1",
        "content_type": "long_description",
        "generated_text": "Experience the pinnacle of smartphone innovation...",
        "status": "pending",
        "sku": "PHONE-001",
        "product_name": "iPhone 15 Pro",
        "brand": "Apple",
        "quality_metrics": {
          "attribute_coverage": 0.92,
          "readability_score": 0.78,
          "keyword_coverage": 0.88
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

**Step 2: Start a review session**
```bash
curl -X POST http://localhost:3000/api/v1/dashboard/sessions/start \
  -H "Content-Type: application/json" \
  -d '{
    "editor_id": "editor-sarah-123",
    "product_id": "product-uuid-1"
  }'
```

**Step 3: Edit and approve content**
```bash
# First, edit the content
curl -X PUT http://localhost:3000/api/v1/dashboard/content/content-uuid-1 \
  -H "Content-Type: application/json" \
  -d '{
    "edited_text": "Experience the pinnacle of smartphone innovation with the iPhone 15 Pro. This premium device features the revolutionary A17 Pro chip and stunning titanium design, delivering unmatched performance and elegance.",
    "editor_id": "editor-sarah-123"
  }'

# Then approve it
curl -X POST http://localhost:3000/api/v1/dashboard/content/content-uuid-1/approve \
  -H "Content-Type: application/json" \
  -d '{
    "editor_id": "editor-sarah-123"
  }'
```

**Step 4: End review session with rating**
```bash
curl -X POST http://localhost:3000/api/v1/dashboard/sessions/session-uuid/end \
  -H "Content-Type: application/json" \
  -d '{
    "brand_voice_rating": 4
  }'
```

### Example 4: Bulk Operations

**Bulk approve multiple content items**
```bash
curl -X POST http://localhost:3000/api/v1/dashboard/content/bulk/approve \
  -H "Content-Type: application/json" \
  -d '{
    "content_ids": ["content-1", "content-2", "content-3", "content-4"],
    "editor_id": "editor-sarah-123"
  }'
```

**Export approved content as CSV**
```bash
curl "http://localhost:3000/api/v1/dashboard/export/approved?format=csv&content_types=long_description,bullet_points" \
  -o approved_product_copy.csv
```

**Export with date filtering**
```bash
curl "http://localhost:3000/api/v1/dashboard/export/approved?format=json&from_date=2024-01-01&to_date=2024-12-31" \
  -o yearly_approved_content.json
```

### Example 5: Analytics and Monitoring

**Get dashboard statistics**
```bash
curl http://localhost:3000/api/v1/dashboard/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": {
      "total": 150,
      "byBrand": [
        {"brand": "Apple", "count": 45},
        {"brand": "Nike", "count": 32},
        {"brand": "Patagonia", "count": 28}
      ],
      "recentlyAdded": 12
    },
    "content": {
      "total": 420,
      "byStatus": [
        {"status": "approved", "count": 280},
        {"status": "pending", "count": 95},
        {"status": "rejected", "count": 45}
      ],
      "byContentType": [
        {"content_type": "long_description", "count": 150},
        {"content_type": "bullet_points", "count": 145},
        {"content_type": "variant_copy", "count": 125}
      ]
    },
    "summary": {
      "total_products": 150,
      "total_content": 420,
      "pending_reviews": 95,
      "approved_content": 280,
      "rejected_content": 45
    }
  }
}
```

**Get editor performance metrics**
```bash
curl http://localhost:3000/api/v1/dashboard/sessions/stats/editor-sarah-123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSessions": 45,
    "averageDurationMinutes": 8.5,
    "totalActionsPerformed": 180,
    "actionBreakdown": [
      {"action_type": "edit", "count": 95},
      {"action_type": "approve", "count": 70},
      {"action_type": "reject", "count": 15}
    ],
    "averageBrandVoiceRating": 4.2,
    "sessionsToday": 3
  }
}
```

### Example 6: Advanced SEO Optimization

**Generate SEO keywords for a product**
```bash
curl -X POST http://localhost:3000/api/v1/generate/seo/keywords \
  -H "Content-Type: application/json" \
  -d '{
    "product_data": {
      "sku": "LAPTOP-002",
      "name": "MacBook Air M2",
      "brand": "Apple",
      "breadcrumbs_text": "Electronics > Computers > Laptops",
      "attributes": {
        "color": "silver",
        "size": "13-inch",
        "weight": "1.24 kilograms"
      },
      "additional_text": "material: Aluminum; warranty: 1 year; features: M2 chip Retina display 18h battery"
    },
    "content_type": "long_description",
    "max_keywords": 15
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "primary_keywords": ["macbook air", "laptop", "apple"],
    "secondary_keywords": ["m2 chip", "retina display", "aluminum", "13-inch"],
    "long_tail_keywords": ["macbook air m2 chip", "apple laptop retina display", "13-inch aluminum laptop"],
    "all_keywords": ["macbook air", "laptop", "apple", "m2 chip", "retina display", "aluminum", "13-inch", "macbook air m2 chip", "apple laptop retina display", "13-inch aluminum laptop"]
  }
}
```

**Optimize existing content**
```bash
curl -X POST http://localhost:3000/api/v1/generate/seo/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "generated_text": "The MacBook Air is a great laptop with good performance and nice design.",
      "content_type": "long_description"
    },
    "target_keywords": ["macbook air m2", "apple laptop", "retina display", "aluminum design"],
    "max_changes": 3
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "optimized_text": "The MacBook Air M2 is a premium Apple laptop with exceptional performance and stunning aluminum design. Featuring a brilliant Retina display, this MacBook Air M2 delivers outstanding visual clarity and color accuracy for professional and creative work.",
    "changes_made": [
      "Added keyword \"MacBook Air M2\" in the opening sentence",
      "Added keyword \"Apple laptop\" to improve brand association",
      "Improved placement of \"Retina display\" and \"aluminum design\""
    ],
    "keyword_improvements": {
      "added_keywords": ["macbook air m2", "apple laptop", "retina display"],
      "improved_placement": ["aluminum design"]
    },
    "optimization_score_before": 0.45,
    "optimization_score_after": 0.82
  }
}
```

## 🎯 Best Practices

### 1. Data Preparation
- Ensure CSV files have consistent column names
- Include required fields: `sku` and `name`
- Use clear, descriptive product names
- Include brand information when available
- Structure breadcrumbs hierarchically (Category > Subcategory > Product Type)

### 2. Content Generation
- Use `auto_generate_seo_keywords: true` for better SEO optimization
- Set `seo_optimization_level: "advanced"` for high-quality content
- Provide clear brand voice descriptions
- Specify target audience for better content targeting
- Use `use_similar_products: true` for richer context

### 3. Review Process
- Start review sessions to track editing time
- Use consistent editor IDs for analytics
- Provide brand voice ratings (1-5) for quality tracking
- Edit content before approving for better quality
- Use bulk operations for efficiency

### 4. SEO Optimization
- Generate keywords before content creation
- Validate keyword coverage after generation
- Optimize content that scores below 0.7
- Monitor keyword density (aim for 1-3%)
- Use long-tail keywords for better targeting

This comprehensive guide should help you get the most out of your AutoDescribe RAG System! 🚀