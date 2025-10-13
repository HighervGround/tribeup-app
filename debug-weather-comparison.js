// Debug script to compare our weather data with OpenWeather website
const OPENWEATHER_API_KEY = '3d49d90fb511ba08385a88435f10825c';
const GOOGLE_MAPS_API_KEY = 'AIzaSyCs_MsE3qt74h6eIR04QJqmf2FYgSys4UQ';

async function debugWeatherComparison() {
  console.log('🔍 Debugging Weather Data Comparison...\n');
  
  // Test with a specific location - let's use New York City
  const testLocation = 'New York, NY';
  console.log(`📍 Testing location: ${testLocation}`);
  
  try {
    // Step 1: Get coordinates from Google
    console.log('\n🗺️ Step 1: Getting coordinates...');
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testLocation)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();
    
    const { lat, lng } = geocodeData.results[0].geometry.location;
    console.log(`✅ Coordinates: ${lat}, ${lng}`);
    
    // Step 2: Get current weather (what OpenWeather website shows)
    console.log('\n🌤️ Step 2: Current Weather (like OpenWeather website)...');
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=imperial`;
    
    const currentResponse = await fetch(currentUrl);
    const currentData = await currentResponse.json();
    
    console.log('📊 CURRENT WEATHER (what website shows):');
    console.log(`   Temperature: ${Math.round(currentData.main.temp)}°F`);
    console.log(`   Feels like: ${Math.round(currentData.main.feels_like)}°F`);
    console.log(`   Condition: ${currentData.weather[0].main} - ${currentData.weather[0].description}`);
    console.log(`   Humidity: ${currentData.main.humidity}%`);
    console.log(`   Wind: ${Math.round(currentData.wind.speed)} mph`);
    console.log(`   Pressure: ${currentData.main.pressure} hPa`);
    console.log(`   Visibility: ${currentData.visibility ? (currentData.visibility / 1000).toFixed(1) + ' km' : 'N/A'}`);
    
    // Step 3: Get forecast data (what our app uses)
    console.log('\n📊 Step 3: Forecast Data (what our app uses)...');
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=imperial`;
    
    const forecastResponse = await fetch(forecastUrl);
    const forecastData = await forecastResponse.json();
    
    console.log(`📈 Forecast entries: ${forecastData.list.length}`);
    console.log('\n🕐 Next 5 forecast entries:');
    
    forecastData.list.slice(0, 5).forEach((forecast, index) => {
      const date = new Date(forecast.dt * 1000);
      console.log(`   ${index + 1}. ${date.toLocaleString()}`);
      console.log(`      Temp: ${Math.round(forecast.main.temp)}°F (feels ${Math.round(forecast.main.feels_like)}°F)`);
      console.log(`      Condition: ${forecast.weather[0].main} - ${forecast.weather[0].description}`);
      console.log(`      Humidity: ${forecast.main.humidity}%, Wind: ${Math.round(forecast.wind.speed)} mph`);
      console.log('');
    });
    
    // Step 4: Test our game weather logic
    console.log('\n🎮 Step 4: Testing our game weather logic...');
    const gameTime = new Date();
    gameTime.setHours(gameTime.getHours() + 3); // 3 hours from now
    
    console.log(`   Game time: ${gameTime.toLocaleString()}`);
    
    const gameTimestamp = gameTime.getTime();
    const windowStart = gameTimestamp - (8 * 60 * 60 * 1000); // 8 hours before
    const windowEnd = gameTimestamp + (8 * 60 * 60 * 1000);   // 8 hours after
    
    const windowForecasts = forecastData.list.filter((forecast) => {
      const forecastTime = forecast.dt * 1000;
      return forecastTime >= windowStart && forecastTime <= windowEnd;
    });
    
    console.log(`   Found ${windowForecasts.length} forecasts in window`);
    
    if (windowForecasts.length > 0) {
      const selectedForecast = windowForecasts.reduce((closest, current) => {
        const currentDiff = Math.abs((current.dt * 1000) - gameTimestamp);
        const closestDiff = Math.abs((closest.dt * 1000) - gameTimestamp);
        return currentDiff < closestDiff ? current : closest;
      });
      
      const selectedTime = new Date(selectedForecast.dt * 1000);
      const timeDiff = Math.abs((selectedForecast.dt * 1000) - gameTimestamp) / (1000 * 60 * 60);
      
      console.log('\n🎯 SELECTED FORECAST FOR GAME:');
      console.log(`   Forecast time: ${selectedTime.toLocaleString()}`);
      console.log(`   Time difference: ${timeDiff.toFixed(1)} hours from game`);
      console.log(`   Temperature: ${Math.round(selectedForecast.main.temp)}°F`);
      console.log(`   Condition: ${selectedForecast.weather[0].main} - ${selectedForecast.weather[0].description}`);
      console.log(`   Humidity: ${selectedForecast.main.humidity}%`);
      console.log(`   Wind: ${Math.round(selectedForecast.wind.speed)} mph`);
    }
    
    // Step 5: Compare with what OpenWeather website shows
    console.log('\n🔍 COMPARISON:');
    console.log('   Check https://openweathermap.org/city/' + currentData.id);
    console.log('   Or search for "' + testLocation + '" on openweathermap.org');
    console.log('   Compare the current weather above with what you see on the website');
    
    console.log('\n💡 DEBUGGING TIPS:');
    console.log('   1. Are the coordinates correct?');
    console.log('   2. Is the current weather matching the website?');
    console.log('   3. Is the forecast time selection reasonable?');
    console.log('   4. Are we using the right units (imperial vs metric)?');
    
  } catch (error) {
    console.error('\n❌ Debug failed:', error);
  }
}

// Run the debug
debugWeatherComparison();
