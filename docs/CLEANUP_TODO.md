# Cleanup & Restructure TODO (Phase 1)

Completed (this phase):
- Removed duplicate service worker at `src/public/sw.js` (keeping `public/sw.js`).
- Removed unused emergency CSS `src/light-mode-fix.css`.
- Removed orphan duplicate QueryProvider under `React TribeUp Social Sports App/`.

Pending (next phases):
1. Move test artifacts:
   - `src/test-weather.html` and `test-openweather.js` -> `scripts/samples/` (scrub API keys).
2. Consolidate documentation:
   - Move audit/report markdown files into `docs/` and create `docs/INDEX.md`.
3. Merge styling overrides:
   - Fold `fix-colors.css` rules into `styles/globals.css` or Tailwind layers; then remove file.
4. Secret scanning:
   - Add lightweight pre-commit hook (grep for common key patterns) or integrate a tool (e.g., `git-secrets`).
5. Supabase service modularization:
   - Split `supabaseService.ts` into `authService.ts`, `profileService.ts`, `gameService.ts`, `notificationService.ts`.
6. Remove stray shell scripts or move them under `scripts/ops/`.
7. Add integration tests for auth/onboarding and game listing (ensure no past games appear in “Upcoming”).

Suggested execution order for next PR:
A. Move & scrub test artifacts.
B. Docs consolidation.
C. Service modularization.
D. Styling merge & remove `fix-colors.css`.
E. Add secret scan hook.

Verification checklist after each step:
- Run `npm run dev` and confirm auth, routing, and game listing still work.
- Check browser console for missing asset or service worker errors.
- Ensure no sensitive keys remain in committed files (`grep -R "apikey" -i .`).

Update this file as tasks complete.
