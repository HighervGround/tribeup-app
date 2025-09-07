import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { 
  ArrowLeft,
  Eye,
  Type,
  Contrast,
  Volume2,
  Zap,
  MousePointer,
  Users,
  Palette,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';

interface AccessibilityPreferences {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  colorBlindFriendly: boolean;
  screenReader: boolean;
  focusIndicators: boolean;
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'normal' | 'large' | 'extra-large';
  contrastLevel: 'normal' | 'high' | 'maximum';
}

const defaultPreferences: AccessibilityPreferences = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  colorBlindFriendly: false,
  screenReader: false,
  focusIndicators: true,
  theme: 'auto',
  fontSize: 'normal',
  contrastLevel: 'normal',
};

export function AccessibilitySettings() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load saved preferences from localStorage
    const saved = localStorage.getItem('accessibility-preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error('Failed to load accessibility preferences:', error);
      }
    }

    // Detect system preferences
    const detectSystemPreferences = () => {
      const updates: Partial<AccessibilityPreferences> = {};
      
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        updates.reducedMotion = true;
      }
      
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        updates.highContrast = true;
        updates.contrastLevel = 'high';
      }
      
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        updates.theme = 'dark';
      }

      if (Object.keys(updates).length > 0) {
        setPreferences(prev => ({ ...prev, ...updates }));
      }
    };

    detectSystemPreferences();
  }, []);

  const updatePreference = <K extends keyof AccessibilityPreferences>(
    key: K, 
    value: AccessibilityPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const applyPreferences = () => {
    const root = document.documentElement;
    
    // Apply theme
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (preferences.theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      // Auto - follow system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      root.classList.toggle('light', !prefersDark);
    }

    // Apply high contrast
    root.classList.toggle('high-contrast', preferences.highContrast);
    
    // Apply large text
    root.classList.toggle('large-text', preferences.largeText);
    
    // Apply colorblind friendly colors
    root.classList.toggle('colorblind-friendly', preferences.colorBlindFriendly);
    
    // Apply reduced motion
    if (preferences.reducedMotion) {
      root.style.setProperty('--duration-fast', '0ms');
      root.style.setProperty('--duration-normal', '0ms');
      root.style.setProperty('--duration-slow', '0ms');
    } else {
      root.style.removeProperty('--duration-fast');
      root.style.removeProperty('--duration-normal');
      root.style.removeProperty('--duration-slow');
    }

    // Save to localStorage
    localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
    
    toast.success('Accessibility settings applied', {
      description: 'Your preferences have been saved',
    });
    
    setHasChanges(false);
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
    setHasChanges(true);
    toast('Settings reset to defaults', {
      description: 'Click Apply to save changes',
    });
  };

  const preferenceSections = [
    {
      title: 'Visual Accessibility',
      icon: Eye,
      items: [
        {
          key: 'highContrast' as const,
          label: 'High Contrast Mode',
          description: 'Increases contrast for better visibility',
          type: 'switch' as const,
        },
        {
          key: 'largeText' as const,
          label: 'Large Text',
          description: 'Increases text size throughout the app',
          type: 'switch' as const,
        },
        {
          key: 'colorBlindFriendly' as const,
          label: 'Color Blind Friendly',
          description: 'Uses alternative color schemes for better distinction',
          type: 'switch' as const,
        },
        {
          key: 'theme' as const,
          label: 'Theme',
          description: 'Choose your preferred color theme',
          type: 'select' as const,
          options: [
            { value: 'auto', label: 'Auto (System)', icon: Monitor },
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
          ],
        },
      ],
    },
    {
      title: 'Motion & Animation',
      icon: Zap,
      items: [
        {
          key: 'reducedMotion' as const,
          label: 'Reduce Motion',
          description: 'Reduces animations and transitions',
          type: 'switch' as const,
        },
      ],
    },
    {
      title: 'Navigation & Interaction',
      icon: MousePointer,
      items: [
        {
          key: 'keyboardNavigation' as const,
          label: 'Enhanced Keyboard Navigation',
          description: 'Improved keyboard shortcuts and navigation',
          type: 'switch' as const,
        },
        {
          key: 'focusIndicators' as const,
          label: 'Enhanced Focus Indicators',
          description: 'More visible focus outlines',
          type: 'switch' as const,
        },
        {
          key: 'screenReader' as const,
          label: 'Screen Reader Optimizations',
          description: 'Enhanced compatibility with screen readers',
          type: 'switch' as const,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10"
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Accessibility</h1>
              <p className="text-sm text-muted-foreground">
                Customize your experience
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="secondary" className="animate-pulse-once">
                Changes pending
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={applyPreferences}
              disabled={!hasChanges}
            >
              Apply Changes
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8 max-w-4xl mx-auto">
        {/* Quick Preview */}
        <div>
          <Card className={`${preferences.highContrast ? 'border-2 border-foreground' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Sample Game Card</h4>
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-sport-basketball rounded-full" />
                      <div>
                        <div className="font-medium">Basketball Game</div>
                        <div className="text-sm text-muted-foreground">Today 6:00 PM</div>
                      </div>
                    </div>
                    <Button size="sm" className="w-full">Join Game</Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Text Sizes</h4>
                  <div className="space-y-1">
                    <div className="text-sm">Small text example</div>
                    <div className="text-base">Normal text example</div>
                    <div className="text-lg">Large text example</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Color Contrast</h4>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 bg-primary rounded" />
                      <div className="w-6 h-6 bg-secondary rounded" />
                      <div className="w-6 h-6 bg-success rounded" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Sport color indicators
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Sections */}
        {preferenceSections.map((section, sectionIndex) => (
          <div
            key={section.title}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="w-5 h-5" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {section.items.map((item, itemIndex) => (
                  <div key={item.key}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {item.type === 'switch' ? (
                          <Switch
                            checked={preferences[item.key] as boolean}
                            onCheckedChange={(checked) => updatePreference(item.key, checked)}
                            aria-label={item.label}
                          />
                        ) : item.type === 'select' && item.options ? (
                          <Select
                            value={preferences[item.key] as string}
                            onValueChange={(value) => updatePreference(item.key, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {item.options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    {option.icon && <option.icon className="w-4 h-4" />}
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : null}
                      </div>
                    </div>
                    {itemIndex < section.items.length - 1 && <Separator className="mt-6" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}

        {/* System Detection */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>System Preferences Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {[
                  {
                    label: 'Prefers Reduced Motion',
                    detected: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
                    applied: preferences.reducedMotion,
                  },
                  {
                    label: 'Prefers High Contrast',
                    detected: window.matchMedia('(prefers-contrast: high)').matches,
                    applied: preferences.highContrast,
                  },
                  {
                    label: 'Prefers Dark Mode',
                    detected: window.matchMedia('(prefers-color-scheme: dark)').matches,
                    applied: preferences.theme === 'dark',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.detected ? 'default' : 'outline'}>
                        {item.detected ? 'Detected' : 'Not detected'}
                      </Badge>
                      <Badge variant={item.applied ? 'secondary' : 'outline'}>
                        {item.applied ? 'Applied' : 'Not applied'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  TribeUp is committed to providing an accessible experience for all users. 
                  If you encounter any accessibility issues or have suggestions for improvement, 
                  please let us know.
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm">
                    Contact Support
                  </Button>
                  <Button variant="outline" size="sm">
                    Accessibility Guide
                  </Button>
                  <Button variant="outline" size="sm">
                    Keyboard Shortcuts
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AccessibilitySettings;