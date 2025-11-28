import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Switch } from '@/shared/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Separator } from '@/shared/components/ui/separator';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
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
  Monitor,
  Settings as SettingsIcon,
  FileText,
  Scale
} from 'lucide-react';
import { useTheme } from '@/shared/hooks/useTheme';
import { useSimpleAuth } from '@/core/auth/SimpleAuthProvider';
import { useNotifications } from '@/domains/users/hooks/useNotifications';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';

function Settings() {
  const navigate = useNavigate();
  const { signOut } = useSimpleAuth();
  const { theme, effectiveTheme, toggleTheme, setTheme } = useTheme();
  const { user } = useAppStore();
  const { settings, updateSettings } = useNotifications();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent double-clicks
    
    setIsSigningOut(true);
    try {
      console.log('Initiating sign out...');
      await signOut();
      console.log('Sign out completed');
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and app preferences</p>
          </div>
        </div>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="font-medium mb-3">Theme</div>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="flex items-center gap-2"
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="flex items-center gap-2"
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('system')}
                    className="flex items-center gap-2"
                  >
                    <Monitor className="w-4 h-4" />
                    System
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Current: {effectiveTheme} mode
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings - Only Functional Ones */}
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
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => updateSettings({ pushNotifications: checked })}
                aria-label="Toggle push notifications"
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Game Reminders</div>
                <div className="text-sm text-muted-foreground">
                  Get notified before your games start
                </div>
              </div>
              <Switch 
                checked={settings.gameReminders}
                onCheckedChange={(checked) => updateSettings({ gameReminders: checked })}
                aria-label="Toggle game reminders"
              />
            </div>

            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Message Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Notifications for messages and updates
                </div>
              </div>
              <Switch 
                checked={settings.messageNotifications}
                onCheckedChange={(checked) => updateSettings({ messageNotifications: checked })}
                aria-label="Toggle message notifications"
              />
            </div>

            <Alert>
              <Bell className="h-4 w-4" />
              <AlertDescription>
                Note: Email notifications and some other features are coming soon.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate('/profile/edit')}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Edit Profile
              </div>
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate('/settings/notifications')}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notification Settings
              </div>
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate('/settings/accessibility')}
            >
              <div className="flex items-center gap-2">
                <Accessibility className="w-4 h-4" />
                Accessibility
              </div>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Legal Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Legal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/legal/terms">
              <Button
                variant="outline"
                className="w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Terms of Service
                </div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link to="/legal/privacy">
              <Button
                variant="outline"
                className="w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy Policy
                </div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="w-5 h-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Settings;
