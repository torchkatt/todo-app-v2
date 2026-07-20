import React from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    // Send to Sentry
    Sentry.captureException(error, { extra: { componentStack: (errorInfo as any)?.componentStack || '' } });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-brand-bg dark:bg-gray-900 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-red-500" />
            </div>
            <h2 className="text-xl font-extrabold text-text-primary mb-2">Algo salió mal</h2>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              Ocurrió un error inesperado. Ya lo registramos y lo revisaremos.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-purple-200">
                <RefreshCw size={16} /> Recargar
              </button>
              <button onClick={() => window.location.href = '/'}
                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-bold text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                Ir al inicio
              </button>
            </div>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary font-semibold">Detalles técnicos</summary>
                <pre className="mt-2 text-[10px] text-text-muted bg-gray-50 dark:bg-gray-800 p-3 rounded-xl overflow-auto max-h-32 leading-relaxed">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
