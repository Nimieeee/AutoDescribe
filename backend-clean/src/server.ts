import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { productLoader } from './lib/product-loader';
import { csvRAGService } from './lib/csv-rag';
import { supabase } from './lib/supabase';
import { aiService } from './lib/ai-service';
import { QualityEvaluationService } from './services/evaluation';
import { 
  applyKPIMiddleware, 
  applyRouteSpecificKPIMiddleware,
  sessionTrackingMiddleware,
  searchTrackingMiddleware,
  generationTrackingMiddleware,
  dataQualityTrackingMiddleware
} from './middleware/kpi-tracking';
import { kpiEventCollector } from './lib/kpi-event-collector';
import { systemPerformanceMonitor } from './lib/system-performance-monitor';
import { eventProcessingPipeline } from './lib/event-processing-pipeline';
import kpiRoutes from './routes/kpi-routes';
import successCriteriaRoutes from './routes/success-criteria-routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize quality evaluation service
const qualityEvaluationService = new QualityEvaluationService();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Apply KPI tracking middleware
applyKPIMiddleware(app);

// KPI API routes
app.use('/api/kpi', kpiRoutes);

// Success criteria tracking routes
app.use('/api/success-criteria', successCriteriaRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Search products
app.get('/api/search-products', async (req, res) => {
  try {
    const { q, limit = 10, advanced = 'false' } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const useAdvanced = advanced === 'true';
    const products = useAdvanced 
      ? await productLoader.searchProductsAdvanced(q as string, parseInt(limit as string))
      : await productLoader.searchProducts(q as string, parseInt(limit as string));
    
    res.json({
      success: true,
      products: products.map(p => ({
        sku: p.sku,
        name: p.name,
        brand: p.brandName,
        category: p.primary_category || p.breadcrumbs_text,
        price: p.salePrice,
        description: p.description?.substring(0, 200)
      })),
      count: products.length,
      search_type: useAdvanced ? 'advanced' : 'basic'
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search by category
app.get('/api/search-category', async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;
    
    if (!category) {
      return res.status(400).json({ error: 'Query parameter "category" is required' });
    }

    const products = await productLoader.getProductsByCategory(category as string, parseInt(limit as string));
    
    res.json({
      success: true,
      products: products.map(p => ({
        sku: p.sku,
        name: p.name,
        brand: p.brandName,
        category: p.primary_category || p.breadcrumbs_text
      })),
      count: products.length
    });
  } catch (error) {
    console.error('Category search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search by brand
app.get('/api/search-brand', async (req, res) => {
  try {
    const { brand, limit = 20 } = req.query;
    
    if (!brand) {
      return res.status(400).json({ error: 'Query parameter "brand" is required' });
    }

    const products = await productLoader.getProductsByBrand(brand as string, parseInt(limit as string));
    
    res.json({
      success: true,
      products: products.map(p => ({
        sku: p.sku,
        name: p.name,
        brand: p.brandName,
        category: p.primary_category || p.breadcrumbs_text
      })),
      count: products.length
    });
  } catch (error) {
    console.error('Brand search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product by SKU
app.get('/api/product/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const product = await productLoader.findProductBySku(sku);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate content with RAG
app.post('/api/generate-with-rag', async (req, res) => {
  try {
    const { sku, content_type = 'description', custom_prompt } = req.body;
    
    if (!sku) {
      return res.status(400).json({ error: 'SKU is required' });
    }

    // Generate RAG context
    const ragContext = await csvRAGService.generateRAGContext(sku);
    
    if (!ragContext) {
      return res.status(404).json({ error: 'Product not found in CSV data' });
    }

    // Generate content using AI service with your system prompts
    const aiResponse = await aiService.generateContent({
      ragContext,
      contentType: content_type as any,
      customPrompt: custom_prompt,
      brandVoice: req.body.brand_voice // Optional brand voice override
    });
    
    const generatedText = aiResponse.generatedText;

    // Save to Supabase
    try {
      // Find or create product in Supabase
      let { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('sku', sku)
        .single();

      if (!product) {
        const { data: newProduct, error: createError } = await supabase
          .from('products')
          .insert({
            sku: ragContext.targetProduct.sku,
            name: ragContext.targetProduct.name,
            brand: ragContext.targetProduct.brandName,
            category: ragContext.targetProduct.primary_category || ragContext.targetProduct.breadcrumbs_text,
            price: ragContext.targetProduct.salePrice ? parseFloat(ragContext.targetProduct.salePrice) : null,
            description: ragContext.targetProduct.description
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating product:', createError);
        } else {
          product = newProduct;
        }
      }

      // Save generated content
      if (product) {
        // First save the content without quality score
        const { data: savedContent, error: saveError } = await supabase
          .from('generated_content')
          .insert({
            product_id: product.id,
            content_type,
            generated_text: generatedText,
            status: 'pending',
            seo_keywords: extractSEOKeywords(ragContext.targetProduct),
            quality_score: 0, // Will be updated after evaluation
            metadata: {
              rag_context_used: true,
              similar_products_count: ragContext.similarProducts.length,
              category_products_count: ragContext.categoryProducts.length,
              brand_products_count: ragContext.brandProducts.length,
              custom_prompt: custom_prompt
            }
          })
          .select()
          .single();

        if (saveError) {
          console.error('Error saving content:', saveError);
        } else if (savedContent) {
          // Now evaluate the quality and update the record
          try {
            console.log('🔍 Evaluating content quality...');
            
            // Convert to the format expected by the evaluation service
            const contentForEvaluation = {
              id: savedContent.id,
              product_id: savedContent.product_id,
              content_type: savedContent.content_type,
              generated_text: savedContent.generated_text,
              edited_text: null,
              seo_keywords: savedContent.seo_keywords || []
            };

            // Convert product format
            const productForEvaluation = {
              id: product.id,
              sku: ragContext.targetProduct.sku,
              name: ragContext.targetProduct.name,
              brand: ragContext.targetProduct.brandName,
              category: ragContext.targetProduct.primary_category || ragContext.targetProduct.breadcrumbs_text,
              attributes: {
                color: ragContext.targetProduct.color,
                material: ragContext.targetProduct.material,
                style: ragContext.targetProduct.style,
                size: ragContext.targetProduct.size,
                use_case: ragContext.targetProduct.specific_uses_for_product
              },
              additional_text: ragContext.targetProduct.features_text || ragContext.targetProduct.description
            };

            // Run quality evaluation
            const evaluationReport = await qualityEvaluationService.evaluateContent(
              contentForEvaluation as any,
              productForEvaluation as any,
              savedContent.seo_keywords
            );

            // Update the content with quality score and breakdown
            const { error: updateError } = await supabase
              .from('generated_content')
              .update({
                quality_score: evaluationReport.score.overall / 10, // Convert to 0-1 scale
                metadata: {
                  ...savedContent.metadata,
                  score_breakdown: evaluationReport.score,
                  recommendations: evaluationReport.recommendations,
                  evaluation_timestamp: evaluationReport.evaluation_timestamp
                }
              })
              .eq('id', savedContent.id);

            if (updateError) {
              console.error('Error updating quality score:', updateError);
            } else {
              console.log(`✅ Quality evaluation complete: ${Math.round(evaluationReport.score.overall)}/10 (${evaluationReport.score.breakdown.qualityLevel})`);
            }

          } catch (evaluationError) {
            console.error('Error during quality evaluation:', evaluationError);
            // Set a default score if evaluation fails
            await supabase
              .from('generated_content')
              .update({ quality_score: 0.7 })
              .eq('id', savedContent.id);
          }
        }
      }
    } catch (supabaseError) {
      console.error('Supabase error:', supabaseError);
    }

    res.json({
      success: true,
      generated_text: generatedText,
      rag_context: ragContext,
      ai_metadata: {
        model: aiResponse.model,
        tokens_used: aiResponse.tokensUsed,
        content_type: content_type,
        brand_voice: req.body.brand_voice || 'auto-selected'
      },
      message: 'Content generated with RAG context and AI using your system prompts'
    });

  } catch (error) {
    console.error('Generate with RAG error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// KPI Dashboard endpoint
app.get('/api/kpis', async (req, res) => {
  try {
    const { KPITrackingService } = await import('./services/kpi');
    const kpiService = new KPITrackingService();
    
    const snapshot = await kpiService.generateKPISnapshot();
    
    res.json({
      success: true,
      kpis: snapshot,
      message: 'KPI snapshot generated successfully'
    });
  } catch (error) {
    console.error('KPI error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Client-side KPI events endpoint
app.post('/api/kpi/client-events', async (req, res) => {
  try {
    const { events } = req.body;
    const sessionId = req.headers['x-session-id'] as string || req.kpiSession?.sessionId;
    
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Events array is required' });
    }
    
    // Process each client event
    for (const event of events) {
      if (event.type === 'user_interaction') {
        await kpiEventCollector.collectUserInteractionEvent(
          event.metadata.action,
          event.metadata.element,
          event.metadata.page,
          sessionId || event.sessionId,
          undefined, // No user ID from client events
          event.metadata.time_on_page_ms
        );
      } else if (event.type === 'search') {
        await kpiEventCollector.collectSearchEvent(
          event.metadata.query,
          event.metadata.results_count,
          event.metadata.response_time_ms,
          sessionId || event.sessionId,
          'basic' // Client searches are basic by default
        );
      } else if (event.type === 'generation_request') {
        // Track generation request initiation
        await kpiEventCollector.collectUserInteractionEvent(
          'generation_request',
          'generate_button',
          event.metadata.page,
          sessionId || event.sessionId
        );
      }
    }
    
    res.json({
      success: true,
      processed: events.length,
      message: 'Client events processed successfully'
    });
  } catch (error) {
    console.error('Client KPI events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get random products for examples
app.get('/api/examples', async (req, res) => {
  try {
    const { count = 10 } = req.query;
    const products = await productLoader.getRandomProducts(parseInt(count as string));
    
    res.json({
      success: true,
      products: products.map(p => ({
        sku: p.sku,
        name: p.name,
        brand: p.brandName,
        category: p.primary_category || p.breadcrumbs_text
      }))
    });
  } catch (error) {
    console.error('Examples error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate content using RAG context (mock implementation)
function generateContentWithContext(ragContext: any, contentType: string, customPrompt?: string): string {
  const { targetProduct, similarProducts, categoryProducts } = ragContext;
  
  let content = `Discover the ${targetProduct.name} from ${targetProduct.brandName} - `;
  
  // Add category positioning
  if (targetProduct.primary_category) {
    content += `a premium ${targetProduct.primary_category.toLowerCase()} that `;
  }
  
  // Add key differentiators
  if (targetProduct.material) {
    content += `features ${targetProduct.material} construction `;
  }
  
  if (targetProduct.color && targetProduct.style) {
    content += `in ${targetProduct.color} with ${targetProduct.style} design. `;
  } else {
    content += `with exceptional quality and design. `;
  }
  
  // Add competitive context
  if (categoryProducts.length > 0) {
    const avgPrice = categoryProducts.reduce((sum: number, p: any) => sum + parseFloat(p.salePrice || '0'), 0) / categoryProducts.length;
    const targetPrice = parseFloat(targetProduct.salePrice || '0');
    
    if (targetPrice > 0 && avgPrice > 0) {
      if (targetPrice < avgPrice * 0.8) {
        content += `At $${targetProduct.salePrice}, it offers exceptional value compared to similar products. `;
      } else if (targetPrice > avgPrice * 1.2) {
        content += `This premium option at $${targetProduct.salePrice} delivers superior quality and features. `;
      } else {
        content += `Competitively priced at $${targetProduct.salePrice} within its category. `;
      }
    }
  }
  
  // Add features from CSV data
  if (targetProduct.features_text) {
    const features = targetProduct.features_text.split('\n').filter((f: string) => f.trim()).slice(0, 3);
    if (features.length > 0) {
      content += `\n\nKey features include:\n`;
      features.forEach((feature: string) => {
        content += `• ${feature.replace(/^\s*[•\-\*]\s*/, '').trim()}\n`;
      });
    }
  }
  
  // Add use case
  if (targetProduct.specific_uses_for_product) {
    content += `\nPerfect for ${targetProduct.specific_uses_for_product.toLowerCase()}, `;
  }
  
  // Add brand context
  if (ragContext.brandProducts.length > 0) {
    content += `this product continues ${targetProduct.brandName}'s tradition of quality and innovation. `;
  }
  
  // Add custom prompt content
  if (customPrompt) {
    content += `\n\nAdditional focus: ${customPrompt}`;
  }
  
  // Add call to action
  content += `\nExperience the difference with ${targetProduct.name} - order now for reliable performance and satisfaction.`;
  
  return content.replace(/\*/g, '').trim();
}

// Extract SEO keywords from product data
function extractSEOKeywords(product: any): string[] {
  const allKeywords: string[] = [];
  
  // Parse keywords from product name
  if (product.name) {
    const nameKeywords = parseKeywordsFromText(product.name);
    allKeywords.push(...nameKeywords);
  }
  
  // Parse keywords from brand name
  if (product.brandName) {
    const brandKeywords = parseKeywordsFromText(product.brandName);
    allKeywords.push(...brandKeywords);
  }
  
  // Parse keywords from breadcrumbs
  if (product.breadcrumbs_text) {
    const breadcrumbKeywords = parseKeywordsFromBreadcrumbs(product.breadcrumbs_text);
    allKeywords.push(...breadcrumbKeywords);
  }
  
  // Add structured product attributes
  const structuredKeywords = [
    product.primary_category,
    product.product_type,
    product.material,
    product.color,
    product.style,
    product.size,
    ...(product.key_features || []),
    product.use_case,
    product.specific_uses_for_product
  ].filter(Boolean).map(k => k.toLowerCase().trim());
  
  allKeywords.push(...structuredKeywords);
  
  // Clean, deduplicate, and filter keywords
  const cleanedKeywords = allKeywords
    .map(k => k.toLowerCase().trim())
    .filter(k => k.length > 2) // Remove very short words
    .filter(k => !isStopWord(k)) // Remove common stop words
    .filter(Boolean);
  
  // Remove duplicates and return top 15 keywords
  return [...new Set(cleanedKeywords)].slice(0, 15);
}

// Parse keywords from text (product names, descriptions, etc.)
function parseKeywordsFromText(text: string): string[] {
  if (!text) return [];
  
  // Split by common delimiters and clean
  return text
    .split(/[\s,\-_\(\)\[\]\/\\&\+\|]+/)
    .map(word => word.replace(/[^\w]/g, '').toLowerCase())
    .filter(word => word.length > 2)
    .filter(word => !isStopWord(word));
}

// Parse keywords from breadcrumb navigation
function parseKeywordsFromBreadcrumbs(breadcrumbs: string): string[] {
  if (!breadcrumbs) return [];
  
  // Split by common breadcrumb separators
  return breadcrumbs
    .split(/[>\/\|\\]+/)
    .map(crumb => crumb.trim())
    .filter(crumb => crumb.length > 0)
    .flatMap(crumb => parseKeywordsFromText(crumb));
}

// Check if a word is a common stop word
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'among', 'this', 'that', 'these', 'those', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'a', 'an'
  ]);
  
  return stopWords.has(word.toLowerCase());
}

// Apply route-specific KPI middleware
applyRouteSpecificKPIMiddleware(app);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 KPI API: http://localhost:${PORT}/api/kpi/health`);
  
  // Start KPI monitoring services
  console.log('🔍 Starting KPI monitoring services...');
  systemPerformanceMonitor.startMonitoring(30000); // Every 30 seconds
  eventProcessingPipeline.startProcessing();
  
  // Pre-load products
  productLoader.getProductCount().then(count => {
    console.log(`📦 Loaded ${count} products from CSV`);
  }).catch(error => {
    console.error('❌ Error loading products:', error);
  });
});