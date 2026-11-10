import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app/App'
import { settingsRepo } from './data/repositories/settings'
import './styles/global.css'

async function bootstrap() {
  await settingsRepo.ensure()
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

void bootstrap()
