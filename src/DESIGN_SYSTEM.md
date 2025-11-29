# TribeUp Design System
## Complete Developer Handoff Guide

### Table of Contents
1. [Brand Identity](#brand-identity)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Icons & Assets](#icons--assets)
7. [Animation System](#animation-system)
8. [Responsive Design](#responsive-design)
9. [Accessibility](#accessibility)
10. [Implementation Guide](#implementation-guide)

---

## Brand Identity

### Logo & Branding
- **Primary Logo**: TribeUp wordmark
- **Tagline**: "Find your game, find your tribe"
- **Brand Values**: Community, Inclusivity, Active Lifestyle, University Spirit

### Visual Style
- **Design Language**: Modern, clean, energetic
- **Aesthetic**: University of Florida inspired with sports-focused functionality
- **Personality**: Friendly, approachable, competitive, community-driven

---

## Color System

### Primary Brand Colors

#### Core Colors
```css
/* University of Florida Brand Colors */
--uf-core-orange: #FA4616    /* Primary brand color */
--uf-core-blue: #0021A5      /* Secondary brand color */
--uf-bottlebrush: #D32737    /* Accent/destructive actions */
--uf-alachua: #D97706        /* Warning/highlight color */
--uf-gator: #22884C          /* Success/positive actions */
--uf-dark-blue: #002657      /* Dark accent */
--uf-perennial: #6A2A60      /* Purple accent */
```

#### Neutral Colors
```css
--uf-cool-grey-11: #343741   /* Dark text/borders */
--uf-cool-grey-3: #C7C9C8    /* Light borders/disabled */
--uf-warm-grey-1: #D8D4D7    /* Background tints */
```

### Sport Category Colors
Each sport has a designated color for visual categorization:

```css
--sport-basketball: #FA4616  /* Orange - High energy */
--sport-soccer: #22884C      /* Green - Field/grass */
--sport-tennis: #0021A5      /* Blue - Professional */
--sport-volleyball: #D97706  /* Amber - Sand courts */
--sport-football: #6A2A60    /* Purple - Premium */
--sport-baseball: #D32737    /* Red - Classic American */
```

### Color Usage Guidelines

#### Primary Colors
- **Orange (#FA4616)**: Primary actions, active states, brand elements
- **Blue (#0021A5)**: Navigation, secondary actions, information

#### Application Rules
- Use orange sparingly for maximum impact
- Blue for supporting elements and information hierarchy
- Sport colors only for categorization, not general UI elements
- Maintain 4.5:1 contrast ratio minimum for text

### Dark Mode Colors
```css
.dark {
  --background: #343741
  --foreground: #ffffff
  --card: #343741
  --muted: #002657
  --border: rgba(199, 201, 200, 0.2)
}
```

### High Contrast Mode
```css
.high-contrast {
  --background: #ffffff
  --foreground: #000000
  --primary: #000000
  --border: #000000
  --focus-ring: #0000ff
}
```

---

## Typography

### Font System
- **Primary Font**: System font stack for optimal performance
- **Base Size**: 14px (mobile), 16px (tablet+)
- **Scale**: Modular scale with consistent line heights

### Typography Scale
```css
/* Headings */
h1: 2rem (32px) / 1.4 line-height / -0.025em letter-spacing
h2: 1.5rem (24px) / 1.4 line-height / -0.025em letter-spacing  
h3: 1.25rem (20px) / 1.5 line-height
h4: 1.125rem (18px) / 1.5 line-height
h5: 1rem (16px) / 1.5 line-height
h6: 0.875rem (14px) / 1.5 line-height

/* Body Text */
p: 1rem (16px) / 1.6 line-height
small: 0.875rem (14px) / 1.5 line-height
caption: 0.75rem (12px) / 1.4 line-height

/* Interactive Elements */
button: 1rem (16px) / 1.5 line-height / medium weight
input: 1rem (16px) / 1.5 line-height
label: 0.875rem (14px) / 1.5 line-height / medium weight
```

### Font Weights
- **Normal**: 400 (body text, inputs)
- **Medium**: 500 (labels, buttons, headings)

### Large Text Mode
When `.large-text` class is applied:
```css
--base-font-size: 18px
h1: 2.5rem (45px)
h2: 2rem (36px)
p: 1.125rem (20.25px)
button: 1.125rem (20.25px)
```

### Typography Usage Rules
- Use h1 for page titles only
- h2 for major section headings
- h3 for subsection headings
- Maintain consistent line heights for vertical rhythm
- Use medium weight for interactive elements and emphasis

---

## Spacing & Layout

### Spacing Scale
```css
--space-1: 4px    /* Fine adjustments */
--space-2: 8px    /* Tight spacing */
--space-3: 12px   /* Close related elements */
--space-4: 16px   /* Standard spacing */
--space-6: 24px   /* Section spacing */
--space-8: 32px   /* Large gaps */
--space-12: 48px  /* Major sections */
--space-16: 64px  /* Page sections */
--space-20: 80px  /* Large separations */
--space-24: 96px  /* Maximum spacing */
```

### Layout Grid
- **Mobile**: Single column, 16px margins
- **Tablet**: 2-3 columns, 32px margins
- **Desktop**: 3-4 columns, 48px margins

### Component Spacing Rules
- **Card padding**: 16px (mobile), 24px (desktop)
- **Button padding**: 12px horizontal, 8px vertical
- **Input padding**: 12px horizontal, 10px vertical
- **List item spacing**: 8px between items
- **Section spacing**: 32px between major sections

### Border Radius Scale
```css
--radius-xs: 4px   /* Small elements */
--radius-sm: 8px   /* Buttons, inputs */
--radius-md: 12px  /* Cards, modals */
--radius-lg: 16px  /* Large components */
--radius-xl: 24px  /* Hero sections */
```

---

## Components

### Button Component

#### Variants
```tsx
// Primary Button - Main actions
<Button variant="default" size="lg">
  Primary Action
</Button>
// Style: bg-primary, text-white, 48px height

// Secondary Button - Supporting actions  
<Button variant="outline" size="lg">
  Secondary Action
</Button>
// Style: border-primary, text-primary, 48px height

// Ghost Button - Subtle actions
<Button variant="ghost" size="sm">
  Subtle Action
</Button>
// Style: transparent bg, hover:bg-muted, 36px height
```

#### Measurements
- **Large**: 48px height, 24px horizontal padding
- **Medium**: 40px height, 16px horizontal padding  
- **Small**: 36px height, 12px horizontal padding
- **Icon**: 40x40px square
- **Border radius**: 8px
- **Font weight**: 500 (medium)

#### States
- **Default**: Standard colors
- **Hover**: Slight elevation (translateY(-1px))
- **Active**: Scale down (scale(0.98))
- **Disabled**: 50% opacity, no interactions
- **Loading**: Show spinner, disable interactions

### Card Component

#### Structure
```tsx
<Card className="shadow-subtle hover:shadow-medium">
  <CardHeader className="p-6">
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent className="p-6 pt-0">
    Content
  </CardContent>
</Card>
```

#### Measurements
- **Padding**: 24px all sides
- **Border radius**: 12px
- **Border**: 1px solid var(--border)
- **Shadow**: Subtle (default), Medium (hover)
- **Background**: Card color (white/dark)

#### Hover Effects
- **Elevation**: translateY(-2px)
- **Shadow**: Increase to medium
- **Transition**: 250ms ease-out

### Game Card Component

#### Specifications
- **Width**: Full width (mobile), 300px (desktop)
- **Image aspect ratio**: 16:9
- **Padding**: 16px
- **Border radius**: 12px
- **Hover effect**: Lift 2px, increase shadow

#### Content Structure
1. **Image**: 16:9 aspect ratio with sport icon overlay
2. **Date/Time badge**: Top-left absolute positioning
3. **Sport badge**: Top-right absolute positioning  
4. **Title**: 18px, medium weight
5. **Location**: 14px with MapPin icon
6. **Player count**: 14px with Users icon
7. **Cost badge**: Styled based on price
8. **Join button**: Primary or outline variant

### Input Component

#### Measurements
- **Height**: 40px (standard), 48px (large)
- **Padding**: 12px horizontal, 10px vertical
- **Border radius**: 8px
- **Border**: 1px solid var(--border)
- **Font size**: 16px

#### States
- **Default**: Border color var(--border)
- **Focus**: Border color var(--ring), box-shadow
- **Error**: Border color var(--destructive)
- **Disabled**: 50% opacity, no interactions

---

## Icons & Assets

### Icon System
- **Library**: Lucide React
- **Size scale**: 16px, 20px, 24px
- **Usage**: Consistent sizing within components
- **Color**: Inherit from parent or muted-foreground

### Icon Guidelines
- **16px**: Small UI elements, inline text
- **20px**: Standard buttons, navigation
- **24px**: Large buttons, headers
- **32px+**: Special emphasis, hero sections

### Sport Icons
Use emoji representations for sport types:
- Basketball: 🏀
- Soccer: ⚽
- Tennis: 🎾
- Volleyball: 🏐
- Football: 🏈
- Baseball: ⚾

### Image Requirements
- **Game images**: 16:9 aspect ratio, minimum 600px width
- **Profile images**: 1:1 aspect ratio, minimum 200px
- **Fallback**: Use ImageWithFallback component
- **Loading**: Show skeleton while loading
- **Optimization**: Use appropriate formats (WebP preferred)

---

## Animation System

### Duration Scale
```css
--duration-fast: 150ms     /* Quick feedback */
--duration-normal: 250ms   /* Standard transitions */
--duration-slow: 350ms     /* Complex animations */
```

### Easing Functions
```css
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1)     /* Entering */
--ease-in: cubic-bezier(0.4, 0.0, 1, 1)        /* Exiting */
--ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1)  /* Persistent */
--spring: cubic-bezier(0.175, 0.885, 0.32, 1.275) /* Bouncy */
```

### Animation Patterns

#### Page Transitions
```tsx
// Screen transitions
const screenVariants = {
  enter: { x: 300, opacity: 0, scale: 0.95 },
  center: { x: 0, opacity: 1, scale: 1 },
  exit: { x: -300, opacity: 0, scale: 0.95 }
}
// Duration: 250ms, Easing: ease-out
```

#### Component Interactions
```tsx
// Button press
whileTap={{ scale: 0.95 }}
// Duration: 150ms

// Card hover
whileHover={{ y: -2, transition: { duration: 0.25 } }}

// Loading spinner
animate={{ rotate: 360 }}
transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
```

#### Micro-interactions
- **Button hover**: Scale 1.05, duration 150ms
- **Card hover**: translateY(-2px), duration 250ms  
- **Input focus**: Border color change, duration 150ms
- **Toast enter**: slideInDown, duration 250ms
- **Modal enter**: slideInUp, duration 300ms

### Reduced Motion
When `prefers-reduced-motion: reduce`:
```css
* {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

---

## Responsive Design

### Breakpoints
```css
--mobile-max: 767px
--tablet-min: 768px
--tablet-max: 1023px  
--desktop-min: 1024px
--desktop-large-min: 1440px
```

### Layout Adaptations

#### Mobile (320px - 767px)
- Single column layout
- 16px horizontal margins
- Stack navigation (bottom tabs)
- Touch-friendly 44px minimum touch targets
- Full-width cards and components

#### Tablet (768px - 1023px)  
- 2-3 column grid layouts
- 32px horizontal margins
- Larger touch targets maintained
- Side-by-side content areas
- Adaptive navigation

#### Desktop (1024px+)
- 3-4 column grid layouts
- Sidebar navigation (280px width, collapsible to 80px)
- Multi-panel layouts
- 48px+ horizontal margins
- Hover states and interactions
- Context panels (320px width)

### Responsive Component Behavior

#### GameCard
- **Mobile**: Full width, stacked content
- **Tablet**: 2-per-row in grid
- **Desktop**: 3-per-row in grid, hover effects enabled

#### CreateGame Form
- **Mobile**: Single column, full-width inputs
- **Tablet**: Optimized for landscape, larger touch targets
- **Desktop**: Wider form, better visual hierarchy

#### HomeScreen
- **Mobile**: Linear scroll, pull-to-refresh
- **Tablet**: Grid layouts, larger cards
- **Desktop**: Dashboard layout with sidebar, multi-column content

---

## Accessibility

### WCAG 2.1 AA Compliance

#### Color Contrast Requirements
- **Normal text**: 4.5:1 minimum ratio
- **Large text**: 3:1 minimum ratio
- **UI components**: 3:1 minimum ratio

#### Focus Management
```css
*:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: 4px;
}
```

#### Screen Reader Support
- Semantic HTML elements
- ARIA labels for interactive elements
- Live regions for dynamic content
- Skip links for navigation

#### Keyboard Navigation
- Tab order follows visual order
- All interactive elements focusable
- Keyboard shortcuts available
- Escape key dismisses modals

### Accessibility Features

#### High Contrast Mode
```css
.high-contrast {
  --primary: #000000;
  --background: #ffffff;
  --border: #000000;
  /* Enhanced contrast ratios */
}
```

#### Large Text Mode
```css
.large-text {
  --font-size: 18px;
  /* All text scales proportionally */
}
```

#### Reduced Motion
Respects `prefers-reduced-motion: reduce` system setting.

#### Color-blind Friendly
Alternative color schemes available for better distinction.

### Touch Targets
- Minimum 44x44px on mobile
- Adequate spacing between interactive elements
- Larger targets for primary actions

---

## Implementation Guide

### Setup & Installation

#### Required Dependencies
```json
{
  "motion/react": "^11.0.0",
  "lucide-react": "latest",
  "sonner": "^2.0.3",
  "react-hook-form": "^7.55.0"
}
```

#### CSS Setup
Import the globals.css file and ensure Tailwind v4 is configured.

### Code Structure

#### Component Organization
```
/components
  /ui              # Base UI components
  /screens         # Page-level components  
  /layout          # Layout components
  /forms           # Form-specific components
```

#### Naming Conventions
- **Components**: PascalCase (GameCard, UserProfile)
- **Props**: camelCase (onGameSelect, currentScreen)
- **CSS Classes**: kebab-case (game-card, user-profile)
- **Files**: PascalCase for components, camelCase for utilities

### Development Patterns

#### Responsive Hooks
```tsx
import { useResponsive } from './ui/use-responsive';

const { screenSize, isMobile, isDesktop } = useResponsive();
```

#### Animation Patterns
```tsx
import { motion } from 'motion/react';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  Content
</motion.div>
```

#### Theme Application
```tsx
// Apply theme classes to document root
document.documentElement.classList.add('dark');
document.documentElement.classList.add('high-contrast');
```

### Testing Guidelines

#### Accessibility Testing
- Use axe-core for automated testing
- Test with screen readers (NVDA, VoiceOver)
- Verify keyboard navigation
- Check color contrast ratios

#### Responsive Testing
- Test on actual devices when possible
- Use browser dev tools for breakpoint testing
- Verify touch targets on mobile
- Test landscape and portrait orientations

#### Performance Testing
- Monitor animation performance
- Optimize images and assets
- Test on lower-end devices
- Measure loading times

---

## Component API Reference

### Button
```tsx
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
  onClick?: () => void
}
```

### GameCard
```tsx
interface GameCardProps {
  game: {
    id: string
    title: string
    sport: string
    date: string
    time: string
    location: string
    currentPlayers: number
    maxPlayers: number
    cost: string
    description: string
    imageUrl: string
    sportColor: string
    isJoined: boolean
  }
  compact?: boolean
  onSelect?: () => void
}
```

### HomeScreen
```tsx
interface HomeScreenProps {
  onCreateGame: () => void
  onGameSelect: (gameId: string) => void
  onSearch: () => void
  currentScreen?: string
  onScreenChange?: (screen: string) => void
}
```

---

## Quality Checklist

### Before Development Handoff
- [ ] All color values documented with hex codes
- [ ] Typography scale defined with pixel values
- [ ] Spacing measurements specified
- [ ] Component variants documented
- [ ] Animation timings and easings specified
- [ ] Responsive breakpoints defined
- [ ] Accessibility requirements listed
- [ ] Asset requirements specified

### During Development
- [ ] Color contrast ratios verified
- [ ] Touch targets meet minimum sizes
- [ ] Keyboard navigation tested
- [ ] Screen reader compatibility verified
- [ ] Responsive behavior tested across devices
- [ ] Animation performance acceptable
- [ ] Loading states implemented
- [ ] Error states handled

### Pre-Launch
- [ ] Accessibility audit completed
- [ ] Cross-browser testing done
- [ ] Performance optimization verified
- [ ] User testing conducted
- [ ] Design-dev QA session completed

---

This design system serves as the complete reference for implementing TribeUp. All measurements, colors, and behaviors are specified to ensure pixel-perfect implementation across all devices and accessibility requirements.

For questions or clarifications, refer to the component implementations in the codebase or reach out to the design team.

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Maintained by**: TribeUp Design Team