import React from 'react';
// import { motion } from 'framer-motion'; // TEMPORARILY DISABLED
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { LoadingSpinner } from './ui/loading-spinner';
import { 
  Bell, 
  BellOff, 
  Smartphone, 
  Mail, 
  MessageSquare, 
  Calendar,
  Users,
  Trophy,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useNotifications } from '../hooks/useNotifications';
import { toast } from 'sonner';

function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    canSubscribe,
    shouldRequestPermission,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification
  } = usePushNotifications();

  const {
    settings,
    updateSettings,
    requestPermission: requestNotificationPermission
  } = useNotifications();

  const getPermissionIcon = () => {
    switch (permission) {
      case 'granted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'denied':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getPermissionText = () => {
    switch (permission) {
      case 'granted':
        return 'Notifications enabled';
      case 'denied':
        return 'Notifications blocked';
      default:
        return 'Permission pending';
    }
  };

  const handleTogglePushNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else if (canSubscribe) {
      await subscribe();
    } else if (shouldRequestPermission) {
      await requestPermission();
    }
  };

  return (
    <div className="space-y-6">
      {/* Push Notifications Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported ? (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Push notifications are not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Permission Status */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getPermissionIcon()}
                  <div>
                    <div className="font-medium">{getPermissionText()}</div>
                    <div className="text-sm text-muted-foreground">
                      {permission === 'granted' && isSubscribed && 'You\'ll receive notifications for important updates'}
                      {permission === 'granted' && !isSubscribed && 'Click to enable push notifications'}
                      {permission === 'denied' && 'Enable notifications in your browser settings'}
                      {permission === 'default' && 'Click to enable notifications'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSubscribed && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                      Active
                    </Badge>
                  )}
                  <Switch
                    checked={isSubscribed}
                    onCheckedChange={handleTogglePushNotifications}
                    disabled={isLoading || (permission === 'denied')}
                  />
                </div>
              </div>

              {/* Error State */}
              {error && (
                <Alert variant="destructive">
                  <XCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Test Notification */}
              {isSubscribed && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Test Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Send a test notification to verify everything works
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={sendTestNotification}
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Send Test'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Notification Types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">New Messages</div>
                <div className="text-sm text-muted-foreground">
                  Get notified when someone sends you a message
                </div>
              </div>
            </div>
            <Switch
              checked={settings.messageNotifications}
              onCheckedChange={(checked) => updateSettings({ messageNotifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Game Reminders</div>
                <div className="text-sm text-muted-foreground">
                  Reminders before your games start
                </div>
              </div>
            </div>
            <Switch
              checked={settings.gameReminders}
              onCheckedChange={(checked) => updateSettings({ gameReminders: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Game Updates</div>
                <div className="text-sm text-muted-foreground">
                  When someone joins or leaves your games
                </div>
              </div>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => updateSettings({ pushNotifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Weekly summary and important updates
                </div>
              </div>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => updateSettings({ emailNotifications: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sound Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Sound & Vibration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Notification Sounds</div>
              <div className="text-sm text-muted-foreground">
                Play a sound when you receive notifications
              </div>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              updateSettings({
                pushNotifications: true,
                messageNotifications: true,
                gameReminders: true,
                soundEnabled: true
              });
              // Removed toast - settings change is visible in UI
            }}
          >
            <Bell className="w-4 h-4 mr-2" />
            Enable All Notifications
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              updateSettings({
                pushNotifications: false,
                messageNotifications: false,
                gameReminders: false,
                soundEnabled: false
              });
              // Removed toast - settings change is visible in UI
            }}
          >
            <BellOff className="w-4 h-4 mr-2" />
            Disable All Notifications
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              // Reset to defaults
              updateSettings({
                pushNotifications: true,
                emailNotifications: false,
                gameReminders: true,
                messageNotifications: true,
                soundEnabled: true
              });
              // Removed toast - settings change is visible in UI
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
        </CardContent>
      </Card>

      {/* Browser Instructions */}
      {permission === 'denied' && (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Notifications are blocked</div>
              <div className="text-sm">
                To enable notifications:
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Click the 🔒 icon in your browser's address bar</li>
                  <li>Select "Notifications" and choose "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default NotificationSettings;