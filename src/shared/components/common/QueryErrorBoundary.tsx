import React, { Component, ReactNode } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface QueryErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function QueryErrorFallback({ error, resetErrorBoundary }: QueryErrorFallbackProps) {
  console.error('🚨 [QueryErrorBoundary] Caught error:', error);
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center">
          <AlertTriangle className="w-12 h-12 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-4">
            {error.message || 'An unexpected error occurred while loading data.'}
          </p>
          <details className="text-left bg-muted p-3 rounded text-xs">
            <summary className="cursor-pointer font-medium mb-2">
              Technical Details
            </summary>
            <pre className="whitespace-pre-wrap break-words">
              {error.stack || error.message}
            </pre>
          </details>
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={resetErrorBoundary}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              console.log('🧹 [QueryErrorBoundary] Clearing all cache');
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
          >
            Reset App
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

class SimpleErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 [SimpleErrorBoundary] Error caught:', {
      error: error.message,
      stack: error.stack,
      errorInfo
    });
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return <QueryErrorFallback error={this.state.error} resetErrorBoundary={this.reset} />;
    }

    return this.props.children;
  }
}

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
}

export function QueryErrorBoundary({ children }: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <SimpleErrorBoundary
          onReset={reset}
          fallback={(error, resetErrorBoundary) => (
            <QueryErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
          )}
        >
          {children}
        </SimpleErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
