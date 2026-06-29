import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import AppRouter from './AppRouter.jsx'
import { MenuProvider } from './context/MenuContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <MenuProvider>
        <AppRouter />
      </MenuProvider>
    </BrowserRouter>
  </StrictMode>,
)
