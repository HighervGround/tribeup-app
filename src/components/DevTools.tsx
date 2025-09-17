import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { 
  User, 
  Settings, 
  Database, 
  RefreshCw, 
  UserPlus, 
  Crown,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { SupabaseService } from '../lib/supabaseService';
import { useAppStore } from '../store/appStore';
import { supabase } from '../lib/supabase';

interface DevUser {
  id: string;
  name?: string;
  full_name?: string;
  username: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  avatar?: string;
}

// Test data generators
const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn',
  'Blake', 'Cameron', 'Drew', 'Emery', 'Finley', 'Harper', 'Hayden', 'Jamie',
  'Kendall', 'Logan', 'Parker', 'Reese', 'Sage', 'Skyler', 'Tatum', 'River'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White'
];

const LOCATIONS = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
  'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
  'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC',
  'San Francisco, CA', 'Indianapolis, IN', 'Seattle, WA', 'Denver, CO', 'Boston, MA'
];

const BIOS = [
  'Love playing sports and meeting new people!',
  'Always up for a good game and some friendly competition.',
  'Sports enthusiast looking to stay active and have fun.',
  'Passionate about fitness and building community through sports.',
  'Weekend warrior seeking new challenges and teammates.',
  'Just moved to the area and looking to join some games!',
  'Former college athlete staying active in the community.',
  'Casual player who enjoys the social aspect of sports.',
  'Competitive but fair - let\'s play some great games!',
  'New to the sport but eager to learn and improve.'
];

const generateRandomUser = () => {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const fullName = `${firstName} ${lastName}`;
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 99) + 1}`;
  const email = `${username}@testuser.com`;
  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const bio = BIOS[Math.floor(Math.random() * BIOS.length)];
  
  return {
    name: fullName,
    username,
    email,
    location,
    bio
  };
};

const DevTools: React.FC = () => {
  const { user, setUser } = useAppStore();
  const [isVisible, setIsVisible] = useState(false);
  const [devUsers, setDevUsers] = useState<DevUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    location: '',
    role: 'user' as 'user' | 'moderator' | 'admin'
  });

  // Load dev users on mount
  useEffect(() => {
    loadDevUsers();
  }, []);

  const loadDevUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, username, email, avatar_url')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Map data to include mock role since column doesn't exist yet
      const usersWithMockRoles = (data || []).map(user => ({
        ...user,
        role: user.id.startsWith('test_') ? 'user' : 'user' // Default to user role for now
      }));

      setDevUsers(usersWithMockRoles);
    } catch (error: any) {
      console.error('Failed to load dev users:', error);
      toast.error('Failed to load dev users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchToUser = async (devUser: DevUser) => {
    try {
      setLoading(true);
      
      // Sign out current user
      await supabase.auth.signOut();
      
      // Create a mock session for the dev user
      setUser({
        id: devUser.id,
        name: devUser.name || devUser.full_name || 'Unknown User',
        username: devUser.username,
        email: devUser.email,
        avatar: devUser.avatar || '',
        role: devUser.role,
        preferences: {
          theme: 'auto' as const,
          highContrast: false,
          largeText: false,
          reducedMotion: false,
          colorBlindFriendly: false,
          notifications: {
            email: true,
            push: true,
            gameReminders: true
          },
          privacy: {
            profileVisibility: 'public' as const,
            locationSharing: true
          }
        }
      });

      toast.success(`Switched to ${devUser.name}`, {
        description: `Role: ${devUser.role}`
      });
      
      // Refresh the page to ensure clean state
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Failed to switch user:', error);
      toast.error('Failed to switch user');
    } finally {
      setLoading(false);
    }
  };

  const createTestUser = async () => {
    if (!newUserForm.name || !newUserForm.username || !newUserForm.email) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      
      // Create mock user entry for development purposes
      const mockUserId = crypto.randomUUID();
      
      // Create user profile using RPC function to bypass RLS for development
      const { error: profileError } = await supabase.rpc('create_dev_user', {
        user_id: mockUserId,
        user_name: newUserForm.name,
        user_username: newUserForm.username,
        user_email: newUserForm.email,
        user_bio: newUserForm.bio || '',
        user_location: newUserForm.location || ''
      });

      if (profileError) throw profileError;

      toast.success(`Created mock test user: ${newUserForm.name}`, {
        description: 'Note: This is a development mock user without full auth'
      });
      setNewUserForm({ name: '', username: '', email: '', bio: '', location: '', role: 'user' });
      loadDevUsers();
    } catch (error: any) {
      console.error('Failed to create test user:', error);
      toast.error('Failed to create test user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateTestUser = () => {
    const randomUser = generateRandomUser();
    setNewUserForm({
      ...randomUser,
      role: 'user'
    });
  };

  const createBulkTestUsers = async (count: number = 5) => {
    try {
      setLoading(true);
      const createdUsers: string[] = [];
      
      for (let i = 0; i < count; i++) {
        const randomUser = generateRandomUser();
        const mockUserId = crypto.randomUUID();
        
        // Create user profile using RPC function to bypass RLS for development
        const { error: profileError } = await supabase.rpc('create_dev_user', {
          user_id: mockUserId,
          user_name: randomUser.name,
          user_username: randomUser.username,
          user_email: randomUser.email,
          user_bio: randomUser.bio,
          user_location: randomUser.location
        });

        if (profileError) {
          console.error('Profile error for user', randomUser.name, profileError);
          continue;
        }

        createdUsers.push(randomUser.name);
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.success(`Created ${createdUsers.length} mock test users`, {
        description: createdUsers.join(', ')
      });
      loadDevUsers();
    } catch (error: any) {
      console.error('Failed to create bulk test users:', error);
      toast.error('Failed to create test users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'moderator' | 'admin') => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Updated user role to ${newRole}`);
      loadDevUsers();
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const copyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    toast.success('User ID copied to clipboard');
  };

  const clearAllData = async () => {
    if (!confirm('⚠️ This will delete ALL games, participants, and messages. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      
      // Delete in correct order due to foreign key constraints
      await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('game_participants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('games').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      toast.success('All test data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
      toast.error('Failed to clear data');
    } finally {
      setLoading(false);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsVisible(!isVisible)}
          className="bg-background border-2 border-primary shadow-lg"
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
        </Button>
      </div>

      {/* Dev Tools Panel */}
      {isVisible && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Development Tools
                <Badge variant="secondary">DEV ONLY</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Current User */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Current User
                </h3>
                {user ? (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">@{user.username}</div>
                    </div>
                    <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'moderator' ? 'secondary' : 'outline'}>
                      {user.role === 'admin' && <Crown className="w-3 h-3 mr-1" />}
                      {user.role === 'moderator' && <Shield className="w-3 h-3 mr-1" />}
                      {user.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyUserId(user.id)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No user signed in</div>
                )}
              </div>

              <Separator />

              {/* User Switching */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Switch User
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadDevUsers}
                    disabled={loading}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {devUsers.map(devUser => (
                    <div key={devUser.id} className="flex items-center gap-2 p-2 border rounded-lg">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs">
                        {devUser.name?.charAt(0) || devUser.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{devUser.name || devUser.full_name || 'Unknown User'}</div>
                        <div className="text-xs text-muted-foreground truncate">@{devUser.username}</div>
                      </div>
                      <Select
                        value={devUser.role}
                        onValueChange={(role: 'user' | 'moderator' | 'admin') => updateUserRole(devUser.id, role)}
                      >
                        <SelectTrigger className="w-20 h-6 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Mod</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => switchToUser(devUser)}
                        disabled={loading}
                        className="h-6 px-2 text-xs"
                      >
                        Switch
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Create Test User */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Create Test User
                </h3>
                
                {/* Quick Actions */}
                <div className="flex gap-2 mb-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateTestUser}
                    disabled={loading}
                    className="flex-1"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Generate Random
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => createBulkTestUsers(5)}
                    disabled={loading}
                    className="flex-1"
                  >
                    Create 5 Users
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Input
                    placeholder="Full Name"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Username"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, username: e.target.value }))}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <Select
                    value={newUserForm.role}
                    onValueChange={(role: 'user' | 'moderator' | 'admin') => setNewUserForm(prev => ({ ...prev, role }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Location (optional)"
                    value={newUserForm.location}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, location: e.target.value }))}
                  />
                  <Input
                    placeholder="Bio (optional)"
                    value={newUserForm.bio}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
                <Button onClick={createTestUser} disabled={loading} className="w-full">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Test User
                </Button>
              </div>

              <Separator />

              {/* Danger Zone */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
                  <Trash2 className="w-4 h-4" />
                  Danger Zone
                </h3>
                <Button
                  variant="destructive"
                  onClick={clearAllData}
                  disabled={loading}
                  className="w-full"
                >
                  Clear All Test Data
                </Button>
              </div>

              {/* Close Button */}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsVisible(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default DevTools;
