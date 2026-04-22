import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

export default function DeactivateModal({ open, onClose, onConfirm, teamName, loading }) {
  return (
    <Modal open={open} onClose={onClose} title="Nonaktifkan Tim" size="sm"
      footer={<><Button onClick={onClose} disabled={loading}>Batal</Button><Button variant="danger" onClick={onConfirm} disabled={loading}>{loading?'Menonaktifkan...':'Nonaktifkan Tim'}</Button></>}
    >
      <div style={{ display:'flex', gap:14 }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--amber-bg)', border:'1px solid rgba(251,191,36,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
          <AlertTriangle size={14} style={{ color:'var(--amber)' }} />
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <p>Nonaktifkan <strong style={{ color:'var(--text-primary)' }}>{teamName}</strong>?</p>
          <p>Semua member akan langsung diblokir dari login. Data tim tetap tersimpan dan bisa dipulihkan kapan saja.</p>
          <p style={{ fontSize:11, color:'var(--text-dim)' }}>Aksi ini dapat dibatalkan dari halaman ini.</p>
        </div>
      </div>
    </Modal>
  )
}
