#!/usr/bin/env node

/**
 * Script to update all imports to use @/ path aliases and reflect new structure
 */

const fs = require('fs');
const path = require('path');

// Mapping of old paths to new paths
const PATH_MAPPINGS = {
  // Components -> Domains
  './components/CreateGame': '@/domains/games/components/CreateGame',
  './components/GameDetails': '@/domains/games/components/GameDetails',
  './components/UnifiedGameCard': '@/domains/games/components/UnifiedGameCard',
  './components/GameChat': '@/domains/games/components/GameChat',
  './components/EnhancedGameChat': '@/domains/games/components/EnhancedGameChat',
  './components/HomeScreen': '@/domains/games/components/HomeScreen',
  './components/SearchDiscovery': '@/domains/games/components/SearchDiscovery',
  './components/WeatherWidget': '@/domains/weather/components/WeatherWidget',
  './components/MapView': '@/domains/locations/components/MapView',
  './components/UserProfile': '@/domains/users/components/UserProfile',
  './components/Onboarding': '@/domains/users/components/Onboarding',
  './components/Settings': '@/domains/users/components/Settings',
  
  // Components -> Shared
  './components/ErrorBoundary': '@/shared/components/common/ErrorBoundary',
  './components/BottomNavigation': '@/shared/components/layout/BottomNavigation',
  './components/ui/button': '@/shared/components/ui/button',
  
  // Components -> Core
  './components/Auth': '@/core/auth/Auth',
  './components/AppRouter': '@/core/routing/AppRouter',
  './providers/AuthProvider': '@/core/auth/AuthProvider',
  './providers/QueryProvider': '@/core/auth/QueryProvider',
  
  // Hooks
  './hooks/useGameActions': '@/domains/games/hooks/useGameActions',
  './hooks/useGames': '@/domains/games/hooks/useGames',
  './hooks/useLocation': '@/domains/locations/hooks/useLocation',
  './hooks/useUserProfile': '@/domains/users/hooks/useUserProfile',
  './hooks/useDebounce': '@/shared/hooks/useDebounce',
  
  // Lib -> Database
  './lib/supabase': '@/core/database/supabase',
  './lib/database.types': '@/core/database/database.types',
  './lib/supabaseService': '@/core/database/supabaseService',
  
  // Lib -> Services
  './lib/weatherService': '@/domains/weather/services/weatherService',
  './lib/gameParticipantService': '@/domains/games/services/gameParticipantService',
  './lib/profileService': '@/domains/users/services/profileService',
  './lib/locationCache': '@/domains/locations/services/locationCache',
  
  // Lib -> Config
  './lib/envUtils': '@/core/config/envUtils',
  './lib/envConfig': '@/core/config/envConfig',
  
  // Lib -> Utils
  './lib/utils': '@/shared/utils/utils',
  './lib/dateUtils': '@/shared/utils/dateUtils',
  './utils': '@/shared/utils',
};

function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Update each mapped path
    for (const [oldPath, newPath] of Object.entries(PATH_MAPPINGS)) {
      // Match various import formats
      const patterns = [
        new RegExp(`from ['"]${escapeRegex(oldPath)}['"]`, 'g'),
        new RegExp(`from ['"]${escapeRegex(oldPath)}\\.tsx?['"]`, 'g'),
        new RegExp(`import\\(['"]${escapeRegex(oldPath)}['"]\\)`, 'g'),
        new RegExp(`import\\(['"]${escapeRegex(oldPath)}\\.tsx?['"]\\)`, 'g'),
      ];
      
      patterns.forEach(pattern => {
        if (pattern.test(content)) {
          content = content.replace(pattern, match => {
            updated = true;
            return match.replace(oldPath, newPath).replace(/\.tsx?['"]/, '\'');
          });
        }
      });
    }
    
    // Update relative paths (../../) to use @/ when possible
    const relativeImportRegex = /from ['"](\.\.\/)+([^'"]+)['"]/g;
    content = content.replace(relativeImportRegex, (match, dots, importPath) => {
      // Skip if already using @/
      if (importPath.startsWith('@/')) return match;
      
      // Try to determine the absolute path
      const fromDir = path.dirname(filePath);
      const absolutePath = path.resolve(fromDir, dots + importPath);
      const srcPath = absolutePath.replace(path.join(__dirname, 'src'), '');
      
      // Convert to @/ path if within src/
      if (srcPath && srcPath !== absolutePath) {
        updated = true;
        return match.replace(`${dots}${importPath}`, `@${srcPath}`);
      }
      
      return match;
    });
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        findTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main execution
console.log('🚀 Starting import path migration...\n');

const srcDir = path.join(__dirname, 'src');
const tsFiles = findTsFiles(srcDir);

console.log(`Found ${tsFiles.length} TypeScript files\n`);

let updatedCount = 0;
tsFiles.forEach(file => {
  if (updateImportsInFile(file)) {
    updatedCount++;
  }
});

console.log(`\n✅ Migration complete! Updated ${updatedCount} files.`);

