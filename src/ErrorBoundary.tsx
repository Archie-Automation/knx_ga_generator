import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ padding: 20 }}>
          <h2>Er is een fout opgetreden</h2>
          <p className="small" style={{ color: 'var(--color-danger)' }}>
            {this.state.error?.message || 'Onbekende fout'}
          </p>
          <button
            className="button primary"
            onClick={() => {
              this.setState({ hasError: false, error: undefined });
              window.location.reload();
            }}
          >
            Pagina herladen
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

