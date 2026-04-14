import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { tokensCss, ThemeProvider } from '@thedatablitz/tokens'
import './index.css'
import App from './App.tsx'
import { createAppQueryClient } from './queryClient.ts'

const queryClient = createAppQueryClient()

const TOKENS_STYLE_ID = 'db-design-bit-tokens'
if (
  typeof document !== 'undefined' &&
  !document.getElementById(TOKENS_STYLE_ID)
) {
  const el = document.createElement('style')
  el.id = TOKENS_STYLE_ID
  el.textContent = tokensCss
  document.head.prepend(el)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme="dark">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
)
