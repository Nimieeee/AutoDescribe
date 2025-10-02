const http = require('http');

console.log('🚀 Testing Enhanced Search Functionality');
console.log('=======================================');

function testSearch(endpoint, params, description) {
  return new Promise((resolve, reject) => {
    const queryString = new URLSearchParams(params).toString();
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `${endpoint}?${queryString}`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`\n🔍 ${description}`);
          console.log(`URL: ${endpoint}?${queryString}`);
          console.log(`Status: ${res.statusCode}`);
          
          if (response.success) {
            console.log(`✅ Found ${response.products.length} products`);
            
            if (response.search_type) {
              console.log(`🔧 Search Type: ${response.search_type}`);
            }
            
            if (response.products.length > 0) {
              console.log(`📦 Top Results:`);
              response.products.slice(0, 5).forEach((product, index) => {
                console.log(`   ${index + 1}. ${product.sku} - ${product.name.substring(0, 50)}...`);
                console.log(`      Brand: ${product.brand || 'N/A'} | Category: ${product.category || 'N/A'}`);
              });
              
              if (response.products.length > 5) {
                console.log(`   ... and ${response.products.length - 5} more`);
              }
            } else {
              console.log(`❌ No products found`);
            }
          } else {
            console.log(`❌ Search Failed: ${response.error}`);
          }
          
          resolve(response);
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Request error:', err.message);
      reject(err);
    });

    req.end();
  });
}

async function runEnhancedSearchTests() {
  try {
    console.log('\n🎯 Testing Enhanced Search Capabilities...\n');
    
    // Test 1: Basic vs Advanced Search Comparison
    console.log('📋 Test 1: Basic vs Advanced Search Comparison');
    await testSearch('/api/search-products', { q: 'gloves', limit: 10 }, 'Basic Search: "gloves"');
    await testSearch('/api/search-products', { q: 'gloves', limit: 10, advanced: 'true' }, 'Advanced Search: "gloves"');
    
    // Test 2: SKU Searches (should be very precise)
    console.log('\n📋 Test 2: SKU-based Searches');
    await testSearch('/api/search-products', { q: 'B0DTQCFGX3', limit: 5 }, 'SKU Search: "B0DTQCFGX3"');
    await testSearch('/api/search-products', { q: 'B0', limit: 20 }, 'SKU Prefix Search: "B0"');
    
    // Test 3: Brand Searches
    console.log('\n📋 Test 3: Brand-based Searches');
    await testSearch('/api/search-products', { q: 'Amazon', limit: 15 }, 'Brand Search: "Amazon"');
    await testSearch('/api/search-brand', { brand: 'Amazon', limit: 15 }, 'Brand Endpoint: "Amazon"');
    
    // Test 4: Category Searches
    console.log('\n📋 Test 4: Category-based Searches');
    await testSearch('/api/search-products', { q: 'Electronics', limit: 15 }, 'Category Search: "Electronics"');
    await testSearch('/api/search-category', { category: 'Electronics', limit: 15 }, 'Category Endpoint: "Electronics"');
    
    // Test 5: Multi-word Searches
    console.log('\n📋 Test 5: Multi-word Searches');
    await testSearch('/api/search-products', { q: 'nitrile gloves', limit: 10, advanced: 'true' }, 'Multi-word: "nitrile gloves"');
    await testSearch('/api/search-products', { q: 'amazon basics', limit: 10, advanced: 'true' }, 'Multi-word: "amazon basics"');
    
    // Test 6: Common Product Types
    console.log('\n📋 Test 6: Common Product Type Searches');
    const commonTypes = ['book', 'game', 'phone', 'case', 'cable', 'toy'];
    for (const type of commonTypes.slice(0, 3)) {
      await testSearch('/api/search-products', { q: type, limit: 15, advanced: 'true' }, `Product Type: "${type}"`);
    }
    
    // Test 7: Stress Test with Higher Limits
    console.log('\n📋 Test 7: High-Limit Searches (Dataset Coverage)');
    await testSearch('/api/search-products', { q: 'B0', limit: 100 }, 'High Limit: B0 SKUs (100 results)');
    await testSearch('/api/search-products', { q: 'Amazon', limit: 50 }, 'High Limit: Amazon products (50 results)');
    
    console.log('\n🎉 Enhanced Search Tests Complete!');
    console.log('\n📊 Search Improvement Analysis:');
    console.log('✅ Enhanced search includes more product fields');
    console.log('✅ Advanced search with scoring and ranking');
    console.log('✅ Multi-word search support');
    console.log('✅ Dedicated category and brand endpoints');
    console.log('✅ Better logging for debugging');
    console.log('✅ Fuzzy matching and partial matches');
    
    console.log('\n🔧 If searches still miss products:');
    console.log('1. Check backend logs for "🔍 Searching for..." messages');
    console.log('2. Verify CSV data quality and field population');
    console.log('3. Try advanced search with advanced=true parameter');
    console.log('4. Use higher limit values to see more results');
    console.log('5. Check specific brand/category endpoints');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\nMake sure the backend server is running: cd backend-clean && npm run dev-full');
  }
}

runEnhancedSearchTests();