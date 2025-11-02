import React from 'react';
import { CurrentUserAvatar } from '@/components/current-user-avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Example component showing different ways to use CurrentUserAvatar
 * This demonstrates the official Supabase current user avatar component
 * integrated with TribeUp's user system
 */
export function CurrentUserAvatarExample() {
  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Current User Avatar Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Different Sizes */}
          <div>
            <h3 className="text-sm font-medium mb-3">Different Sizes</h3>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <CurrentUserAvatar size="sm" />
                <p className="text-xs text-muted-foreground mt-1">Small</p>
              </div>
              <div className="text-center">
                <CurrentUserAvatar size="md" />
                <p className="text-xs text-muted-foreground mt-1">Medium</p>
              </div>
              <div className="text-center">
                <CurrentUserAvatar size="lg" />
                <p className="text-xs text-muted-foreground mt-1">Large</p>
              </div>
            </div>
          </div>

          {/* With Online Indicator */}
          <div>
            <h3 className="text-sm font-medium mb-3">With Online Indicator</h3>
            <div className="flex items-center gap-4">
              <CurrentUserAvatar size="md" showOnlineIndicator />
              <CurrentUserAvatar size="lg" showOnlineIndicator />
            </div>
          </div>

          {/* Custom Styling */}
          <div>
            <h3 className="text-sm font-medium mb-3">Custom Styling</h3>
            <div className="flex items-center gap-4">
              <CurrentUserAvatar 
                size="lg" 
                className="ring-2 ring-primary ring-offset-2" 
              />
              <CurrentUserAvatar 
                size="lg" 
                className="border-2 border-dashed border-muted-foreground" 
              />
            </div>
          </div>

          {/* Usage in Navigation */}
          <div>
            <h3 className="text-sm font-medium mb-3">Navigation Usage</h3>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <CurrentUserAvatar size="sm" />
              <span className="text-sm">Profile</span>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
