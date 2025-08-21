const { spawn } = require('child_process');

console.log('🚀 Starting API Integration Tests...');

const playwright = spawn('npx', [
  'playwright',
  'test',
  '--config=playwright.config.ts',
  '--grep',
  '@api'
], {
  stdio: 'inherit',
  shell: true
});

playwright.on('close', (code) => {
  if (code === 0) {
    console.log('✅ API Integration Tests Passed!');
  } else {
    console.error(`❌ API Integration Tests Failed with code ${code}`);
  }
  process.exit(code);
});
