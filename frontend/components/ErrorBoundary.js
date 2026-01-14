'use client';
import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * ErrorBoundary - Catches React errors and prevents app crashes
 * Provides user-friendly error messages and recovery options
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to external error tracking service if available
    if (typeof window !== 'undefined' && window.reportError) {
      window.reportError(error);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      const isRecurringError = errorCount > 2;

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-red-900">
                    Something went wrong
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {isRecurringError 
                      ? 'This error keeps occurring. Please try reloading the page.'
                      : 'An unexpected error occurred while rendering this page.'
                    }
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-900 mb-2">Error Message:</p>
                  <p className="text-sm text-red-700 font-mono break-all">
                    {error.toString()}
                  </p>
                </div>
              )}

              {/* Technical details (collapsed by default) */}
              {errorInfo && process.env.NODE_ENV === 'development' && (
                <details className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <summary className="text-sm font-semibold text-gray-900 cursor-pointer">
                    Technical Details (Developer Info)
                  </summary>
                  <pre className="mt-3 text-xs text-gray-700 overflow-auto max-h-64">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-4">
                {!isRecurringError && (
                  <Button 
                    onClick={this.handleReset}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}
                <Button 
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              {/* Help text */}
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-600">
                  If this problem persists, please try:
                </p>
                <ul className="mt-2 text-xs text-gray-600 list-disc list-inside space-y-1">
                  <li>Clearing your browser cache</li>
                  <li>Using a different browser</li>
                  <li>Checking your internet connection</li>
                  <li>Contacting support if the issue continues</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
