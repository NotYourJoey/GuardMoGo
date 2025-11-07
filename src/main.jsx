import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'

// Error boundary for initial render
try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }

  const root = createRoot(rootElement)
  
  root.render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>
  )
} catch (error) {
  console.error('Failed to render app:', error)
  document.body.innerHTML = `
    <div style="padding: 2rem; font-family: system-ui, sans-serif; text-align: center;">
      <h1 style="color: #c41262;">Error Loading Application</h1>
      <p style="color: #666;">${error.message}</p>
      <p style="color: #666; margin-top: 1rem;">Please check the browser console for more details.</p>
    </div>
  `
}
