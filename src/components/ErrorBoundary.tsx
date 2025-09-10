import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorLogger } from '@/utils/errorLogger';
import { ErrorDisplay } from './ErrorDisplay';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log del error con información del componente
    const errorId = errorLogger.logError(error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      additionalInfo: {
        componentStack: errorInfo.componentStack,
        errorBoundaryStack: error.stack
      }
    });

    this.setState({
      errorId,
      errorInfo
    });

    // Llamar callback personalizado si existe
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log adicional en consola para desarrollo
    console.group('🔥 ERROR BOUNDARY ACTIVADO');
    console.error('Error capturado por ErrorBoundary:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error ID:', errorId);
    console.groupEnd();
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Mostrar el componente de error detallado
      return (
        <ErrorDisplay
          error={this.state.error}
          errorId={this.state.errorId}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

// HOC para envolver componentes fácilmente
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}