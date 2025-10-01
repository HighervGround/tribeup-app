const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2OTc5NzEsImV4cCI6MjA0MjI3Mzk3MX0.EHqnlPJUWdWZA4jXsJJZ_6bWWRNKkRtJMlBfXqZdKYU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugOAuthUser() {
  console.log('🔍 Debugging OAuth user identity mismatch...');
  
  const problemUserId = '6e9f3e18-0005-4080-a62a-2a298cf52199';
  
  try {
    // 1. Check if user exists in auth.users (Supabase auth table)
    console.log('\n1. Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Cannot access auth.users (need service role key)');
    } else {
      const authUser = authUsers.users.find(u => u.id === problemUserId);
      if (authUser) {
        console.log('✅ Found in auth.users:', {
          id: authUser.id,
          email: authUser.email,
          provider: authUser.app_metadata?.provider,
          oauth_email: authUser.user_metadata?.email,
          full_name: authUser.user_metadata?.full_name,
          created_at: authUser.created_at
        });
      } else {
        console.log('❌ NOT found in auth.users');
      }
    }
    
    // 2. Check if user exists in public.users table
    console.log('\n2. Checking public.users table...');
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('*')
      .eq('id', problemUserId)
      .single();
    
    if (publicError) {
      console.log('❌ NOT found in public.users:', publicError.message);
    } else {
      console.log('✅ Found in public.users:', {
        id: publicUser.id,
        email: publicUser.email,
        username: publicUser.username,
        full_name: publicUser.full_name,
        created_at: publicUser.created_at
      });
    }
    
    // 3. Check game_participants table
    console.log('\n3. Checking game_participants table...');
    const { data: participations, error: partError } = await supabase
      .from('game_participants')
      .select('*')
      .eq('user_id', problemUserId);
    
    if (partError) {
      console.log('❌ Error checking game_participants:', partError.message);
    } else {
      console.log(`✅ Found ${participations.length} game participations`);
      participations.forEach(p => {
        console.log(`  - Game: ${p.game_id}, Joined: ${p.joined_at}`);
      });
    }
    
    // 4. Check chat_messages table
    console.log('\n4. Checking chat_messages table...');
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', problemUserId);
    
    if (msgError) {
      console.log('❌ Error checking chat_messages:', msgError.message);
    } else {
      console.log(`✅ Found ${messages.length} chat messages`);
      messages.forEach(m => {
        console.log(`  - Game: ${m.game_id}, Message: "${m.message.substring(0, 50)}..."`);
      });
    }
    
    // 5. Get current session to compare
    console.log('\n5. Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Error getting session:', sessionError.message);
    } else if (session) {
      console.log('✅ Current session user:', {
        id: session.user.id,
        email: session.user.email,
        is_problem_user: session.user.id === problemUserId
      });
    } else {
      console.log('❌ No active session');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugOAuthUser();
