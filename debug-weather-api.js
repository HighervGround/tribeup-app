// Debug script to check WeatherAPI.com data vs iPhone weather
const WEATHER_API_KEY = '5471e2ac15dc4f118ee131228251310';

async function debugWeatherAPI() {
  console.log('🌤️ WEATHER API DEBUG - Checking actual API responses');
  console.log('=' .repeat(60));
  
  // Using your actual game location in Gainesville, FL
  const lat = 29.638737; // Gainesville, FL (Oak Hall School area)
  const lng = -82.427517;
  const zipcode = '32607';
  
  console.log(`📍 Location: ${lat}, ${lng} (Gainesville, FL - zipcode ${zipcode})`);
  console.log(`🕐 Current time: ${new Date().toISOString()}`);
  console.log('');
  
  try {
    // 1. Check current weather
    console.log('1️⃣ CURRENT WEATHER:');
    const currentResponse = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${lat},${lng}&aqi=no`
    );
    
    if (currentResponse.ok) {
      const currentData = await currentResponse.json();
      console.log(`   Temperature: ${currentData.current.temp_f}°F`);
      console.log(`   Condition: ${currentData.current.condition.text}`);
      console.log(`   Humidity: ${currentData.current.humidity}%`);
      console.log(`   Wind: ${currentData.current.wind_mph} mph`);
      console.log(`   Precipitation: ${currentData.current.precip_in} inches`);
      console.log(`   Feels like: ${currentData.current.feelslike_f}°F`);
    } else {
      console.error(`   ❌ Current weather API error: ${currentResponse.status}`);
    }
    
    console.log('');
    
    // 2. Check forecast with alerts
    console.log('2️⃣ FORECAST WITH ALERTS:');
    const forecastResponse = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lng}&days=3&aqi=no&alerts=yes`
    );
    
    if (forecastResponse.ok) {
      const forecastData = await forecastResponse.json();
      
      // Show alerts
      if (forecastData.alerts && forecastData.alerts.alert && forecastData.alerts.alert.length > 0) {
        console.log('   🚨 WEATHER ALERTS:');
        forecastData.alerts.alert.forEach((alert, index) => {
          console.log(`   Alert ${index + 1}: ${alert.headline}`);
          console.log(`   Severity: ${alert.severity}`);
          console.log(`   Urgency: ${alert.urgency}`);
          console.log(`   Areas: ${alert.areas}`);
          console.log(`   Category: ${alert.category}`);
          console.log(`   Event: ${alert.event}`);
          console.log(`   Effective: ${alert.effective}`);
          console.log(`   Expires: ${alert.expires}`);
          console.log(`   Description: ${alert.desc.substring(0, 200)}...`);
          console.log('   ---');
        });
      } else {
        console.log('   ✅ No weather alerts');
      }
      
      // Show today's forecast
      const today = forecastData.forecast.forecastday[0];
      console.log('   📅 TODAY\'S FORECAST:');
      console.log(`   High: ${today.day.maxtemp_f}°F, Low: ${today.day.mintemp_f}°F`);
      console.log(`   Condition: ${today.day.condition.text}`);
      console.log(`   Chance of rain: ${today.day.daily_chance_of_rain}%`);
      console.log(`   Total precipitation: ${today.day.totalprecip_in} inches`);
      console.log(`   Max wind: ${today.day.maxwind_mph} mph`);
      
      // Show hourly for next few hours
      console.log('   ⏰ NEXT 6 HOURS:');
      const currentHour = new Date().getHours();
      today.hour.slice(currentHour, currentHour + 6).forEach((hour, index) => {
        const time = new Date(hour.time);
        console.log(`   ${time.getHours()}:00 - ${hour.temp_f}°F, ${hour.condition.text}, ${hour.chance_of_rain}% rain`);
      });
      
    } else {
      console.error(`   ❌ Forecast API error: ${forecastResponse.status}`);
    }
    
    console.log('');
    console.log('📱 COMPARISON WITH YOUR IPHONE:');
    console.log('   Your iPhone shows: 0% precipitation');
    console.log('   WeatherAPI shows: See above data');
    console.log('');
    console.log('🤔 POSSIBLE REASONS FOR DISCREPANCY:');
    console.log('   1. Different data sources (Apple uses Weather.com, WeatherAPI uses multiple sources)');
    console.log('   2. Different update frequencies');
    console.log('   3. Coastal flood warnings may be issued by NWS but not affect precipitation forecasts');
    console.log('   4. Flood warnings can be for storm surge/tidal flooding, not rain');
    console.log('   5. Location precision differences');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugWeatherAPI();
