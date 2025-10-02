// Simplified evaluation service for backend-clean
export interface QualityScore {
  overall: number; // 0-10 scale
  clarity: number; // 0-2 points
  conciseness: number; // 0-2 points
  technicalAccuracy: number; // 0-2 points
  professionalTone: number; // 0-2 points
  seoEngagement: number; // 0-2 points
  breakdown: {
    fleschScore: number;
    avgWordsPerSentence: number;
    avgSyllablesPerWord: number;
    foundAttributes: string[];
    foundKeywords: string[];
    qualityLevel: string; // Poor, Fair, Good, Excellent
  };
}

export interface EvaluationReport {
  content_id: string;
  product_id: string;
  content_type: string;
  score: QualityScore;
  recommendations: string[];
  evaluation_timestamp: Date;
}

export class QualityEvaluationService {
  async evaluateContent(
    content: any,
    product?: any,
    targetKeywords?: string[]
  ): Promise<EvaluationReport> {
    console.log(`Evaluating content quality: ${content.id}`);

    const text = content.edited_text || content.generated_text;
    const keywords = targetKeywords || content.seo_keywords || [];

    // Calculate the 5 dimensions (0-2 points each)
    const clarity = this.evaluateClarity(text);
    const conciseness = this.evaluateConciseness(text);
    const technicalAccuracy = this.evaluateTechnicalAccuracy(text, product);
    const professionalTone = this.evaluateProfessionalTone(text);
    const seoEngagement = await this.evaluateSEOEngagement(text, keywords);

    // Calculate overall score (0-10)
    const overall = clarity + conciseness + technicalAccuracy + professionalTone + seoEngagement;

    // Calculate breakdown metrics for detailed analysis
    const breakdown = this.calculateBreakdown(text, product, keywords);

    const score: QualityScore = {
      overall,
      clarity,
      conciseness,
      technicalAccuracy,
      professionalTone,
      seoEngagement,
      breakdown: {
        ...breakdown,
        qualityLevel: this.getQualityLevel(overall)
      }
    };

    // Generate recommendations based on the new scoring system
    const recommendations = this.generateRecommendations(score, content.content_type);

    return {
      content_id: content.id,
      product_id: content.product_id,
      content_type: content.content_type,
      score,
      recommendations,
      evaluation_timestamp: new Date(),
    };
  }

  /**
   * 1. Clarity (0–2 points)
   * 0 = Confusing, vague, or full of jargon
   * 1 = Somewhat clear but may contain redundancy or unclear phrasing
   * 2 = Very clear, concise, and easy to understand
   */
  private evaluateClarity(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);
    const avgSyllablesPerWord = syllables / words.length;

    // Calculate Flesch Reading Ease
    const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    // Check for jargon and complex terms
    const jargonWords = words.filter(word => 
      word.length > 12 || // Very long words
      /[A-Z]{3,}/.test(word) || // Acronyms
      word.includes('_') || word.includes('-') && word.length > 8
    );
    const jargonRatio = jargonWords.length / words.length;

    // Scoring logic - much more lenient for marketing content
    if (fleschScore >= 30 && jargonRatio < 0.15 && avgWordsPerSentence <= 40) {
      return 2; // Very clear (marketing content can be longer and more complex)
    } else if (fleschScore >= 20 && jargonRatio < 0.25 && avgWordsPerSentence <= 50) {
      return 1; // Somewhat clear
    } else {
      return 0; // Confusing
    }
  }

  /**
   * 2. Conciseness (0–2 points)
   * 0 = Overly wordy, repetitive, or filled with unnecessary adjectives
   * 1 = Some redundancy, but still digestible
   * 2 = Concise, no fluff, minimal redundancy
   */
  private evaluateConciseness(text: string): number {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (words.length === 0) return 0;

    // Check for redundant words and phrases
    const redundantPhrases = [
      'very very', 'really really', 'absolutely perfect', 'completely unique',
      'totally amazing', 'incredibly awesome', 'extremely excellent', 'pretty good i think',
      'or something', 'like 20 bucks or something'
    ];
    const textLower = text.toLowerCase();
    const redundancyCount = redundantPhrases.filter(phrase => textLower.includes(phrase)).length;

    // Check for excessive adjectives and marketing fluff
    const fluffWords = words.filter(word => 
      /ly$/.test(word) || // Adverbs ending in -ly
      ['amazing', 'incredible', 'awesome', 'fantastic', 'perfect', 'excellent', 'outstanding', 'pretty', 'really', 'very'].includes(word.toLowerCase())
    );
    const fluffRatio = fluffWords.length / words.length;

    // Check for content density (meaningful words vs total words)
    const meaningfulWords = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'who', 'oil', 'sit', 'set'].includes(word.toLowerCase())
    );
    const densityRatio = meaningfulWords.length / words.length;

    // Check for repetitive sentence structure
    const shortSentences = sentences.filter(s => s.trim().split(' ').length < 5).length;
    const shortSentenceRatio = sentences.length > 0 ? shortSentences / sentences.length : 0;

    // Scoring logic - balanced for marketing content
    let score = 2; // Start with perfect score
    
    // Deduct for redundancy
    if (redundancyCount > 2) score -= 1;
    else if (redundancyCount > 0) score -= 0.3;
    
    // Deduct for excessive fluff
    if (fluffRatio > 0.3) score -= 1;
    else if (fluffRatio > 0.2) score -= 0.5;
    
    // Deduct for low content density
    if (densityRatio < 0.4) score -= 0.5;
    
    // Deduct for too many short/choppy sentences
    if (shortSentenceRatio > 0.6) score -= 0.5;
    
    return Math.max(0, Math.min(2, Math.round(score)));
  }

  /**
   * 3. Technical Accuracy (0–2 points)
   * 0 = Contains factual errors, misleading claims, or wrong product features
   * 1 = Mostly correct but may exaggerate or misstate details
   * 2 = Fully accurate, technically correct, and matches actual product use
   */
  private evaluateTechnicalAccuracy(text: string, product?: any): number {
    if (!product) return 1; // Default score when product info unavailable

    const textLower = text.toLowerCase();
    let accuracyScore = 2; // Start with perfect score

    // Check if product name is mentioned correctly (more lenient)
    if (!textLower.includes(product.name.toLowerCase())) {
      accuracyScore -= 0.2; // Reduced penalty
    }

    // Check brand accuracy (more lenient)
    if (product.brand && !textLower.includes(product.brand.toLowerCase())) {
      accuracyScore -= 0.1; // Reduced penalty
    }

    // Check for exaggerated claims - adjusted for marketing content
    const exaggeratedClaims = [
      'best ever', 'perfect solution', 'flawless', 'miraculous', 'unbelievable results', 'impossible to beat'
    ];
    const exaggerationCount = exaggeratedClaims.filter(claim => textLower.includes(claim)).length;
    if (exaggerationCount > 3) {
      accuracyScore -= 0.5;
    } else if (exaggerationCount > 1) {
      accuracyScore -= 0.2;
    }

    // Check attribute accuracy using additional_text field
    if (product.additional_text) {
      const additionalTextLower = product.additional_text.toLowerCase();
      const attributeTerms = additionalTextLower.split(/[,;:]/).map((term: string) => term.trim());
      let mentionedTerms = 0;
      
      attributeTerms.forEach((term: string) => {
        if (term.length > 2 && textLower.includes(term)) {
          mentionedTerms++;
        }
      });
      
      const attributeRatio = attributeTerms.length > 0 ? mentionedTerms / attributeTerms.length : 0;
      if (attributeRatio < 0.1) {
        accuracyScore -= 0.2; // Much more lenient
      }
    }

    // Also check standard attributes (very lenient)
    if (product.attributes) {
      Object.entries(product.attributes).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          if (!textLower.includes(value.toLowerCase()) && !textLower.includes(key.toLowerCase())) {
            accuracyScore -= 0.05; // Very minor penalty for missing standard attributes
          }
        }
      });
    }

    return Math.max(0, Math.min(2, Math.round(accuracyScore)));
  }

  /**
   * 4. Professional Tone & Consistency (0–2 points)
   * 0 = Informal, unprofessional, or inconsistent tone
   * 1 = Adequate but with minor inconsistencies (style, formatting, grammar)
   * 2 = Professional, consistent, polished tone
   */
  private evaluateProfessionalTone(text: string): number {
    // Check for informal language
    const informalWords = [
      'gonna', 'wanna', 'gotta', 'yeah', 'nah', 'ok', 'cool', 'awesome sauce',
      'super duper', 'totes', 'legit', 'sick', 'dope', 'lit', 'i think', 'i guess',
      'like 20 bucks', 'pretty good', 'or something', 'thing about'
    ];
    const textLower = text.toLowerCase();
    const informalCount = informalWords.filter(word => textLower.includes(word)).length;

    // Check for professional structure and formatting
    const hasProperFormatting = text.includes('**') || text.includes('⭐') || text.includes('🔑') || text.includes('•');
    const hasCallToAction = /\b(grab|buy|get|purchase|order|shop|watch|stream)\b/i.test(text);
    const hasValueProps = /\b(exclusive|premium|limited|best|top|great|perfect)\b/i.test(text);
    
    // Check sentence structure quality
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? text.length / sentences.length : 0;
    const hasVariedSentences = sentences.length > 1;
    
    // Check for complete sentences vs fragments
    const fragments = sentences.filter(s => s.trim().split(' ').length < 3).length;
    const fragmentRatio = sentences.length > 0 ? fragments / sentences.length : 0;

    // Scoring logic - balanced for marketing content
    let score = 2; // Start with perfect score
    
    // Deduct for informal language
    if (informalCount > 3) score -= 1;
    else if (informalCount > 1) score -= 0.5;
    
    // Deduct for poor structure
    if (fragmentRatio > 0.3) score -= 0.5;
    if (avgSentenceLength < 20) score -= 0.3; // Very short sentences
    
    // Bonus for professional marketing elements
    if (hasProperFormatting) score += 0.2;
    if (hasCallToAction) score += 0.1;
    if (hasValueProps) score += 0.1;
    
    return Math.max(0, Math.min(2, Math.round(score)));
  }

  /**
   * 5. SEO & Engagement Potential (0–2 points)
   * 0 = No SEO value (lacks keywords, boring structure)
   * 1 = Some keywords, but could be improved for search/discovery
   * 2 = Optimized with relevant keywords and phrased for engagement
   */
  private async evaluateSEOEngagement(text: string, keywords: string[]): Promise<number> {
    const textLower = text.toLowerCase();
    
    // Keyword coverage - more lenient
    let keywordScore = 0;
    if (keywords.length > 0) {
      const foundKeywords = keywords.filter(keyword => textLower.includes(keyword.toLowerCase()));
      const keywordCoverage = foundKeywords.length / keywords.length;
      keywordScore = keywordCoverage >= 0.6 ? 1 : keywordCoverage >= 0.3 ? 0.8 : keywordCoverage >= 0.1 ? 0.5 : 0.2;
    } else {
      keywordScore = 1; // Give full score when no keywords provided
    }

    // Engagement elements
    let engagementScore = 0;
    
    // Check for engaging elements
    const engagingElements = [
      /\?/, // Questions
      /!/, // Exclamations (moderate use)
      /\b(you|your)\b/i, // Direct address
      /\b(discover|explore|experience|enjoy)\b/i, // Action words
      /\b(top|best|premium|exclusive|limited)\b/i, // Value propositions
    ];
    
    const engagementCount = engagingElements.filter(pattern => pattern.test(text)).length;
    engagementScore = engagementCount >= 3 ? 1 : engagementCount >= 2 ? 0.8 : engagementCount >= 1 ? 0.5 : 0.2;

    const totalScore = keywordScore + engagementScore;
    return Math.min(2, Math.round(totalScore));
  }

  private getQualityLevel(overallScore: number): string {
    if (overallScore >= 9) return 'Excellent';
    if (overallScore >= 7) return 'Good';
    if (overallScore >= 4) return 'Fair';
    return 'Poor';
  }

  private calculateBreakdown(text: string, product?: any, keywords: string[] = []) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);
    
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
    const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;
    const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    // Find attributes and keywords
    const foundAttributes: string[] = [];
    const foundKeywords: string[] = [];
    const textLower = text.toLowerCase();

    if (product) {
      // Check product attributes from additional_text
      if (product.additional_text) {
        const attributeTerms = product.additional_text.split(/[,;:]/).map((term: string) => term.trim());
        attributeTerms.forEach((term: string) => {
          if (term.length > 2 && textLower.includes(term.toLowerCase())) {
            foundAttributes.push(term);
          }
        });
      }
      
      // Also check standard attributes
      if (product.attributes) {
        Object.entries(product.attributes).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            if (textLower.includes(value.toLowerCase()) || textLower.includes(key.toLowerCase())) {
              foundAttributes.push(key);
            }
          }
        });
      }
    }

    // Check keywords
    keywords.forEach(keyword => {
      if (textLower.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      }
    });

    return {
      fleschScore,
      avgWordsPerSentence,
      avgSyllablesPerWord,
      foundAttributes,
      foundKeywords
    };
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let syllableCount = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      previousWasVowel = isVowel;
    }

    // Handle silent 'e'
    if (word.endsWith('e') && syllableCount > 1) {
      syllableCount--;
    }

    return Math.max(1, syllableCount);
  }

  private generateRecommendations(score: QualityScore, contentType: string): string[] {
    const recommendations: string[] = [];

    // Clarity recommendations (0-2 points)
    if (score.clarity === 0) {
      recommendations.push('🔍 CLARITY: Simplify language, reduce jargon, and use shorter sentences (under 20 words)');
    } else if (score.clarity === 1) {
      recommendations.push('🔍 CLARITY: Minor improvements needed - reduce complex terms and improve sentence flow');
    }

    // Conciseness recommendations (0-2 points)
    if (score.conciseness === 0) {
      recommendations.push('✂️ CONCISENESS: Remove redundant phrases, excessive adjectives, and filler words');
    } else if (score.conciseness === 1) {
      recommendations.push('✂️ CONCISENESS: Tighten up the copy by removing some unnecessary descriptors');
    }

    // Technical Accuracy recommendations (0-2 points)
    if (score.technicalAccuracy === 0) {
      recommendations.push('⚠️ ACCURACY: Verify product details, remove exaggerated claims, and ensure factual correctness');
    } else if (score.technicalAccuracy === 1) {
      recommendations.push('⚠️ ACCURACY: Double-check product specifications and tone down any overstated benefits');
    }

    // Professional Tone recommendations (0-2 points)
    if (score.professionalTone === 0) {
      recommendations.push('👔 TONE: Use more professional language, fix grammar issues, and maintain consistent formatting');
    } else if (score.professionalTone === 1) {
      recommendations.push('👔 TONE: Minor polish needed - check grammar and maintain consistent style');
    }

    // SEO & Engagement recommendations (0-2 points)
    if (score.seoEngagement === 0) {
      recommendations.push('🎯 SEO: Add relevant keywords naturally and include more engaging elements (questions, benefits)');
    } else if (score.seoEngagement === 1) {
      recommendations.push('🎯 SEO: Improve keyword integration or add more engaging language to boost discoverability');
    }

    // Overall recommendations based on total score
    if (score.overall <= 3) {
      recommendations.unshift('🚨 OVERALL: Content needs complete rewrite - multiple critical issues identified');
    } else if (score.overall <= 6) {
      recommendations.unshift('📝 OVERALL: Significant improvements needed across multiple dimensions');
    } else if (score.overall <= 8) {
      recommendations.unshift('✨ OVERALL: Good quality with minor improvements needed');
    } else {
      recommendations.unshift('🏆 OVERALL: Excellent quality - ready for publication!');
    }

    return recommendations;
  }
}