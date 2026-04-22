import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Trash2 } from 'lucide-react'

export default function DeleteTeamModal({ open, onClose, onConfirm, team, loading }) {
  const hasMembers = (team?.member_count ?? 0) > 0
  return (
    <Modal open={open} onClose={onClose} title="Hapus Tim" size="sm"
      footer={<><Button onClick={onClose} disabled={loading}>Batal</Button><Button variant="danger" onClick={onConfirm} disabled={loading || hasMembers}>{loading?'Menghapus...':'Hapus Permanen'}</Button></>}
    >
      <div style={{ display:'flex', gap:14 }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--red-bg)', border:'1px solid rgba(248,113,113,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
          <Trash2 size={14} style={{ color:'var(--red)' }} />
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {hasMembers ? (
            <>
              <p><strong style={{ color:'var(--text-primary)' }}>{team?.name}</strong> masih memiliki <strong style={{ color:'var(--text-primary)' }}>{team?.member_count} member</strong>.</p>
              <p>Hapus semua member dari tim ini sebelum menghapus tim.</p>
            </>
          ) : (
            <>
              <p>Hapus permanen <strong style={{ color:'var(--text-primary)' }}>{team?.name}</strong>?</p>
              <p>Semua data match, tournament, dan activity log akan ikut terhapus. Aksi ini tidak bisa dibatalkan.</p>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
