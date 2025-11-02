/**
 * Connection Diagnostic Tool
 * Tests and fixes Supabase connection issues
 */

import { supabase } from '@/core/database/supabase';

export class ConnectionDiagnostic {
  
  /**
   * Run comprehensive connection diagnostics
   */
  static async runConnectionTest(): Promise<void> {
    console.log('🔍 [Connection] Starting comprehensive connection test...');
    
    const results = {
      basicFetch: false,
      supabaseHealth: false,
      dnsResolution: false,
      networkLatency: 0,
      corsIssues: false,
      authEndpoint: false,
      restEndpoint: false
    };
    
    try {
      // Test 1: Basic fetch to Supabase
      console.log('🧪 Test 1: Basic fetch to Supabase...');
      const basicStart = performance.now();
      
      try {
        const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseKey
          }
        });
        
        results.basicFetch = response.ok;
        results.networkLatency = performance.now() - basicStart;
        
        console.log(`✅ Basic fetch: ${results.basicFetch ? 'SUCCESS' : 'FAILED'} (${results.networkLatency.toFixed(2)}ms)`);
      } catch (error) {
        console.error('❌ Basic fetch failed:', error);
        results.basicFetch = false;
      }
      
      // Test 2: DNS Resolution
      console.log('🧪 Test 2: DNS Resolution...');
      try {
        const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const url = new URL(supabaseUrl);
        const dnsStart = performance.now();
        
        // Try to resolve the hostname
        await fetch(`https://${url.hostname}`, { method: 'HEAD', mode: 'no-cors' });
        
        results.dnsResolution = true;
        console.log(`✅ DNS Resolution: SUCCESS (${(performance.now() - dnsStart).toFixed(2)}ms)`);
      } catch (error) {
        console.error('❌ DNS Resolution failed:', error);
        results.dnsResolution = false;
      }
      
      // Test 3: Supabase Health Check
      console.log('🧪 Test 3: Supabase Health Check...');
      try {
        const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        
        const healthResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseKey,
            'Accept': 'application/json'
          }
        });
        
        results.supabaseHealth = healthResponse.ok;
        console.log(`✅ Supabase Health: ${results.supabaseHealth ? 'HEALTHY' : 'UNHEALTHY'}`);
        
        if (!healthResponse.ok) {
          console.error('❌ Supabase response:', await healthResponse.text());
        }
      } catch (error) {
        console.error('❌ Supabase Health failed:', error);
        results.supabaseHealth = false;
      }
      
      // Test 4: CORS Issues
      console.log('🧪 Test 4: CORS Test...');
      try {
        const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        
        const corsResponse = await fetch(`${supabaseUrl}/rest/v1/games?select=count&limit=0`, {
          headers: {
            'apikey': supabaseKey,
            'Accept': 'application/json'
          }
        });
        
        results.corsIssues = !corsResponse.ok && corsResponse.status === 0;
        console.log(`✅ CORS: ${results.corsIssues ? 'BLOCKED' : 'OK'}`);
      } catch (error: any) {
        results.corsIssues = error.message?.includes('CORS') || error.message?.includes('blocked');
        console.log(`✅ CORS: ${results.corsIssues ? 'BLOCKED' : 'OK'}`);
      }
      
      // Test 5: Auth Endpoint
      console.log('🧪 Test 5: Auth Endpoint...');
      try {
        const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        
        const authResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
          headers: {
            'apikey': supabaseKey
          }
        });
        
        results.authEndpoint = authResponse.ok;
        console.log(`✅ Auth Endpoint: ${results.authEndpoint ? 'OK' : 'FAILED'}`);
      } catch (error) {
        console.error('❌ Auth Endpoint failed:', error);
        results.authEndpoint = false;
      }
      
      // Test 6: REST Endpoint with actual query
      console.log('🧪 Test 6: REST Endpoint Query...');
      try {
        const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        
        const restResponse = await fetch(`${supabaseUrl}/rest/v1/games?select=id&limit=1`, {
          headers: {
            'apikey': supabaseKey,
            'Accept': 'application/json'
          }
        });
        
        results.restEndpoint = restResponse.ok;
        console.log(`✅ REST Endpoint: ${results.restEndpoint ? 'OK' : 'FAILED'}`);
        
        if (restResponse.ok) {
          const data = await restResponse.json();
          console.log('📊 Sample data:', data);
        } else {
          console.error('❌ REST response:', await restResponse.text());
        }
      } catch (error) {
        console.error('❌ REST Endpoint failed:', error);
        results.restEndpoint = false;
      }
      
      // Summary and Recommendations
      console.log('\n📊 CONNECTION TEST RESULTS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🌐 Basic Fetch:      ${results.basicFetch ? '✅ OK' : '❌ FAILED'}`);
      console.log(`🏥 Supabase Health:  ${results.supabaseHealth ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
      console.log(`🔍 DNS Resolution:   ${results.dnsResolution ? '✅ OK' : '❌ FAILED'}`);
      console.log(`⏱️  Network Latency:  ${results.networkLatency.toFixed(2)}ms`);
      console.log(`🚫 CORS Issues:      ${results.corsIssues ? '❌ BLOCKED' : '✅ OK'}`);
      console.log(`🔐 Auth Endpoint:    ${results.authEndpoint ? '✅ OK' : '❌ FAILED'}`);
      console.log(`📡 REST Endpoint:    ${results.restEndpoint ? '✅ OK' : '❌ FAILED'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Provide specific recommendations
      this.provideRecommendations(results);
      
    } catch (error) {
      console.error('❌ Connection test failed:', error);
    }
  }
  
  /**
   * Provide specific recommendations based on test results
   */
  private static provideRecommendations(results: any): void {
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (!results.basicFetch) {
      console.log('🚨 CRITICAL: Basic fetch failed');
      console.log('   → Check internet connection');
      console.log('   → Try different network (mobile hotspot)');
      console.log('   → Check firewall/antivirus settings');
    }
    
    if (!results.dnsResolution) {
      console.log('🚨 CRITICAL: DNS resolution failed');
      console.log('   → Try different DNS servers (8.8.8.8, 1.1.1.1)');
      console.log('   → Check /etc/hosts file for conflicts');
      console.log('   → Restart network adapter');
    }
    
    if (!results.supabaseHealth) {
      console.log('🚨 CRITICAL: Supabase is unhealthy');
      console.log('   → Check status.supabase.com');
      console.log('   → Verify project isn\'t paused/suspended');
      console.log('   → Check billing status');
    }
    
    if (results.corsIssues) {
      console.log('🚨 CRITICAL: CORS blocking requests');
      console.log('   → Check Supabase project settings');
      console.log('   → Add localhost to allowed origins');
      console.log('   → Try incognito mode');
    }
    
    if (results.networkLatency > 5000) {
      console.log('⚠️  WARNING: High network latency');
      console.log('   → Try different Supabase region');
      console.log('   → Check network quality');
      console.log('   → Consider CDN/proxy');
    }
    
    if (!results.authEndpoint) {
      console.log('⚠️  WARNING: Auth endpoint failed');
      console.log('   → Check API keys');
      console.log('   → Verify project configuration');
    }
    
    if (!results.restEndpoint) {
      console.log('🚨 CRITICAL: REST endpoint failed');
      console.log('   → This is likely your main issue');
      console.log('   → Check RLS policies');
      console.log('   → Verify table permissions');
    }
    
    // Overall assessment
    const criticalIssues = [
      !results.basicFetch,
      !results.dnsResolution, 
      !results.supabaseHealth,
      results.corsIssues,
      !results.restEndpoint
    ].filter(Boolean).length;
    
    if (criticalIssues === 0) {
      console.log('✅ All tests passed - connection should work!');
    } else if (criticalIssues <= 2) {
      console.log(`⚠️  ${criticalIssues} issues found - fixable`);
    } else {
      console.log(`🚨 ${criticalIssues} critical issues - major connection problems`);
    }
  }
  
  /**
   * Quick network fixes to try
   */
  static async tryQuickFixes(): Promise<void> {
    console.log('🔧 [Connection] Trying quick fixes...');
    
    // Fix 1: Clear browser cache
    console.log('🧹 Clearing browser cache...');
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('✅ Browser cache cleared');
      }
    } catch (error) {
      console.warn('⚠️ Could not clear cache:', error);
    }
    
    // Fix 2: Reset fetch configuration
    console.log('🔄 Resetting fetch configuration...');
    // Force new connection by adding timestamp
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const testUrl = `${supabaseUrl}/rest/v1/?t=${Date.now()}`;
    
    try {
      const response = await fetch(testUrl, {
        headers: {
          'apikey': supabaseKey,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log(`✅ Fresh connection test: ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.error('❌ Fresh connection failed:', error);
    }
    
    // Fix 3: Test with different headers
    console.log('🔄 Testing with minimal headers...');
    try {
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/rest/v1/games?select=count`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey
        }
      });
      
      console.log(`✅ Minimal headers test: ${response.ok ? 'SUCCESS' : 'FAILED'}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Response data:', data);
      }
    } catch (error) {
      console.error('❌ Minimal headers failed:', error);
    }
  }
}

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).connectionTest = () => ConnectionDiagnostic.runConnectionTest();
  (window as any).quickFixes = () => ConnectionDiagnostic.tryQuickFixes();
}
