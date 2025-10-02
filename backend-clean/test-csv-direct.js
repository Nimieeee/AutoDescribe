const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

console.log('🧪 Testing CSV loading from backend directory...');
console.log('Current directory:', process.cwd());

// Test the exact path resolution used in product-loader.ts
const csvPath = process.env.CSV_PATH || './structured_products.csv';
const fullPath = path.resolve(process.cwd(), csvPath);

console.log('CSV path:', csvPath);
console.log('Full path:', fullPath);
console.log('File exists:', fs.existsSync(fullPath));

if (fs.existsSync(fullPath)) {
  console.log('📁 Loading CSV from:', fullPath);
  
  let count = 0;
  const sampleProducts = [];
  
  fs.createReadStream(fullPath)
    .pipe(csv())
    .on('data', (row) => {
      count++;
      if (count <= 3) {
        sampleProducts.push({
          sku: row.sku,
          name: row.name ? row.name.substring(0, 40) + '...' : 'No name',
          brand: row.brandName
        });
      }
    })
    .on('end', () => {
      console.log(`📦 Successfully loaded ${count} products from CSV`);
      console.log('Sample products:');
      sampleProducts.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.sku} - ${p.name} (${p.brand})`);
      });
      console.log('✅ Backend CSV loading is working correctly!');
    })
    .on('error', (error) => {
      console.error('❌ Error loading CSV:', error);
    });
} else {
  console.log('❌ CSV file not found');
  console.log('Available files:', fs.readdirSync(process.cwd()).filter(f => f.includes('.csv')));
}