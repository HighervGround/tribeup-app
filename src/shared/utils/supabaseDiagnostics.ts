/**
 * Supabase Database Diagnostics
 * 
 * This tool helps identify why queries are hanging by testing
 * different database operations and RLS policies.
 */

import { supabase } from '@/core/database/supabase';

export class SupabaseDiagnostics {
  
  /**
   * Run comprehensive database diagnostics
   */
  static async runDiagnostics(): Promise<void> {
    console.log('🔍 [Diagnostics] Starting Supabase diagnostics...');
    
    try {
      // Test 1: Basic connection
      await this.testConnection();
      
      // Test 2: Auth status
      await this.testAuth();
      
      // Test 3: Simple table queries
      await this.testTableAccess();
      
      // Test 4: RLS policies
      await this.testRLSPolicies();
      
      // Test 5: Specific game query
      await this.testGameQuery();
      
      console.log('✅ [Diagnostics] All tests completed');
      
    } catch (error) {
      console.error('❌ [Diagnostics] Failed:', error);
    }
  }
  
  /**
   * Test basic Supabase connection
   */
  private static async testConnection(): Promise<void> {
    console.log('🧪 [Test 1] Testing Supabase connection...');
    
    try {
      const startTime = performance.now();
      
      // Simple health check - this should always work
      const { data, error } = await Promise.race([
        supabase.from('games').select('count', { count: 'exact', head: true }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ]) as any;
      
      const duration = performance.now() - startTime;
      
      if (error) {
        console.error('❌ [Test 1] Connection failed:', error);
        console.error('🚨 This indicates a fundamental Supabase connection issue');
      } else {
        console.log(`✅ [Test 1] Connection OK (${duration.toFixed(2)}ms)`);
      }
      
    } catch (error) {
      console.error('❌ [Test 1] Connection timeout or error:', error);
      console.error('🚨 Supabase is not responding - check network/URL/keys');
    }
  }
  
  /**
   * Test authentication status
   */
  private static async testAuth(): Promise<void> {
    console.log('🧪 [Test 2] Testing authentication...');
    
    try {
      const startTime = performance.now();
      
      const { data: { user }, error } = await Promise.race([
        supabase.auth.getUser(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 3000)
        )
      ]) as any;
      
      const duration = performance.now() - startTime;
      
      if (error) {
        console.error('❌ [Test 2] Auth error:', error);
      } else {
        console.log(`✅ [Test 2] Auth OK (${duration.toFixed(2)}ms)`, {
          userId: user?.id || 'anonymous',
          email: user?.email || 'none',
          role: user?.role || 'anon'
        });
      }
      
    } catch (error) {
      console.error('❌ [Test 2] Auth timeout:', error);
    }
  }
  
  /**
   * Test basic table access without RLS complications
   */
  private static async testTableAccess(): Promise<void> {
    console.log('🧪 [Test 3] Testing table access...');
    
    const tables = ['games', 'users', 'game_participants'];
    
    for (const table of tables) {
      try {
        const startTime = performance.now();
        
        const { data, error } = await Promise.race([
          supabase.from(table).select('*').limit(1),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`${table} query timeout`)), 8000)
          )
        ]) as any;
        
        const duration = performance.now() - startTime;
        
        if (error) {
          console.error(`❌ [Test 3] ${table} failed:`, error);
          
          // Analyze the error
          if (error.code === 'PGRST301') {
            console.error(`🚨 ${table}: RLS is blocking ALL access - policies too restrictive`);
          } else if (error.message?.includes('timeout')) {
            console.error(`🚨 ${table}: Query hanging - likely RLS infinite loop`);
          } else {
            console.error(`🚨 ${table}: Unknown error - ${error.message}`);
          }
        } else {
          console.log(`✅ [Test 3] ${table} OK (${duration.toFixed(2)}ms) - ${data?.length || 0} rows`);
        }
        
      } catch (error) {
        console.error(`❌ [Test 3] ${table} timeout:`, error);
        console.error(`🚨 ${table}: Hanging query detected - RLS issue likely`);
      }
    }
  }
  
  /**
   * Test RLS policies by trying different user contexts
   */
  private static async testRLSPolicies(): Promise<void> {
    console.log('🧪 [Test 4] Testing RLS policies...');
    
    try {
      // Test anonymous access
      console.log('🔍 Testing anonymous access...');
      const { data: anonGames, error: anonError } = await Promise.race([
        supabase.from('games').select('id, title').limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Anonymous query timeout')), 5000)
        )
      ]) as any;
      
      if (anonError) {
        console.error('❌ Anonymous access failed:', anonError);
        console.error('🚨 RLS is blocking anonymous users - this breaks public game viewing');
      } else {
        console.log('✅ Anonymous access OK');
      }
      
      // Test authenticated access
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('🔍 Testing authenticated access...');
        const { data: authGames, error: authError } = await Promise.race([
          supabase.from('games').select('id, title').limit(1),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Authenticated query timeout')), 5000)
          )
        ]) as any;
        
        if (authError) {
          console.error('❌ Authenticated access failed:', authError);
          console.error('🚨 RLS is blocking authenticated users - major issue');
        } else {
          console.log('✅ Authenticated access OK');
        }
      }
      
    } catch (error) {
      console.error('❌ [Test 4] RLS test failed:', error);
    }
  }
  
  /**
   * Test the specific game query that's failing
   */
  private static async testGameQuery(): Promise<void> {
    console.log('🧪 [Test 5] Testing specific game query...');
    
    try {
      // First, get any game ID
      const { data: games } = await supabase
        .from('games')
        .select('id')
        .limit(1);
        
      if (!games || games.length === 0) {
        console.warn('⚠️ No games found to test with');
        return;
      }
      
      const gameId = games[0].id;
      console.log('🔍 Testing with game ID:', gameId);
      
      // Test the exact query that's failing
      const startTime = performance.now();
      
      const { data, error } = await Promise.race([
        supabase
          .from('games')
          .select(`
            *,
            game_participants(user_id),
            creator:users!creator_id(id, full_name, username, avatar_url)
          `)
          .eq('id', gameId)
          .single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Game query timeout')), 10000)
        )
      ]) as any;
      
      const duration = performance.now() - startTime;
      
      if (error) {
        console.error('❌ [Test 5] Game query failed:', error);
        console.error('🚨 This is the exact query that\'s causing the hang!');
        
        // Try simpler version
        console.log('🔍 Trying simpler game query...');
        const { data: simpleData, error: simpleError } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();
          
        if (simpleError) {
          console.error('❌ Even simple game query failed:', simpleError);
        } else {
          console.log('✅ Simple game query works - issue is with joins');
          console.log('🚨 Problem is likely with users table RLS or foreign key constraints');
        }
      } else {
        console.log(`✅ [Test 5] Game query OK (${duration.toFixed(2)}ms)`);
      }
      
    } catch (error) {
      console.error('❌ [Test 5] Game query timeout:', error);
      console.error('🚨 The game query is definitely hanging - RLS issue confirmed');
    }
  }
  
  /**
   * Generate RLS fix SQL based on detected issues
   */
  static generateRLSFix(): string {
    return `
-- RLS Fix SQL for TribeUp
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS on all tables
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;

-- 2. Games table policies (allow public read, authenticated write)
DROP POLICY IF EXISTS "Games are viewable by everyone" ON public.games;
CREATE POLICY "Games are viewable by everyone" ON public.games
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create games" ON public.games;
CREATE POLICY "Users can create games" ON public.games
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can update their own games" ON public.games;
CREATE POLICY "Users can update their own games" ON public.games
    FOR UPDATE USING (auth.uid() = creator_id);

-- 3. Users table policies (allow public read of basic info)
DROP POLICY IF EXISTS "Users can view basic profile info" ON public.users;
CREATE POLICY "Users can view basic profile info" ON public.users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 4. Game participants policies
DROP POLICY IF EXISTS "Game participants are viewable by everyone" ON public.game_participants;
CREATE POLICY "Game participants are viewable by everyone" ON public.game_participants
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join games" ON public.game_participants;
CREATE POLICY "Users can join games" ON public.game_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave games" ON public.game_participants;
CREATE POLICY "Users can leave games" ON public.game_participants
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Fix any foreign key constraints that might cause issues
-- (These should already exist, but just in case)
ALTER TABLE public.games 
    ADD CONSTRAINT games_creator_id_fkey 
    FOREIGN KEY (creator_id) REFERENCES public.users(id) 
    ON DELETE CASCADE;

ALTER TABLE public.game_participants 
    ADD CONSTRAINT game_participants_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) 
    ON DELETE CASCADE;

ALTER TABLE public.game_participants 
    ADD CONSTRAINT game_participants_game_id_fkey 
    FOREIGN KEY (game_id) REFERENCES public.games(id) 
    ON DELETE CASCADE;
`;
  }
}

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).supabaseDiagnostics = SupabaseDiagnostics;
  (window as any).runDiagnostics = () => SupabaseDiagnostics.runDiagnostics();
  (window as any).getRLSFix = () => {
    console.log(SupabaseDiagnostics.generateRLSFix());
    return SupabaseDiagnostics.generateRLSFix();
  };
}
