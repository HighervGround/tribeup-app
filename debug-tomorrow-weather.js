// Check weather for tomorrow evening 8pm in Gainesville
const WEATHER_API_KEY = '5471e2ac15dc4f118ee131228251310';

async function checkTomorrowEvening() {
  console.log('🌤️ CHECKING WEATHER FOR TOMORROW EVENING 8PM');
  console.log('=' .repeat(60));
  
  // Gainesville, FL coordinates
  const lat = 29.638737;
  const lng = -82.427517;
  
  // Tomorrow at 8pm
  const tomorrow8pm = new Date();
  tomorrow8pm.setDate(tomorrow8pm.getDate() + 1);
  tomorrow8pm.setHours(20, 0, 0, 0); // 8:00 PM
  
  console.log(`📍 Location: Gainesville, FL (${lat}, ${lng})`);
  console.log(`🕐 Current time: ${new Date().toLocaleString()}`);
  console.log(`🎯 Game time: ${tomorrow8pm.toLocaleString()} (Tomorrow 8pm)`);
  console.log('');
  
  try {
    // Get 2-day forecast to cover tomorrow
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lng}&days=2&aqi=no&alerts=no`
    );
    
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    
    // Find tomorrow's forecast
    const tomorrowForecast = data.forecast.forecastday[1]; // Index 1 = tomorrow
    
    if (!tomorrowForecast) {
      console.error('❌ No forecast data for tomorrow');
      return;
    }
    
    console.log('📅 TOMORROW\'S OVERALL FORECAST:');
    console.log(`   High: ${tomorrowForecast.day.maxtemp_f}°F`);
    console.log(`   Low: ${tomorrowForecast.day.mintemp_f}°F`);
    console.log(`   Condition: ${tomorrowForecast.day.condition.text}`);
    console.log(`   Chance of rain: ${tomorrowForecast.day.daily_chance_of_rain}%`);
    console.log(`   Total precipitation: ${tomorrowForecast.day.totalprecip_in} inches`);
    console.log(`   Max wind: ${tomorrowForecast.day.maxwind_mph} mph`);
    console.log('');
    
    // Find the 8pm hour specifically
    const hour8pm = tomorrowForecast.hour.find(h => {
      const hourTime = new Date(h.time);
      return hourTime.getHours() === 20; // 8pm
    });
    
    if (hour8pm) {
      console.log('🎯 TOMORROW 8PM SPECIFIC FORECAST:');
      console.log(`   Temperature: ${hour8pm.temp_f}°F`);
      console.log(`   Feels like: ${hour8pm.feelslike_f}°F`);
      console.log(`   Condition: ${hour8pm.condition.text}`);
      console.log(`   Chance of rain: ${hour8pm.chance_of_rain}%`);
      console.log(`   Precipitation: ${hour8pm.precip_in} inches`);
      console.log(`   Wind: ${hour8pm.wind_mph} mph`);
      console.log(`   Humidity: ${hour8pm.humidity}%`);
      console.log('');
      
      // Test if it's outdoor friendly (ignoring alerts)
      const temp = hour8pm.temp_f;
      const isGoodTemp = temp >= 40 && temp <= 90;
      const isGoodWind = hour8pm.wind_mph <= 25;
      const isGoodCondition = !hour8pm.condition.text.toLowerCase().includes('rain') &&
                             !hour8pm.condition.text.toLowerCase().includes('storm') &&
                             !hour8pm.condition.text.toLowerCase().includes('snow');
      
      const isOutdoorFriendly = isGoodTemp && isGoodWind && isGoodCondition;
      
      console.log('🏃‍♂️ OUTDOOR SPORTS ASSESSMENT:');
      console.log(`   Temperature OK (40-90°F): ${isGoodTemp ? '✅' : '❌'} (${temp}°F)`);
      console.log(`   Wind OK (<25mph): ${isGoodWind ? '✅' : '❌'} (${hour8pm.wind_mph}mph)`);
      console.log(`   No precipitation: ${isGoodCondition ? '✅' : '❌'} (${hour8pm.condition.text})`);
      console.log(`   Overall: ${isOutdoorFriendly ? '✅ GOOD FOR OUTDOOR SPORTS' : '❌ NOT IDEAL'}`);
      
    } else {
      console.log('❌ Could not find 8pm forecast data');
    }
    
    console.log('');
    console.log('📱 VS YOUR IPHONE:');
    console.log('   Your iPhone: 0% precipitation');
    console.log(`   WeatherAPI: ${hour8pm ? hour8pm.chance_of_rain : 'N/A'}% chance of rain`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTomorrowEvening();
