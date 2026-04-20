import Sidebar from './Sidebar'
import Topbar from './Topbar'
import ToastContainer from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'

export default function DashboardLayout({ children, title, subtitle }) {
  const { toasts, removeToast } = useToast()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080910' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-5 animate-fade-up">
          {children}
        </main>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}