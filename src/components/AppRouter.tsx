import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSpinner } from './ui/loading-spinner';
import { ProtectedRoute } from './ProtectedRoute';
import { ProfileCheck } from './ProfileCheck';
import AppContent from './AppContent';

// Lazy load components for better performance
const HomeScreen = lazy(() => import('./HomeScreen'));
const SearchDiscovery = lazy(() => import('./SearchDiscovery'));
const CreateGame = lazy(() => import('./CreateGame'));
const UserProfile = lazy(() => import('./UserProfile'));
const GameDetails = lazy(() => import('./GameDetails'));
const OtherUserProfile = lazy(() => import('./OtherUserProfile'));
const NotificationCenter = lazy(() => import('./NotificationCenter'));
const Settings = lazy(() => import('./Settings'));
const AccessibilitySettings = lazy(() => import('./AccessibilitySettings'));
const NotificationSettings = lazy(() => import('./NotificationSettings'));
const DesignSystem = lazy(() => import('./DesignSystem'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const AuthCallback = lazy(() => import('./AuthCallback'));

const Onboarding = lazy(() => import('./Onboarding'));
const NavigationTest = lazy(() => import('./NavigationTest'));
const Auth = lazy(() => import('./Auth'));

// Simple loading component
const RouteLoader = ({ text = "Loading..." }: { text?: string }) => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <LoadingSpinner size="lg" text={text} />
  </div>
);

// AppWrapper component for consistent layout
const AppWrapper = ({ children }: { children: React.ReactNode }) => (
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
              {/* Protected Routes - require authentication */}
              <Route path="/" element={
                <ProtectedRoute>
                  <ProfileCheck>
                    <AppContent />
                  </ProfileCheck>
                </ProtectedRoute>
              }>
                {/* Main App Routes */}
                <Route index element={<HomeScreen />} />
                <Route path="search" element={<SearchDiscovery />} />
                <Route path="create" element={<CreateGame />} />
                <Route path="profile" element={<UserProfile />} />

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

                {/* Admin Routes */}
                <Route path="admin" element={<AdminDashboard />} />

                {/* Design System Routes */}
                <Route path="design" element={<DesignSystem onBack={() => {}} />} />
    

                {/* Development Routes */}
                <Route path="navigation-test" element={<NavigationTest />} />

              </Route>

              {/* Public routes - no authentication required */}
              <Route
                path="/auth"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Suspense fallback={<RouteLoader text="Loading authentication..." />}>
                      <Auth />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/auth/callback"
                element={
                  <Suspense fallback={<RouteLoader text="Processing authentication..." />}>
                    <AuthCallback />
                  </Suspense>
                }
              />
              <Route
                path="onboarding"
                element={
                  <Suspense fallback={<RouteLoader text="Loading onboarding..." />}>
                    <Onboarding onComplete={() => {}} />
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