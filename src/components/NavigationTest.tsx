import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Home, 
  Search, 
  Plus, 
  User, 
  Settings, 
  Bell, 
  Accessibility, 
  MessageSquare, 
  Gamepad2,
  ArrowLeft,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface NavRoute {
  path: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const routes: NavRoute[] = [
  { path: '/', label: 'Home', icon: Home, description: 'Main dashboard and activity feed' },
  { path: '/search', label: 'Search', icon: Search, description: 'Discover and search activities' },
  { path: '/create', label: 'Create Activity', icon: Plus, description: 'Create a new activity' },
  { path: '/profile', label: 'Profile', icon: User, description: 'User profile and stats' },
  { path: '/settings', label: 'Settings', icon: Settings, description: 'App settings and preferences' },
  { path: '/settings/notifications', label: 'Notifications', icon: Bell, description: 'Push notification settings' },
  { path: '/settings/accessibility', label: 'Accessibility', icon: Accessibility, description: 'Accessibility options' },
  { path: '/game/1', label: 'Activity Details', icon: Gamepad2, description: 'Sample activity details page' },
  { path: '/chat/game/1', label: 'Activity Chat', icon: MessageSquare, description: 'Activity chat interface' },
  { path: '/chat/direct/user1', label: 'Direct Chat', icon: MessageSquare, description: 'Direct message interface' },
];

function NavigationTest() {
  const navigate = useNavigate();
  const location = useLocation();
  const [testedRoutes, setTestedRoutes] = React.useState<Set<string>>(new Set());

  const handleNavigate = (path: string) => {
    navigate(path);
    setTestedRoutes(prev => new Set(prev).add(path));
  };

  const currentPath = location.pathname;
  const isTestRoute = currentPath === '/navigation-test';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl">Navigation Test</h1>
            <p className="text-sm text-muted-foreground">
              Test all app routes and navigation
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Current Route Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">Current Route</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm bg-muted p-3 rounded">
              {currentPath}
            </div>
            {!isTestRoute && (
              <div className="mt-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/navigation-test')}
                >
                  Back to Navigation Test
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {isTestRoute && (
          <>
            {/* Route Testing */}
            <Card>
              <CardHeader>
                <CardTitle>Route Testing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {routes.map((route) => {
                    const Icon = route.icon;
                    const isTested = testedRoutes.has(route.path);
                    const isCurrent = currentPath === route.path;
                    
                    return (
                      <div 
                        key={route.path}
                        className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                          isCurrent ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{route.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {route.description}
                            </div>
                            <div className="text-xs font-mono text-muted-foreground">
                              {route.path}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isTested && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {isCurrent ? (
                            <Badge variant="default" className="text-xs">
                              Current
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNavigate(route.path)}
                            >
                              Test
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Routes Tested</span>
                    <Badge variant="secondary">
                      {testedRoutes.size} / {routes.length}
                    </Badge>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(testedRoutes.size / routes.length) * 100}%` }}
                    />
                  </div>
                  
                  {testedRoutes.size === routes.length && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded">
                      <CheckCircle className="w-5 h-5" />
                      <span>All routes tested successfully!</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      routes.forEach((route, index) => {
                        setTimeout(() => {
                          handleNavigate(route.path);
                        }, index * 1000);
                      });
                    }}
                  >
                    Test All Routes
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTestedRoutes(new Set())}
                  >
                    Clear Results
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/')}
                  >
                    Go Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default NavigationTest;