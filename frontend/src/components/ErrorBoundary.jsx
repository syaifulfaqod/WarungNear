import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error);
    if (error && error.stack) {
      console.error(error.stack);
    }
    console.error("Error Info:", errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
          <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-border text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">Terjadi Kesalahan Sistem</h1>
            <p className="text-gray-500 text-sm mb-6">
              Aplikasi mendeteksi kendala pada tampilan sistem. Silakan muat ulang halaman untuk mencoba kembali.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <div className="text-left bg-red-50 p-4 rounded-xl border border-red-200 text-red-650 text-xs font-mono mb-6 max-h-60 overflow-y-auto leading-relaxed">
                <p className="font-bold mb-1">Error: {this.state.error.message || this.state.error.toString()}</p>
                <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-sm shadow-sm"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
