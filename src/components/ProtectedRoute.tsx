import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

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
  const location = useLocation();
  
  try {
    const { user, loading } = useAuth();

    // Show simple loading while checking auth state
    if (loading) {
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
