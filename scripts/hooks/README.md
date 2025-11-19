# Git Hooks

This directory contains Git hooks to enforce code quality and security standards.

## Available Hooks

### `pre-commit.sh` - Secret Scanning

Prevents committing sensitive credentials to version control.

**What it catches:**
- OpenWeatherMap API keys
- Supabase URLs and anon keys
- Generic API keys, tokens, secrets
- AWS access keys
- Google OAuth client secrets
- Private key files

**Installation:**

```bash
# One-time setup
cp scripts/hooks/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**Or use this automated installer:**

```bash
npm run install:hooks
```

*(Add this to package.json scripts: `"install:hooks": "cp scripts/hooks/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit"`)*

**Testing:**

```bash
# Test the hook without committing
./scripts/hooks/pre-commit.sh
```

**Bypassing (NOT RECOMMENDED):**

```bash
# Only if you're absolutely sure the detection is a false positive
git commit --no-verify
```

## How It Works

1. **Pre-commit trigger:** Git runs the hook before creating a commit
2. **File scanning:** Checks all staged files (excluding .env.example, docs, etc.)
3. **Pattern matching:** Uses regex to detect common secret formats
4. **Blocking:** Prevents commit if secrets are found
5. **Guidance:** Shows which patterns matched and how to fix

## Customization

Edit `scripts/hooks/pre-commit.sh` to:
- Add new secret patterns to `PATTERNS` array
- Exclude additional file types in `EXCLUDE_PATTERNS`
- Adjust color output or messaging

## Best Practices

1. **Always use .env files** for secrets (never commit .env, only .env.example)
2. **Rotate immediately** if a secret is committed (even in a branch)
3. **Use environment-specific keys** (different keys for dev/staging/prod)
4. **Enable GitHub secret scanning** for additional protection
5. **Review git history** if you suspect past leaks (`git log -S "api_key"`)

## Related Documentation

- Environment setup: `docs/QUICK_START_GUIDE.md`
- Weather API configuration: `scripts/samples/README.md`
- Supabase setup: `docs/SUPABASE_SETUP.md`

## Future Enhancements

- [ ] Add hook for commit message linting
- [ ] Add hook for TypeScript type checking
- [ ] Add hook for ESLint validation
- [ ] Integrate with Husky for easier hook management
- [ ] Add post-checkout hook to verify .env file exists
