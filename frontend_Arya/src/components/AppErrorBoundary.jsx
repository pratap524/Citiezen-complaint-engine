import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown runtime error' };
  }

  componentDidCatch(error, info) {
    console.error('App runtime error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', color: '#111' }}>
          <h2>Frontend runtime error</h2>
          <p>{this.state.message}</p>
          <p>Please share this text so it can be fixed quickly.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
