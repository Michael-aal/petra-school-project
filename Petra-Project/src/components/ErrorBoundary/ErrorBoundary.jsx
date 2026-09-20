import React from "react";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";
import "./ErrorBoundary.css";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Petra ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="petra-error-boundary-container" role="alert">
          <div className="petra-error-card">
            <div className="petra-error-icon-wrapper">
              <AlertOctagon size={32} />
            </div>
            <h2>Something went wrong</h2>
            <p className="petra-error-message">
              An unexpected error occurred while rendering this view. Your session and data are safe.
            </p>
            {this.state.error?.message && (
              <div className="petra-error-details">
                <code>{this.state.error.message}</code>
              </div>
            )}
            <div className="petra-error-actions">
              <button
                type="button"
                className="petra-btn petra-btn-primary"
                onClick={this.handleReset}
              >
                <RotateCcw size={16} />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                className="petra-btn petra-btn-outline"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = "/dashboard";
                }}
              >
                <Home size={16} />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
