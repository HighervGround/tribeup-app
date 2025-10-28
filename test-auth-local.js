// Test email/password authentication locally
// Usage: node test-auth-local.js <email> <password> [signup|signin]

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignUp(email, password) {
  console.log('🔐 Testing Sign Up...\n');
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: email.split('@')[0],
          username: email.split('@')[0].toLowerCase().replace(/\s+/g, '_'),
        }
      }
    });

    if (error) {
      console.error('❌ Sign Up Error:', error.message);
      return false;
    }

    console.log('✅ Sign Up Successful!');
    console.log('   User ID:', data.user?.id);
    console.log('   Email:', data.user?.email);
    console.log('   Session:', data.session ? 'Created' : 'Requires email confirmation');
    return true;
  } catch (error) {
    console.error('❌ Sign Up Exception:', error.message);
    return false;
  }
}

async function testSignIn(email, password) {
  console.log('🔐 Testing Sign In...\n');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ Sign In Error:', error.message);
      return false;
    }

    console.log('✅ Sign In Successful!');
    console.log('   User ID:', data.user?.id);
    console.log('   Email:', data.user?.email);
    console.log('   Session Valid:', !!data.session);
    
    // Test getting user profile
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.log('⚠️  Profile check:', profileError.message);
      } else {
        console.log('✅ User profile exists in database');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Sign In Exception:', error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const email = args[0];
  const password = args[1];
  const action = args[2] || 'signin';

  if (!email || !password) {
    console.log('Usage: node test-auth-local.js <email> <password> [signup|signin]');
    console.log('Example: node test-auth-local.js test@example.com password123 signup');
    process.exit(1);
  }

  console.log('📧 Email:', email);
  console.log('🔑 Password:', '*'.repeat(password.length));
  console.log('🎯 Action:', action);
  console.log('🌐 Supabase URL:', supabaseUrl);
  console.log('');

  if (action === 'signup') {
    await testSignUp(email, password);
  } else {
    await testSignIn(email, password);
  }
}

main().catch(console.error);

