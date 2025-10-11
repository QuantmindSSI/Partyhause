import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useRenderSafety } from '@/lib/render-safety';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number;
}

/**
 * Hardened Error Boundary with Render Loop Detection
 * 
 * Features:
 * - Detects and recovers from render loops
 * - Tracks error frequency to prevent infinite error loops
 * - Provides graceful fallback UI
 * - Logs detailed error information for debugging
 */
export class HardenedErrorBoundary extends Component<Props, State> {
  private errorCountWindow = 10000; // 10 seconds
  private maxErrorsPerWindow = 5;
  private errorHistory: number[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now();
    
    // Add to error history
    this.errorHistory.push(now);
    
    // Clean old errors outside the window
    this.errorHistory = this.errorHistory.filter(
      time => now - time < this.errorCountWindow
    );
    
    // Check if we're in an error loop
    if (this.errorHistory.length > this.maxErrorsPerWindow) {
      console.error('🚨 ERROR_BOUNDARY: Error loop detected! Too many errors in short time period.');
      console.error('🚨 ERROR_BOUNDARY: Entering safe mode - blocking further renders to prevent browser freeze.');
      
      // Force a page reload as last resort
      setTimeout(() => {
        console.error('🚨 ERROR_BOUNDARY: Reloading page to recover from error loop...');
        window.location.reload();
      }, 3000);
    }

    this.setState({
      error,
      errorInfo,
      errorCount: this.errorHistory.length,
      lastErrorTime: now,
    });

    // Log detailed error information
    console.group('🚨 ERROR_BOUNDARY: Component Error Caught');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Count in Window:', this.errorHistory.length);
    console.groupEnd();

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Check if this looks like a render loop
    if (this.isRenderLoopError(error)) {
      console.error('🚨 ERROR_BOUNDARY: Render loop detected in error message!');
      this.handleRenderLoop();
    }
  }

  private isRenderLoopError(error: Error): boolean {
    const renderLoopIndicators = [
      'Element type is invalid',
      'Cannot read properties of undefined',
      'Maximum update depth exceeded',
      'Too many re-renders',
      'Render loop',
      'useEffect'
    ];

    return renderLoopIndicators.some(indicator => 
      error.message.includes(indicator) || error.stack?.includes(indicator)
    );
  }

  private handleRenderLoop() {
    console.warn('🚨 ERROR_BOUNDARY: Implementing render loop recovery...');
    
    // Clear any potentially problematic localStorage
    try {
      localStorage.removeItem('party-store');
      console.log('✅ ERROR_BOUNDARY: Cleared party-store from localStorage');
    } catch (e) {
      console.warn('⚠️ ERROR_BOUNDARY: Could not clear localStorage:', e);
    }

    // Set a flag to indicate we're in recovery mode
    sessionStorage.setItem('render-loop-recovery', 'true');
  }

  private handleRetry = () => {
    console.log('🔄 ERROR_BOUNDARY: User initiated retry');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    console.log('🔄 ERROR_BOUNDARY: User initiated page reload');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              
              <h1 className="text-xl font-bold text-foreground mb-2">
                Oops! Something went wrong
              </h1>
              
              <p className="text-muted-foreground mb-4">
                {this.state.errorCount > 3 
                  ? "We've detected multiple errors. The app might be in an unstable state."
                  : "Don't worry, this happens sometimes. You can try refreshing the page."
                }
              </p>

              {process.env.NODE_ENV === 'development' && (
                <details className="text-left mb-4 p-3 bg-muted rounded text-sm">
                  <summary className="cursor-pointer font-medium">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Error:</strong>
                      <pre className="text-xs overflow-auto">{this.state.error?.message}</pre>
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="text-xs overflow-auto">{this.state.error?.stack}</pre>
                    </div>
                    <div>
                      <strong>Error Count:</strong> {this.state.errorCount}
                    </div>
                  </div>
                </details>
              )}

              <div className="space-y-2">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
                  disabled={this.state.errorCount > 3}
                >
                  {this.state.errorCount > 3 ? 'Too Many Errors' : 'Try Again'}
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md transition-colors"
                >
                  Reload Page
                </button>
              </div>

              {this.state.errorCount > 3 && (
                <p className="text-xs text-muted-foreground mt-4">
                  Multiple errors detected. Please reload the page to reset the application.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based component wrapper for render safety monitoring
 */
export function RenderSafetyMonitor({ 
  children, 
  componentName = 'Unknown' 
}: { 
  children: ReactNode; 
  componentName?: string; 
}) {
  const renderCount = useRenderSafety(componentName);
  
  // Show warning overlay if too many renders detected in development
  if (process.env.NODE_ENV === 'development' && renderCount > 20) {
    return (
      <div className="relative">
        {children}
        <div className="fixed top-4 right-4 bg-yellow-500 text-black p-2 rounded-md shadow-lg z-50 text-sm">
          ⚠️ {componentName}: {renderCount} renders
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component for render safety
 */
export function withRenderSafety<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const SafeComponent = (props: P) => {
    return (
      <HardenedErrorBoundary>
        <RenderSafetyMonitor componentName={componentName || WrappedComponent.name}>
          <WrappedComponent {...props} />
        </RenderSafetyMonitor>
      </HardenedErrorBoundary>
    );
  };

  SafeComponent.displayName = `withRenderSafety(${componentName || WrappedComponent.name})`;
  return SafeComponent;
}