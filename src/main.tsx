import { init as initLogbit } from '@thedatablitz/logbit-sdk'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { RelayEnvironmentProvider } from 'react-relay'
import { ThemeProvider } from '@design-system'
import { AuthProvider } from './pages/auth/AuthContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { relayEnvironment } from './relay/Environment'
import App from './App'
import '@design-system/styles/global.css'

console.log('LOGBIT_API_BASE_URL', import.meta.env)
initLogbit({
  service: 'workbit-web',
  env: import.meta.env.MODE ?? 'development',
  release: import.meta.env.VITE_APP_VERSION ?? '0.0.0',
  ...(import.meta.env.VITE_LOGBIT_API_BASE_URL && {
    apiBaseUrl: import.meta.env.VITE_LOGBIT_API_BASE_URL,
  }),
  ...(import.meta.env.VITE_LOGBIT_ENDPOINT && {
    endpoint: import.meta.env.VITE_LOGBIT_ENDPOINT,
  }),
  ...(import.meta.env.VITE_WORK_BIT_API_KEY && {
    workbit: { apiKey: import.meta.env.VITE_WORK_BIT_API_KEY },
  }),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <WorkspaceProvider>
            <RelayEnvironmentProvider environment={relayEnvironment}>
              <App />
            </RelayEnvironmentProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
)
