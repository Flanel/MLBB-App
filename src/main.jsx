import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import './index.css'

// FIX BUG #2: ToastProvider membungkus seluruh app agar useToast()
// berbagi state yang sama antara DashboardLayout (renderer) dan
// semua halaman (caller addToast).
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>,
)
