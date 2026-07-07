import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { CustomerAuthProvider } from './context/CustomerAuthContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CustomerAuthProvider>
        <App />
      </CustomerAuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
