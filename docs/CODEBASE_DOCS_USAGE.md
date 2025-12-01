# Codebase Documentation Tools - Usage Guide

This guide explains how to use `code2prompt` to generate focused documentation for different aspects of your codebase.

## Available Scripts

### 1. Full Codebase Documentation
Generate complete codebase documentation (2.3MB):

```bash
./scripts/generate-codebase-docs.sh
```

**Use for:**
- Complete AI analysis
- Comprehensive code reviews
- Full onboarding documentation

**Output:** `docs/CODEBASE_DOCUMENTATION.md`

---

### 2. Domain-Specific Documentation
Generate documentation for a specific domain:

```bash
./scripts/generate-domain-docs.sh games
./scripts/generate-domain-docs.sh users
./scripts/generate-domain-docs.sh locations
./scripts/generate-domain-docs.sh tribes
./scripts/generate-domain-docs.sh weather
```

**Use for:**
- Focused feature analysis
- Domain-specific AI prompts
- Feature documentation

**Output:** `docs/DOMAIN_[DOMAIN]_DOCUMENTATION.md`

**Example:**
```bash
# Generate games domain docs for AI analysis
./scripts/generate-domain-docs.sh games
# Then paste into ChatGPT: "Analyze this games domain code and suggest improvements"
```

---

### 3. API/Services Documentation
Generate documentation for all service layers:

```bash
./scripts/generate-api-docs.sh
```

**Use for:**
- API endpoint analysis
- Service layer reviews
- Business logic documentation
- Integration planning

**Output:** `docs/API_SERVICES_DOCUMENTATION.md`

**Includes:**
- All `*Service.ts` files
- API call patterns
- Business logic
- Data transformation

---

### 4. Hooks Documentation
Generate documentation for all custom React hooks:

```bash
./scripts/generate-hooks-docs.sh
```

**Use for:**
- Hook pattern analysis
- State management review
- Data fetching patterns
- Reusability assessment

**Output:** `docs/HOOKS_DOCUMENTATION.md`

**Includes:**
- All `use*.ts` and `use*.tsx` files
- Custom hook implementations
- State management patterns

---

### 5. Configuration Documentation
Generate documentation for config and setup:

```bash
./scripts/generate-config-docs.sh
```

**Use for:**
- Environment setup
- Configuration review
- Database setup documentation
- Deployment planning

**Output:** `docs/CONFIG_DOCUMENTATION.md`

**Includes:**
- Environment configuration
- Database setup
- Routing configuration
- Supabase config

---

## Advanced Usage

### Generate Git Diff Documentation
Show changes between branches:

```bash
code2prompt src --git-diff-branch main cole/development -O docs/CHANGES_DOCUMENTATION.md
```

### Generate Specific File Types
Document only components:

```bash
code2prompt src --include "*.tsx" --exclude "*.test.*" -O docs/COMPONENTS_DOCUMENTATION.md
```

### Generate with Line Numbers
Add line numbers for reference:

```bash
code2prompt src -l -O docs/CODEBASE_WITH_LINES.md
```

### Generate Token Map
See which files use the most tokens:

```bash
code2prompt src --token-map --token-map-lines 30
```

---

## Use Cases

### For AI Analysis

**Full Analysis:**
```bash
./scripts/generate-codebase-docs.sh
# Paste into ChatGPT: "Review this codebase and suggest architectural improvements"
```

**Feature-Specific:**
```bash
./scripts/generate-domain-docs.sh games
# Paste into ChatGPT: "Analyze the games domain and suggest performance optimizations"
```

**API Review:**
```bash
./scripts/generate-api-docs.sh
# Paste into ChatGPT: "Review these API services and suggest error handling improvements"
```

### For Onboarding

1. Start with `CODEBASE_INDEX.md` for overview
2. Generate domain docs for the area they'll work on
3. Use hooks/docs for understanding patterns

### For Code Reviews

1. Generate domain-specific docs for the changed area
2. Use git diff documentation for change analysis
3. Reference full docs for context

### For Migration Planning

1. Generate full codebase docs
2. Generate config docs for setup changes
3. Use domain docs for feature migration

---

## File Sizes & Performance

- **Full Codebase:** ~2.3MB, 75k lines, 554k tokens
- **Domain Docs:** ~200-500KB per domain
- **API Docs:** ~300-600KB
- **Hooks Docs:** ~100-200KB
- **Config Docs:** ~50-100KB

**Token Limits:**
- ChatGPT-4: ~128k tokens
- Claude 3: ~200k tokens
- Use domain-specific docs for focused analysis

---

## Tips

1. **Regenerate regularly** - Code changes, docs should too
2. **Use focused docs** - Domain/docs are more useful than full docs for specific tasks
3. **Combine with git diff** - See what changed, not just current state
4. **Exclude test files** - Use `--exclude "*.test.*"` for cleaner docs
5. **Use token map** - Identify large files that might need refactoring

---

## All Generated Files (Git Ignored)

All generated documentation files are excluded from git:
- `CODEBASE_DOCUMENTATION.md`
- `DOMAIN_*_DOCUMENTATION.md`
- `API_SERVICES_DOCUMENTATION.md`
- `HOOKS_DOCUMENTATION.md`
- `CONFIG_DOCUMENTATION.md`

Regenerate them as needed using the scripts above.

