# Motion System Documentation

## Overview

The TribeUp app now uses a comprehensive motion system built with Framer Motion that provides:

- **Global motion configuration** with design system tokens
- **Accessibility support** with reduced motion preferences
- **Performance optimizations** with lazy loading
- **Consistent animations** across all components

## Key Features

### 1. MotionProvider
The `MotionProvider` wraps the entire app and provides:
- React context for motion settings
- Reduced motion detection
- Global motion configuration
- Accessibility support

### 2. Motion Context
Use the `useMotion` hook to access motion settings:

```tsx
import { useMotion } from './components/MotionProvider';

function MyComponent() {
  const { reducedMotion, motionEnabled } = useMotion();
  
  // Use these values to conditionally apply animations
}
```

### 3. Common Variants
Pre-built animation variants for consistent animations:

```tsx
import { commonVariants } from './components/MotionProvider';

<motion.div
  variants={commonVariants.fadeIn}
  initial="initial"
  animate="animate"
  exit="exit"
>
  Content
</motion.div>
```

## Available Variants

### fadeIn
Simple fade in/out animation

### slideUp
Slide up from below

### slideDown
Slide down from above

### scale
Scale in/out animation

### stagger
Stagger children animations

## Motion Configuration

The `motionConfig` object provides design system tokens:

```tsx
import { motionConfig } from './components/MotionProvider';

// Duration tokens
motionConfig.duration.fast    // 0.15s
motionConfig.duration.normal  // 0.3s
motionConfig.duration.slow    // 0.5s

// Easing functions
motionConfig.ease.easeOut     // [0.4, 0, 0.2, 1]
motionConfig.ease.easeIn      // [0.4, 0, 1, 1]
motionConfig.ease.easeInOut   // [0.4, 0, 0.2, 1]

// Spring configuration
motionConfig.spring          // { type: 'spring', stiffness: 300, damping: 30 }

// Stagger delays
motionConfig.stagger.fast    // 0.05s
motionConfig.stagger.normal  // 0.1s
motionConfig.stagger.slow    // 0.2s
```

## Accessibility

The motion system automatically respects user preferences:

- **Reduced Motion**: Detects `prefers-reduced-motion` media query
- **Motion Disabled**: Can be disabled via `enableMotion` prop
- **Fallback Animations**: Provides simple opacity transitions when motion is reduced

## Best Practices

### 1. Always Check Reduced Motion
```tsx
const { reducedMotion } = useMotion();

const variants = reducedMotion ? {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
} : {
  // Full animation variants
};
```

### 2. Use Design System Tokens
```tsx
import { motionConfig } from './components/MotionProvider';

<motion.div
  transition={{
    duration: motionConfig.duration.normal,
    ease: motionConfig.ease.easeOut
  }}
>
```

### 3. Leverage Common Variants
```tsx
import { commonVariants } from './components/MotionProvider';

<motion.div variants={commonVariants.fadeIn}>
  Content
</motion.div>
```

### 4. Test with Motion Test Route
Visit `/motion-test` to see all animations in action and verify accessibility.

## Example Usage

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useMotion, commonVariants, motionConfig } from './components/MotionProvider';

export function AnimatedCard() {
  const { reducedMotion } = useMotion();

  return (
    <motion.div
      className="p-4 bg-white rounded-lg shadow"
      variants={commonVariants.slideUp}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={reducedMotion ? {} : { scale: 1.02 }}
      transition={motionConfig.spring}
    >
      <h3>Animated Card</h3>
      <p>This card animates smoothly with accessibility support.</p>
    </motion.div>
  );
}
```

## Testing

1. **Normal Mode**: Visit any page to see full animations
2. **Reduced Motion**: Enable reduced motion in your OS settings
3. **Motion Test**: Visit `/motion-test` to see all variants
4. **Accessibility**: Test with screen readers and keyboard navigation

## Troubleshooting

### Motion Not Working
- Ensure `MotionProvider` wraps your component tree
- Check that `framer-motion` is properly installed
- Verify no console errors related to React context

### Performance Issues
- Use `LazyMotion` for code splitting (already configured)
- Avoid complex animations on low-end devices
- Consider reducing animation complexity for mobile

### Accessibility Issues
- Always provide fallbacks for reduced motion
- Test with screen readers
- Ensure animations don't interfere with focus management
