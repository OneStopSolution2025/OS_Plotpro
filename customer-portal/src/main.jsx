import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { CustomerAuthProvider } from './context/CustomerAuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <CustomerAuthProvider>
          <App />
        </CustomerAuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
