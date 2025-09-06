// API Key Testing Script
const https = require('https');
const http = require('http');

const API_KEYS = {
  GOOGLE_MAPS: 'AIzaSyCs_MsE3qt74h6eIR04QJqmf2FYgSys4UQ',
  GOOGLE_PLACES: 'AIzaSyCs_MsE3qt74h6eIR04QJqmf2FYgSys4UQ',
  OPENWEATHER: '3d49d90fb511ba08385a88435f10825c'
};

async function testGoogleMapsEmbed() {
  console.log('🗺️  Testing Google Maps Embed API...');
  
  // Test embed URL (this would work in browser iframe)
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${API_KEYS.GOOGLE_MAPS}&q=New+York+City&zoom=15`;
  
  try {
    const response = await fetch(embedUrl, { method: 'HEAD' });
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('   ✅ Google Maps Embed API key is valid');
    } else if (response.status === 403) {
      console.log('   ❌ Google Maps Embed API key is invalid or restricted');
    } else {
      console.log(`   ⚠️  Unexpected response: ${response.status}`);
    }
  } catch (error) {
    console.log('   ❌ Error testing Google Maps Embed:', error.message);
  }
}

async function testGooglePlacesAPI() {
  console.log('📍 Testing Google Places API...');
  
  const placesUrl = `https://places.googleapis.com/v1/places:autocomplete`;
  
  try {
    const response = await fetch(placesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEYS.GOOGLE_PLACES
      },
      body: JSON.stringify({
        input: 'New York',
        locationBias: {
          circle: {
            center: { latitude: 40.7128, longitude: -74.0060 },
            radius: 50000
          }
        }
      })
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('   ✅ Google Places API key is valid');
      console.log(`   📦 Found ${data.suggestions?.length || 0} suggestions`);
    } else if (response.status === 403) {
      console.log('   ❌ Google Places API key is invalid or restricted');
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log('   ❌ Error testing Google Places API:', error.message);
  }
}

async function testOpenWeatherAPI() {
  console.log('🌤️  Testing OpenWeatherMap API...');
  
  // Test current weather for NYC
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=40.7128&lon=-74.0060&appid=${API_KEYS.OPENWEATHER}&units=imperial`;
  
  try {
    const response = await fetch(weatherUrl);
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('   ✅ OpenWeatherMap API key is valid');
      console.log(`   🌡️  Current temp in NYC: ${Math.round(data.main.temp)}°F`);
      console.log(`   ☁️  Conditions: ${data.weather[0].description}`);
    } else if (response.status === 401) {
      console.log('   ❌ OpenWeatherMap API key is invalid');
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log('   ❌ Error testing OpenWeatherMap API:', error.message);
  }
}

async function testOpenWeatherGeocode() {
  console.log('🌍 Testing OpenWeatherMap Geocoding API...');
  
  const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=New York&limit=1&appid=${API_KEYS.OPENWEATHER}`;
  
  try {
    const response = await fetch(geocodeUrl);
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('   ✅ OpenWeatherMap Geocoding API is working');
      if (data.length > 0) {
        console.log(`   📍 Found: ${data[0].name}, ${data[0].state}, ${data[0].country}`);
        console.log(`   🗺️  Coordinates: ${data[0].lat}, ${data[0].lon}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log('   ❌ Error testing geocoding:', error.message);
  }
}

async function runAllTests() {
  console.log('🧪 Testing all API keys...\n');
  
  try {
    await testGoogleMapsEmbed();
    console.log('');
    
    await testGooglePlacesAPI();
    console.log('');
    
    await testOpenWeatherAPI();
    console.log('');
    
    await testOpenWeatherGeocode();
    console.log('');
    
    console.log('✨ API key testing complete!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runAllTests();
