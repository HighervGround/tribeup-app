// Test OpenWeatherMap API with different approaches
const keys = [
  '***REMOVED***',
  'e13535154c9c651a5c982ede6fda8df9'
];

async function testKey(apiKey) {
  console.log(`\n🧪 Testing key: ${apiKey.substring(0, 8)}...`);
  
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

async function testAllKeys() {
  console.log('🌤️ Testing OpenWeatherMap API Keys...\n');
  
  for (const key of keys) {
    const success = await testKey(key);
    if (success) {
      console.log(`\n🎉 Working key found: ${key}`);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
  
  console.log('\n📝 If all keys failed, try:');
  console.log('1. Check email verification at openweathermap.org');
  console.log('2. Wait 2 hours for key activation');
  console.log('3. Generate a new API key');
  console.log('4. Check account status and billing');
}

// Run the test
testAllKeys();
