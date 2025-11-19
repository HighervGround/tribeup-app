// OpenWeatherMap API Test Script
// IMPORTANT: Set your API key in .env as VITE_OPENWEATHER_API_KEY before running

// Usage: node scripts/samples/test-openweather.js

// Load API key from environment
const API_KEY = process.env.VITE_OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY;

if (!API_KEY) {
  console.error('❌ ERROR: No API key found!');
  console.error('Set VITE_OPENWEATHER_API_KEY in your .env file or export OPENWEATHER_API_KEY');
  console.error('Example: export OPENWEATHER_API_KEY=your_key_here');
  process.exit(1);
}

async function testKey(apiKey) {
  console.log(`\n🧪 Testing OpenWeatherMap API key: ${apiKey.substring(0, 8)}...`);
  
  try {
    // Test current weather
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${apiKey}&units=imperial`
    );
    
    console.log(`📡 Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ SUCCESS! Temperature: ${data.main.temp}°F, Condition: ${data.weather[0].description}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ FAILED: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
    return false;
  }
}

async function runTest() {
  console.log('🌤️ Testing OpenWeatherMap API...\n');
  
  const success = await testKey(API_KEY);
  
  if (!success) {
    console.log('\n📝 Troubleshooting tips:');
    console.log('1. Check email verification at openweathermap.org');
    console.log('2. Wait 2 hours for key activation after registration');
    console.log('3. Generate a new API key from your dashboard');
    console.log('4. Check account status and billing limits');
    console.log('5. Verify the key is correctly set in your .env file');
  }
}

// Run the test
runTest();
