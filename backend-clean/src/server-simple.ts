import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: {
      supabase_url: process.env.SUPABASE_URL ? 'set' : 'missing',
      service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing'
    }
  });
});

// Mock product search (without CSV for now)
app.get('/api/search-products', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    // Mock products for testing
    const mockProducts = [
      {
        sku: 'B0795ZW85G',
        name: 'Kinsa Smart Thermometer',
        brandName: 'Kinsa',
        primary_category: 'Health & Medical',
        salePrice: '29.99',
        description: 'Smart thermometer for accurate temperature readings'
      },
      {
        sku: 'TEST-001',
        name: 'Sample Product',
        brandName: 'TestBrand',
        primary_category: 'Electronics',
        salePrice: '19.99',
        description: 'Sample product for testing'
      }
    ];

    const searchTerm = (q as string).toLowerCase();
    const results = mockProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.brandName.toLowerCase().includes(searchTerm) ||
      p.sku.toLowerCase().includes(searchTerm)
    );
    
    res.json({
      success: true,
      products: results.slice(0, parseInt(limit as string)),
      count: results.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock content generation
app.post('/api/generate-with-rag', async (req, res) => {
  try {
    const { sku, content_type = 'description', custom_prompt } = req.body;
    
    if (!sku) {
      return res.status(400).json({ error: 'SKU is required' });
    }

    // Mock generated content
    const generatedText = `Discover the premium product ${sku} - expertly crafted for exceptional performance and reliability. 

This innovative product combines cutting-edge technology with user-friendly design, delivering outstanding value for customers who demand quality and excellence.

Key features:
• Premium materials and construction
• Advanced functionality for optimal performance
• Sleek, modern design
• Excellent customer satisfaction ratings
• Trusted brand quality

${custom_prompt ? `\nCustom focus: ${custom_prompt}` : ''}

Experience the difference with this exceptional product - your satisfaction is guaranteed.`;

    // Try to save to Supabase (will import here to avoid startup errors)
    try {
      const { supabase } = await import('./lib/supabase');
      
      // Find or create product
      let { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('sku', sku)
        .single();

      if (!product) {
        const { data: newProduct } = await supabase
          .from('products')
          .insert({
            sku,
            name: `Product ${sku}`,
            brand: 'Generated',
            category: 'General',
            description: 'Auto-generated product entry'
          })
          .select()
          .single();
        
        product = newProduct;
      }

      // Save content
      if (product) {
        await supabase
          .from('generated_content')
          .insert({
            product_id: product.id,
            content_type,
            generated_text: generatedText,
            status: 'pending',
            seo_keywords: ['product', 'quality', 'premium', 'performance'],
            quality_score: 0.85
          });
      }
    } catch (supabaseError) {
      console.error('Supabase error (continuing anyway):', supabaseError);
    }

    res.json({
      success: true,
      generated_text: generatedText,
      message: 'Content generated successfully (mock mode)'
    });

  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Mock mode - no CSV loading required`);
});