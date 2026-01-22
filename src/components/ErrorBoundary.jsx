import React from 'react';
import { Button, Result } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    // Clear localStorage to reset state
    const confirmReset = window.confirm(
      'This will clear your stored data and refresh the page. Continue?'
    );
    
    if (confirmReset) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          padding: '20px'
        }}>
          <Result
            status="error"
            title="Something went wrong"
            subTitle="An unexpected error occurred. Please try refreshing the page or clearing your browser data."
            extra={[
              <Button 
                type="primary" 
                key="refresh"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>,
              <Button 
                key="reset"
                onClick={this.handleReset}
              >
                Clear Data & Reset
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
