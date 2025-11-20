# TribeUp Documentation Index

Central hub for all project documentation. Grouped for fast onboarding, maintenance, and AI‑assisted development. Add new docs under the appropriate section; keep titles concise and include a TL;DR at the top of long reports.

## 1. Core Architecture
| Doc | Purpose |
| --- | --- |
| [CODE_FLOW.md](./CODE_FLOW.md) | Runtime boot sequence & providers |
| [CODEBASE_AUDIT_REPORT.md](./CODEBASE_AUDIT_REPORT.md) | High‑level architecture & gaps |
| [CLEANUP_TODO.md](./CLEANUP_TODO.md) | Active structural & refactor tasks |

## 2. Setup & Environment
| Doc | Purpose |
| --- | --- |
| [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) | Post‑reorg quick start & conventions |
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Backend integration & verification steps |
| [AUTH_SETUP.md](./AUTH_SETUP.md) | Auth model, flows & tokens |
| [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) | Domain aligned Google OAuth configuration |

## 3. Authentication & User Lifecycle
| Doc | Purpose |
| --- | --- |
| [AUTH_JOIN_IMPLEMENTATION.md](./AUTH_JOIN_IMPLEMENTATION.md) | Join + profile creation flow details |
| [AUDIT_SUPABASE_ALIGNMENT.md](./AUDIT_SUPABASE_ALIGNMENT.md) | Consistency audit: auth vs DB schema |
| [CLIENT_ENDPOINTS_SUMMARY.md](./CLIENT_ENDPOINTS_SUMMARY.md) | Client → Supabase interaction catalog |

## 4. Friends & Social Graph
| Doc | Purpose |
| --- | --- |
| [FRIENDS_FEATURE_V1.md](./FRIENDS_FEATURE_V1.md) | Initial follow graph specification |
| [FRIENDS_FEATURE_COMPLETE.md](./FRIENDS_FEATURE_COMPLETE.md) | Implementation completion report |
| [CODEBASE_AUDIT_FRIENDS_FEATURE.md](./CODEBASE_AUDIT_FRIENDS_FEATURE.md) | Gap analysis & improvement targets |
| [FRIENDS_FEATURE_V2_USER_RELATIONSHIPS_COMPLEX.md](./FRIENDS_FEATURE_V2_USER_RELATIONSHIPS_COMPLEX.md) | Advanced relationship modeling |
| [FRIENDS_FEATURE_V2_ADVANCED_RECOMMENDATIONS.md](./FRIENDS_FEATURE_V2_ADVANCED_RECOMMENDATIONS.md) | Recommendation engine strategies |

## 5. Ratings & Reviews
| Doc | Purpose |
| --- | --- |
| [GAME_FEATURE_REVIEW_SYSTEM.md](./GAME_FEATURE_REVIEW_SYSTEM.md) | Core game review feature spec |
| [CODEBASE_AUDIT_GAME_REVIEWS.md](./CODEBASE_AUDIT_GAME_REVIEWS.md) | Review feature audit & gaps |
| [CODEBASE_AUDIT_RATING_REVIEW_SYSTEM.md](./CODEBASE_AUDIT_RATING_REVIEW_SYSTEM.md) | Unified rating/review strategy & algorithm notes |

## 6. Database & Migrations
| Doc | Purpose |
| --- | --- |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Simplified schema overview |
| [FIX_DATABASE_NOW.md](./FIX_DATABASE_NOW.md) | Urgent DB remediation checklist |
| [APPLY_FIX.md](./APPLY_FIX.md) | Manual migration execution guide |

## 7. Operational & Maintenance
| Doc | Purpose |
| --- | --- |
| [CLIENT_ENDPOINTS_SUMMARY.md](./CLIENT_ENDPOINTS_SUMMARY.md) | Endpoint usage map |
| [CLIENT_SIDE_BEST_PRACTICES.md](./CLIENT_SIDE_BEST_PRACTICES.md) | Client-side coding standards |
| [APPLY_FIX.md](./APPLY_FIX.md) | Manual fix application guide |
| [REALTIME_TESTING.md](./REALTIME_TESTING.md) | Real-time feature verification |

## 8. Deployment & Launch
| Doc | Purpose |
| --- | --- |
| [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) | Pre-launch verification steps |
| [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) | Production environment config |
| [PRE_LAUNCH_SUMMARY.md](./PRE_LAUNCH_SUMMARY.md) | Pre-launch status report |
| [USER_TESTING_CHECKLIST.md](./USER_TESTING_CHECKLIST.md) | User acceptance testing guide |

## 9. Fix & Integration Reports
| Doc | Purpose |
| --- | --- |
| [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) | Integration patterns & workflows |
| [JOINING_FIX_SUMMARY.md](./JOINING_FIX_SUMMARY.md) | Game join flow fixes |
| [JOIN_FIX_ROOT_CAUSE.md](./JOIN_FIX_ROOT_CAUSE.md) | Join issue root cause analysis |
| [QUICK_FIX_SUMMARY.md](./QUICK_FIX_SUMMARY.md) | Rapid fix documentation |
| [SETUP_SUMMARY.md](./SETUP_SUMMARY.md) | Initial setup completion notes |
| [FRIENDS_INTEGRATED_PROPERLY.md](./FRIENDS_INTEGRATED_PROPERLY.md) | Friends integration verification |

## 10. UI/UX & Design
| Doc | Purpose |
| --- | --- |
| [UI_AUDIT_REPORT.md](./UI_AUDIT_REPORT.md) | UI/UX comprehensive audit |
| [UI_IMPLEMENTATION_SUMMARY.md](./UI_IMPLEMENTATION_SUMMARY.md) | UI feature implementation notes |
| [TERMINOLOGY_UPDATE_SUMMARY.md](./TERMINOLOGY_UPDATE_SUMMARY.md) | Terminology standardization changes |

## 11. External Integrations & Analysis
| Doc | Purpose |
| --- | --- |
| [OAUTH_DOMAIN_SETUP.md](./OAUTH_DOMAIN_SETUP.md) | OAuth domain configuration |
| [api_endpoints_reference.md](./api_endpoints_reference.md) | API endpoint catalog |
| [strava_analysis_report.md](./strava_analysis_report.md) | Strava integration analysis |

## 12. Audits & Schema Reports
| Doc | Purpose |
| --- | --- |
| [SCHEMA_AUDIT_REPORT.md](./SCHEMA_AUDIT_REPORT.md) | Database schema audit findings |
| [REORGANIZATION_SUMMARY.md](./REORGANIZATION_SUMMARY.md) | Codebase reorganization notes |

## 13. Architecture & Roadmaps
| Doc | Purpose |
| --- | --- |
| [SUPABASE_SERVICE_MODULARIZATION_PLAN.md](./SUPABASE_SERVICE_MODULARIZATION_PLAN.md) | Service layer refactoring roadmap |

## 13. Architecture & Roadmaps
| Doc | Purpose |
| --- | --- |
| [SUPABASE_SERVICE_MODULARIZATION_PLAN.md](./SUPABASE_SERVICE_MODULARIZATION_PLAN.md) | Service layer refactoring roadmap |

## 14. Conventions
- Keep root minimal: only `README.md` and `CODE_FLOW.md` (stub pointing here)
- All new feature specs belong under a clear section; add section if none fits
- Large audits must start with a TL;DR block and actionable next steps
- Prefer tables for quick scanning of related docs

## 15. Next Documentation Tasks
- Add UI/Design System & Accessibility section (pull from `src/ACCESSIBILITY_GUIDE.md`, `DESIGN_SYSTEM.md`)
- Create Analytics & Observability doc (metrics, error tracking, performance budgets)
- Introduce revision metadata (Last Reviewed: YYYY‑MM‑DD) in each doc header
- Add secret management & key rotation guide (after pre‑commit hook implementation)

> Update this index with any new doc: keep ordering stable to avoid link churn.
