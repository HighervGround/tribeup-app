# TribeUp Social Sports App

A modern React-based social sports platform that helps people organize and join local sports activities.

## Features

- 🏀 Create and join sports games
- 📱 Mobile-responsive design
- 🗺️ Location-based game discovery
- ☀️ Weather integration
- 👥 Social features and user profiles
- 🔐 Secure authentication

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Vercel
- **Maps**: Google Maps API
- **Weather**: WeatherAPI

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your API keys:
   - Supabase URL and anon key
   - Google Maps API key  
   - Weather API key

3. **Start development server**
   ```bash
   npm run dev
   ```

## Environment Variables

See `.env.example` for required environment variables. You'll need:
- Supabase project credentials
- Google Maps API key
- WeatherAPI key

## Deployment

The app is configured for Vercel deployment. Set environment variables in your Vercel dashboard.

## Security

⚠️ **Never commit real API keys to version control.** Always use environment variables and `.env.example` for templates.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.