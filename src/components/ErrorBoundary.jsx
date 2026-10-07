import { Component } from 'react';

/** Last line of defence: a crash in one page shows a recovery card instead of a blank screen. */
export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('CSP Lab page crashed:', error, info); }
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page">
        <div className="empty">
          <h4>Something went wrong on this page</h4>
          <p>Your saved progress is safe. Try going back home.</p>
          <button type="button" className="btn btn-primary" onClick={() => { this.setState({ error: null }); window.location.hash = '#/'; }}>Back to home</button>
        </div>
      </div>
    );
  }
}
