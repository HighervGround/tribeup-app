import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSimpleAuth } from '../providers/SimpleAuthProvider';
import { useOnboardingCheck } from '../hooks/useOnboardingCheck';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  skipOnboardingCheck?: boolean; // For routes that should bypass onboarding check
}

export function ProtectedRoute({ 
  children = null, 
  requireAuth = true, 
  redirectTo = '/auth',
  skipOnboardingCheck = false
}: ProtectedRouteProps) {
  const location = useLocation();
  
  try {
    const { user, loading } = useSimpleAuth();
    const { needsOnboarding, isLoading: onboardingLoading } = useOnboardingCheck();

    // Show loading while checking auth state or onboarding status
    if (loading || (user && !skipOnboardingCheck && onboardingLoading)) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      );
    }

    // If auth is required and user is not authenticated, redirect to auth page
    if (requireAuth && !user) {
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // If auth is not required and user is authenticated, redirect to home
    if (!requireAuth && user) {
      return <Navigate to="/" replace />;
    }

    // Check if user needs onboarding (only for authenticated users and when not skipping the check)
    if (user && !skipOnboardingCheck && needsOnboarding) {
      // Don't redirect if already on onboarding page to prevent loops
      // Also don't redirect if coming from onboarding completion
      if (location.pathname !== '/onboarding' && !location.state?.fromOnboarding) {
        console.log('🔄 User needs onboarding, redirecting to /onboarding');
        return <Navigate to="/onboarding" replace />;
      }
    }

    // User is authenticated and can access the route
    return <>{children}</>;
    
  } catch (error) {
    console.error('ProtectedRoute error:', error);
    // On error, show simple loading or redirect to auth
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
}
