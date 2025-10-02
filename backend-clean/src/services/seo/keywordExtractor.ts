import { ExtractedKeyword, KeywordAnalysis } from './types';

import { ParsedProductData } from '../ingestion/types';

export class KeywordExtractor {
  private stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);

  extractKeywords(text: string): KeywordAnalysis {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word));

    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    const keywords: ExtractedKeyword[] = Array.from(wordFreq.entries())
      .map(([keyword, frequency]) => ({
        keyword,
        frequency,
        relevance: frequency / words.length,
        position: text.toLowerCase().indexOf(keyword)
      }))
      .sort((a, b) => b.frequency - a.frequency);

    const totalKeywords = keywords.length;
    const primaryKeywords = keywords.slice(0, 5);
    const secondaryKeywords = keywords.slice(5, 15);
    const keywordDensity = totalKeywords / words.length;

    return {
      primaryKeywords,
      secondaryKeywords,
      totalKeywords,
      keywordDensity
    };
  }

  extractFromProduct(product: ParsedProductData, options: any): KeywordAnalysis {
    const text = [
      product.title,
      product.description,
      product.brand,
      product.category,
      product.additional_text,
      ...(product.features || [])
    ].filter(Boolean).join(' ');

    return this.extractKeywords(text);
  }
}