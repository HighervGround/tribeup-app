# Icon Usage Guide

Complete guide to using icons in the TribeUp app, based on Strava's icon system.

## Table of Contents

1. [Icon System Overview](#icon-system-overview)
2. [Icon Categories](#icon-categories)
3. [Size Guidelines](#size-guidelines)
4. [Color Usage](#color-usage)
5. [Accessibility](#accessibility)
6. [Import Patterns](#import-patterns)

---

## Icon System Overview

The TribeUp icon system uses **Lucide React** as the primary icon library, with emoji support for sports icons.

**Location**: `src/shared/config/iconSystem.ts`

---

## Icon Categories

### Sports Icons

**Location**: `sportIcons` object in `iconSystem.ts`

**Available Sports**:
- `basketball` - Basketball icon
- `soccer` - Soccer icon
- `tennis` - Tennis icon
- `volleyball` - Volleyball icon
- `football` - Football icon
- `baseball` - Baseball icon
- `pickleball` - 🥒 (emoji)
- `running` - 🏃 (emoji)
- `cycling` - 🚴 (emoji)
- `swimming` - 🏊 (emoji)
- `hiking` - 🥾 (emoji)
- `rock_climbing` - 🧗 (emoji)

**Usage**:
```tsx
import { getSportIcon, getSportIconColor } from '@/shared/config/iconSystem';

const SportIcon = getSportIcon('basketball');
<SportIcon size={24} className={getSportIconColor('basketball')} />
```

### UI Icons

**Location**: `uiIcons` object in `iconSystem.ts`

**Available Icons**:
- `search` - Search icon
- `filter` - Filter icon
- `settings` - Settings icon
- `user` - User icon
- `users` - Users icon
- `calendar` - Calendar icon
- `mapPin` - Map pin icon
- `clock` - Clock icon
- `star` - Star icon
- `trophy` - Trophy icon
- `activity` - Activity icon

**Usage**:
```tsx
import { uiIcons } from '@/shared/config/iconSystem';
import { iconSizes } from '@/shared/config/iconSystem';

const SearchIcon = uiIcons.search;
<SearchIcon size={iconSizes.md} />
```

### Action Icons

**Location**: `actionIcons` object in `iconSystem.ts`

**Available Icons**:
- `add` - Plus icon
- `edit` - Edit icon
- `delete` - Trash icon
- `share` - Share icon
- `like` - Heart icon
- `comment` - Message circle icon

### Navigation Icons

**Location**: `navigationIcons` object in `iconSystem.ts`

**Available Icons**:
- `chevronLeft` - Left chevron
- `chevronRight` - Right chevron
- `chevronUp` - Up chevron
- `chevronDown` - Down chevron
- `arrowLeft` - Left arrow
- `arrowRight` - Right arrow

### Status Icons

**Location**: `statusIcons` object in `iconSystem.ts`

**Available Icons**:
- `success` - Check circle
- `error` - X circle
- `warning` - Alert circle
- `info` - Info icon

---

## Size Guidelines

**Icon Size Presets** (from `iconSizes`):
- `xs`: 12px - Small UI elements, inline text
- `sm`: 16px - Standard buttons, navigation
- `md`: 20px - Default size for most icons
- `lg`: 24px - Large buttons, headers
- `xl`: 32px - Hero sections, emphasis
- `2xl`: 48px - Special emphasis, large displays

**Usage**:
```tsx
import { iconSizes } from '@/shared/config/iconSystem';

<Icon size={iconSizes.md} />
```

**Best Practices**:
- Use consistent sizing within components
- Match icon size to text size
- Larger icons for primary actions
- Smaller icons for secondary actions

---

## Color Usage

### Sport Colors

Each sport has a designated color for visual categorization:

```tsx
import { getSportIconColor } from '@/shared/config/iconSystem';

const color = getSportIconColor('basketball'); // Returns '#FA4616'
```

**Sport Color Mapping**:
- Basketball: `#FA4616` (Orange)
- Soccer: `#22884C` (Green)
- Tennis: `#0021A5` (Blue)
- Volleyball: `#D97706` (Amber)
- Football: `#6A2A60` (Purple)
- Baseball: `#D32737` (Red)

### Semantic Colors

Use semantic colors for status and actions:

- **Primary**: `text-primary` - Primary actions
- **Success**: `text-success` - Success states
- **Warning**: `text-warning` - Warnings
- **Destructive**: `text-destructive` - Errors, delete actions
- **Muted**: `text-muted-foreground` - Secondary information

**Usage**:
```tsx
<Icon className="text-primary" />
<Icon className="text-success" />
<Icon className="text-destructive" />
```

---

## Accessibility

### ARIA Labels

Always provide accessible labels for icons:

```tsx
<Icon aria-label="Search" />
<Icon aria-label="Close dialog" />
<Icon aria-label="Delete item" />
```

### Decorative Icons

For decorative icons, use `aria-hidden`:

```tsx
<Icon aria-hidden="true" />
```

### Icon Buttons

Icon buttons should have accessible labels:

```tsx
<Button aria-label="Search">
  <SearchIcon />
</Button>
```

---

## Import Patterns

### Direct Import (Recommended)

```tsx
import { Search, User, Settings } from 'lucide-react';

<Search size={20} />
```

### From Icon System

```tsx
import { uiIcons, iconSizes } from '@/shared/config/iconSystem';

const SearchIcon = uiIcons.search;
<SearchIcon size={iconSizes.md} />
```

### Sport Icons

```tsx
import { getSportIcon, getSportIconColor } from '@/shared/config/iconSystem';

const BasketballIcon = getSportIcon('basketball');
<BasketballIcon 
  size={24} 
  style={{ color: getSportIconColor('basketball') }}
/>
```

---

## Icon Guidelines Summary

1. **Consistency**: Use consistent icon sizes within components
2. **Semantic**: Choose icons that clearly represent their function
3. **Accessibility**: Always provide ARIA labels for interactive icons
4. **Color**: Use semantic colors for status, sport colors for categorization
5. **Size**: Match icon size to text size and importance
6. **Spacing**: Maintain adequate spacing around icons

---

## Common Patterns

### Icon + Text

```tsx
<div className="flex items-center gap-2">
  <Icon size={16} />
  <span>Label</span>
</div>
```

### Icon Button

```tsx
<Button variant="ghost" size="icon" aria-label="Action">
  <Icon size={20} />
</Button>
```

### Icon Badge

```tsx
<div className="relative">
  <Icon size={24} />
  <Badge className="absolute -top-1 -right-1">3</Badge>
</div>
```

---

**Last Updated**: January 2025  
**Version**: 1.0.0

