# TribeUp Code Flow & Runbook

This document walks through the execution flow of the TribeUp Social Sports App and captures the steps required to run it locally.

---

## 1. Boot & Initialization

1. **Entry Point (`src/main.tsx`)**
   - Imports global styles and mounts the React tree.
   - Registers the service worker in production and logs simple performance metrics.
   - Calls `initializeApp()` which creates a React root and renders `<App />`. On fatal errors it reloads the page after 1 s.
2. **Root Component (`src/App.tsx`)**
   - Wraps the entire UI with:
     - `<ErrorBoundary />` – catches unexpected render errors.
     - `<QueryProvider />` – configures a global TanStack Query client and DevTools.
     - `<SimpleAuthProvider />` – restores Supabase auth sessions, ensures a profile exists, and hydrates the global store.
     - `<AppRouter />` – supplies the navigation structure.
   - Renders a global `Toaster` component for notifications.

```
main.tsx -> App.tsx -> ErrorBoundary -> QueryProvider -> SimpleAuthProvider -> AppRouter
```

---

## 2. Routing & Layout

1. **Browser Router (`src/core/routing/AppRouter.tsx`)**
   - Defines all public pages (`/login`, `/public/game/:id`, `/auth/*`, `/legal/*`).
   - Wraps application routes (`/*`) with `<AuthGate />` to block unauthenticated users.
   - Lazily loads domain components for games, users, settings, admin, etc.
   - Legal/feedback pages render inside `Suspense` with loading spinners.
2. **Layout Switcher (`src/shared/components/layout/AppContent.tsx`)**
   - Chooses `MobileLayout` or `DesktopLayout` via `useResponsive()` and renders the current route with `<Outlet />`.

---

## 3. Authentication & State

1. **Supabase Client (`src/core/database/supabase.ts`)**
   - Constructs a singleton client using environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) via `envUtils`.
   - Exposes helper transformers (`transformGameFromDB`, `transformUserFromDB`) to normalize DB rows.
2. **SimpleAuthProvider (`src/core/auth/SimpleAuthProvider.tsx`)**
   - Restores sessions with an 8 s timeout, exposes `signIn`, `signUp`, OAuth, and `signOut`.
   - Ensures a user profile row exists (using `SupabaseService`) before signaling the rest of the app.
   - Hydrates the Zustand store (`src/store/appStore.ts`) with a basic user immediately for responsive UI.
3. **Global Store (`src/store/appStore.ts`)**
   - Persisted Zustand store for user info, cached games, search filters, and UI flags.
   - Service methods update Supabase when preferences change and provide local helpers like `setUser`, `joinGame`, etc.

---

## 4. Data Fetching & Domains

1. **React Query (`src/core/auth/QueryProvider.tsx`)**
   - Centralizes caching: `staleTime` 2 min, `gcTime` 5 min, 2 retry attempts with exponential delay.
   - Exposes the client globally for debugging.
2. **Games Domain Example**
   - `useGamesWithCreators` (`src/domains/games/hooks/useGamesWithCreators.ts`) manually fetches upcoming games from the `games_with_counts` view, then queries participants and user profiles to produce enriched `GameWithCreator` objects.
   - `HomeScreen` (`src/domains/games/components/HomeScreen.tsx`) uses that data, sorts games into Today/Tomorrow/Future buckets, and shows loading/error/timeout UI states. It also hooks into location services (`useLocation`) for distance stats and (optionally) realtime updates (`useAllGamesRealtime` – currently disabled for stability).
3. **Other Domains**
   - `src/domains/locations` provides geolocation helpers (`useLocation`, distance math).
   - `src/domains/users` handles profile editing, onboarding, settings, feedback, etc.
   - Shared components live under `src/shared` (design system, layout, utilities).

---

## 5. Running the App Locally

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Create environment file**
   ```bash
   npm run setup:env
   ```
   - Edit the generated `.env` and add valid Supabase credentials:
     ```
     VITE_SUPABASE_URL=...
     VITE_SUPABASE_ANON_KEY=...
     ```
   - Optional: add API keys for weather, Google Maps, etc.
3. **Start the dev server**
   ```bash
   npm run dev
   ```
   - Vite serves the app at http://localhost:3008 (default). The terminal prints the exact URL and opens the browser automatically.
4. **Production build preview (optional)**
   ```bash
   npm run build
   npx vite preview --host --port 4173
   ```
5. **Supabase connectivity checks**
   - Ensure the Supabase project has the required tables/views (see `supabase/` migrations).
   - Confirm that Vite forwarded env vars (check the console log from `supabase.ts`: it reports whether `SUPABASE_URL`/`ANON_KEY` are set).

---

## 6. Debugging Tips

- **Console logs**: The codebase logs key lifecycle events (auth init, game fetches, realtime connection) – inspect DevTools console first.
- **React Query DevTools**: Enabled automatically when running on `localhost`. Open them to inspect cache entries or refetch manually.
- **Global handles**: `window.supabase` and `window.queryClient` are available for ad‑hoc debugging.
- **Cache issues**: Use the `CacheClearButton` (visible only on localhost) or clear `localStorage` if you suspect stale auth sessions.

---

Refer to `README.md` for high-level project info and to `supabase/` for database schema and migrations.


As a next steps we Can do :
1. phone number login/ guest to see all the events
2. But while registering for the game we need a mail or the phone number
3. And the events, which are past arw also displaying
4. UI/UX of the application is not too responsive not understanding by the user
5. 