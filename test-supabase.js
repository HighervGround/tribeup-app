const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔗 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('games').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
}

async function checkExistingData() {
  console.log('\n📊 Checking existing data...');
  
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error reading data:', error.message);
      return false;
    }

    if (data && data.length > 0) {
      console.log('✅ Found existing games:');
      data.forEach(game => {
        console.log(`   - ${game.title} (${game.sport})`);
      });
    } else {
      console.log('ℹ️  No games found in database');
      console.log('💡 You can create games through the app interface');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 TribeUp Supabase Integration Test');
  console.log('=====================================\n');

  const connected = await testConnection();
  
  if (connected) {
    await checkExistingData();
  }

  console.log('\n🎯 Test completed!');
  console.log('📱 Your app should now show real data from Supabase');
}

main().catch(console.error);
