# Testing & Sample Scripts

This directory contains development/testing utilities that should **never** be deployed to production or committed with hard-coded secrets.

## Files

### `test-openweather.js`
Node.js script to verify OpenWeatherMap API connectivity.

**Usage:**
```bash
# Set your API key in .env first
echo "VITE_OPENWEATHER_API_KEY=your_key_here" >> .env

# Run the test
node scripts/samples/test-openweather.js
```

**Or use environment variable:**
```bash
OPENWEATHER_API_KEY=your_key_here node scripts/samples/test-openweather.js
```

### `test-weather.html`
Browser-based weather API testing tool with interactive UI.

**Usage:**
1. Open `test-weather.html` in a browser
2. Enter your OpenWeatherMap API key in the input field
3. Click test buttons to verify API responses

**Security:** Keys entered are only stored in browser memory during the session—they are not persisted or sent anywhere except the OpenWeatherMap API.

## Security Best Practices

1. **Never commit API keys** to version control
2. Always use environment variables (`.env`) for keys in Node.js scripts
3. Add `.env` to `.gitignore` (already configured)
4. Rotate keys immediately if accidentally exposed
5. Use separate keys for development and production

## Related Documentation

- Weather service integration: `src/domains/weather/`
- Environment setup: `docs/QUICK_START_GUIDE.md`
- Secret management: _(pending—see TODO task "Add secret scanning pre-commit")_

## Cleanup Notes

These files replace the following legacy artifacts that contained hard-coded keys:
- `test-openweather.js` (root, removed)
- `src/test-weather.html` (removed)

The sanitized versions here use environment variables and user input instead.
