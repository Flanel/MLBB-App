import { useState, useEffect, useCallback } from 'react'
import { Users, Edit2, Trash2, Power, RefreshCw, Database } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import TeamFormModal from '@/components/super-admin/TeamFormModal'
import DeactivateModal from '@/components/super-admin/DeactivateModal'
import DeleteTeamModal from '@/components/super-admin/DeleteTeamModal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Link } from 'react-router-dom'

async function logAudit(userId, action, target) {
  await supabase.from('audit_logs').insert({ user_id: userId, action, target })
}

export default function TeamsPage() {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [teams, setTeams]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [busy, setBusy]       = useState(false)

  const [createOpen, setCreateOpen]   = useState(false)
  const [editTarget, setEditTarget]   = useState(null)
  const [deactTarget, setDeactTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('teams')
      .select('*, users(count)')
      .order('created_at', { ascending: false })
    if (error) {
      addToast({ message: `Gagal memuat tim: ${error.message}`, type: 'danger' })
    } else {
      setTeams((data || []).map(t => ({ ...t, member_count: t.users?.[0]?.count ?? 0 })))
    }
    setLoading(false)
  }, [addToast])

  useEffect(() => { fetchTeams() }, [fetchTeams])

  async function handleCreate({ name, game }) {
    setBusy(true)
    const { data, error } = await supabase.from('teams').insert({ name, game, is_active: true }).select().single()
    if (error) { addToast({ message: `Gagal: ${error.message}`, type: 'danger' }) }
    else {
      setTeams(prev => [{ ...data, member_count: 0 }, ...prev])
      await logAudit(user?.id, 'Buat tim', name)
      addToast({ message: `Tim "${name}" dibuat.`, type: 'success' })
      setCreateOpen(false)
    }
    setBusy(false)
  }

  async function handleEdit({ name, game }) {
    setBusy(true)
    const { error } = await supabase.from('teams').update({ name, game }).eq('id', editTarget.id)
    if (error) { addToast({ message: `Gagal: ${error.message}`, type: 'danger' }) }
    else {
      setTeams(prev => prev.map(t => t.id === editTarget.id ? { ...t, name, game } : t))
      await logAudit(user?.id, 'Edit tim', name)
      addToast({ message: `Tim "${name}" diperbarui.`, type: 'success' })
      setEditTarget(null)
    }
    setBusy(false)
  }

  async function handleDeactivate() {
    setBusy(true)
    const { error } = await supabase.from('teams').update({ is_active: false }).eq('id', deactTarget.id)
    if (error) { addToast({ message: `Gagal: ${error.message}`, type: 'danger' }) }
    else {
      setTeams(prev => prev.map(t => t.id === deactTarget.id ? { ...t, is_active: false } : t))
      await logAudit(user?.id, 'Nonaktifkan tim', deactTarget.name)
      addToast({ message: `"${deactTarget.name}" dinonaktifkan. Semua member tidak bisa login.`, type: 'success' })
      setDeactTarget(null)
    }
    setBusy(false)
  }

  async function handleActivate(team) {
    const { error } = await supabase.from('teams').update({ is_active: true }).eq('id', team.id)
    if (error) { addToast({ message: `Gagal: ${error.message}`, type: 'danger' }) }
    else {
      setTeams(prev => prev.map(t => t.id === team.id ? { ...t, is_active: true } : t))
      await logAudit(user?.id, 'Aktifkan tim', team.name)
      addToast({ message: `"${team.name}" diaktifkan kembali.`, type: 'success' })
    }
  }

  async function handleDelete() {
    setBusy(true)
    const tid = deleteTarget.id

    // DEBUG: cascade delete in dependency order to avoid FK constraint errors
    try {
      // 1. schedule_availability (depends on schedules)
      const { data: schIds } = await supabase.from('schedules').select('id').eq('team_id', tid)
      if (schIds?.length) {
        await supabase.from('schedule_availability').delete().in('schedule_id', schIds.map(s => s.id))
      }
      // 2. schedules
      await supabase.from('schedules').delete().eq('team_id', tid)
      // 3. match_player_stats (depends on matches)
      const { data: mIds } = await supabase.from('matches').select('id').eq('team_id', tid)
      if (mIds?.length) {
        await supabase.from('match_player_stats').delete().in('match_id', mIds.map(m => m.id))
      }
      // 4. matches
      await supabase.from('matches').delete().eq('team_id', tid)
      // 5. player_activities for users in this team
      const { data: uIds } = await supabase.from('users').select('id').eq('team_id', tid)
      if (uIds?.length) {
        await supabase.from('player_activities').delete().in('user_id', uIds.map(u => u.id))
      }
      // 6. player_applications
      await supabase.from('player_applications').delete().eq('team_id', tid)
      // 7. invite_tokens
      await supabase.from('invite_tokens').delete().eq('team_id', tid)
      // 8. tournaments
      await supabase.from('tournaments').delete().eq('team_id', tid)
      // 9. finally delete team
      const { error } = await supabase.from('teams').delete().eq('id', tid)
      if (error) throw error

      setTeams(prev => prev.filter(t => t.id !== deleteTarget.id))
      await logAudit(user?.id, 'Hapus tim', deleteTarget.name)
      addToast({ message: `"${deleteTarget.name}" dihapus permanen.`, type: 'success' })
      setDeleteTarget(null)
    } catch (err) {
      addToast({ message: `Gagal menghapus: ${err.message}`, type: 'danger' })
    }

    setBusy(false)
  }

  const filtered = teams.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.game?.toLowerCase().includes(search.toLowerCase())
  )
  const activeCount   = teams.filter(t => t.is_active).length
  const inactiveCount = teams.filter(t => !t.is_active).length
  const totalMembers  = teams.reduce((acc, t) => acc + Number(t.member_count), 0)

  return (
    <DashboardLayout title="Teams">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Teams</h2>
          <p style={{ fontSize:12, color:'var(--text-muted)' }}>Buat, konfigurasi, dan kelola akses tim.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>+ Tim Baru</button>
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
        {[
          { label:'Total Tim', value: teams.length, sub:'terdaftar' },
          { label:'Aktif', value: activeCount, sub:'bisa login' },
          { label:'Total Member', value: totalMembers, sub:'semua tim' },
        ].map(k => (
          <div key={k.label} className="card animate-fade-up">
            <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:8, fontFamily:'Syne,sans-serif' }}>{k.label}</p>
            <p style={{ fontSize:24, fontWeight:700, fontFamily:'IBM Plex Mono,monospace', color:'var(--text-primary)' }}>{k.value}</p>
            <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:4 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          <input className="form-input" style={{ maxWidth:220 }} placeholder="Cari tim..." value={search} onChange={e=>setSearch(e.target.value)} />
          <button className="btn" style={{ padding:'6px 10px' }} onClick={fetchTeams} title="Refresh">
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10, fontSize:12, color:'var(--text-dim)' }}>
            {inactiveCount > 0 && <span className="badge badge-amber">{inactiveCount} nonaktif</span>}
            <span>{filtered.length} tim</span>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontSize:12 }}>Memuat...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontSize:12 }}>
            {search ? 'Tidak ada tim yang cocok.' : 'Belum ada tim. Buat tim pertama di atas.'}
          </p>
        ) : (
          <div className="table-scroll-container">
            <table style={{ width:'100%', minWidth:600 }}>
              <thead>
                <tr>{['Tim','Game','Member','Status','Dibuat','Aksi'].map(h=><th key={h} className="table-th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map(team => (
                  <tr key={team.id}>
                    <td className="table-td">
                      <p style={{ fontWeight:500, color:'var(--text-primary)' }}>{team.name}</p>
                      <p style={{ fontSize:10, fontFamily:'IBM Plex Mono,monospace', color:'var(--text-dim)', marginTop:2 }}>{team.id}</p>
                    </td>
                    <td className="table-td" style={{ color:'var(--text-muted)' }}>{team.game}</td>
                    <td className="table-td">
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, color:'var(--text-muted)' }}>
                        <Users size={11} />{team.member_count}
                      </span>
                    </td>
                    <td className="table-td">
                      <span className={`badge ${team.is_active ? 'badge-green' : 'badge-slate'}`}>
                        {team.is_active ? 'aktif' : 'nonaktif'}
                      </span>
                    </td>
                    <td className="table-td" style={{ color:'var(--text-dim)', fontSize:12 }}>
                      {new Date(team.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                    </td>
                    <td className="table-td">
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <Link to={`/super-admin/teams/${team.id}/data`} className="btn btn-cyan" style={{ fontSize:11, padding:'4px 8px', gap:4 }}>
                          <Database size={10}/>Explorer
                        </Link>
                        <button className="btn" style={{ fontSize:11, padding:'4px 8px', gap:4 }} onClick={() => setEditTarget(team)}>
                          <Edit2 size={10}/>Edit
                        </button>
                        {team.is_active ? (
                          <button className="btn btn-danger" style={{ fontSize:11, padding:'4px 8px', gap:4 }} onClick={() => setDeactTarget(team)}>
                            <Power size={10}/>Nonaktif
                          </button>
                        ) : (
                          <button className="btn btn-success" style={{ fontSize:11, padding:'4px 8px', gap:4 }} onClick={() => handleActivate(team)}>
                            <Power size={10}/>Aktifkan
                          </button>
                        )}
                        <button className="btn btn-danger" style={{ fontSize:11, padding:'4px 8px' }} onClick={() => setDeleteTarget(team)} title="Hapus permanen">
                          <Trash2 size={10}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TeamFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} loading={busy} />
      <TeamFormModal open={!!editTarget} onClose={() => setEditTarget(null)} onSubmit={handleEdit} team={editTarget} loading={busy} />
      <DeactivateModal open={!!deactTarget} onClose={() => setDeactTarget(null)} onConfirm={handleDeactivate} teamName={deactTarget?.name} loading={busy} />
      <DeleteTeamModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} team={deleteTarget} loading={busy} />
    </DashboardLayout>
  )
}