#!/usr/bin/env node
/**
 * Environment Variables Verification Script
 * 
 * This script verifies that all required environment variables are set
 * before building or deploying the application.
 * 
 * Usage:
 *   node scripts/verify-env.js           # Check current environment
 *   node scripts/verify-env.js --strict  # Fail if recommended vars are missing
 * 
 * Exit codes:
 *   0 - All required variables are set
 *   1 - Required variables are missing
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
};

// Environment variable definitions
const envVars = {
  required: [
    {
      name: 'VITE_SUPABASE_URL',
      description: 'Supabase project URL',
      pattern: /^https:\/\/[a-z0-9]+\.supabase\.co$/,
      patternDescription: 'Must be a valid Supabase URL (https://xxx.supabase.co)',
    },
    {
      name: 'VITE_SUPABASE_ANON_KEY',
      description: 'Supabase anonymous/public key',
      minLength: 100,
    },
  ],
  recommended: [
    {
      name: 'VITE_APP_URL',
      description: 'Application URL for OAuth redirects',
      pattern: /^https?:\/\/.+$/,
      patternDescription: 'Must be a valid URL',
    },
    {
      name: 'VITE_GOOGLE_MAPS_API_KEY',
      description: 'Google Maps API key for map features',
      minLength: 30,
    },
    {
      name: 'VITE_GOOGLE_PLACES_API_KEY',
      description: 'Google Places API key for location search',
      minLength: 30,
    },
    {
      name: 'VITE_OPENWEATHER_API_KEY',
      description: 'OpenWeatherMap API key for weather features',
      minLength: 20,
    },
    {
      name: 'VITE_VAPID_PUBLIC_KEY',
      description: 'VAPID public key for push notifications',
      minLength: 50,
    },
  ],
  optional: [
    { name: 'VITE_APP_VERSION', description: 'Application version', default: '1.0.0' },
    { name: 'VITE_ENVIRONMENT', description: 'Environment name', default: 'development' },
    { name: 'VITE_ENABLE_MOCK_DATA', description: 'Enable mock data', default: 'false' },
    { name: 'VITE_WEATHER_TEMP_UNIT', description: 'Temperature unit', default: 'fahrenheit' },
    { name: 'VITE_WEATHER_UPDATE_INTERVAL', description: 'Weather update interval (seconds)', default: '3600' },
    { name: 'VITE_LOG_LEVEL', description: 'Logging level', default: 'info' },
    { name: 'VITE_WEATHERAPI_KEY', description: 'WeatherAPI.com key (alternative to OpenWeatherMap)', sensitive: true },
  ],
};

// Security checks
const securityChecks = [
  {
    name: 'No service role key exposed',
    check: () => {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      if (serviceKey) {
        return { pass: false, message: 'Service role key should NOT be in client-side environment variables' };
      }
      return { pass: true };
    },
  },
  {
    name: 'No private VAPID key exposed',
    check: () => {
      const privateKey = process.env.VAPID_PRIVATE_KEY || process.env.VITE_VAPID_PRIVATE_KEY;
      if (privateKey) {
        return { pass: false, message: 'VAPID private key should NOT be in client-side environment variables' };
      }
      return { pass: true };
    },
  },
  {
    name: 'Production environment configured',
    check: () => {
      const env = process.env.VITE_ENVIRONMENT || process.env.NODE_ENV;
      if (env === 'production') {
        const mockData = process.env.VITE_ENABLE_MOCK_DATA;
        if (mockData === 'true') {
          return { pass: false, message: 'Mock data should be disabled in production' };
        }
      }
      return { pass: true };
    },
  },
];

function loadEnvFile() {
  // Try to load .env file if not already in environment
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

// Placeholder patterns to detect unset values
const PLACEHOLDER_PATTERNS = [
  /^your_.*_here$/i,
  /^placeholder$/i,
  /^xxx+$/i,
  /^your-.*$/i,
  /^<.*>$/,
  /^TODO$/i,
];

function isPlaceholder(value) {
  if (!value) return true;
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(value.trim()));
}

function validateVar(varDef) {
  const value = process.env[varDef.name];
  
  if (!value || isPlaceholder(value)) {
    return { set: false };
  }
  
  const issues = [];
  
  if (varDef.pattern && !varDef.pattern.test(value)) {
    issues.push(varDef.patternDescription || 'Invalid format');
  }
  
  if (varDef.minLength && value.length < varDef.minLength) {
    issues.push(`Value seems too short (expected >= ${varDef.minLength} characters)`);
  }
  
  return { set: true, issues, value };
}

function printHeader(title) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

function printResult(name, description, result, isOptional = false) {
  const prefix = result.set 
    ? `${colors.green}✓${colors.reset}` 
    : isOptional 
      ? `${colors.dim}○${colors.reset}` 
      : `${colors.red}✗${colors.reset}`;
  
  const status = result.set 
    ? `${colors.green}SET${colors.reset}` 
    : isOptional 
      ? `${colors.dim}NOT SET (optional)${colors.reset}` 
      : `${colors.red}MISSING${colors.reset}`;
  
  console.log(`${prefix} ${name}`);
  console.log(`  ${colors.dim}${description}${colors.reset}`);
  console.log(`  Status: ${status}`);
  
  if (result.issues && result.issues.length > 0) {
    for (const issue of result.issues) {
      console.log(`  ${colors.yellow}⚠ ${issue}${colors.reset}`);
    }
  }
  console.log();
}

function main() {
  const strictMode = process.argv.includes('--strict');
  
  console.log(`\n${colors.blue}TribeUp Environment Variables Verification${colors.reset}`);
  console.log(`${colors.dim}Mode: ${strictMode ? 'Strict' : 'Normal'}${colors.reset}`);
  
  loadEnvFile();
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check required variables
  printHeader('Required Variables');
  for (const varDef of envVars.required) {
    const result = validateVar(varDef);
    printResult(varDef.name, varDef.description, result);
    if (!result.set) hasErrors = true;
  }
  
  // Check recommended variables
  printHeader('Recommended Variables');
  for (const varDef of envVars.recommended) {
    const result = validateVar(varDef);
    printResult(varDef.name, varDef.description, result, !strictMode);
    if (!result.set) {
      if (strictMode) hasErrors = true;
      else hasWarnings = true;
    }
  }
  
  // Check optional variables
  printHeader('Optional Variables');
  for (const varDef of envVars.optional) {
    const result = validateVar(varDef);
    // Only show defaults for non-sensitive variables
    const defaultInfo = (varDef.default && !varDef.sensitive) ? ` (default: ${varDef.default})` : '';
    printResult(varDef.name, varDef.description + defaultInfo, result, true);
  }
  
  // Security checks
  printHeader('Security Checks');
  for (const check of securityChecks) {
    const result = check.check();
    const prefix = result.pass 
      ? `${colors.green}✓${colors.reset}` 
      : `${colors.red}✗${colors.reset}`;
    console.log(`${prefix} ${check.name}`);
    if (!result.pass) {
      console.log(`  ${colors.red}${result.message}${colors.reset}`);
      hasErrors = true;
    }
    console.log();
  }
  
  // Summary
  printHeader('Summary');
  if (hasErrors) {
    console.log(`${colors.red}✗ Environment configuration has errors${colors.reset}`);
    console.log(`\nPlease set the missing required variables before deploying.`);
    console.log(`See .env.example for reference.\n`);
    process.exit(1);
  } else if (hasWarnings) {
    console.log(`${colors.yellow}⚠ Environment configuration is incomplete${colors.reset}`);
    console.log(`\nSome recommended features may not work without the missing variables.`);
    console.log(`See .env.example for reference.\n`);
    process.exit(0);
  } else {
    console.log(`${colors.green}✓ Environment configuration is complete${colors.reset}\n`);
    process.exit(0);
  }
}

main();
