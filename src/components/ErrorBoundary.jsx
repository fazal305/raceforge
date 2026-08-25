import { Component } from 'react';
import { Button } from './ui/Button.jsx';
import './ErrorBoundary.css';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('RaceForge crashed:', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="error-boundary" role="alert">
        <h1 className="error-boundary__title">Something stalled the race.</h1>
        <p className="error-boundary__message">
          RaceForge hit an unexpected error. Your saved progress is untouched.
        </p>
        <Button variant="primary" onClick={this.handleReset}>
          Back to Menu
        </Button>
      </div>
    );
  }
}
