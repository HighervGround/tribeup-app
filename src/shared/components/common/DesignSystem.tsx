import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Switch } from '@/shared/components/ui/switch';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Progress } from '@/shared/components/ui/progress';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Separator } from '@/shared/components/ui/separator';
import { 
  ArrowLeft, 
  Home, 
  Plus, 
  User, 
  Calendar, 
  MapPin, 
  Users, 
  Settings,
  Trophy,
  Star,
  Heart,
  Bell,
  Search,
  Filter,
  Download,
  Share,
  Edit,
  Trash,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info
} from 'lucide-react';

interface DesignSystemProps {
  onBack: () => void;
}

const sportColors = [
  { name: 'Basketball', color: 'bg-sport-basketball', icon: '🏀' },
  { name: 'Soccer', color: 'bg-sport-soccer', icon: '⚽' },
  { name: 'Tennis', color: 'bg-sport-tennis', icon: '🎾' },
  { name: 'Volleyball', color: 'bg-sport-volleyball', icon: '🏐' },
  { name: 'Football', color: 'bg-sport-football', icon: '🏈' },
  { name: 'Baseball', color: 'bg-sport-baseball', icon: '⚾' },
];

const brandColors = [
  { name: 'Core Orange', hex: '#FA4616', usage: 'Primary brand color, CTAs' },
  { name: 'Core Blue', hex: '#0021A5', usage: 'Secondary color, text' },
  { name: 'Bottlebrush', hex: '#D32737', usage: 'Error states, alerts' },
  { name: 'Alachua', hex: '#F2A900', usage: 'Warning states, highlights' },
  { name: 'Gator', hex: '#22884C', usage: 'Success states, confirmation' },
  { name: 'Dark Blue', hex: '#002657', usage: 'Dark text, headers' },
  { name: 'Perennial', hex: '#6A2A60', usage: 'Accent color, premium' },
];

function DesignSystem({ onBack }: DesignSystemProps) {
  const [darkMode, setDarkMode] = useState(false);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">TribeUp Design System</h1>
              <p className="text-sm text-muted-foreground">University of Florida Brand</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Dark Mode</span>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-6xl mx-auto">
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="icons">Icons</TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-8">
            {/* Brand Colors */}
            <Card>
              <CardHeader>
                <CardTitle>University of Florida Brand Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {brandColors.map((color) => (
                    <div key={color.name} className="space-y-2">
                      <div 
                        className="w-full h-20 rounded-lg shadow-subtle"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div>
                        <div className="font-medium">{color.name}</div>
                        <div className="text-sm text-muted-foreground">{color.hex}</div>
                        <div className="text-xs text-muted-foreground">{color.usage}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sport Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Sport Color System</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {sportColors.map((sport) => (
                    <div key={sport.name} className="text-center">
                      <div className={`w-full h-16 rounded-lg ${sport.color} flex items-center justify-center text-2xl shadow-subtle`}>
                        {sport.icon}
                      </div>
                      <div className="mt-2 text-sm font-medium">{sport.name}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Semantic Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Semantic Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-primary rounded-lg shadow-subtle"></div>
                    <div className="text-sm font-medium">Primary</div>
                    <div className="text-xs text-muted-foreground">Core Orange</div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-secondary rounded-lg shadow-subtle"></div>
                    <div className="text-sm font-medium">Secondary</div>
                    <div className="text-xs text-muted-foreground">Core Blue</div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-destructive rounded-lg shadow-subtle"></div>
                    <div className="text-sm font-medium">Destructive</div>
                    <div className="text-xs text-muted-foreground">Bottlebrush</div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-success rounded-lg shadow-subtle"></div>
                    <div className="text-sm font-medium">Success</div>
                    <div className="text-xs text-muted-foreground">Gator</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Typography Scale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h1>Heading 1 - Display Large</h1>
                  <p className="text-sm text-muted-foreground">2rem, medium weight, -0.025em tracking</p>
                </div>
                <div>
                  <h2>Heading 2 - Display Medium</h2>
                  <p className="text-sm text-muted-foreground">1.5rem, medium weight, -0.025em tracking</p>
                </div>
                <div>
                  <h3>Heading 3 - Display Small</h3>
                  <p className="text-sm text-muted-foreground">1.25rem, medium weight</p>
                </div>
                <div>
                  <h4>Heading 4 - Title Large</h4>
                  <p className="text-sm text-muted-foreground">1.125rem, medium weight</p>
                </div>
                <div>
                  <h5>Heading 5 - Title Medium</h5>
                  <p className="text-sm text-muted-foreground">1rem, medium weight</p>
                </div>
                <div>
                  <h6>Heading 6 - Title Small</h6>
                  <p className="text-sm text-muted-foreground">0.875rem, medium weight</p>
                </div>
                <div>
                  <p>Body Text - Regular paragraph text with good readability</p>
                  <p className="text-sm text-muted-foreground">1rem, normal weight, 1.6 line height</p>
                </div>
                <div>
                  <label>Label Text - Form labels and captions</label>
                  <p className="text-sm text-muted-foreground">0.875rem, medium weight</p>
                </div>
                <div>
                  <div className="text-caption">Caption Text - Small descriptive text</div>
                  <p className="text-sm text-muted-foreground">0.75rem, normal weight</p>
                </div>
                <div>
                  <div className="text-overline">OVERLINE TEXT</div>
                  <p className="text-sm text-muted-foreground">0.75rem, medium weight, uppercase, 0.1em tracking</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Buttons Tab */}
          <TabsContent value="buttons" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Button Variants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-3">Primary Buttons</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button size="sm">Small</Button>
                      <Button>Default</Button>
                      <Button size="lg">Large</Button>
                      <Button disabled>Disabled</Button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="mb-3">Secondary Buttons</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="secondary" size="sm">Small</Button>
                      <Button variant="secondary">Default</Button>
                      <Button variant="secondary" size="lg">Large</Button>
                      <Button variant="secondary" disabled>Disabled</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3">Outline Buttons</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" size="sm">Small</Button>
                      <Button variant="outline">Default</Button>
                      <Button variant="outline" size="lg">Large</Button>
                      <Button variant="outline" disabled>Disabled</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3">Ghost Buttons</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="ghost" size="sm">Small</Button>
                      <Button variant="ghost">Default</Button>
                      <Button variant="ghost" size="lg">Large</Button>
                      <Button variant="ghost" disabled>Disabled</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3">Destructive Buttons</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="destructive" size="sm">Small</Button>
                      <Button variant="destructive">Default</Button>
                      <Button variant="destructive" size="lg">Large</Button>
                      <Button variant="destructive" disabled>Disabled</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3">Icon Buttons</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button size="icon"><Home className="w-4 h-4" /></Button>
                      <Button variant="outline" size="icon"><Plus className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon"><User className="w-4 h-4" /></Button>
                      <Button variant="destructive" size="icon"><Trash className="w-4 h-4" /></Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3">Buttons with Icons</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button><Plus className="w-4 h-4 mr-2" />Add Game</Button>
                      <Button variant="outline"><Download className="w-4 h-4 mr-2" />Download</Button>
                      <Button variant="secondary"><Share className="w-4 h-4 mr-2" />Share</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-8">
            {/* Input Components */}
            <Card>
              <CardHeader>
                <CardTitle>Input Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label>Default Input</label>
                    <Input placeholder="Enter text..." />
                  </div>
                  <div className="space-y-2">
                    <label>Disabled Input</label>
                    <Input placeholder="Disabled" disabled />
                  </div>
                  <div className="space-y-2">
                    <label>Date Input</label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <label>Time Input</label>
                    <Input type="time" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Badges & Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-3">Badge Variants</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge>Default</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="outline">Outline</Badge>
                      <Badge variant="destructive">Destructive</Badge>
                      <Badge variant="orange">Orange</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="mb-3">Badge Sizes</h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge size="sm">Small</Badge>
                      <Badge size="default">Default</Badge>
                      <Badge size="lg">Large</Badge>
                      <Badge size="icon" variant="secondary" aria-label="Notifications">
                        <Bell className="size-4" />
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="mb-3">Sport Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {sportColors.map((sport) => (
                        <Badge key={sport.name} className={`${sport.color} text-white border-none`}>
                          {sport.icon} {sport.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="mb-3">Status Badges</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-success text-success-foreground">Available</Badge>
                      <Badge className="bg-warning text-warning-foreground">Almost Full</Badge>
                      <Badge className="bg-destructive text-destructive-foreground">Full</Badge>
                      <Badge className="bg-muted text-muted-foreground">Cancelled</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Alerts & Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Information</AlertTitle>
                  <AlertDescription>
                    This is a general information alert for user notifications.
                  </AlertDescription>
                </Alert>
                
                <Alert className="border-success text-success-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Your game has been successfully created and published.
                  </AlertDescription>
                </Alert>
                
                <Alert className="border-warning text-warning-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    This game is almost at capacity. Join now to secure your spot.
                  </AlertDescription>
                </Alert>
                
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Unable to join game. Please try again later.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Avatars & Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Avatars, Progress & Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="mb-3">Avatars</h4>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>SM</AvatarFallback>
                    </Avatar>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>MD</AvatarFallback>
                    </Avatar>
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>LG</AvatarFallback>
                    </Avatar>
                    <Avatar className="w-16 h-16">
                      <AvatarFallback>XL</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                
                <div>
                  <h4 className="mb-3">Progress Indicators</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Game Capacity</span>
                        <span>7/10 players</span>
                      </div>
                      <Progress value={70} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Event Progress</span>
                        <span>3/5 complete</span>
                      </div>
                      <Progress value={60} className="[&>div]:bg-success" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="mb-3">Controls</h4>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="terms" />
                      <label htmlFor="terms" className="text-sm">Accept terms</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="notifications" />
                      <label htmlFor="notifications" className="text-sm">Notifications</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loading States */}
            <Card>
              <CardHeader>
                <CardTitle>Loading States</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="mb-3">Skeleton Loading</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[160px]" />
                      </div>
                    </div>
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-10 w-20" />
                      <Skeleton className="h-10 w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Spacing System</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="bg-primary h-1 mb-2"></div>
                      <div className="text-sm">4px</div>
                      <div className="text-xs text-muted-foreground">Space 1</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-primary h-2 mb-2"></div>
                      <div className="text-sm">8px</div>
                      <div className="text-xs text-muted-foreground">Space 2</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-primary h-3 mb-2"></div>
                      <div className="text-sm">12px</div>
                      <div className="text-xs text-muted-foreground">Space 3</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-primary h-4 mb-2"></div>
                      <div className="text-sm">16px</div>
                      <div className="text-xs text-muted-foreground">Space 4</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-primary h-6 mb-2"></div>
                      <div className="text-sm">24px</div>
                      <div className="text-xs text-muted-foreground">Space 6</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-primary h-8 mb-2"></div>
                      <div className="text-sm">32px</div>
                      <div className="text-xs text-muted-foreground">Space 8</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-primary h-12 mb-2"></div>
                      <div className="text-sm">48px</div>
                      <div className="text-xs text-muted-foreground">Space 12</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Border Radius</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="bg-muted h-16 mb-2 rounded-xs"></div>
                    <div className="text-sm">4px</div>
                    <div className="text-xs text-muted-foreground">XS</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-muted h-16 mb-2 rounded-sm"></div>
                    <div className="text-sm">8px</div>
                    <div className="text-xs text-muted-foreground">SM</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-muted h-16 mb-2 rounded-md"></div>
                    <div className="text-sm">12px</div>
                    <div className="text-xs text-muted-foreground">MD</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-muted h-16 mb-2 rounded-lg"></div>
                    <div className="text-sm">16px</div>
                    <div className="text-xs text-muted-foreground">LG</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-muted h-16 mb-2 rounded-xl"></div>
                    <div className="text-sm">24px</div>
                    <div className="text-xs text-muted-foreground">XL</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shadow System</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-card h-24 rounded-lg shadow-subtle mb-3"></div>
                    <div className="text-sm font-medium">Subtle</div>
                    <div className="text-xs text-muted-foreground">Cards, buttons</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-card h-24 rounded-lg shadow-medium mb-3"></div>
                    <div className="text-sm font-medium">Medium</div>
                    <div className="text-xs text-muted-foreground">Modals, dropdowns</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-card h-24 rounded-lg shadow-strong mb-3"></div>
                    <div className="text-sm font-medium">Strong</div>
                    <div className="text-xs text-muted-foreground">Overlays, floating</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Icons Tab */}
          <TabsContent value="icons" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Icon Library</CardTitle>
                <p className="text-muted-foreground">Lucide React icons used throughout the application</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="mb-4">Navigation Icons</h4>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                      {[Home, Plus, User, Settings, Search, Filter, ArrowLeft].map((Icon, index) => (
                        <div key={index} className="flex flex-col items-center gap-2 p-3 rounded-lg border">
                          <Icon className="w-6 h-6" />
                          <span className="text-xs">{Icon.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-4">Action Icons</h4>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                      {[Edit, Trash, Download, Share, Eye, EyeOff, Heart, Star].map((Icon, index) => (
                        <div key={index} className="flex flex-col items-center gap-2 p-3 rounded-lg border">
                          <Icon className="w-6 h-6" />
                          <span className="text-xs">{Icon.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-4">Status Icons</h4>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                      {[CheckCircle, AlertCircle, XCircle, Info, Bell, Trophy].map((Icon, index) => (
                        <div key={index} className="flex flex-col items-center gap-2 p-3 rounded-lg border">
                          <Icon className="w-6 h-6" />
                          <span className="text-xs">{Icon.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-4">Content Icons</h4>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                      {[Calendar, MapPin, Users].map((Icon, index) => (
                        <div key={index} className="flex flex-col items-center gap-2 p-3 rounded-lg border">
                          <Icon className="w-6 h-6" />
                          <span className="text-xs">{Icon.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default DesignSystem;