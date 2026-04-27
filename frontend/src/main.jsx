import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Provider } from 'react-redux'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import { store } from './features/store'
import { isDesktopRuntime } from './platform/runtime'
import './assets/styles/global.css'

const Router = isDesktopRuntime() ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <ErrorBoundary>
          <Router>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3200,
                style: {
                  borderRadius: '18px',
                  background: '#0f172a',
                  color: '#f8fafc',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                },
                success: {
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#f8fafc',
                  },
                },
              }}
            />
          </Router>
        </ErrorBoundary>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>
)
