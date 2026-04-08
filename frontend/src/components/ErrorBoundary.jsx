import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('UI error boundary caught an error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
          <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-500">Something went wrong</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              OrderSync hit an unexpected issue.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Please refresh the page. If the problem continues, contact support before going live.
            </p>
            <button
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload Application
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
