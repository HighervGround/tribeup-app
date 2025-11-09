# TribeUp Developer Implementation Guide
## Complete Technical Specification

### Quick Start Checklist

#### Initial Setup
- [ ] Install required dependencies (Motion, Lucide React, Sonner)
- [ ] Set up Tailwind v4 with custom CSS variables
- [ ] Import and configure globals.css
- [ ] Set up responsive hook system
- [ ] Configure accessibility preferences system

#### Core Implementation
- [ ] Implement responsive layout system
- [ ] Set up animation framework with Motion
- [ ] Create accessibility preference management
- [ ] Implement theme switching (light/dark/high-contrast)
- [ ] Set up toast notification system

---

## Exact Component Specifications

### Button Component

#### Technical Requirements
```tsx
// Exact measurements and styles
const buttonVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline"
}

const buttonSizes = {
  default: "h-10 px-4 py-2",      // 40px height, 16px horizontal padding
  sm: "h-9 rounded-md px-3",      // 36px height, 12px horizontal padding
  lg: "h-11 rounded-md px-8",     // 44px height, 32px horizontal padding
  icon: "h-10 w-10"               // 40x40px square
}
```

#### Animation Specifications
- **Hover**: `transform: translateY(-1px)` in 150ms
- **Active**: `transform: scale(0.95)` in 100ms
- **Loading**: Spinner rotation at 1s duration, linear easing
- **Disabled**: `opacity: 0.5`, no pointer events

#### Accessibility Requirements
- Minimum 44x44px touch target on mobile
- Focus ring: 2px solid, 2px offset
- ARIA labels for icon-only buttons
- Keyboard activation (Enter/Space)

### GameCard Component

#### Exact Layout Measurements
```scss
.game-card {
  // Mobile (default)
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  // Tablet
  @media (min-width: 768px) {
    width: calc(50% - 12px);
  }
  
  // Desktop
  @media (min-width: 1024px) {
    width: calc(33.333% - 16px);
    max-width: 360px;
  }
}

.game-card__image {
  aspect-ratio: 16 / 9;
  position: relative;
  overflow: hidden;
}

.game-card__content {
  padding: 16px;
  
  @media (min-width: 1024px) {
    padding: 20px;
  }
}

.game-card__badges {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
```

#### Hover Animation Specification
```css
.game-card {
  transition: all 250ms cubic-bezier(0.0, 0.0, 0.2, 1);
}

.game-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.game-card__image:hover {
  transform: scale(1.02);
  transition: transform 300ms ease-out;
}
```

### Form Components

#### Input Field Specifications
```scss
.input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 16px; // Prevents zoom on iOS
  line-height: 1.5;
  background: var(--input-background);
  
  &:focus {
    outline: none;
    border-color: var(--ring);
    box-shadow: 0 0 0 2px rgba(250, 70, 22, 0.2);
  }
  
  &:invalid {
    border-color: var(--destructive);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Large variant for mobile accessibility
.input--large {
  height: 48px;
  font-size: 18px;
}
```

#### Form Validation States
- **Default**: Border `var(--border)`
- **Focus**: Border `var(--ring)`, box-shadow with 20% opacity
- **Error**: Border `var(--destructive)`, error message below
- **Success**: Border `var(--success)`, check icon
- **Disabled**: 50% opacity, no interactions

---

## Layout System Implementation

### Responsive Grid System
```scss
.grid-responsive {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
  }
  
  @media (min-width: 1440px) {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### Container System
```scss
.container-mobile {
  max-width: 100%;
  padding: 0 16px;
}

.container-tablet {
  max-width: 768px;
  margin: 0 auto;
  padding: 0 32px;
}

.container-desktop {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 48px;
}
```

### Sidebar Layout (Desktop)
```scss
.desktop-layout {
  display: flex;
  min-height: 100vh;
  
  .sidebar {
    width: 280px;
    flex-shrink: 0;
    border-right: 1px solid var(--border);
    background: var(--card);
    
    &.collapsed {
      width: 80px;
    }
    
    transition: width 300ms ease-out;
  }
  
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0; // Prevent flex item overflow
  }
  
  .right-panel {
    width: 320px;
    flex-shrink: 0;
    border-left: 1px solid var(--border);
    background: var(--card);
  }
}
```

---

## Animation Implementation

### Screen Transition System
```tsx
// Page transition variants
const screenVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
};

// Modal transition variants
const modalVariants = {
  enter: {
    y: '100%',
    opacity: 0,
  },
  center: {
    y: 0,
    opacity: 1,
  },
  exit: {
    y: '100%',
    opacity: 0,
  },
};

// Usage in component
<AnimatePresence mode="wait">
  <motion.div
    key={currentScreen}
    custom={direction}
    variants={screenVariants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ duration: 0.25, ease: 'easeOut' }}
  >
    {renderScreen()}
  </motion.div>
</AnimatePresence>
```

### Micro-interaction Specifications
```tsx
// Button press animation
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.15 }}
>

// Card hover animation  
<motion.div
  whileHover={{ 
    y: -2,
    transition: { duration: 0.25, ease: 'easeOut' }
  }}
  className="card-hover"
>

// Loading spinner
<motion.div
  animate={{ rotate: 360 }}
  transition={{ 
    duration: 1, 
    repeat: Infinity, 
    ease: 'linear' 
  }}
  className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
/>

// Toast notification entrance
<motion.div
  initial={{ y: -100, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: -100, opacity: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
```

---

## Accessibility Implementation

### Focus Management System
```tsx
// Focus management utility
const manageFocus = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

// Skip link implementation
<a 
  href="#main-content" 
  className="skip-link"
  onFocus={() => setSkipLinkVisible(true)}
  onBlur={() => setSkipLinkVisible(false)}
>
  Skip to main content
</a>

// CSS for skip link
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary);
  color: var(--primary-foreground);
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
  transition: top 0.3s ease;
}

.skip-link:focus {
  top: 6px;
}
```

### Screen Reader Support
```tsx
// Live region for announcements
const announceToScreenReader = (message: string) => {
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  liveRegion.textContent = message;
  document.body.appendChild(liveRegion);
  
  setTimeout(() => {
    document.body.removeChild(liveRegion);
  }, 1000);
};

// ARIA labels for interactive elements
<button 
  aria-label="Join basketball game at Southwest Recreation Center"
  onClick={handleJoin}
>
  Join Game
</button>

// Loading states with ARIA
<div 
  role="status" 
  aria-label="Loading games"
  className="flex items-center justify-center p-8"
>
  <LoadingSpinner />
  <span className="sr-only">Loading games...</span>
</div>
```

### Keyboard Navigation
```tsx
// Global keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Alt + number keys for navigation
    if (event.altKey) {
      switch (event.key) {
        case '1':
          event.preventDefault();
          navigateTo('home');
          break;
        case '2':
          event.preventDefault();
          navigateTo('search');
          break;
        // ... more shortcuts
      }
    }
    
    // Escape key to close modals
    if (event.key === 'Escape') {
      closeModal();
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## Performance Optimization

### Image Optimization
```tsx
// Use ImageWithFallback component for all images
<ImageWithFallback
  src={game.imageUrl}
  alt={`${game.sport} game at ${game.location}`}
  className="w-full h-full object-cover"
  loading="lazy"
/>

// Implement image loading states
const [imageLoaded, setImageLoaded] = useState(false);

<div className="relative">
  {!imageLoaded && (
    <div className="absolute inset-0 bg-muted animate-pulse" />
  )}
  <img 
    src={imageUrl}
    onLoad={() => setImageLoaded(true)}
    className={`transition-opacity duration-300 ${
      imageLoaded ? 'opacity-100' : 'opacity-0'
    }`}
  />
</div>
```

### Animation Performance
```tsx
// Use transform and opacity for animations (GPU accelerated)
.card-hover {
  transform: translateZ(0); // Create stacking context
  transition: transform 250ms ease-out;
}

.card-hover:hover {
  transform: translateY(-2px) translateZ(0);
}

// Avoid animating layout-triggering properties
// Good: transform, opacity, filter
// Avoid: width, height, padding, margin
```

### Bundle Optimization
```tsx
// Lazy load non-critical components
const GameDetails = lazy(() => import('./GameDetails'));
const Settings = lazy(() => import('./Settings'));

// Use dynamic imports for large dependencies
const loadChartLibrary = () => import('recharts');
```

---

## Testing Requirements

### Accessibility Testing Checklist
- [ ] Keyboard navigation works throughout app
- [ ] Screen reader can navigate and understand content
- [ ] Color contrast ratios meet WCAG AA standards
- [ ] Focus indicators are visible and logical
- [ ] All images have appropriate alt text
- [ ] Forms have proper labels and error messages
- [ ] Loading states are announced to screen readers
- [ ] Skip links work correctly

### Responsive Testing Points
- [ ] 320px width (smallest mobile)
- [ ] 375px width (iPhone SE)
- [ ] 768px width (tablet breakpoint)
- [ ] 1024px width (desktop breakpoint)
- [ ] 1440px width (large desktop)
- [ ] Landscape orientation on mobile/tablet
- [ ] Touch targets are minimum 44x44px

### Performance Testing
- [ ] Page load times under 3 seconds
- [ ] Animations run at 60fps
- [ ] Images load progressively
- [ ] Bundle size optimized
- [ ] Memory usage reasonable
- [ ] Works on low-end devices

---

## Code Quality Standards

### TypeScript Requirements
```tsx
// Always type component props
interface GameCardProps {
  game: Game;
  compact?: boolean;
  onSelect?: () => void;
}

// Use proper event types
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
  // Handle click
};

// Type custom hooks
const useResponsive = (): ResponsiveHookReturn => {
  // Implementation
};
```

### Component Structure
```tsx
// Standard component structure
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // 1. Hooks (useState, useEffect, custom hooks)
  const [state, setState] = useState(initialValue);
  const { responsive } = useResponsive();
  
  // 2. Event handlers
  const handleEvent = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  // 3. Derived values
  const computedValue = useMemo(() => {
    return expensive calculation;
  }, [dependencies]);
  
  // 4. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 5. Early returns
  if (loading) return <LoadingSpinner />;
  
  // 6. Main render
  return (
    <div className="component-wrapper">
      {/* Component content */}
    </div>
  );
}
```

### CSS Organization
```scss
// Use consistent naming
.component-name {
  // Layout properties first
  display: flex;
  flex-direction: column;
  
  // Box model
  width: 100%;
  padding: 16px;
  margin: 0;
  
  // Visual properties
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 8px;
  
  // Typography
  font-size: 1rem;
  color: var(--foreground);
  
  // Transitions
  transition: all 250ms ease-out;
  
  // Nested elements
  &__element {
    // Element styles
  }
  
  // Modifiers
  &--variant {
    // Variant styles
  }
  
  // States
  &:hover {
    // Hover styles
  }
  
  &:focus {
    // Focus styles
  }
}
```

---

## Deployment Checklist

### Pre-deployment
- [ ] All TypeScript errors resolved
- [ ] All tests passing
- [ ] Accessibility audit completed
- [ ] Performance benchmarks met
- [ ] Cross-browser testing completed
- [ ] Mobile device testing completed
- [ ] Code review completed
- [ ] Security review completed

### Environment Configuration
- [ ] Production build optimized
- [ ] Environment variables configured
- [ ] CDN setup for assets
- [ ] Error tracking configured
- [ ] Analytics configured
- [ ] Monitoring setup

### Launch Verification
- [ ] All features working in production
- [ ] Performance metrics acceptable
- [ ] No console errors
- [ ] Accessibility still working
- [ ] Mobile experience verified
- [ ] Error handling working

---

This implementation guide provides the exact specifications needed to build TribeUp pixel-perfect and fully accessible. Reference the main Design System document for design decisions and this guide for technical implementation details.

**Technical Requirements**:
- React 18+
- TypeScript 4.9+
- Tailwind CSS v4
- Motion (Framer Motion) 11+
- Node.js 18+

**Browser Support**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari iOS 14+
- Chrome Mobile Android 90+