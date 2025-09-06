import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read environment variables from .env file
const envContent = readFileSync('.env', 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔗 Testing Supabase Connection...\n');
  
  try {
    // Test basic connection
    console.log('📡 Testing basic connection...');
    const { data, error } = await supabase.from('games').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Connection successful!');
    console.log('📊 Database is accessible');
    
    // Test auth
    console.log('\n🔐 Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('⚠️  Auth test:', authError.message);
    } else {
      console.log('✅ Authentication service working');
    }
    
    console.log('\n🎉 Connection test passed! Your Supabase integration is ready.');
    console.log('\n🚀 You can now run: npm run dev');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testConnection();
