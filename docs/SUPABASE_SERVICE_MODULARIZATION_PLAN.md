# Supabase Service Modularization Plan

**Status:** Draft Roadmap  
**Last Updated:** November 19, 2025  
**Priority:** Medium (foundation for future scalability)

## Current State

The codebase currently uses a monolithic `supabaseService` pattern that centralizes all database interactions in a single large service module. While this works for initial development, it creates several maintenance challenges:

### Problems with Current Approach

1. **File Size:** Large service files become difficult to navigate and maintain
2. **Coupling:** Changes in one domain affect unrelated domains
3. **Testing:** Hard to test individual features in isolation
4. **Onboarding:** New developers must understand entire service to modify one feature
5. **Code Review:** Large files make targeted reviews harder
6. **Import Bloat:** Components import entire service when they need one function
7. **Performance:** Bundlers can't tree-shake unused database operations

### Current Service Organization

```
src/
  core/
    database/
      supabase.ts              # Client singleton + transformers
      supabaseService.ts       # MONOLITHIC: all DB operations
```

**Typical size:** 500-1500 lines of mixed concerns (auth, profiles, games, messages, notifications, friends, etc.)

## Proposed Architecture

### Domain-Specific Services

Split the monolithic service into focused, domain-aligned modules:

```
src/
  core/
    database/
      supabase.ts              # Client singleton (unchanged)
      baseService.ts           # Shared utilities & error handling
      
  domains/
    users/
      services/
        profileService.ts      # User profiles, preferences, stats
        authService.ts         # Auth helpers (if not in core/auth)
        
    games/
      services/
        gameService.ts         # CRUD for games
        participantService.ts  # Join/leave/RSVP operations
        gameQueryService.ts    # Advanced queries & filters
        
    social/
      services/
        friendService.ts       # Follow/unfollow, suggestions
        messageService.ts      # Chat & DMs
        notificationService.ts # Notifications & subscriptions
        
    locations/
      services/
        venueService.ts        # Venue CRUD & search
        geocodeService.ts      # Geocoding utilities
        
    weather/
      services/
        weatherService.ts      # Already modularized! ✅
```

### Shared Base Service

Create a `baseService.ts` with common patterns:

```typescript
// src/core/database/baseService.ts
import { supabase } from './supabase';

export class BaseService {
  protected handleError(context: string, error: any) {
    console.error(`[${context}]`, error);
    throw new Error(`${context}: ${error.message || 'Unknown error'}`);
  }
  
  protected transformTimestamps(data: any) {
    // Common timestamp parsing logic
    return data;
  }
  
  protected async withRetry<T>(
    operation: () => Promise<T>,
    retries = 2
  ): Promise<T> {
    // Retry logic for transient failures
    for (let i = 0; i <= retries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === retries) throw error;
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
    throw new Error('Retry failed');
  }
}
```

### Example: Game Service

```typescript
// src/domains/games/services/gameService.ts
import { supabase } from '@/core/database/supabase';
import { BaseService } from '@/core/database/baseService';
import type { Game, GameInsert } from '@/domains/games/types';

export class GameService extends BaseService {
  async getById(id: string): Promise<Game | null> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*, creator:users(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data ? this.transformGame(data) : null;
    } catch (error) {
      this.handleError('GameService.getById', error);
    }
  }
  
  async create(game: GameInsert): Promise<Game> {
    try {
      const { data, error } = await supabase
        .from('games')
        .insert(game)
        .select()
        .single();
      
      if (error) throw error;
      return this.transformGame(data);
    } catch (error) {
      this.handleError('GameService.create', error);
    }
  }
  
  private transformGame(raw: any): Game {
    // Domain-specific transformation logic
    return {
      ...raw,
      createdAt: new Date(raw.created_at),
      gameTime: new Date(raw.game_time),
    };
  }
}

// Export singleton
export const gameService = new GameService();
```

### Migration Strategy

**Phase 1: Foundation (Week 1)**
- [ ] Create `baseService.ts` with shared utilities
- [ ] Document service interface patterns
- [ ] Set up testing infrastructure for services

**Phase 2: Extract Core Domains (Week 2-3)**
- [ ] Extract `profileService` (users domain)
- [ ] Extract `gameService` (games domain)
- [ ] Extract `participantService` (games domain)
- [ ] Update imports in affected components

**Phase 3: Extract Social Features (Week 4)**
- [ ] Extract `friendService` (social domain)
- [ ] Extract `messageService` (social domain)
- [ ] Extract `notificationService` (social domain)

**Phase 4: Polish & Optimize (Week 5)**
- [ ] Extract remaining services (venues, etc.)
- [ ] Remove old monolithic service file
- [ ] Update all component imports
- [ ] Document service APIs in domain READMEs
- [ ] Add JSDoc comments to public methods

## Benefits

### Developer Experience
- **Focused Context:** Work on one domain without seeing unrelated code
- **Faster Onboarding:** New devs learn one service at a time
- **Better IDE Support:** Autocomplete works better with smaller files
- **Clearer Ownership:** Each service has a clear maintainer

### Code Quality
- **Testability:** Mock individual services in tests
- **Type Safety:** Domain-specific types enforced at service boundary
- **Error Handling:** Consistent patterns via `BaseService`
- **Logging:** Contextual logs per service

### Performance
- **Tree Shaking:** Unused services excluded from bundle
- **Code Splitting:** Services loaded on-demand per route
- **Cache Granularity:** React Query cache keys scoped to service
- **Bundle Size:** Smaller initial load (estimated 15-20% reduction)

## Testing Strategy

### Unit Tests (per service)
```typescript
// src/domains/games/services/gameService.test.ts
import { gameService } from './gameService';
import { supabase } from '@/core/database/supabase';

jest.mock('@/core/database/supabase');

describe('GameService', () => {
  it('should fetch game by ID', async () => {
    const mockGame = { id: '123', title: 'Test Game' };
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockGame, error: null }),
    });
    
    const game = await gameService.getById('123');
    expect(game?.title).toBe('Test Game');
  });
});
```

### Integration Tests
- Test service interactions (e.g., creating game + joining participant)
- Use Supabase local instance or test database
- Verify RLS policies work with service methods

## Rollout Checklist

Before merging each service extraction:
- [ ] All unit tests passing
- [ ] No TypeScript errors
- [ ] Updated imports in all components
- [ ] Service documented in domain README
- [ ] Manual smoke test of affected features
- [ ] Performance benchmarks (bundle size, query time)

## Migration Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking changes during migration | Feature flags to toggle old vs new service |
| Import path confusion | Create migration guide with find/replace patterns |
| Missed dependencies | Grep for old service imports before each PR |
| Performance regression | Benchmark before/after each extraction |
| Testing gaps | Require 80% coverage for new services |

## Alternative Approaches Considered

### 1. Keep Monolithic Service
**Pros:** No migration cost, familiarity  
**Cons:** Technical debt compounds as app grows  
**Decision:** Rejected—doesn't scale to planned features (analytics, matchmaking, tournaments)

### 2. Functional Modules (not classes)
**Pros:** Simpler, tree-shakes naturally  
**Cons:** Harder to share utilities, no inheritance  
**Decision:** Consider for future greenfield services; use classes for migration consistency

### 3. Repository Pattern
**Pros:** Industry standard, clean separation  
**Cons:** More boilerplate, steeper learning curve  
**Decision:** May adopt later if team grows; overkill for current size

## Success Metrics

Track these before/after migration:
- **Bundle Size:** Main chunk size reduction
- **Dev Satisfaction:** Survey team on code navigability
- **PR Review Time:** Average time to review service-related PRs
- **Test Coverage:** Service-level coverage percentage
- **Build Time:** TypeScript compilation duration
- **Onboarding Time:** How long new devs take to make first service change

## Next Steps

1. **Spike:** Prototype `gameService` extraction in feature branch
2. **Review:** Team review of prototype approach
3. **Decision:** Go/no-go on full migration (based on spike learnings)
4. **Plan:** Finalize timeline & assign ownership
5. **Execute:** Phase 1 implementation (foundation)

## Related Documentation

- Current architecture: `docs/CODE_FLOW.md`
- Domain structure: `docs/QUICK_START_GUIDE.md`
- Testing strategy: _(to be created)_
- Service API reference: _(to be created per domain)_

## Questions & Answers

**Q: Can we do this incrementally?**  
A: Yes! Each service can be extracted independently. Old monolithic service can coexist during migration.

**Q: Will this break existing features?**  
A: No, if done carefully. We'll use feature flags and comprehensive testing.

**Q: How long will full migration take?**  
A: Estimated 4-5 weeks part-time (assuming 10-15 hrs/week dedicated to refactor).

**Q: Do we need this now?**  
A: Not urgent, but beneficial before adding complex features (matchmaking, analytics, tournaments).

---

**Action Required:** Review this plan and schedule a team discussion to approve/refine the approach before starting Phase 1.
