export interface ExtractedKeyword {
  keyword: string;
  frequency: number;
  relevance: number;
  position: number;
}

export interface KeywordAnalysis {
  primaryKeywords: ExtractedKeyword[];
  secondaryKeywords: ExtractedKeyword[];
  totalKeywords: number;
  keywordDensity: number;
  keywords?: ExtractedKeyword[];
  suggested_primary?: ExtractedKeyword[];
  suggested_secondary?: ExtractedKeyword[];
  long_tail?: ExtractedKeyword[];
}

export interface SEOOptimizationSuggestions {
  titleOptimization: string[];
  metaDescriptionOptimization: string[];
  keywordOptimization: string[];
  contentOptimization: string[];
  structureOptimization: string[];
}