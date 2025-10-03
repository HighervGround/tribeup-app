import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { useAppStore } from '../store/appStore';

export function AuthFallback() {
  const { setUser } = useAppStore();

  const createMockUser = () => {
    const mockUser = {
      id: 'mock-user-123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      avatar: '',
      role: 'user' as const,
      preferences: {
        theme: 'auto' as const,
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        colorBlindFriendly: false,
        notifications: {
          push: true,
          email: false,
          gameReminders: true,
        },
        privacy: {
          locationSharing: true,
          profileVisibility: 'public' as const,
        },
        sports: []
      }
    };
    
    setUser(mockUser);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connection Issue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Unable to connect to Supabase. This might be due to:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Network connectivity issues</li>
                <li>Supabase project might be paused</li>
                <li>DNS resolution problems</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              For testing purposes, you can continue with a mock user:
            </p>
            <Button onClick={createMockUser} className="w-full">
              Continue with Test User
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p><strong>Supabase URL:</strong> alegufnopsminqcokelr.supabase.co</p>
            <p><strong>Status:</strong> Connection failed</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
