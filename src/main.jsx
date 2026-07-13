// v0.3.1
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { SplashScreen as NativeSplashScreen } from '@capacitor/splash-screen'
import './styles.css'

document.documentElement.dataset.platform = Capacitor.isNativePlatform() ? 'native' : 'web'

const root = ReactDOM.createRoot(document.getElementById('root'))

function StartupScreen({ failed = false }) {
  return (
    <div className="app-shell">
      <div className="startup-screen">
        <div className="startup-spinner" />
        <p>{failed ? 'Dukwise could not start.' : 'Starting Dukwise...'}</p>
        {failed && (
          <button type="button" onClick={() => window.location.reload()}>
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

// Paint a tiny local interface before importing the complete application.
// This lets Android release its native splash without waiting for Supabase,
// business screens, or the shop's remote data.
root.render(<StartupScreen />)

if (Capacitor.isNativePlatform()) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      NativeSplashScreen.hide().catch((error) => {
        console.error('Could not hide the native splash screen:', error)
      })
    })
  })
}

import('./App.jsx')
  .then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    )
  })
  .catch((error) => {
    console.error('Dukwise startup failed:', error)
    root.render(<StartupScreen failed />)
  })
