// Script to create test users for development
import { SupabaseService } from './src/lib/supabaseService.js';

const testUsers = [
  {
    id: '6e9f3e18-0005-4080-a62a-2a298cf52199',
    full_name: 'Alex Johnson',
    username: 'alexj',
    email: 'alex.johnson@example.com',
    bio: 'Love playing basketball and tennis!',
    location: 'San Francisco, CA'
  },
  {
    full_name: 'Sarah Chen',
    username: 'sarahc',
    email: 'sarah.chen@example.com',
    bio: 'Soccer enthusiast and runner',
    location: 'Los Angeles, CA'
  },
  {
    full_name: 'Mike Rodriguez',
    username: 'mikerod',
    email: 'mike.rodriguez@example.com',
    bio: 'Baseball coach and fitness trainer',
    location: 'Austin, TX'
  },
  {
    full_name: 'Emma Wilson',
    username: 'emmaw',
    email: 'emma.wilson@example.com',
    bio: 'Volleyball player and yoga instructor',
    location: 'Seattle, WA'
  },
  {
    full_name: 'David Kim',
    username: 'davidk',
    email: 'david.kim@example.com',
    bio: 'Tennis player and swimming coach',
    location: 'Miami, FL'
  }
];

async function createTestUsers() {
  console.log('🚀 Creating test users...');
  
  for (const userData of testUsers) {
    try {
      const user = await SupabaseService.createTestUser(userData);
      console.log(`✅ Created user: ${user.full_name} (${user.username})`);
    } catch (error) {
      console.error(`❌ Failed to create user ${userData.full_name}:`, error.message);
    }
  }
  
  console.log('🎉 Test user creation completed!');
}

// Run the script
createTestUsers().catch(console.error);
