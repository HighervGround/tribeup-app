import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { LoadingSpinner } from './ui/loading-spinner';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children = null, 
  requireAuth = true, 
  redirectTo = '/auth' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (loading) {
    console.log('ProtectedRoute: Auth loading...');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
          Debug: Auth loading...
        </div>
      </div>
    );
  }

  console.log('ProtectedRoute: Auth check complete - user:', user?.id || 'none', 'requireAuth:', requireAuth);

  // If auth is required and user is not authenticated, redirect to auth page
  if (requireAuth && !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If auth is not required and user is authenticated, redirect to home
  if (!requireAuth && user) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and can access the route
  return <>{children || null}</>;
}

