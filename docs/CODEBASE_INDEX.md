# TribeUp Codebase Documentation Index

> **Note:** This is an index to help navigate the codebase. For full code content, see `CODEBASE_DOCUMENTATION.md` (generated separately).

## Quick Links

- **[Full Documentation](./CODEBASE_DOCUMENTATION.md)** - Complete codebase with all source code (2.3MB, ~75k lines)
- **[Structure Overview](./CODEBASE_STRUCTURE.txt)** - Directory tree only (lightweight)
- **[Developer Guide](../src/DEVELOPER_GUIDE.md)** - Development setup and guidelines
- **[Database Schema](./DATABASE_SCHEMA.md)** - Database structure and relationships

## Codebase Overview

### Architecture
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Radix UI
- **State Management:** Zustand + React Query
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Routing:** React Router v6

### Project Structure

```
src/
├── core/              # App infrastructure
│   ├── auth/          # Authentication & authorization
│   ├── config/        # Environment & system config
│   ├── database/      # Supabase client & types
│   ├── routing/       # App routing
│   └── notifications/ # Notification system
│
├── domains/           # Business domains (feature-based)
│   ├── games/        # Game Management System
│   ├── weather/      # Weather Integration
│   ├── locations/    # Location Services
│   ├── tribes/       # Tribe/Social Features
│   └── users/        # User Engagement
│
├── shared/           # Shared across domains
│   ├── components/   # Reusable UI components
│   ├── hooks/        # Shared hooks
│   └── utils/        # Utility functions
│
└── store/            # Global state (Zustand)
```

## Key Domains

### 🎮 Games Domain (`src/domains/games/`)
- **Components:** Game cards, details, creation, chat, RSVP management
- **Hooks:** Game data fetching, real-time updates, participant management
- **Services:** Game actions, participant operations, activity likes
- **Features:** Game creation, joining, real-time updates, weather integration

### 👥 Users Domain (`src/domains/users/`)
- **Components:** Profiles, settings, achievements, friends, onboarding
- **Hooks:** User data, friends, notifications, presence, push notifications
- **Services:** Profile management, friend operations, moderation, feedback
- **Features:** User profiles, social connections, achievements, push notifications

### 📍 Locations Domain (`src/domains/locations/`)
- **Components:** Map views, location pickers, geospatial features
- **Hooks:** Location data, geocoding, distance calculations
- **Services:** Location search, clustering, geospatial queries
- **Features:** Location-based game discovery, map integration

### 🌤️ Weather Domain (`src/domains/weather/`)
- **Components:** Weather widgets, sport-specific forecasts
- **Services:** Weather API integration, suitability scoring
- **Features:** Real-time weather, sport-specific conditions

### 👨‍👩‍👧‍👦 Tribes Domain (`src/domains/tribes/`)
- **Components:** Tribe management, member lists
- **Hooks:** Tribe data, member operations
- **Services:** Tribe operations, member management
- **Features:** Social groups, member coordination

## Core Infrastructure

### Authentication (`src/core/auth/`)
- Multiple auth providers (Google, Apple, Email)
- OAuth flows with proper redirect handling
- Profile management and onboarding
- Protected routes and auth gates

### Database (`src/core/database/`)
- Supabase client configuration
- Type-safe database types
- Service layer for database operations
- Real-time subscriptions

### Routing (`src/core/routing/`)
- App router configuration
- Protected route components
- Public vs authenticated routes

## Generating Documentation

To regenerate the full codebase documentation:

```bash
./scripts/generate-codebase-docs.sh
```

Or manually:
```bash
code2prompt src -O docs/CODEBASE_DOCUMENTATION.md
```

## Documentation Files

- `CODEBASE_DOCUMENTATION.md` - Full codebase with all source code (large, ~2.3MB)
- `CODEBASE_STRUCTURE.txt` - Directory tree only (lightweight)
- `CODEBASE_INDEX.md` - This file (navigation guide)
- `DATABASE_SCHEMA.md` - Database schema reference
- `DEVELOPER_GUIDE.md` - Development setup guide
- Domain-specific READMEs in each domain folder

## Usage Tips

1. **For AI Analysis:** Use `CODEBASE_DOCUMENTATION.md` - paste into ChatGPT/Claude
2. **For Quick Reference:** Use this index or `CODEBASE_STRUCTURE.txt`
3. **For Onboarding:** Start with `DEVELOPER_GUIDE.md` and domain READMEs
4. **For Code Reviews:** Use `CODEBASE_DOCUMENTATION.md` for full context

---

*Last updated: Generated on-demand via `scripts/generate-codebase-docs.sh`*

