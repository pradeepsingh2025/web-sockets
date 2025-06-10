import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import BettingGameClient from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BettingGameClient />
  </StrictMode>,
)
