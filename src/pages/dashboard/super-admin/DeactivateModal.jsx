import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

export default function DeactivateModal({ open, onClose, onConfirm, teamName, loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Deactivate team"
      size="sm"
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deactivating...' : 'Deactivate team'}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(245,158,11,0.1)' }}
        >
          <AlertTriangle size={14} style={{ color: '#fbbf24' }} />
        </div>
        <div className="space-y-2 text-sm" style={{ color: '#a0a4be' }}>
          <p>You are about to deactivate <strong style={{ color: '#dde0ef' }}>{teamName}</strong>.</p>
          <p>All members will be immediately blocked from logging in. Team data is preserved and can be restored at any time.</p>
          <p className="text-xs pt-1" style={{ color: '#555a78' }}>This action can be undone from this page.</p>
        </div>
      </div>
    </Modal>
  )
}