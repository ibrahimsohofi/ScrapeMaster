'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { handleError, reportError, ApplicationError } from '@/lib/error-handler';

interface ErrorInfo {
  componentStack: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorId: string, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  showDetails?: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private maxRetries: number;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.maxRetries = props.maxRetries || 3;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;

    this.setState({ errorInfo });

    // Log error using our centralized error handler
    const handledError = handleError(error);

    // Report the error with context
    reportError(handledError, {
      errorInfo,
      source: 'ErrorBoundary',
      retryCount: this.state.retryCount,
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;

    if (retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: retryCount + 1,
      });
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    });
  };

  render() {
    const { hasError, error, errorInfo, errorId, retryCount } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorId || 'unknown', this.handleRetry);
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl font-semibold text-red-600 dark:text-red-400">
                Something went wrong
              </CardTitle>
              <CardDescription>
                An unexpected error occurred while rendering this component.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error message */}
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {error.message || 'An unexpected error occurred'}
                </p>
              </div>

              {/* Error ID for support */}
              {errorId && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Error ID:</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {errorId}
                  </Badge>
                </div>
              )}

              {/* Retry information */}
              {retryCount > 0 && (
                <div className="text-sm text-muted-foreground">
                  Retry attempts: {retryCount} / {this.maxRetries}
                </div>
              )}

              {/* Error details (development only or when showDetails is true) */}
              {(process.env.NODE_ENV === 'development' || showDetails) && errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    <Bug className="inline h-4 w-4 mr-1" />
                    Technical Details
                  </summary>
                  <div className="mt-2 rounded-lg bg-muted p-3">
                    <div className="space-y-2 text-xs font-mono">
                      <div>
                        <strong>Error:</strong>
                        <pre className="mt-1 whitespace-pre-wrap break-all">
                          {error.stack}
                        </pre>
                      </div>
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    </div>
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {retryCount < this.maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    variant="default"
                    size="sm"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}

                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>

              {/* Additional help */}
              <div className="text-center text-sm text-muted-foreground">
                If this problem persists, please{' '}
                <button
                  className="text-primary hover:underline"
                  onClick={() => {
                    // In a real app, this would open a support form or email
                    window.open(`mailto:support@datavault.com?subject=Error Report&body=Error ID: ${errorId}%0A%0APlease describe what you were doing when this error occurred.`);
                  }}
                >
                  contact support
                </button>
                {errorId && ` and include error ID: ${errorId}`}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for easy error boundary wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for programmatic error throwing (useful for async errors)
export function useErrorBoundary() {
  const [, setState] = React.useState();

  return React.useCallback((error: Error) => {
    setState(() => {
      throw error;
    });
  }, []);
}

// Async error boundary for handling promise rejections
export function AsyncErrorBoundary({ children, ...props }: ErrorBoundaryProps) {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Convert unhandled promise rejection to an error that can be caught by error boundary
      const error = new Error(
        event.reason instanceof Error ? event.reason.message : String(event.reason)
      );
      error.stack = event.reason instanceof Error ? event.reason.stack : undefined;

      // Throw the error in the next tick so it can be caught by the error boundary
      setTimeout(() => {
        throw error;
      }, 0);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <ErrorBoundary {...props}>{children}</ErrorBoundary>;
}

export default ErrorBoundary;
