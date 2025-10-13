// Test OpenWeather API with Google Geocoding
const OPENWEATHER_API_KEY = '***REMOVED***';
const GOOGLE_MAPS_API_KEY = 'AIzaSyCs_MsE3qt74h6eIR04QJqmf2FYgSys4UQ';

async function testWeatherAPI() {
  console.log('🧪 Testing OpenWeather API Integration...\n');
  
  // Test location: Central Park, New York
  const testLocation = 'Central Park, New York, NY';
  console.log(`📍 Testing location: ${testLocation}`);
  
  try {
    // Step 1: Get coordinates from Google Geocoding
    console.log('\n🗺️ Step 1: Google Geocoding...');
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testLocation)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();
    
    if (geocodeData.status !== 'OK') {
      throw new Error(`Google Geocoding failed: ${geocodeData.status} - ${geocodeData.error_message}`);
    }
    
    const { lat, lng } = geocodeData.results[0].geometry.location;
    const formattedAddress = geocodeData.results[0].formatted_address;
    
    console.log(`✅ Geocoding successful:`);
    console.log(`   Coordinates: ${lat}, ${lng}`);
    console.log(`   Formatted: ${formattedAddress}`);
    
    // Step 2: Get current weather from OpenWeather
    console.log('\n🌤️ Step 2: OpenWeather Current Weather...');
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=imperial`;
    
    const currentResponse = await fetch(currentWeatherUrl);
    if (!currentResponse.ok) {
      throw new Error(`OpenWeather current API error: ${currentResponse.status} ${currentResponse.statusText}`);
    }
    
    const currentData = await currentResponse.json();
    console.log(`✅ Current weather successful:`);
    console.log(`   Temperature: ${Math.round(currentData.main.temp)}°F`);
    console.log(`   Condition: ${currentData.weather[0].main} - ${currentData.weather[0].description}`);
    console.log(`   Humidity: ${currentData.main.humidity}%`);
    console.log(`   Wind: ${Math.round(currentData.wind.speed)} mph`);
    
    // Step 3: Get forecast from OpenWeather
    console.log('\n📊 Step 3: OpenWeather Forecast...');
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=imperial`;
    
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) {
      throw new Error(`OpenWeather forecast API error: ${forecastResponse.status} ${forecastResponse.statusText}`);
    }
    
    const forecastData = await forecastResponse.json();
    console.log(`✅ Forecast successful:`);
    console.log(`   Forecast entries: ${forecastData.list.length}`);
    console.log(`   Next 3 forecasts:`);
    
    forecastData.list.slice(0, 3).forEach((forecast, index) => {
      const date = new Date(forecast.dt * 1000);
      console.log(`   ${index + 1}. ${date.toLocaleString()}: ${Math.round(forecast.main.temp)}°F, ${forecast.weather[0].description}`);
    });
    
    // Step 4: Test game-specific weather (2 hours from now)
    console.log('\n🎮 Step 4: Game-specific weather forecast...');
    const gameTime = new Date();
    gameTime.setHours(gameTime.getHours() + 2); // 2 hours from now
    
    console.log(`   Game time: ${gameTime.toLocaleString()}`);
    
    // Find closest forecast to game time
    const gameTimestamp = gameTime.getTime();
    const closestForecast = forecastData.list.reduce((closest, current) => {
      const currentDiff = Math.abs((current.dt * 1000) - gameTimestamp);
      const closestDiff = Math.abs((closest.dt * 1000) - gameTimestamp);
      return currentDiff < closestDiff ? current : closest;
    });
    
    const forecastTime = new Date(closestForecast.dt * 1000);
    console.log(`✅ Game weather forecast:`);
    console.log(`   Forecast time: ${forecastTime.toLocaleString()}`);
    console.log(`   Temperature: ${Math.round(closestForecast.main.temp)}°F`);
    console.log(`   Condition: ${closestForecast.weather[0].main} - ${closestForecast.weather[0].description}`);
    console.log(`   Outdoor friendly: ${closestForecast.main.temp > 40 && closestForecast.main.temp < 95 ? 'Yes ✅' : 'No ⚠️'}`);
    
    console.log('\n🎉 All tests passed! Weather API is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testWeatherAPI();
