
# TribeUp Social Sports App

A production-ready build of the TribeUp social sports experience. The app is deployed through Vercel and backed by Supabase, but the same codebase can be run locally for day-to-day development and QA.

---

## Deployment Model
- **Production**: Vercel builds the app with `npm run build`, publishing the optimized assets in the `build/` directory as defined in `vercel.json`. Configure environment variables (Supabase keys, third-party APIs, etc.) through the Vercel dashboard before deploying.
- **Local development**: Run the app with Vite’s dev server to iterate quickly, while still pointing at the shared Supabase project (or your own fork).

---

## Quick Start (Local Development)
1. **Prerequisites**
   - Node.js 20.x (LTS) and npm 10.x
   - Supabase project access (anon key)
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Create the `.env` file**
   ```bash
   npm run setup:env
   ```
   Update the generated `.env` with your actual `VITE_SUPABASE_ANON_KEY`. The default project URL is pre-filled.
4. **Start the dev server**
   ```bash
   npm run dev
   ```
   Vite serves the app at `http://localhost:3008` and opens the browser automatically.

---

## Build & Preview Locally
```bash
npm run build          # Outputs production assets to ./build
npx vite preview --host --port 4173
```
Use the preview command to mimic Vercel’s static hosting locally.

---

## npm Scripts
- `npm run dev` – Vite dev server with hot module replacement.
- `npm run build` – Production bundle (minified, console statements removed).
- `npm run setup:env` – Generates a starter `.env` file with the Supabase URL.
- `npm run db:push` / `npm run db:pull` / `npm run db:types` – Supabase database helpers (requires the Supabase CLI).

---

## Environment Variables
The app reads environment variables prefixed with `VITE_`. At minimum configure:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Optional but recommended:**
- `VITE_POSTHOG_API_KEY` - PostHog API key for analytics and error tracking
- `VITE_POSTHOG_HOST` - PostHog host URL (defaults to https://app.posthog.com)

When deploying to Vercel, add these under **Project Settings → Environment Variables**. For local development, store them in `.env` (never commit secrets).

---

## Project Structure Highlights
- `src/domains/` – Domain-driven feature modules (`games`, `locations`, `weather`, `users`).
- `src/shared/` – Reusable UI components, hooks, and utilities.
- `src/core/` – App infrastructure: Supabase client, routing, auth, notifications.
- `supabase/` – SQL migrations, seeds, and configuration synced with Supabase CLI.
- `vercel.json` – Rewrites, headers, and build output configuration for production.

Refer to the domain-specific READMEs in `src/domains/**` for deeper architectural guidance.

---

## Component Library
The app includes a comprehensive design system with reusable components:
- **UI Components**: Facepile, Empty States, Leaderboard, Stats Display, Wizard, Activity Feed
- **Game Components**: Sport Picker, RSVP Section, Attendee List
- **User Components**: Player Card
- **Location Components**: Location Picker with map integration

See `src/shared/components/COMPONENT_LIBRARY.md` for full documentation.
Visit `/design-system` route (when authenticated) to see interactive demos.

## Additional Documentation
- `AUTH_SETUP.md` – Authentication configuration.
- `GOOGLE_OAUTH_SETUP.md` – Google OAuth provider instructions.
- `SUPABASE_SETUP.md` – Supabase project bootstrap steps.
- `USER_TESTING_CHECKLIST.md` – Manual QA flows.
- `REORGANIZATION_SUMMARY.md` / `SETUP_SUMMARY.md` – Context on recent structural changes.
- `src/shared/components/COMPONENT_LIBRARY.md` – Component library documentation.
- `src/shared/patterns/PATTERNS.md` – UI patterns and best practices.

---

## Troubleshooting
- **Supabase errors**: Re-run `npm run setup:env` to regenerate the `.env`, then paste a valid anon key from the Supabase dashboard.
- **Port conflicts**: Update `server.port` in `vite.config.ts` or run `npm run dev -- --port <custom-port>`.
- **Slow builds on Vercel**: Ensure the Node version matches the local environment and that cache-busting console statements are minimized (already handled via Terser config).

---

Questions or deployment changes? Coordinate with the TribeUp platform team to keep the Vercel and Supabase environments aligned.

