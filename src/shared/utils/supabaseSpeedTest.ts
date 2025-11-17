/**
 * Supabase Speed Test - Let's see what's actually slow
 */

import { supabase } from '@/core/database/supabase';

export class SupabaseSpeedTest {
  
  static async runFullSpeedTest() {
    console.log('🏃‍♂️ [SpeedTest] Starting comprehensive Supabase speed test...');
    
    const results = {
      connection: 0,
      auth: 0,
      simpleQuery: 0,
      complexQuery: 0,
      joinQuery: 0,
      participantsQuery: 0,
      usersQuery: 0
    };
    
    try {
      // Test 1: Basic connection
      console.log('🧪 Test 1: Basic connection...');
      const start1 = performance.now();
      
      const { count, error: countError } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true });
        
      results.connection = performance.now() - start1;
      console.log(`✅ Connection: ${results.connection.toFixed(2)}ms (${count} games total)`);
      
      if (countError) {
        console.error('❌ Connection failed:', countError);
        return results;
      }
      
      // Test 2: Auth check
      console.log('🧪 Test 2: Auth check...');
      const start2 = performance.now();
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      results.auth = performance.now() - start2;
      console.log(`✅ Auth: ${results.auth.toFixed(2)}ms (User: ${user?.id || 'anonymous'})`);
      
      // Test 3: Simple games query
      console.log('🧪 Test 3: Simple games query...');
      const start3 = performance.now();
      
      const { data: simpleGames, error: simpleError } = await supabase
        .from('games')
        .select('id, title, sport, date')
        .limit(10);
        
      results.simpleQuery = performance.now() - start3;
      console.log(`✅ Simple query: ${results.simpleQuery.toFixed(2)}ms (${simpleGames?.length || 0} games)`);
      
      // Test 4: Complex games query (what we were doing)
      console.log('🧪 Test 4: Complex games query with joins...');
      const start4 = performance.now();
      
      const { data: complexGames, error: complexError } = await supabase
        .from('games')
        .select(`
          *,
          game_participants(user_id),
          creator:users!games_creator_id_fkey(id, full_name, username, avatar_url)
        `)
        .limit(10);
        
      results.complexQuery = performance.now() - start4;
      console.log(`✅ Complex query: ${results.complexQuery.toFixed(2)}ms (${complexGames?.length || 0} games)`);
      
      if (complexError) {
        console.error('❌ Complex query failed:', complexError);
      }
      
      // Test 5: Just the join that might be slow
      console.log('🧪 Test 5: Testing participants join...');
      const start5 = performance.now();
      
      const { data: participants, error: partError } = await supabase
        .from('game_participants')
        .select('game_id, user_id')
        .limit(50);
        
      results.participantsQuery = performance.now() - start5;
      console.log(`✅ Participants query: ${results.participantsQuery.toFixed(2)}ms (${participants?.length || 0} participants)`);
      
      // Test 6: Users table query
      console.log('🧪 Test 6: Testing users query...');
      const start6 = performance.now();
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, username')
        .limit(10);
        
      results.usersQuery = performance.now() - start6;
      console.log(`✅ Users query: ${results.usersQuery.toFixed(2)}ms (${users?.length || 0} users)`);
      
      if (usersError) {
        console.error('❌ Users query failed:', usersError);
        console.error('🚨 This might be the RLS issue!');
      }
      
      // Summary
      console.log('\n📊 SPEED TEST RESULTS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🔌 Connection:        ${results.connection.toFixed(2)}ms`);
      console.log(`🔐 Auth Check:        ${results.auth.toFixed(2)}ms`);
      console.log(`📋 Simple Query:      ${results.simpleQuery.toFixed(2)}ms`);
      console.log(`🔗 Complex Query:     ${results.complexQuery.toFixed(2)}ms`);
      console.log(`👥 Participants:      ${results.participantsQuery.toFixed(2)}ms`);
      console.log(`👤 Users:             ${results.usersQuery.toFixed(2)}ms`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Analysis
      if (results.complexQuery > 5000) {
        console.warn('🚨 COMPLEX QUERY IS SLOW! This is why your app hangs.');
        console.warn('💡 Solution: Use simple queries instead of complex joins');
      }
      
      if (results.usersQuery > 3000) {
        console.warn('🚨 USERS TABLE IS SLOW! RLS policies might be the issue.');
        console.warn('💡 Solution: Fix RLS policies or avoid users table joins');
      }
      
      if (results.connection > 2000) {
        console.warn('🚨 BASIC CONNECTION IS SLOW! Network or Supabase issue.');
        console.warn('💡 Solution: Check network, Supabase region, or switch providers');
      }
      
      if (results.simpleQuery < 1000 && results.complexQuery > 5000) {
        console.log('✅ DIAGNOSIS: Simple queries are fast, complex joins are slow');
        console.log('💡 SOLUTION: Use direct queries from games table instead of complex joins');
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ Speed test failed:', error);
      return results;
    }
  }
  
  /**
   * Test network latency to Supabase
   */
  static async testNetworkLatency() {
    console.log('🌐 Testing network latency to Supabase...');
    
    const times: number[] = [];
    
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      
      try {
        await supabase.from('games').select('count', { count: 'exact', head: true });
        const time = performance.now() - start;
        times.push(time);
        console.log(`Ping ${i + 1}: ${time.toFixed(2)}ms`);
      } catch (error) {
        console.error(`Ping ${i + 1}: FAILED`);
      }
    }
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log(`📊 Latency - Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms, Avg: ${avg.toFixed(2)}ms`);
    
    if (avg > 1000) {
      console.warn('🚨 HIGH LATENCY! Your connection to Supabase is slow.');
      console.warn('💡 Consider: Different Supabase region, network issues, or local development proxy');
    }
    
    return { min, max, avg };
  }
  
  /**
   * Test specific problematic query
   */
  static async testProblematicQuery() {
    console.log('🎯 Testing the exact query that was hanging...');
    
    const start = performance.now();
    
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          game_participants(user_id),
          creator:users!games_creator_id_fkey(id, full_name, username, avatar_url)
        `)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(50);
        
      const duration = performance.now() - start;
      
      console.log(`⏱️ Problematic query took: ${duration.toFixed(2)}ms`);
      console.log(`📦 Returned: ${data?.length || 0} games`);
      
      if (error) {
        console.error('❌ Query failed:', error);
      }
      
      if (duration > 10000) {
        console.warn('🚨 CONFIRMED: This query is too slow!');
        console.warn('💡 This is why your app was hanging - the query takes 10+ seconds');
      } else if (duration > 5000) {
        console.warn('⚠️ Query is slow but not terrible');
      } else {
        console.log('✅ Query is actually fast - the timeouts were the problem');
      }
      
      return { duration, count: data?.length || 0, error };
      
    } catch (error) {
      const duration = performance.now() - start;
      console.error('❌ Problematic query failed:', error);
      return { duration, count: 0, error };
    }
  }
}

// Global access
if (typeof window !== 'undefined') {
  (window as any).supabaseSpeedTest = SupabaseSpeedTest;
  (window as any).testSupabaseSpeed = () => SupabaseSpeedTest.runFullSpeedTest();
  (window as any).testLatency = () => SupabaseSpeedTest.testNetworkLatency();
  (window as any).testProblematicQuery = () => SupabaseSpeedTest.testProblematicQuery();
}
