// Test the updated weather logic with your actual Gainesville data
const mockWeatherData = {
  temperature: 67,
  condition: 'Sunny',
  description: 'Sunny',
  humidity: 71,
  windSpeed: 5,
  precipitation: 0,
  icon: '☀️',
  alerts: [
    'Coastal Flood Warning issued October 13 at 1:44AM EDT until October 14 at 5:00AM EDT by NWS Jacksonville FL',
    'Coastal Flood Warning issued October 13 at 8:03AM EDT until October 15 at 6:00AM EDT by NWS Jacksonville FL',
    'Coastal Flood Advisory issued October 13 at 8:03AM EDT until October 15 at 6:00AM EDT by NWS Jacksonville FL'
  ]
};

// Simulate the updated isOutdoorFriendly logic
function isOutdoorFriendly(temp, condition, windSpeed, alerts = []) {
  const conditionLower = condition.toLowerCase();
  
  // Check for dangerous weather alerts that affect general outdoor activities
  if (alerts && alerts.length > 0) {
    const generalDangerAlerts = alerts.some(alert => {
      const alertLower = alert.toLowerCase();
      // Only block for alerts that affect general outdoor activities
      return alertLower.includes('tornado') ||
             alertLower.includes('hurricane') ||
             alertLower.includes('severe thunderstorm') ||
             alertLower.includes('winter storm') ||
             alertLower.includes('blizzard') ||
             alertLower.includes('ice storm') ||
             (alertLower.includes('flood') && !alertLower.includes('coastal')) || // General flooding, not coastal
             (alertLower.includes('warning') && (
               alertLower.includes('heat') ||
               alertLower.includes('wind') ||
               alertLower.includes('storm')
             ));
    });
    
    if (generalDangerAlerts) return false;
  }
  
  // Temperature check (40-90°F is comfortable)
  if (temp < 40 || temp > 90) return false;
  
  // Wind check (over 25 mph is too windy)
  if (windSpeed > 25) return false;
  
  // Precipitation check
  if (conditionLower.includes('rain') || 
      conditionLower.includes('storm') || 
      conditionLower.includes('snow') ||
      conditionLower.includes('drizzle')) return false;
  
  return true;
}

// Simulate the updated recommendation logic
function getWeatherRecommendation(weather) {
  // Check for weather alerts and categorize them
  if (weather.alerts && weather.alerts.length > 0) {
    const generalDangerAlerts = weather.alerts.filter(alert => {
      const alertLower = alert.toLowerCase();
      return alertLower.includes('tornado') ||
             alertLower.includes('hurricane') ||
             alertLower.includes('severe thunderstorm') ||
             alertLower.includes('winter storm') ||
             alertLower.includes('blizzard') ||
             alertLower.includes('ice storm') ||
             (alertLower.includes('flood') && !alertLower.includes('coastal'));
    });
    
    const coastalAlerts = weather.alerts.filter(alert => {
      const alertLower = alert.toLowerCase();
      return alertLower.includes('coastal flood') ||
             alertLower.includes('rip current') ||
             alertLower.includes('beach') ||
             alertLower.includes('marine');
    });
    
    if (generalDangerAlerts.length > 0) {
      return '⚠️ Severe weather alerts in effect - consider indoor alternatives or postponing outdoor activities.';
    } else if (coastalAlerts.length > 0) {
      return '🌊 Coastal/marine alerts active - avoid waterfront areas, but inland activities should be fine.';
    }
  }
  
  if (weather.isOutdoorFriendly) {
    return 'Perfect conditions for outdoor sports! 🌟';
  }
  
  return 'Check current conditions before heading out.';
}

// Test the logic
console.log('🧪 TESTING UPDATED WEATHER LOGIC');
console.log('='.repeat(50));
console.log(`📍 Location: Gainesville, FL`);
console.log(`🌡️ Conditions: ${mockWeatherData.temperature}°F, ${mockWeatherData.condition}`);
console.log(`💨 Wind: ${mockWeatherData.windSpeed} mph`);
console.log(`💧 Precipitation: ${mockWeatherData.precipitation} inches`);
console.log(`🚨 Alerts: ${mockWeatherData.alerts.length} active`);
console.log('');

// Test isOutdoorFriendly
const isGoodForOutdoor = isOutdoorFriendly(
  mockWeatherData.temperature,
  mockWeatherData.condition,
  mockWeatherData.windSpeed,
  mockWeatherData.alerts
);

mockWeatherData.isOutdoorFriendly = isGoodForOutdoor;

console.log(`✅ Is outdoor friendly: ${isGoodForOutdoor}`);
console.log(`📝 Recommendation: ${getWeatherRecommendation(mockWeatherData)}`);
console.log('');
console.log('🎯 EXPECTED RESULT:');
console.log('   ✅ Should show "Good for outdoor sports"');
console.log('   🌊 Should mention coastal alerts but allow inland activities');
console.log('   📱 Should match your iPhone\'s 0% precipitation assessment');
