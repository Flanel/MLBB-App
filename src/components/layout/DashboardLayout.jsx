import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import ToastContainer from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'

export default function DashboardLayout({ children, title, subtitle }) {
  const { toasts, removeToast } = useToast()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg-base)' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
        <Topbar title={title} subtitle={subtitle} onMenuClick={() => setMobileOpen(true)} />
        <main style={{ flex:1, overflowY:'auto', padding:'20px' }} className="animate-fade-up">
          {children}
        </main>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
