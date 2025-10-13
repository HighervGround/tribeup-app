// Test WeatherAPI.com integration
const WEATHERAPI_KEY = '5471e2ac15dc4f118ee131228251310';

async function testWeatherAPI() {
  console.log('🌤️ Testing WeatherAPI.com Integration...\n');
  
  // Test location: New York City
  const testLocation = 'New York, NY';
  const lat = 40.7128;
  const lng = -74.0060;
  
  console.log(`📍 Testing location: ${testLocation} (${lat}, ${lng})`);
  
  try {
    // Test 1: Current Weather
    console.log('\n🌡️ Test 1: Current Weather...');
    const currentUrl = `https://api.weatherapi.com/v1/current.json?key=${WEATHERAPI_KEY}&q=${lat},${lng}&aqi=no`;
    
    const currentResponse = await fetch(currentUrl);
    if (!currentResponse.ok) {
      throw new Error(`Current weather API error: ${currentResponse.status}`);
    }
    
    const currentData = await currentResponse.json();
    console.log('✅ Current Weather:');
    console.log(`   Location: ${currentData.location.name}, ${currentData.location.region}`);
    console.log(`   Temperature: ${Math.round(currentData.current.temp_f)}°F`);
    console.log(`   Condition: ${currentData.current.condition.text}`);
    console.log(`   Humidity: ${currentData.current.humidity}%`);
    console.log(`   Wind: ${Math.round(currentData.current.wind_mph)} mph`);
    console.log(`   Precipitation: ${currentData.current.precip_in}" rain`);
    
    // Test 2: Forecast Weather
    console.log('\n📊 Test 2: 3-Day Forecast...');
    const forecastUrl = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${lat},${lng}&days=3&aqi=no&alerts=yes`;
    
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) {
      throw new Error(`Forecast API error: ${forecastResponse.status}`);
    }
    
    const forecastData = await forecastResponse.json();
    console.log('✅ Forecast Data:');
    console.log(`   Forecast days: ${forecastData.forecast.forecastday.length}`);
    
    // Show today's hourly forecast
    const today = forecastData.forecast.forecastday[0];
    console.log(`\n🕐 Today's Hourly Forecast (${today.date}):`);
    
    today.hour.slice(0, 6).forEach((hour, index) => {
      const time = new Date(hour.time);
      console.log(`   ${time.toLocaleTimeString()}: ${Math.round(hour.temp_f)}°F, ${hour.condition.text}`);
    });
    
    // Test 3: Game Time Simulation
    console.log('\n🎮 Test 3: Game Time Simulation...');
    const gameTime = new Date();
    gameTime.setHours(gameTime.getHours() + 4); // 4 hours from now
    
    console.log(`   Simulated game time: ${gameTime.toLocaleString()}`);
    
    // Find closest hourly forecast
    let bestMatch = null;
    let smallestDiff = Infinity;
    
    for (const day of forecastData.forecast.forecastday) {
      for (const hour of day.hour) {
        const hourTime = new Date(hour.time);
        const diff = Math.abs(hourTime.getTime() - gameTime.getTime());
        
        if (diff < smallestDiff) {
          smallestDiff = diff;
          bestMatch = hour;
        }
      }
    }
    
    if (bestMatch) {
      const matchTime = new Date(bestMatch.time);
      const hoursDiff = smallestDiff / (1000 * 60 * 60);
      
      console.log('✅ Best forecast match:');
      console.log(`   Forecast time: ${matchTime.toLocaleString()}`);
      console.log(`   Time difference: ${hoursDiff.toFixed(1)} hours`);
      console.log(`   Temperature: ${Math.round(bestMatch.temp_f)}°F`);
      console.log(`   Condition: ${bestMatch.condition.text}`);
      console.log(`   Outdoor friendly: ${isOutdoorFriendly(bestMatch) ? 'Yes ✅' : 'No ⚠️'}`);
    }
    
    // Test 4: Alerts
    if (forecastData.alerts && forecastData.alerts.alert && forecastData.alerts.alert.length > 0) {
      console.log('\n⚠️ Weather Alerts:');
      forecastData.alerts.alert.forEach((alert, index) => {
        console.log(`   ${index + 1}. ${alert.headline}`);
      });
    } else {
      console.log('\n✅ No weather alerts');
    }
    
    console.log('\n🎉 WeatherAPI.com integration test successful!');
    console.log('\n💡 Advantages over OpenWeather:');
    console.log('   ✅ More accurate location matching');
    console.log('   ✅ Better hourly forecasts');
    console.log('   ✅ Cleaner API responses');
    console.log('   ✅ More reliable service');
    console.log('   ✅ Better timezone handling');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

function isOutdoorFriendly(hour) {
  const temp = hour.temp_f;
  const condition = hour.condition.text.toLowerCase();
  const wind = hour.wind_mph;
  
  // Temperature check (40-90°F)
  if (temp < 40 || temp > 90) return false;
  
  // Wind check (over 25 mph)
  if (wind > 25) return false;
  
  // Precipitation check
  if (condition.includes('rain') || condition.includes('storm') || condition.includes('snow')) {
    return false;
  }
  
  return true;
}

// Run the test
testWeatherAPI();
