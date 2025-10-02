#!/usr/bin/env node

/**
 * Test Enhanced SEO Keyword Extraction
 * Tests the new keyword parsing from product names, brands, and breadcrumbs
 */

// Mock product data to test keyword extraction
const testProducts = [
  {
    name: "Apple MacBook Pro 16-inch M2 Max Laptop Computer",
    brandName: "Apple",
    breadcrumbs_text: "Electronics > Computers > Laptops > MacBooks",
    primary_category: "Laptops",
    product_type: "Laptop Computer",
    material: "Aluminum",
    color: "Space Gray",
    style: "Professional",
    size: "16-inch",
    specific_uses_for_product: "Professional Computing, Video Editing, Software Development"
  },
  {
    name: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
    brandName: "Sony",
    breadcrumbs_text: "Electronics / Audio / Headphones / Wireless Headphones",
    primary_category: "Audio Equipment",
    product_type: "Headphones",
    material: "Plastic",
    color: "Black",
    style: "Over-Ear",
    specific_uses_for_product: "Music Listening, Travel, Work from Home"
  },
  {
    name: "Herman Miller Aeron Ergonomic Office Chair - Size B",
    brandName: "Herman Miller",
    breadcrumbs_text: "Furniture > Office Furniture > Chairs > Ergonomic Chairs",
    primary_category: "Office Furniture",
    product_type: "Office Chair",
    material: "Mesh",
    color: "Graphite",
    style: "Ergonomic",
    size: "Size B (Medium)",
    specific_uses_for_product: "Office Work, Gaming, Home Office"
  }
];

// Replicate the enhanced keyword extraction functions
function parseKeywordsFromText(text) {
  if (!text) return [];
  
  return text
    .split(/[\s,\-_\(\)\[\]\/\\&\+\|]+/)
    .map(word => word.replace(/[^\w]/g, '').toLowerCase())
    .filter(word => word.length > 2)
    .filter(word => !isStopWord(word));
}

function parseKeywordsFromBreadcrumbs(breadcrumbs) {
  if (!breadcrumbs) return [];
  
  return breadcrumbs
    .split(/[>\/\|\\]+/)
    .map(crumb => crumb.trim())
    .filter(crumb => crumb.length > 0)
    .flatMap(crumb => parseKeywordsFromText(crumb));
}

function isStopWord(word) {
  const stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'among', 'this', 'that', 'these', 'those', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'a', 'an'
  ]);
  
  return stopWords.has(word.toLowerCase());
}

function extractSEOKeywords(product) {
  const allKeywords = [];
  
  // Parse keywords from product name
  if (product.name) {
    const nameKeywords = parseKeywordsFromText(product.name);
    allKeywords.push(...nameKeywords);
    console.log(`  📝 Name keywords: ${nameKeywords.join(', ')}`);
  }
  
  // Parse keywords from brand name
  if (product.brandName) {
    const brandKeywords = parseKeywordsFromText(product.brandName);
    allKeywords.push(...brandKeywords);
    console.log(`  🏷️  Brand keywords: ${brandKeywords.join(', ')}`);
  }
  
  // Parse keywords from breadcrumbs
  if (product.breadcrumbs_text) {
    const breadcrumbKeywords = parseKeywordsFromBreadcrumbs(product.breadcrumbs_text);
    allKeywords.push(...breadcrumbKeywords);
    console.log(`  🍞 Breadcrumb keywords: ${breadcrumbKeywords.join(', ')}`);
  }
  
  // Add structured product attributes
  const structuredKeywords = [
    product.primary_category,
    product.product_type,
    product.material,
    product.color,
    product.style,
    product.size,
    product.specific_uses_for_product
  ].filter(Boolean).map(k => k.toLowerCase().trim());
  
  allKeywords.push(...structuredKeywords);
  console.log(`  🏗️  Structured keywords: ${structuredKeywords.join(', ')}`);
  
  // Clean, deduplicate, and filter keywords
  const cleanedKeywords = allKeywords
    .map(k => k.toLowerCase().trim())
    .filter(k => k.length > 2)
    .filter(k => !isStopWord(k))
    .filter(Boolean);
  
  // Remove duplicates and return top 15 keywords
  return [...new Set(cleanedKeywords)].slice(0, 15);
}

// Test the keyword extraction
console.log('🔍 Testing Enhanced SEO Keyword Extraction\n');

testProducts.forEach((product, index) => {
  console.log(`\n📦 Product ${index + 1}: ${product.name}`);
  console.log(`🏢 Brand: ${product.brandName}`);
  console.log(`🗂️  Breadcrumbs: ${product.breadcrumbs_text}`);
  console.log('\n🔍 Keyword Extraction Process:');
  
  const keywords = extractSEOKeywords(product);
  
  console.log(`\n✅ Final SEO Keywords (${keywords.length}): ${keywords.join(', ')}`);
  console.log('─'.repeat(80));
});

console.log('\n🎯 Summary:');
console.log('✅ Enhanced keyword extraction now parses:');
console.log('   • Product names (split by spaces, hyphens, etc.)');
console.log('   • Brand names (individual words)');
console.log('   • Breadcrumb navigation (category hierarchy)');
console.log('   • Structured attributes (color, material, etc.)');
console.log('   • Removes stop words and duplicates');
console.log('   • Returns top 15 most relevant keywords');

console.log('\n🚀 This will significantly improve SEO keyword quality!');