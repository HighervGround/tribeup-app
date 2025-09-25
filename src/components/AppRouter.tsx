import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { QueryErrorBoundary } from './QueryErrorBoundary';
import { LoadingSpinner } from './ui/loading-spinner';
import { ProtectedRoute } from './ProtectedRoute';
import AppContent from './AppContent';

// Lazy load components for better performance
const HomeScreen = lazy(() => import('./HomeScreen'));
const SearchDiscovery = lazy(() => import('./SearchDiscovery'));
const CreateGame = lazy(() => import('./CreateGame'));
const UserProfile = lazy(() => import('./UserProfile'));
const EditProfile = lazy(() => import('./EditProfile'));
const GameDetails = lazy(() => import('./GameDetails'));
const OtherUserProfile = lazy(() => import('./OtherUserProfile'));
const NotificationCenter = lazy(() => import('./NotificationCenter'));
const Settings = lazy(() => import('./Settings'));
const AccessibilitySettings = lazy(() => import('./AccessibilitySettings'));
const NotificationSettings = lazy(() => import('./NotificationSettings'));
const DesignSystem = lazy(() => import('./DesignSystem'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
import AuthCallback from './AuthCallback';
const TermsOfService = lazy(() => import('./TermsOfService'));
const PrivacyPolicy = lazy(() => import('./PrivacyPolicy'));

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
        <QueryErrorBoundary>
          <AppWrapper>
            <Suspense fallback={<RouteLoader text="Loading application..." />}>
              <Routes>
              {/* Protected Routes - require authentication */}
              <Route path="/" element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
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
                element={<AuthCallback />}
              />
              <Route
                path="onboarding"
                element={
                  <Suspense fallback={<RouteLoader text="Loading onboarding..." />}>
                    <Onboarding onComplete={(data) => {
                      console.log('Onboarding completed with data:', data);
                      // The onboarding component handles navigation internally
                    }} />
                  </Suspense>
                }
              />

              {/* Legal Pages */}
              <Route
                path="legal/terms"
                element={
                  <Suspense fallback={<RouteLoader text="Loading terms..." />}>
                    <TermsOfService />
                  </Suspense>
                }
              />
              <Route
                path="legal/privacy"
                element={
                  <Suspense fallback={<RouteLoader text="Loading privacy policy..." />}>
                    <PrivacyPolicy />
                  </Suspense>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppWrapper>
        </QueryErrorBoundary>
      </ErrorBoundary>
    </BrowserRouter>
  );
}