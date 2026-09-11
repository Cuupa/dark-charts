import { logger } from "@/lib/logger";
import React, { Component, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Warning, ArrowsClockwise, House } from '@phosphor-icons/react';
import { messages } from '@/i18n/messages';
import { lookupMessage } from '@/i18n/translate';
import { readLangCookie } from '@/i18n/cookie';

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  level?: 'root' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught an error', { error, errorInfo });
    
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (callbackError) {
        logger.error('Error in onError callback', { error: callbackError });
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Wenn eine benutzerdefinierte Fallback-Komponente übergeben wurde, nutze diese
      if (this.props.fallback) {
        try {
          return this.props.fallback(this.state.error!, this.resetError);
        } catch (fallbackError) {
          logger.error('Error in fallback render', { error: fallbackError });
        }
      }

      // Standard Fallback-UI im Dark Mode
      const isRoot = this.props.level === 'root';
      const lang = readLangCookie() ?? 'de';
      const tx = (key: string) => lookupMessage(messages, lang, key);
      
      return (
        <div className={`flex flex-col items-center justify-center p-4 ${isRoot? 'min-h-screen bg-[#0A0A0A] text-white' : 'w-full'}`}>
          <Card className="w-full max-w-2xl p-6 bg-zinc-900 border border-red-900">
            <Alert variant="destructive" className="bg-red-950/30 border-red-900">
              <Warning className="h-5 w-5 text-red-500" weight="fill" />
              <AlertTitle className="text-red-400 font-bold ml-2">{tx('error.system')}</AlertTitle>
              <AlertDescription className="mt-2 text-sm text-red-200 ml-2">
                {this.state.error?.message || tx('error.generic')}
              </AlertDescription>
            </Alert>
            
            <div className="mt-6 flex gap-4 justify-end">
              <button 
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition-colors"
              >
                <House weight="bold" /> {tx('error.home')}
              </button>
              <button 
                onClick={this.resetError}
                className="flex items-center gap-2 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded transition-colors"
              >
                <ArrowsClockwise weight="bold" /> {tx('error.retry')}
              </button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-Order Component (HOC) für einfache Nutzung
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  boundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary {...boundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}