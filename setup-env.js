#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 TribeUp Supabase Environment Setup');
console.log('=====================================\n');

const projectId = 'alegufnopsminqcokelr';
const supabaseUrl = `https://${projectId}.supabase.co`;

console.log(`📋 Your Supabase Project Details:`);
console.log(`   Project ID: ${projectId}`);
console.log(`   Project URL: ${supabaseUrl}`);
console.log(`\n🔑 Next Steps:`);
console.log(`1. Go to: https://supabase.com/dashboard/project/${projectId}/settings/api`);
console.log(`2. Copy the "anon public" key`);
console.log(`3. Add it to your .env file\n`);

const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Replace 'your_anon_key_here' with the actual anon key from your Supabase dashboard

# Analytics & Monitoring (Optional)
# Get your PostHog API key from: https://app.posthog.com/project/settings
VITE_POSTHOG_API_KEY=your_posthog_api_key_here
VITE_POSTHOG_HOST=https://app.posthog.com
`;

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists. Please update it manually with:');
  console.log(`   VITE_SUPABASE_URL=${supabaseUrl}`);
  console.log('   VITE_SUPABASE_ANON_KEY=your_actual_anon_key');
} else {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with project URL');
  console.log('📝 Please update VITE_SUPABASE_ANON_KEY with your actual anon key');
}

console.log('\n🎯 After updating the .env file, run:');
console.log('   npm run dev');
console.log('\n🚀 Your TribeUp app will then connect to Supabase!');

