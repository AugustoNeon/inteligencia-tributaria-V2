import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/archivo-black'
import '@fontsource-variable/archivo'
import '@fontsource-variable/spline-sans-mono'
import './styles/tokens.css'
import './styles/app.css'
import './styles/pages.css'
import './styles/print.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA: registro relativo funciona no GitHub Pages (subpasta) e em domínio próprio
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // sem service worker o site continua funcionando normalmente
    })
  })
}
