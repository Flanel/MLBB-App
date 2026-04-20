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
        <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle size={15} className="text-red-500" />
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <p>You are about to deactivate <strong className="text-slate-800">{teamName}</strong>.</p>
          <p>All members will be immediately blocked from logging in. Team data is preserved in read-only mode and can be restored at any time.</p>
          <p className="text-xs text-slate-400 pt-1">This action can be undone from the Teams page.</p>
        </div>
      </div>
    </Modal>
  )
}
