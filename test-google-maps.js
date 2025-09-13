// Test Google Maps API key
const testGoogleMapsAPI = async () => {
  const apiKey = 'AIzaSyCs_MsE3qt74h6eIR04QJqmf2FYgSys4UQ';
  
  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`);
    console.log('Google Maps API Response Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Google Maps API key is working');
    } else {
      console.log('❌ Google Maps API key issue:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Error testing Google Maps API:', error);
  }
};

testGoogleMapsAPI();
