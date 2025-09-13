import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { 
  ArrowLeft, 
  Bell, 
  Shield, 
  MapPin, 
  Palette, 
  Globe, 
  HelpCircle, 
  MessageSquare, 
  LogOut,
  ChevronRight,
  User,
  Lock,
  Eye,
  EyeOff,
  Accessibility,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../providers/AuthProvider';
import { toast } from 'sonner';

export function Settings() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, effectiveTheme, toggleTheme, setTheme } = useTheme();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [gameReminders, setGameReminders] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState('public');

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const settingsSections = [
    {
      title: 'Account',
      icon: User,
      items: [
        { label: 'Edit Profile', action: () => navigate('/profile/edit') },
        { label: 'Change Email', action: () => console.log('Change email') },
        { label: 'Change Password', action: () => console.log('Change password') },
        { label: 'Delete Account', action: () => console.log('Delete account'), danger: true },
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { 
          label: 'Push Notifications', 
          action: () => navigate('/settings/notifications'),
          description: 'Manage push notifications and browser permissions'
        },
      ]
    },
    {
      title: 'Accessibility',
      icon: Accessibility,
      items: [
        { 
          label: 'Accessibility Settings', 
          action: () => navigate('/settings/accessibility'),
          description: 'High contrast, large text, and more'
        },
      ]
    },
    {
      title: 'Help & Support',
      icon: HelpCircle,
      items: [
        { label: 'FAQ', action: () => console.log('FAQ') },
        { label: 'Contact Support', action: () => console.log('Contact support') },
        { label: 'Report a Bug', action: () => console.log('Report bug') },
        { label: 'Terms of Service', action: () => navigate('/legal/terms') },
        { label: 'Privacy Policy', action: () => navigate('/legal/privacy') },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Receive notifications on your device
                </div>
              </div>
              <Switch 
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
                aria-label="Toggle push notifications"
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Receive updates via email
                </div>
              </div>
              <Switch 
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                aria-label="Toggle email notifications"
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Game Reminders</div>
                <div className="text-sm text-muted-foreground">
                  Get reminded about upcoming games
                </div>
              </div>
              <Switch 
                checked={gameReminders}
                onCheckedChange={setGameReminders}
                aria-label="Toggle game reminders"
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">New Messages</div>
                <div className="text-sm text-muted-foreground">
                  Notifications for chat messages
                </div>
              </div>
              <Switch 
                checked={messageNotifications}
                onCheckedChange={setMessageNotifications}
                aria-label="Toggle message notifications"
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Location Sharing</div>
                <div className="text-sm text-muted-foreground">
                  Share your location to find nearby games
                </div>
              </div>
              <Switch 
                checked={locationSharing}
                onCheckedChange={setLocationSharing}
                aria-label="Toggle location sharing"
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="font-medium">Profile Visibility</div>
              <div className="text-sm text-muted-foreground mb-3">
                Who can see your profile and game history
              </div>
              <Select value={profileVisibility} onValueChange={setProfileVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Everyone</SelectItem>
                  <SelectItem value="players">Players Only - Game participants</SelectItem>
                  <SelectItem value="private">Private - No one</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="font-medium">Theme</div>
              <div className="text-sm text-muted-foreground">
                Choose your preferred theme
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center gap-2 p-3 border rounded-lg transition-colors ${
                    theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  <span className="text-xs">Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center gap-2 p-3 border rounded-lg transition-colors ${
                    theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  <span className="text-xs">Dark</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center gap-2 p-3 border rounded-lg transition-colors ${
                    theme === 'system' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                  }`}
                >
                  <Monitor className="w-5 h-5" />
                  <span className="text-xs">System</span>
                </button>
              </div>
              {theme === 'system' && (
                <div className="text-xs text-muted-foreground">
                  Currently using {effectiveTheme} theme based on system preferences
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="font-medium">Distance Unit</div>
              <div className="text-sm text-muted-foreground mb-3">
                How distances are displayed
              </div>
              <Select defaultValue="miles">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="miles">Miles</SelectItem>
                  <SelectItem value="kilometers">Kilometers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="font-medium">Language</div>
              <div className="text-sm text-muted-foreground mb-3">
                App display language
              </div>
              <Select defaultValue="english">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Account & Support Sections */}
        {settingsSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="w-5 h-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {section.items.map((item, index) => (
                  <div key={index}>
                    <button
                      onClick={item.action}
                      className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        item.danger ? 'text-destructive hover:bg-destructive/10' : ''
                      }`}
                      aria-label={item.label}
                    >
                      <div className="text-left">
                        <span className="font-medium">{item.label}</span>
                        {item.description && (
                          <div className="text-sm text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {index < section.items.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Your data is stored securely and never shared with third parties without your consent.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                Export Data
              </Button>
              <Button variant="outline" className="flex-1">
                Clear Cache
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Developer Tools */}
        {process.env.NODE_ENV === 'development' && (
          <Card>
            <CardHeader>
              <CardTitle>Developer Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/navigation-test')}
              >
                Navigation Test
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sign Out */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* App Version */}
        <div className="text-center text-sm text-muted-foreground">
          TribeUp v1.0.0
        </div>
      </div>
    </div>
  );
}

export default Settings;