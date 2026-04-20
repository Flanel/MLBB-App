import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Trash2 } from 'lucide-react'

export default function DeleteTeamModal({ open, onClose, onConfirm, team, loading }) {
  const hasMembers = (team?.member_count ?? 0) > 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete team"
      size="sm"
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading || hasMembers}>
            {loading ? 'Deleting...' : 'Delete team'}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(225,29,72,0.1)' }}
        >
          <Trash2 size={14} style={{ color: '#fb4c6c' }} />
        </div>
        <div className="space-y-2 text-sm" style={{ color: '#a0a4be' }}>
          {hasMembers ? (
            <>
              <p>
                <strong style={{ color: '#dde0ef' }}>{team?.name}</strong> still has{' '}
                <strong style={{ color: '#dde0ef' }}>{team?.member_count} member{team?.member_count !== 1 ? 's' : ''}</strong>.
              </p>
              <p>Remove all members from this team before deleting it.</p>
            </>
          ) : (
            <>
              <p>
                Permanently delete <strong style={{ color: '#dde0ef' }}>{team?.name}</strong>?
              </p>
              <p>All associated match records, tournaments, and activity logs will be deleted. This cannot be undone.</p>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}