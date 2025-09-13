# TribeUp Authentication Setup Guide

## Overview

This guide covers the complete authentication setup for the TribeUp social sports app using Supabase Auth with React and TypeScript.

## 🏗️ Architecture

### Components
- **AuthProvider**: Central authentication state management
- **ProtectedRoute**: Route protection and auth checks
- **Auth**: Sign in/up/reset password UI
- **SupabaseService**: Backend auth operations

### Flow
1. User visits app → AuthProvider checks session
2. If no session → Redirect to `/auth`
3. User signs in → AuthProvider updates state
4. User accesses protected routes → ProtectedRoute validates
5. User signs out → Clear session and redirect

## 🔧 Setup Steps

### 1. Supabase Configuration

#### Enable Auth in Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Authentication → Settings
3. Configure the following:

```bash
# Site URL (for development)
http://localhost:3000

# Redirect URLs
http://localhost:3000/auth
http://localhost:3000/auth?reset=true

# Email templates (optional)
Customize signup, password reset, and confirmation emails
```

#### Email Settings
```bash
# Enable email confirmations
Confirm email: ON
Secure email change: ON

# SMTP Settings (optional for production)
Configure your own SMTP server for better deliverability
```

### 2. Environment Variables

Create `.env` file:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Schema

Ensure your `users` table has the correct structure:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  sports_preferences TEXT[] DEFAULT '{}',
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## 🚀 Usage

### Basic Authentication

#### Sign Up
```typescript
import { useAuth } from '../providers/AuthProvider';

const { signUp } = useAuth();

await signUp(email, password, { name: 'John Doe' });
```

#### Sign In
```typescript
import { useAuth } from '../providers/AuthProvider';

const { signIn } = useAuth();

await signIn(email, password);
```

#### Sign Out
```typescript
import { useAuth } from '../providers/AuthProvider';

const { signOut } = useAuth();

await signOut();
```

#### Reset Password
```typescript
import { useAuth } from '../providers/AuthProvider';

const { resetPassword } = useAuth();

await resetPassword(email);
```

### Protected Routes

#### Protect a Route
```typescript
import { ProtectedRoute } from './ProtectedRoute';

<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

#### Public Route (no auth required)
```typescript
<ProtectedRoute requireAuth={false}>
  <PublicComponent />
</ProtectedRoute>
```

#### Custom Redirect
```typescript
<ProtectedRoute redirectTo="/custom-login">
  <YourComponent />
</ProtectedRoute>
```

### Access User Data

#### In Components
```typescript
import { useAuth } from '../providers/AuthProvider';

const { user, session } = useAuth();

if (user) {
  console.log('User ID:', user.id);
  console.log('User Email:', user.email);
}
```

#### In Store
```typescript
import { useAppStore } from '../store/appStore';

const { user } = useAppStore();

if (user) {
  console.log('User Profile:', user);
}
```

## 🔒 Security Features

### 1. Session Management
- Automatic session persistence
- Secure session storage
- Automatic token refresh

### 2. Route Protection
- All app routes require authentication
- Automatic redirect to login
- Loading states during auth checks

### 3. Password Security
- Secure password reset flow
- Email confirmation required
- Password strength validation (client-side)

### 4. Row Level Security
- Database-level security policies
- User can only access their own data
- Secure API endpoints

## 🎨 UI Components

### Auth Screen Features
- Sign in/Sign up toggle
- Password reset functionality
- Email confirmation messages
- Loading states
- Error handling
- Success notifications

### Responsive Design
- Mobile-first approach
- Desktop-friendly layout
- Accessible form controls

## 🔧 Configuration Options

### AuthProvider Props
```typescript
interface AuthProviderProps {
  children: React.ReactNode;
  // Additional configuration options can be added here
}
```

### ProtectedRoute Props
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // Default: true
  redirectTo?: string;   // Default: '/auth'
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "Invalid login credentials"
- Check email/password
- Ensure user exists
- Verify email confirmation

#### 2. "Email not confirmed"
- Check spam folder
- Resend confirmation email
- Verify email address

#### 3. "Session expired"
- Automatic redirect to login
- Clear local storage if needed
- Check token refresh

#### 4. "Route protection not working"
- Ensure AuthProvider wraps app
- Check ProtectedRoute usage
- Verify auth state

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('supabase.debug', 'true');
```

## 📱 Mobile Considerations

### Deep Linking
- Handle auth redirects on mobile
- Configure app URLs
- Test on real devices

### Biometric Auth (Future)
- Face ID/Touch ID integration
- Secure keychain storage
- Native auth flows

## 🚀 Production Deployment

### Environment Setup
```bash
# Production environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

### Security Checklist
- [ ] HTTPS enabled
- [ ] Secure cookies
- [ ] CORS configured
- [ ] Rate limiting
- [ ] Email verification required
- [ ] Password policies enforced

### Monitoring
- Auth success/failure rates
- Session duration analytics
- Error tracking
- User engagement metrics

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React Router Documentation](https://reactrouter.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

When adding new auth features:
1. Update this documentation
2. Add TypeScript types
3. Include error handling
4. Test on mobile devices
5. Update security policies

