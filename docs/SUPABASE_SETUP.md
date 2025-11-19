# TribeUp Supabase Integration Setup Guide

## 🚀 Overview

This guide will help you set up Supabase as the backend for your TribeUp social sports app. The integration replaces mock data with real database functionality while preserving all existing frontend components and features.

## 📋 Prerequisites

- A Supabase account (free tier available)
- Node.js 18+ installed
- Your TribeUp app codebase

## 🔧 Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `tribeup-social-sports`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

## 🔑 Step 2: Get Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

## 🗄️ Step 3: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `supabase-schema.sql`
3. Paste it into the SQL editor
4. Click "Run" to execute the schema

This will create:
- ✅ Users table with profiles
- ✅ Games table with location data
- ✅ Game participants (many-to-many)
- ✅ Chat messages
- ✅ Notifications
- ✅ Row Level Security (RLS) policies
- ✅ Database functions for game management
- ✅ Real-time subscriptions

## 🔐 Step 4: Configure Environment Variables

1. Create a `.env` file in your project root:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Replace the placeholder values with your actual Supabase credentials

## 🎯 Step 5: Test the Integration

1. Start your development server:
```bash
npm run dev
```

2. The app should now connect to Supabase instead of using mock data

## 🔍 Step 6: Verify Functionality

Test these features to ensure they work with Supabase:

### Authentication
- [ ] User sign up
- [ ] User sign in
- [ ] User sign out
- [ ] Profile creation

### Games
- [ ] View all games
- [ ] Create new game
- [ ] Join game
- [ ] Leave game
- [ ] View my games

### Real-time Features
- [ ] Chat messaging
- [ ] Game updates
- [ ] User notifications

## 🛠️ Troubleshooting

### Common Issues

**1. Environment Variables Not Found**
```
Error: Missing Supabase environment variables
```
**Solution**: Make sure your `.env` file is in the project root and contains the correct values.

**2. Database Connection Error**
```
Error: Failed to connect to database
```
**Solution**: Check your Supabase URL and anon key are correct.

**3. RLS Policy Errors**
```
Error: Row Level Security policy violation
```
**Solution**: Make sure you're signed in and the user profile exists in the database.

**4. Real-time Not Working**
```
Error: Real-time subscription failed
```
**Solution**: Check that real-time is enabled in your Supabase project settings.

### Debug Mode

To enable debug logging, add this to your `.env`:
```bash
VITE_DEBUG=true
```

## 📊 Database Schema Overview

### Tables Created

1. **users** - User profiles and preferences
2. **games** - Game listings with location data
3. **game_participants** - Many-to-many relationship for game joins
4. **chat_messages** - Real-time chat messages
5. **notifications** - User notifications

### Key Features

- **Row Level Security**: Users can only access their own data
- **Real-time subscriptions**: Live updates for chat and games
- **Geospatial support**: Location-based game discovery
- **Automatic timestamps**: Created/updated timestamps on all records

## 🔒 Security Features

- **RLS Policies**: Database-level security
- **JWT Authentication**: Secure user sessions
- **Input Validation**: SQL injection protection
- **Rate Limiting**: Built into Supabase

## 📈 Performance Optimizations

- **Database Indexes**: Optimized queries for games and users
- **Connection Pooling**: Efficient database connections
- **Caching**: Automatic query result caching
- **CDN**: Global content delivery

## 🚀 Production Deployment

When deploying to production:

1. **Environment Variables**: Set production Supabase credentials
2. **Database Backups**: Enable automatic backups in Supabase
3. **Monitoring**: Set up Supabase analytics
4. **Scaling**: Upgrade Supabase plan as needed

## 📞 Support

If you encounter issues:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review the [TribeUp Developer Guide](./src/DEVELOPER_GUIDE.md)
3. Check the browser console for error messages
4. Verify your database schema matches the SQL file

## 🎉 Success!

Once you've completed these steps, your TribeUp app will have:

- ✅ Real user authentication
- ✅ Persistent game data
- ✅ Real-time chat messaging
- ✅ Location-based game discovery
- ✅ User notifications
- ✅ Scalable backend infrastructure

Your frontend components will work exactly the same, but now with real data persistence and real-time functionality!
