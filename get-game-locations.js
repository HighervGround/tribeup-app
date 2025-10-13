// Quick script to get actual game locations from your database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alegufnopsminqcokelr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsZWd1Zm5vcHNtaW5xY29rZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzUwMjIsImV4cCI6MjA3MTgxMTAyMn0.YgwFtX87MiSXA83DN2um0WP-1uYU6qsPXhwGmIWjadQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getGameLocations() {
  console.log('🎯 Getting actual game locations from your database...');
  
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select('location, latitude, longitude')
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching games:', error);
      return;
    }
    
    if (!games || games.length === 0) {
      console.log('📭 No games found in database');
      return;
    }
    
    console.log('📍 Found game locations:');
    games.forEach((game, index) => {
      console.log(`${index + 1}. Location: "${game.location}"`);
      if (game.latitude && game.longitude) {
        console.log(`   Coordinates: ${game.latitude}, ${game.longitude}`);
      }
      
      // Extract zipcode if present
      const zipcodeMatch = game.location?.match(/\b\d{5}(-\d{4})?\b/);
      if (zipcodeMatch) {
        console.log(`   Zipcode: ${zipcodeMatch[0]}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

getGameLocations();
