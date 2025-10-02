export interface GeneratedContent {
  id: string;
  productSku: string;
  title: string;
  description: string;
  features: string[];
  seoKeywords: string[];
  generatedAt: Date;
  quality: {
    score: number;
    metrics: {
      readability: number;
      seoOptimization: number;
      brandVoice: number;
      technicalAccuracy: number;
    };
  };
  // Legacy fields for compatibility
  seo_keywords?: string[];
  edited_text?: string;
  generated_text?: string;
  content_type?: string;
}