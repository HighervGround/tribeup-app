# TribeUp App Colors - Code2Prompt Documentation

## Overview
This document contains all color definitions used in the TribeUp Social Sports App. Colors are organized by category and include CSS variables, hex values, and usage contexts.

---

## UF Brand Colors

### Core Brand Colors
```css
--uf-core-orange: #FA4616    /* Primary brand color - UF Orange */
--uf-core-blue: #0021A5      /* Secondary brand color - UF Blue */
--uf-bottlebrush: #D32737    /* Accent/destructive actions - Red */
--uf-alachua: #F2A900        /* Warning/highlight color - Yellow/Gold */
--uf-gator: #22884C          /* Success/positive actions - Green */
--uf-dark-blue: #002657      /* Dark accent - Deep Blue */
--uf-perennial: #6A2A60      /* Purple accent */
```

### Neutral Colors
```css
--uf-cool-grey-11: #343741   /* Dark text/borders */
--uf-cool-grey-3: #C7C9C8    /* Light borders/disabled states */
--uf-warm-grey-1: #D8D4D7    /* Background tints */
```

---

## Sport Category Colors

### Primary Sport Colors
Each sport has a designated color for visual categorization:

```css
--sport-basketball: #FA4616  /* Orange - High energy (matches UF core orange) */
--sport-soccer: #22884C      /* Green - Field/grass (matches UF gator) */
--sport-tennis: #0021A5      /* Blue - Professional (matches UF core blue) */
--sport-volleyball: #F2A900  /* Yellow - Beach/sun (matches UF alachua) */
--sport-football: #6A2A60    /* Purple - Premium (matches UF perennial) */
--sport-baseball: #D32737    /* Red - Classic American (matches UF bottlebrush) */
```

### Colorblind-Friendly Alternatives
Alternative colors for accessibility:

```css
--sport-basketball-alt: #FF6B35  /* Lighter orange */
--sport-soccer-alt: #4CAF50      /* Brighter green */
--sport-tennis-alt: #2196F3      /* Lighter blue */
--sport-volleyball-alt: #FFC107  /* Brighter yellow */
--sport-football-alt: #9C27B0    /* Brighter purple */
--sport-baseball-alt: #F44336    /* Brighter red */
```

---

## Design System Tokens

### Base Colors
```css
--color-white: #ffffff
--color-black: #000000
--color-orange-600: #ea580c
--color-gray-700: #374151
--color-gray-900: #111827
```

### Semantic Color Tokens (Light Mode)
```css
--background: #ffffff
--foreground: #000000
--card: #ffffff
--card-foreground: #000000
--popover: #ffffff
--popover-foreground: #000000
--primary: var(--uf-core-orange)              /* #FA4616 */
--primary-foreground: #ffffff
--secondary: var(--uf-core-blue)              /* #0021A5 */
--secondary-foreground: #ffffff
--muted: var(--uf-warm-grey-1)                /* #D8D4D7 */
--muted-foreground: #6b7280
--accent: var(--uf-cool-grey-3)               /* #C7C9C8 */
--accent-foreground: #374151
--destructive: var(--uf-bottlebrush)          /* #D32737 */
--destructive-foreground: #ffffff
--success: var(--uf-gator)                    /* #22884C */
--success-foreground: #ffffff
--warning: var(--uf-alachua)                  /* #F2A900 */
--warning-foreground: #000000
--border: rgba(52, 55, 65, 0.15)             /* 15% opacity of --uf-cool-grey-11 */
--input: transparent
--input-background: #f8f9fa
--switch-background: var(--uf-cool-grey-3)    /* #C7C9C8 */
--ring: var(--uf-core-orange)                 /* #FA4616 */
```

### Focus and Accessibility
```css
--focus-ring: #4285f4                        /* Google Blue for focus indicators */
--focus-ring-width: 2px
--focus-offset: 2px
```

---

## Dark Mode Colors

### Dark Mode Semantic Tokens
```css
.dark {
  --background: var(--uf-cool-grey-11)        /* #343741 */
  --foreground: #ffffff
  --card: var(--uf-cool-grey-11)            /* #343741 */
  --card-foreground: #ffffff
  --popover: var(--uf-cool-grey-11)         /* #343741 */
  --popover-foreground: #ffffff
  --primary: var(--uf-core-orange)          /* #FA4616 */
  --primary-foreground: #ffffff
  --secondary: var(--uf-core-blue)         /* #0021A5 */
  --secondary-foreground: #ffffff
  --muted: var(--uf-dark-blue)             /* #002657 */
  --muted-foreground: var(--uf-cool-grey-3) /* #C7C9C8 */
  --accent: var(--uf-dark-blue)            /* #002657 */
  --accent-foreground: #ffffff
  --destructive: var(--uf-bottlebrush)     /* #D32737 */
  --destructive-foreground: #ffffff
  --border: rgba(199, 201, 200, 0.2)      /* 20% opacity of --uf-cool-grey-3 */
  --input: var(--uf-dark-blue)             /* #002657 */
  --ring: var(--uf-core-orange)            /* #FA4616 */
}
```

### Dark Mode Sidebar Colors
```css
.dark {
  --sidebar: var(--uf-dark-blue)           /* #002657 */
  --sidebar-foreground: #ffffff
  --sidebar-primary: var(--uf-core-orange) /* #FA4616 */
  --sidebar-primary-foreground: #ffffff
  --sidebar-accent: var(--uf-cool-grey-11) /* #343741 */
  --sidebar-accent-foreground: #ffffff
  --sidebar-border: rgba(199, 201, 200, 0.2)
  --sidebar-ring: var(--uf-core-orange)     /* #FA4616 */
}
```

---

## Status Colors

### Game/Event Status Colors (Light Mode)
```css
--status-upcoming: var(--uf-core-blue)                    /* #0021A5 */
--status-upcoming-foreground: #ffffff
--status-upcoming-bg: rgba(0, 33, 165, 0.1)             /* 10% opacity */

--status-in-progress: var(--uf-alachua)                  /* #F2A900 */
--status-in-progress-foreground: #000000
--status-in-progress-bg: rgba(242, 169, 0, 0.1)         /* 10% opacity */

--status-completed: var(--uf-cool-grey-11)               /* #343741 */
--status-completed-foreground: #ffffff
--status-completed-bg: rgba(52, 55, 65, 0.1)            /* 10% opacity */

--status-cancelled: var(--uf-bottlebrush)                /* #D32737 */
--status-cancelled-foreground: #ffffff
--status-cancelled-bg: rgba(211, 39, 55, 0.1)           /* 10% opacity */
```

### Game/Event Status Colors (Dark Mode)
```css
.dark {
  --status-upcoming: var(--uf-core-blue)                 /* #0021A5 */
  --status-upcoming-foreground: #ffffff
  --status-upcoming-bg: rgba(0, 33, 165, 0.2)           /* 20% opacity */

  --status-in-progress: var(--uf-alachua)                /* #F2A900 */
  --status-in-progress-foreground: #000000
  --status-in-progress-bg: rgba(242, 169, 0, 0.2)       /* 20% opacity */

  --status-completed: var(--uf-cool-grey-3)             /* #C7C9C8 */
  --status-completed-foreground: #000000
  --status-completed-bg: rgba(199, 201, 200, 0.2)       /* 20% opacity */

  --status-cancelled: var(--uf-bottlebrush)              /* #D32737 */
  --status-cancelled-foreground: #ffffff
  --status-cancelled-bg: rgba(211, 39, 55, 0.2)         /* 20% opacity */
}
```

---

## Chart Colors

### Data Visualization Colors
```css
--chart-1: var(--uf-core-orange)    /* #FA4616 */
--chart-2: var(--uf-core-blue)      /* #0021A5 */
--chart-3: var(--uf-gator)          /* #22884C */
--chart-4: var(--uf-alachua)        /* #F2A900 */
--chart-5: var(--uf-bottlebrush)     /* #D32737 */
```

---

## Sidebar Colors (Light Mode)

```css
--sidebar: #ffffff
--sidebar-foreground: var(--uf-cool-grey-11)        /* #343741 */
--sidebar-primary: var(--uf-core-orange)            /* #FA4616 */
--sidebar-primary-foreground: #ffffff
--sidebar-accent: var(--uf-warm-grey-1)             /* #D8D4D7 */
--sidebar-accent-foreground: var(--uf-cool-grey-11)  /* #343741 */
--sidebar-border: var(--uf-cool-grey-3)            /* #C7C9C8 */
--sidebar-ring: var(--uf-core-orange)               /* #FA4616 */
```

---

## High Contrast Mode

### High Contrast (Light)
```css
.high-contrast {
  --background: #ffffff
  --foreground: #000000
  --card: #ffffff
  --card-foreground: #000000
  --primary: #000000
  --primary-foreground: #ffffff
  --secondary: #000000
  --secondary-foreground: #ffffff
  --muted: #f0f0f0
  --muted-foreground: #000000
  --border: #000000
  --focus-ring: #0000ff
  --ring: #0000ff
  
  /* All sport colors become black in high contrast */
  --sport-basketball: #000000
  --sport-soccer: #000000
  --sport-tennis: #000000
  --sport-volleyball: #000000
  --sport-football: #000000
  --sport-baseball: #000000
}
```

### High Contrast (Dark)
```css
.high-contrast.dark {
  --background: #000000
  --foreground: #ffffff
  --card: #000000
  --card-foreground: #ffffff
  --primary: #ffffff
  --primary-foreground: #000000
  --secondary: #ffffff
  --secondary-foreground: #000000
  --muted: #1a1a1a
  --muted-foreground: #ffffff
  --border: #ffffff
}
```

---

## Theme Configuration (TypeScript)

### Brand Colors Object
Located in `src/shared/config/theme.ts`:

```typescript
export const brandColors = {
  primary: '#E85A2B',        // Muted from #FA4616 (reduced saturation ~15%)
  primaryHover: '#D14A1F',
  primaryLight: '#F07A4F',
  primaryDark: '#C03D0A',
} as const;
```

**Note:** The TypeScript `brandColors.primary` (#E85A2B) is a muted version of the CSS variable `--uf-core-orange` (#FA4616). The CSS variable takes precedence in most components.

---

## Tailwind CSS Color Configuration

### Tailwind Color Mappings
Located in `tailwind.config.js`:

```javascript
colors: {
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },
  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))",
  },
  destructive: {
    DEFAULT: "hsl(var(--destructive))",
    foreground: "hsl(var(--destructive-foreground))",
  },
  muted: {
    DEFAULT: "hsl(var(--muted))",
    foreground: "hsl(var(--muted-foreground))",
  },
  accent: {
    DEFAULT: "hsl(var(--accent))",
    foreground: "hsl(var(--accent-foreground))",
  },
  popover: {
    DEFAULT: "hsl(var(--popover))",
    foreground: "hsl(var(--popover-foreground))",
  },
  card: {
    DEFAULT: "hsl(var(--card))",
    foreground: "hsl(var(--card-foreground))",
  },
}
```

**Note:** Tailwind expects HSL values, but the CSS variables contain hex colors. The `hsl()` wrapper is used for compatibility, though the actual values are hex.

---

## Color Usage Guidelines

### Primary Colors
- **Orange (#FA4616)**: Primary actions, active states, brand elements, CTAs
- **Blue (#0021A5)**: Navigation, secondary actions, information displays

### Application Rules
- Use orange sparingly for maximum impact
- Blue for supporting elements and information hierarchy
- Sport colors only for categorization, not general UI elements
- Maintain 4.5:1 contrast ratio minimum for text (WCAG AA)
- All colors support both light and dark modes

### Semantic Color Usage
- `--primary`: Main brand color, primary buttons, active states
- `--secondary`: Secondary actions, navigation elements
- `--destructive`: Delete actions, error states, warnings
- `--success`: Success messages, positive feedback
- `--warning`: Warning messages, caution states
- `--muted`: Subtle backgrounds, disabled states
- `--accent`: Hover states, subtle highlights

---

## File Locations

### Primary Color Definitions
- **CSS Variables**: `src/styles/globals.css` (lines 5-221)
- **TypeScript Config**: `src/shared/config/theme.ts`
- **Tailwind Config**: `tailwind.config.js`
- **Design System Docs**: `src/DESIGN_SYSTEM.md`

### Usage Examples
- Components use CSS variables via Tailwind classes
- Direct CSS variable access: `var(--uf-core-orange)`
- Tailwind classes: `bg-primary`, `text-primary`, `border-primary`
- Sport-specific: `bg-sport-basketball`, `text-sport-soccer`

---

## Color Reference Quick Lookup

### Hex Values Summary
```
UF Brand:
  Orange:     #FA4616
  Blue:       #0021A5
  Red:        #D32737
  Yellow:     #F2A900
  Green:      #22884C
  Dark Blue:  #002657
  Purple:     #6A2A60

Neutrals:
  Dark Grey:  #343741
  Light Grey: #C7C9C8
  Warm Grey:  #D8D4D7

Base:
  White:      #ffffff
  Black:      #000000
```

---

## Accessibility Notes

1. **Contrast Ratios**: All text colors meet WCAG 2.1 AA standards (4.5:1 minimum)
2. **Colorblind Support**: Alternative sport colors provided for colorblind users
3. **High Contrast Mode**: Full support with black/white/blue palette
4. **Focus Indicators**: Blue (#4285f4) focus rings for keyboard navigation
5. **Dark Mode**: All colors have dark mode variants with appropriate contrast

---

## Notes

- CSS variables are the source of truth for colors
- TypeScript `brandColors` object contains a muted variant used in some contexts
- Sport colors map directly to UF brand colors for consistency
- All colors support opacity modifiers (e.g., `bg-primary/10` for 10% opacity)
- Colors are theme-aware and automatically switch in dark mode
