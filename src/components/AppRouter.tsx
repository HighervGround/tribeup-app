import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSpinner } from './ui/loading-spinner';
import { ProtectedRoute } from './ProtectedRoute';
import { ProfileCheck } from './ProfileCheck';
import { useAuth } from '../providers/AuthProvider';
import { useAppStore } from '../store/appStore';
import { SupabaseService } from '../lib/supabaseService';

// Lazy load components for better performance
const HomeScreen = lazy(() => import('./HomeScreen').then(module => ({ default: module.HomeScreen })));
const SearchDiscovery = lazy(() => import('./SearchDiscovery').then(module => ({ default: module.SearchDiscovery })));
const CreateGame = lazy(() => import('./CreateGame').then(module => ({ default: module.CreateGame })));
const UserProfile = lazy(() => import('./UserProfile').then(module => ({ default: module.UserProfile })));
const EditProfile = lazy(() => import('./EditProfile').then(module => ({ default: module.EditProfile })));
const Onboarding = lazy(() => import('./Onboarding').then(module => ({ default: module.Onboarding })));
const GameDetails = lazy(() => import('./GameDetails').then(module => ({ default: module.GameDetails })));
const OtherUserProfile = lazy(() => import('./OtherUserProfile').then(module => ({ default: module.OtherUserProfile })));
const NotificationCenter = lazy(() => import('./NotificationCenter').then(module => ({ default: module.NotificationCenter })));
const Settings = lazy(() => import('./Settings').then(module => ({ default: module.Settings })));
const AccessibilitySettings = lazy(() => import('./AccessibilitySettings').then(module => ({ default: module.AccessibilitySettings })));
const NotificationSettings = lazy(() => import('./NotificationSettings').then(module => ({ default: module.NotificationSettings })));
const PrivacyPolicy = lazy(() => import('./PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./TermsOfService').then(module => ({ default: module.TermsOfService })));
const DesignSystem = lazy(() => import('./DesignSystem').then(module => ({ default: module.DesignSystem })));
const AppContent = lazy(() => import('./AppContent').then(module => ({ default: module.AppContent })));
const NavigationTest = lazy(() => import('./NavigationTest').then(module => ({ default: module.NavigationTest })));
const Auth = lazy(() => import('./Auth').then(module => ({ default: module.Auth })));
const AuthCallback = lazy(() => import('../pages/AuthCallback').then(module => ({ default: module.AuthCallback })));
const PublicGamePage = lazy(() => import('./PublicGamePage').then(module => ({ default: module.PublicGamePage })));

// Wrapper component to handle Onboarding completion
const OnboardingWrapper = () => {
  const navigate = useNavigate();
  const [isComplete, setIsComplete] = useState(false);
  const { user } = useAuth();
  const { setUser } = useAppStore();
  
  const handleComplete = async (profileData: any) => {
    console.log('Onboarding complete, saving profile...', profileData);
    
    if (!user) {
      console.error('No user found when completing onboarding');
      return;
    }
    
    try {
      // Prepare the profile data
      const profileUpdate = {
        name: `${profileData.firstName} ${profileData.lastName}`.trim(),
        email: user.email || '',
        ...(profileData.bio && { bio: profileData.bio }),
        ...(profileData.skillLevel && { skill_level: profileData.skillLevel }),
        // Add any other profile fields you need to save
      };
      
      console.log('Saving profile with data:', profileUpdate);
      
      // Save the profile data to Supabase
      await SupabaseService.createUserProfile(user.id, profileUpdate);
      
      // Fetch the updated profile to ensure we have all fields
      const updatedProfile = await SupabaseService.getUserProfile(user.id);
      
      if (!updatedProfile) {
        throw new Error('Failed to fetch updated profile');
      }
      
      console.log('Profile saved successfully:', updatedProfile);
      
      // Update the user in the app store
      setUser(updatedProfile);
      
      // Update the current history state before navigating
      const currentState = window.history.state?.usr || {};
      window.history.replaceState(
        { ...window.history.state, usr: { ...currentState, fromOnboarding: true } },
        ''
      );
      
      // Navigate to home
      console.log('Navigating to home...');
      navigate('/', { 
        replace: true,
        state: { fromOnboarding: true }
      });
      
    } catch (error) {
      console.error('Error saving profile:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <Suspense fallback={<RouteLoader text="Loading onboarding..." />}>
      <Onboarding onComplete={handleComplete} />
    </Suspense>
  );
};

// Wrapper component to handle ProtectedRoute with ProfileCheck
const ProtectedRouteWithProfileCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const content = (
    <ProfileCheck>
      {children}
    </ProfileCheck>
  );
  
  return (
    <ProtectedRoute requireAuth={true}>
      {content}
    </ProtectedRoute>
  );
};

// Wrapper component for auth route
const AuthRouteWrapper: React.FC = () => {
  const authContent = (
    <Suspense fallback={<RouteLoader text="Loading authentication..." />}>
      <Auth />
    </Suspense>
  );
  
  return (
    <ProtectedRoute requireAuth={false}>
      {authContent}
    </ProtectedRoute>
  );
};

// Simple loading component
const RouteLoader = ({ text = "Loading..." }: { text?: string }) => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <LoadingSpinner size="lg" text={text} />
  </div>
);

// AppWrapper component for consistent layout
const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-background">
    {children}
  </div>
);

// Main Router Component
export function AppRouter() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppWrapper>
          <Suspense fallback={<RouteLoader text="Loading application..." />}>
            <Routes>
              {/* Layout Route - wraps all routes that need the standard layout */}
              <Route path="/" element={
                <ProtectedRouteWithProfileCheck>
                  <AppContent />
                </ProtectedRouteWithProfileCheck>
              }>
                {/* Main App Routes */}
                <Route index element={<HomeScreen />} />
                <Route path="search" element={<SearchDiscovery />} />
                <Route path="create" element={<CreateGame />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="profile/edit" element={<EditProfile />} />


                {/* Game Routes */}
                <Route path="game/:gameId" element={<GameDetails />} />


                {/* User Profile Routes */}
                <Route path="user/:userId" element={<OtherUserProfile />} />

                {/* Notification Routes */}
                <Route path="notifications" element={<NotificationCenter />} />

                {/* Settings Routes */}
                <Route path="settings" element={<Settings />} />
                <Route path="settings/accessibility" element={<AccessibilitySettings />} />
                <Route path="settings/notifications" element={<NotificationSettings />} />

                {/* Legal Routes */}
                <Route path="legal/privacy" element={<PrivacyPolicy />} />
                <Route path="legal/terms" element={<TermsOfService />} />

                {/* Design System Routes */}
                <Route path="design" element={<DesignSystem onBack={function (): void {
                  throw new Error('Function not implemented.');
                } } />} />
    

                {/* Development Routes */}
                <Route path="navigation-test" element={<NavigationTest />} />

              </Route>

              {/* Special routes that don't use the standard layout */}
              <Route
                path="auth"
                element={<AuthRouteWrapper />}
              />
              <Route
                path="auth/callback"
                element={
                  <Suspense fallback={<RouteLoader text="Completing sign in..." />}>
                    <AuthCallback />
                  </Suspense>
                }
              />
              <Route
                path="onboarding"
                element={<OnboardingWrapper />}
              />

              {/* Public Game Page - accessible without authentication */}
              <Route
                path="public/game/:gameId"
                element={
                  <Suspense fallback={<RouteLoader text="Loading game..." />}>
                    <PublicGamePage />
                  </Suspense>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppWrapper>
      </ErrorBoundary>
    </BrowserRouter>
  );
}