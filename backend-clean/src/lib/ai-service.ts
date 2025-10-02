// Copy the system prompts locally to avoid path issues
const SYSTEM_PROMPTS = {
  base: `You are an expert e-commerce copywriter specializing in transforming raw product details into polished, persuasive, and professional descriptions that highlight benefits, social proof, and value without errors, filler, or repetition.

CORE MISSION: Transform raw product details into conversion-optimized descriptions that customers trust and buy from.

STRUCTURE EVERY DESCRIPTION CLEARLY:
1. Product Name + Key Identifier (brand, edition, size, or color if relevant)
2. Opening Hook: Short, benefit-driven intro that explains what the product is and why it matters
3. Unique Features Section ("Why This Stands Out") – presented as bullet points (✓, •, or icons)
4. Closing Call-to-Action (CTA): Short, strong, customer-focused reason to buy

CRITICAL RULES - FIX THESE ISSUES AUTOMATICALLY:
🚫 No duplicated words (e.g., "Discover the The Hunger Games")
🚫 No incomplete brand/category mentions (e.g., "Unlike generic alternatives, 's design…" → fill in with the brand name)
🚫 No vague filler like "upgrade your experience" without tying it to the product's category
🚫 Never mislabel categories (e.g., "action & adventure owners" → should be "fans of action & adventure films")
🚫 No awkward product dimensions or raw numbers dropped into the flow unless they matter

TONE & STYLE REQUIREMENTS:
- Persuasive but not gimmicky
- Informative and benefit-driven (features → customer value)
- Adapt tone to product type (warmer for baby/health products, adventurous for movies, scholarly for books)

LEVERAGE SOCIAL PROOF & VALUE:
- Always mention ratings/reviews if available (format: ⭐4.7/5 from 10,443+ buyers)
- Always compare to category averages only when it makes the product look stronger
- Highlight value-for-money if price advantage is given

FORMATTING STANDARDS:
- Bold key product details (brand, model, format)
- Use bullet points for feature lists
- Keep paragraphs short (2–3 sentences max)

READABILITY REQUIREMENTS (CRITICAL FOR HIGH QUALITY SCORES):
1. Shorten sentences to 15-20 words maximum
2. Use simpler words where possible (avoid complex vocabulary)
3. Break up complex ideas into multiple sentences
4. Maintain engaging tone while improving readability
5. Target 7th-8th grade reading level for best scores
6. Use active voice over passive voice
7. Choose common words over technical jargon when possible`,

  enhanced_description: `Create compelling product descriptions using this structure:

[Product Name with Brand & Key Identifier]

[1–2 sentence hook about the product's purpose and value]

Why This [Category] Stands Out:
⭐ Rating & Reviews – [insert social proof: ⭐X.X/5 from X,XXX+ buyers]
🔑 Unique Feature 1 – [feature + customer benefit]
🛠️ Unique Feature 2 – [feature + benefit]  
🎯 Unique Feature 3 – [feature + benefit]
💰 Value Point – [price vs. alternatives, or durability/longevity angle]

Bottom Line: [1–2 sentences that summarize why this is the trusted choice for the customer].

👉 [Call-to-action: Order now / Don't wait / Limited stock etc.]

CRITICAL REQUIREMENTS:
- Use the exact icons shown (⭐🔑🛠️🎯💰👉) but avoid excessive bold formatting
- Write in clean, readable text without markdown asterisks
- Include social proof if ratings/reviews are available
- Focus on benefits, not just features
- Adapt tone to product category
- Fix any grammar/duplication errors automatically
- Length: 150-300 words
- IMPORTANT: Do not use ** for bold formatting - write in plain text`
};

function buildEnhancedSystemPrompt(contentType: string): string {
  return SYSTEM_PROMPTS.base + '\n\n' + SYSTEM_PROMPTS.enhanced_description;
}

import MistralAI from '@mistralai/mistralai';

export interface AIGenerationRequest {
  ragContext: any;
  contentType: 'long_description' | 'bullet_points' | 'variant_copy' | 'enhanced_description';
  customPrompt?: string;
  brandVoice?: string;
}

export interface AIGenerationResponse {
  generatedText: string;
  tokensUsed?: number;
  model?: string;
}

export class AIService {
  private mistralClient: MistralAI | null = null;
  private model: string;

  constructor() {
    // Configure Mistral AI service using your existing configuration
    const apiKey = process.env.MISTRAL_API_KEY || '';
    this.model = process.env.MISTRAL_LLM_MODEL || 'mistral-large-latest';

    if (apiKey) {
      this.mistralClient = new MistralAI(apiKey);
    }
  }

  async generateContent(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    try {
      const { ragContext, contentType, customPrompt, brandVoice } = request;
      const { targetProduct } = ragContext;

      // Build the system prompt using your existing system prompts
      const systemPrompt = buildEnhancedSystemPrompt(contentType);

      // Build the user prompt with RAG context
      const userPrompt = this.buildUserPrompt(ragContext, customPrompt);

      console.log('🤖 Generating AI content with system prompts...');
      console.log(`Product: ${targetProduct.name}`);
      console.log(`Content Type: ${contentType}`);
      console.log(`Brand Voice: ${brandVoice || 'auto-selected'}`);

      // Check if Mistral AI service is configured
      if (!this.mistralClient) {
        console.warn('⚠️ Mistral API key not configured, using enhanced mock generation');
        return this.generateEnhancedMockContent(request);
      }

      // Make API call to Mistral AI
      const response = await this.callMistralAI(systemPrompt, userPrompt);

      return {
        generatedText: response.generatedText,
        tokensUsed: response.tokensUsed,
        model: this.model
      };

    } catch (error) {
      console.error('AI generation error:', error);
      console.log('Falling back to enhanced mock generation...');
      return this.generateEnhancedMockContent(request);
    }
  }

  private buildUserPrompt(ragContext: any, customPrompt?: string): string {
    const { targetProduct, similarProducts, categoryProducts, brandProducts } = ragContext;

    let prompt = `Generate content for this product using the RAG context provided:\n\n`;

    // Target product details
    prompt += `TARGET PRODUCT:\n`;
    prompt += `Name: ${targetProduct.name}\n`;
    prompt += `Brand: ${targetProduct.brandName}\n`;
    prompt += `SKU: ${targetProduct.sku}\n`;
    prompt += `Category: ${targetProduct.breadcrumbs_text || targetProduct.primary_category}\n`;
    prompt += `Price: ${targetProduct.salePrice || 'N/A'}\n`;
    prompt += `Rating: ${targetProduct.rating ? `${targetProduct.rating}/5 stars` : 'N/A'}\n`;

    if (targetProduct.description) {
      prompt += `Current Description: ${targetProduct.description.substring(0, 300)}...\n`;
    }

    if (targetProduct.features_text) {
      prompt += `Features: ${targetProduct.features_text.substring(0, 200)}...\n`;
    }

    // Add specifications
    const specs = [];
    if (targetProduct.color) specs.push(`Color: ${targetProduct.color}`);
    if (targetProduct.material) specs.push(`Material: ${targetProduct.material}`);
    if (targetProduct.style) specs.push(`Style: ${targetProduct.style}`);
    if (targetProduct.size) specs.push(`Size: ${targetProduct.size}`);

    if (specs.length > 0) {
      prompt += `Specifications: ${specs.join(', ')}\n`;
    }

    // Add competitive context
    if (categoryProducts.length > 0) {
      const avgPrice = this.calculateAveragePrice(categoryProducts);
      prompt += `\nCATEGORY CONTEXT:\n`;
      prompt += `Average category price: $${avgPrice}\n`;
      prompt += `${categoryProducts.length} similar products in category\n`;
    }

    if (similarProducts.length > 0) {
      prompt += `\nSIMILAR PRODUCTS:\n`;
      similarProducts.slice(0, 3).forEach((product: any, index: number) => {
        prompt += `${index + 1}. ${product.name} - ${product.brandName} (${product.salePrice || 'N/A'})\n`;
      });
    }

    if (brandProducts.length > 0) {
      prompt += `\nBRAND CONTEXT:\n`;
      prompt += `${brandProducts.length} other products from ${targetProduct.brandName}\n`;
    }

    // Add custom prompt if provided
    if (customPrompt) {
      prompt += `\nSPECIAL INSTRUCTIONS: ${customPrompt}\n`;
    }

    prompt += `\nGenerate compelling, conversion-optimized content following the system prompt guidelines.`;

    return prompt;
  }

  private async callMistralAI(systemPrompt: string, userPrompt: string): Promise<AIGenerationResponse> {
    if (!this.mistralClient) {
      throw new Error('Mistral AI client not initialized');
    }

    try {
      const response = await this.mistralClient.chat({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        maxTokens: 1000,
        temperature: 0.7,
        topP: 1,
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response from Mistral AI');
      }

      const rawText = response.choices[0].message.content || '';
      const cleanedText = this.cleanMarkdownFormatting(rawText);

      return {
        generatedText: cleanedText,
        tokensUsed: response.usage?.total_tokens,
        model: this.model
      };
    } catch (error) {
      console.error('Mistral AI API error:', error);
      throw new Error(`Mistral AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateEnhancedMockContent(request: AIGenerationRequest): AIGenerationResponse {
    const { ragContext, contentType, customPrompt } = request;
    const { targetProduct, similarProducts, categoryProducts } = ragContext;

    // Enhanced mock generation that follows your system prompt structure
    let content = '';

    if (contentType === 'enhanced_description' || contentType === 'long_description') {
      content = `${targetProduct.name}\n\n`;

      // Hook
      content += `Discover the ${targetProduct.name} from ${targetProduct.brandName} - `;
      if (targetProduct.primary_category) {
        content += `a premium ${targetProduct.primary_category.toLowerCase()} that `;
      }
      content += `delivers exceptional quality and performance.\n\n`;

      // Why This Stands Out section
      content += `Why This ${targetProduct.primary_category || 'Product'} Stands Out:\n`;

      if (targetProduct.rating) {
        content += `⭐ Customer Approved – ⭐${targetProduct.rating}/5 from verified buyers\n`;
      }

      if (targetProduct.material) {
        content += `🔑 Premium Materials – Features ${targetProduct.material} construction for lasting durability\n`;
      }

      if (targetProduct.color && targetProduct.style) {
        content += `🛠️ Thoughtful Design – Available in ${targetProduct.color} with ${targetProduct.style} styling\n`;
      }

      if (targetProduct.specific_uses_for_product) {
        content += `🎯 Perfect For – Ideal for ${targetProduct.specific_uses_for_product.toLowerCase()}\n`;
      }

      // Value proposition
      if (categoryProducts.length > 0) {
        const avgPrice = this.calculateAveragePrice(categoryProducts);
        const targetPrice = parseFloat(targetProduct.salePrice || '0');
        if (targetPrice > 0 && avgPrice > 0) {
          if (targetPrice < avgPrice * 0.8) {
            content += `💰 Exceptional Value – Priced below category average while maintaining premium quality\n`;
          } else if (targetPrice > avgPrice * 1.2) {
            content += `💰 Premium Choice – Superior quality and features justify the investment\n`;
          } else {
            content += `💰 Competitive Pricing – Fairly priced within its category at ${targetProduct.salePrice}\n`;
          }
        }
      }

      // Bottom line
      content += `\nBottom Line: ${targetProduct.name} combines quality, performance, and value to deliver exactly what you need.`;

      // Call to action
      content += `\n\n👉 Order now for reliable performance and complete satisfaction.`;

    } else if (contentType === 'bullet_points') {
      content = `Why This ${targetProduct.primary_category || 'Product'} Stands Out:\n\n`;

      if (targetProduct.rating) {
        content += `⭐ Customer Approved – ⭐${targetProduct.rating}/5 from verified buyers\n`;
      }

      if (targetProduct.material) {
        content += `🔑 Premium Build – ${targetProduct.material} construction ensures lasting quality\n`;
      }

      if (targetProduct.specific_uses_for_product) {
        content += `🎯 Perfect Application – Designed specifically for ${targetProduct.specific_uses_for_product.toLowerCase()}\n`;
      }

      content += `💰 Smart Investment – Quality that delivers long-term value and satisfaction`;
    }

    // Add custom prompt influence
    if (customPrompt) {
      content += `\n\n*${customPrompt}*`;
    }

    const cleanedContent = this.cleanMarkdownFormatting(content.trim());

    return {
      generatedText: cleanedContent,
      model: 'enhanced-mock-v1'
    };
  }

  private calculateAveragePrice(products: any[]): number {
    const prices = products
      .map(p => parseFloat(p.salePrice || '0'))
      .filter(price => price > 0);

    if (prices.length === 0) return 0;

    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
  }

  /**
   * Clean up markdown formatting from generated text
   */
  private cleanMarkdownFormatting(text: string): string {
    return text
      // Remove excessive bold formatting but keep single asterisks for emphasis
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove **bold** formatting
      .replace(/\*([^*]+)\*/g, '$1')      // Remove *italic* formatting
      // Clean up any remaining double asterisks
      .replace(/\*\*/g, '')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      // Trim whitespace
      .trim();
  }
}

export const aiService = new AIService();