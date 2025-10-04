import React from 'react'
import reportClientError from '../services/monitoringReporter'

type Props = { children: React.ReactNode }
type State = { hasError: boolean; error?: any }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: any, info: any) {
    // Report error to server if enabled
    reportClientError({ error: String(error), info, url: typeof window !== 'undefined' ? window.location.href : undefined, timestamp: Date.now() })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <p>We've reported the issue to the devs. You can try refreshing the page.</p>
        </div>
      )
    }
    return this.props.children
  }
}
