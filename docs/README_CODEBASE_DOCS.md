# Codebase Documentation

This directory contains generated codebase documentation files.

## Files

### 📚 CODEBASE_DOCUMENTATION.md (2.3MB)
**Full codebase with all source code** - Use for AI analysis, comprehensive reviews, or onboarding.

### 📋 CODEBASE_INDEX.md (4.7KB)
**Navigation guide** - Quick reference for codebase structure and key domains.

### 📁 CODEBASE_STRUCTURE.txt
**Directory tree** - Lightweight structure overview (if generated).

## Generating Documentation

Run the generation script:

```bash
./scripts/generate-codebase-docs.sh
```

Or manually:

```bash
code2prompt src -O docs/CODEBASE_DOCUMENTATION.md
```

## Usage

- **AI Analysis:** Use `CODEBASE_DOCUMENTATION.md` - paste into ChatGPT/Claude for codebase analysis
- **Quick Reference:** Use `CODEBASE_INDEX.md` for navigation
- **Onboarding:** Start with domain READMEs and this index
- **Code Reviews:** Use full documentation for complete context

## Note

These files are **excluded from git** (see `.gitignore`) because they are:
- Large (2.3MB+)
- Regeneratable on-demand
- Not needed for version control

Regenerate them when needed using the script above.

