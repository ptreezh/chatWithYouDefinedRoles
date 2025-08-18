const http = require('http');

// Test health endpoint
function testHealth() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Health check passed:', result);
          resolve(result);
        } catch (e) {
          console.log('❌ Health check failed - invalid JSON');
          reject(e);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Health check failed - connection error:', err.message);
      reject(err);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      console.log('❌ Health check failed - timeout');
      reject(new Error('Timeout'));
    });
  });
}

// Test models endpoint
function testModels() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/api/models', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Models check passed:', result.length || 0, 'models available');
          resolve(result);
        } catch (e) {
          console.log('❌ Models check failed - invalid JSON');
          reject(e);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Models check failed - connection error:', err.message);
      reject(err);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      console.log('❌ Models check failed - timeout');
      reject(new Error('Timeout'));
    });
  });
}

// Test config endpoint
function testConfig() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/api/config', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Config check passed - API configured');
          resolve(result);
        } catch (e) {
          console.log('❌ Config check failed - invalid JSON');
          reject(e);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Config check failed - connection error:', err.message);
      reject(err);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      console.log('❌ Config check failed - timeout');
      reject(new Error('Timeout'));
    });
  });
}

// Test characters endpoint
function testCharacters() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/api/characters', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Characters check passed:', result.length || 0, 'characters available');
          resolve(result);
        } catch (e) {
          console.log('❌ Characters check failed - invalid JSON');
          reject(e);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Characters check failed - connection error:', err.message);
      reject(err);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      console.log('❌ Characters check failed - timeout');
      reject(new Error('Timeout'));
    });
  });
}

// Run all tests
async function runCoreTests() {
  console.log('🧪 Starting core functionality validation...\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealth },
    { name: 'Models API', fn: testModels },
    { name: 'Config API', fn: testConfig },
    { name: 'Characters API', fn: testCharacters }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      await test.fn();
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name} failed:`, error.message);
      failed++;
    }
    console.log(''); // Empty line for readability
  }
  
  console.log('🎯 Core Functionality Test Summary');
  console.log('========================================');
  console.log(`Total tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check server logs for details.');
  }
}

runCoreTests().catch(console.error);