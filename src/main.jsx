import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[RootErrorBoundary] Caught React crash:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#0d1117',
          color: '#f85149',
          padding: '30px',
          fontFamily: 'monospace',
          zIndex: 999999,
          overflow: 'auto'
        }}>
          <h2 style={{ fontSize: '20px', color: '#ff7b72', marginBottom: '15px' }}>
            ⚠️ MediaFactory Application Error
          </h2>
          <p style={{ color: '#c9d1d9', marginBottom: '20px' }}>
            {this.state.error && this.state.error.toString()}
          </p>
          <pre style={{
            backgroundColor: '#161b22',
            padding: '15px',
            borderRadius: '6px',
            color: '#8b949e',
            fontSize: '12px',
            overflowX: 'auto',
            border: '1px solid #30363d'
          }}>
            {this.state.error && this.state.error.stack}
            {'\n\nComponent Stack:\n'}
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{
              marginTop: '20px',
              padding: '8px 16px',
              backgroundColor: '#238636',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Clear Cache & Restart
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
)
