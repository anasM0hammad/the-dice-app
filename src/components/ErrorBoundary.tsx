import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#a0a0b0',
          textAlign: 'center',
          padding: '20px',
        }}>
          <p style={{ fontSize: '18px', marginBottom: '8px', color: '#DC2626' }}>
            Something went wrong
          </p>
          <p style={{ fontSize: '14px' }}>
            Your device may not support 3D graphics. Please try restarting the app.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
