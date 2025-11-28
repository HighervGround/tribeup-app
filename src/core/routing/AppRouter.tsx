import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ErrorBoundary } from '@/shared/components/common/ErrorBoundary';
import { QueryErrorBoundary } from '@/shared/components/common/QueryErrorBoundary';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { ProtectedRoute } from '@/core/routing/ProtectedRoute';
import AuthGate from '@/core/auth/AuthGate';
import AppContent from '@/shared/components/layout/AppContent';
import { AnalyticsListener } from '@/core/analytics/AnalyticsListener';

// Lazy load components for better performance
const HomeScreen = lazy(() => import('@/domains/games/components/HomeScreen'));
const PublicHomeScreen = lazy(() => import('@/pages/PublicHomeScreen'));
const SearchDiscovery = lazy(() => import('@/domains/games/components/SearchDiscovery'));
const CreateGame = lazy(() => import('@/domains/games/components/CreateGame'));
const UserProfile = lazy(() => import('@/domains/users/components/UserProfile'));
const EditProfile = lazy(() => import('@/domains/users/components/EditProfile'));
const GameDetails = lazy(() => import('@/domains/games/components/GameDetails'));
const OtherUserProfile = lazy(() => import('@/domains/users/components/OtherUserProfile'));
const NotificationCenter = lazy(() => import('@/shared/components/common/NotificationCenter'));
const Settings = lazy(() => import('@/domains/users/components/Settings'));
const AccessibilitySettings = lazy(() => import('@/domains/users/components/AccessibilitySettings'));
const NotificationSettings = lazy(() => import('@/domains/users/components/NotificationSettings'));
const DesignSystem = lazy(() => import('@/shared/components/common/DesignSystem'));
const DesignSystemShowcase = lazy(() => import('@/pages/DesignSystemShowcase'));
const LeaderboardPage = lazy(() => import('@/domains/users/components/LeaderboardPage'));
const AdminDashboard = lazy(() => import('@/shared/components/common/AdminDashboard'));
import AuthCallback from '@/core/auth/AuthCallback';
const TermsOfService = lazy(() => import('@/core/auth/TermsOfService'));
const PrivacyPolicy = lazy(() => import('@/core/auth/PrivacyPolicy'));
const FeedbackPage = lazy(() => import('@/domains/users/components/FeedbackPage'));

const Onboarding = lazy(() => import('@/domains/users/components/Onboarding'));
const NavigationTest = lazy(() => import('@/shared/components/common/NavigationTest'));
const PublicGamePage = lazy(() => import('@/domains/games/components/PublicGamePage'));
const Auth = lazy(() => import('@/core/auth/Auth'));
const TribeList = lazy(() => import('@/domains/tribes/components/TribeList'));
const TribeDetail = lazy(() => import('@/domains/tribes/components/TribeDetail'));
const CreateTribe = lazy(() => import('@/domains/tribes/components/CreateTribe'));
const TribeEdit = lazy(() => import('@/domains/tribes/components/TribeEdit'));

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
      <AnalyticsListener />
      <ErrorBoundary>
        <QueryErrorBoundary>
          <AppWrapper>
            <Suspense fallback={<RouteLoader text="Loading application..." />}>
              <Routes>
              {/* Public Routes - No Auth Required */}
              <Route path="/" element={<PublicHomeScreen />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding onComplete={() => {}} />} />
              <Route path="/public/game/:gameId" element={<PublicGamePage />} />
              
              {/* Authenticated Routes - require authentication and onboarding */}
              <Route path="/app/*" element={
                <AuthGate>
                  <AppContent />
                </AuthGate>
              }>
                {/* Main App Routes */}
                <Route index element={<HomeScreen />} />
                <Route path="search" element={<SearchDiscovery />} />
                <Route path="create" element={<CreateGame />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="profile/me" element={<UserProfile />} />
                <Route path="profile/edit" element={<EditProfile />} />

                {/* Game Routes */}
                <Route path="game/:gameId" element={<GameDetails />} />

                {/* Tribe Routes */}
                <Route path="tribes" element={<TribeList />} />
                <Route path="tribe/create" element={<CreateTribe />} />
                <Route path="tribe/:tribeId" element={<TribeDetail />} />
                <Route path="tribe/:tribeId/edit" element={<TribeEdit />} />

                {/* User Profile Routes */}
                <Route path="user/:userId" element={<OtherUserProfile />} />
                <Route path="leaderboard" element={<LeaderboardPage />} />

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
                <Route path="design-system" element={<DesignSystemShowcase />} />
    

                {/* Development Routes */}
                <Route path="navigation-test" element={<NavigationTest />} />

                {/* Feedback Route */}
                <Route 
                  path="feedback" 
                  element={
                    <Suspense fallback={<RouteLoader text="Loading feedback..." />}>
                      <FeedbackPage />
                    </Suspense>
                  } 
                />

              </Route>

              {/* Public routes - no authentication required */}
              <Route
                path="/auth"
                element={
                  <Suspense fallback={<RouteLoader text="Loading authentication..." />}>
                    <Auth />
                  </Suspense>
                }
              />
              <Route
                path="/auth/callback"
                element={<AuthCallback />}
              />

              {/* Legacy redirects (backward compatibility with pre-/app paths) */}
              <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
              <Route path="/profile/edit" element={<Navigate to="/app/profile/edit" replace />} />
              <Route path="/search" element={<Navigate to="/app/search" replace />} />
              <Route path="/create" element={<Navigate to="/app/create" replace />} />
              <Route path="/notifications" element={<Navigate to="/app/notifications" replace />} />
              <Route path="/tribes" element={<Navigate to="/app/tribes" replace />} />
              <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
              {/* Dynamic legacy game route */}
              <Route path="/game/:gameId" element={<LegacyGameRedirect />} />

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

// Component for dynamic legacy game redirect
function LegacyGameRedirect() {
  const { gameId } = useParams();
  if (!gameId) return <Navigate to="/" replace />;
  return <Navigate to={`/app/game/${gameId}`} replace />;
}