import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Trash2, AlertTriangle, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// DEBUG: fetch exact cascade counts before confirming delete
export default function DeleteTeamModal({ open, onClose, onConfirm, team, loading }) {
  const [counts, setCounts]   = useState(null)
  const [fetching, setFetching] = useState(false)
  const hasMembers = (team?.member_count ?? 0) > 0

  useEffect(() => {
    if (!open || !team?.id || hasMembers) return
    setFetching(true)
    Promise.all([
      supabase.from('matches').select('id', { count:'exact', head:true }).eq('team_id', team.id),
      supabase.from('tournaments').select('id', { count:'exact', head:true }).eq('team_id', team.id),
      supabase.from('schedules').select('id', { count:'exact', head:true }).eq('team_id', team.id),
      supabase.from('player_applications').select('id', { count:'exact', head:true }).eq('team_id', team.id),
      supabase.from('invite_tokens').select('id', { count:'exact', head:true }).eq('team_id', team.id),
    ]).then(([m, t, s, pa, it]) => {
      setCounts({
        matches: m.count ?? 0,
        tournaments: t.count ?? 0,
        schedules: s.count ?? 0,
        applications: pa.count ?? 0,
        invites: it.count ?? 0,
      })
      setFetching(false)
    })
  }, [open, team?.id, hasMembers])

  const totalRecords = counts
    ? counts.matches + counts.tournaments + counts.schedules + counts.applications + counts.invites
    : null

  return (
    <Modal open={open} onClose={onClose} title="Hapus Tim Permanen" size="sm"
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>Batal</Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading || hasMembers || fetching}>
            {loading ? 'Menghapus...' : 'Hapus Permanen'}
          </Button>
        </>
      }
    >
      <div style={{ display:'flex', gap:14 }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--red-bg)', border:'1px solid rgba(255,77,109,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
          <Trash2 size={14} style={{ color:'var(--red)' }} />
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:13, color:'var(--text-secondary)', flex:1 }}>
          {hasMembers ? (
            <>
              <p><strong style={{ color:'var(--text-primary)' }}>{team?.name}</strong> masih memiliki <strong style={{ color:'var(--text-primary)' }}>{team?.member_count} member aktif</strong>.</p>
              <p style={{ fontSize:12, color:'var(--text-muted)' }}>Hapus semua member dari tim ini di halaman Data Explorer sebelum menghapus tim.</p>
            </>
          ) : (
            <>
              <p>Hapus permanen <strong style={{ color:'var(--text-primary)' }}>{team?.name}</strong>?</p>

              {fetching ? (
                <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--text-dim)', fontSize:12 }}>
                  <Loader size={12} className="spin" /> Menghitung data...
                </div>
              ) : counts && totalRecords > 0 ? (
                <div style={{ background:'var(--red-bg)', border:'1px solid rgba(255,77,109,0.15)', borderRadius:8, padding:'10px 12px' }}>
                  <p style={{ fontSize:11, fontWeight:600, color:'var(--red)', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
                    <AlertTriangle size={11} /> Data yang akan ikut terhapus:
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                    {counts.matches > 0      && <span style={{ fontSize:11, color:'var(--text-muted)' }}>· {counts.matches} match + player stats</span>}
                    {counts.tournaments > 0  && <span style={{ fontSize:11, color:'var(--text-muted)' }}>· {counts.tournaments} tournament</span>}
                    {counts.schedules > 0    && <span style={{ fontSize:11, color:'var(--text-muted)' }}>· {counts.schedules} jadwal + availability</span>}
                    {counts.applications > 0 && <span style={{ fontSize:11, color:'var(--text-muted)' }}>· {counts.applications} aplikasi pendaftaran</span>}
                    {counts.invites > 0      && <span style={{ fontSize:11, color:'var(--text-muted)' }}>· {counts.invites} invite token</span>}
                  </div>
                </div>
              ) : counts && totalRecords === 0 ? (
                <p style={{ fontSize:12, color:'var(--text-muted)' }}>Tim ini tidak memiliki data tambahan.</p>
              ) : null}

              <p style={{ fontSize:11, color:'var(--text-dim)' }}>Aksi ini tidak bisa dibatalkan.</p>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}