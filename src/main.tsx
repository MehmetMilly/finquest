import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/alexandria/500.css'
import '@fontsource/alexandria/600.css'
import '@fontsource/alexandria/700.css'
import '@fontsource/ibm-plex-sans-arabic/400.css'
import '@fontsource/ibm-plex-sans-arabic/500.css'
import '@fontsource/ibm-plex-sans-arabic/600.css'
import './styles/base.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
