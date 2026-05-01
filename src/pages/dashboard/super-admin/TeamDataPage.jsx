import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  ArrowLeft, Trash2, Users, Swords, Trophy, Calendar,
  Activity, Key, RefreshCw, AlertTriangle, ChevronRight, Loader
} from 'lucide-react'

const TABS = [
  { key:'members',      label:'Members',      icon: Users },
  { key:'matches',      label:'Matches',      icon: Swords },
  { key:'tournaments',  label:'Tournaments',  icon: Trophy },
  { key:'schedules',    label:'Schedules',    icon: Calendar },
  { key:'activities',   label:'Activities',   icon: Activity },
  { key:'invites',      label:'Invite Tokens',icon: Key },
]

async function logAudit(userId, action, target) {
  await supabase.from('audit_logs').insert({ user_id: userId, action, target })
}

export default function TeamDataPage() {
  const { teamId } = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const { addToast } = useToast()

  const [team, setTeam]       = useState(null)
  const [activeTab, setActiveTab] = useState('members')
  const [data, setData]       = useState({})
  const [loading, setLoading] = useState({})
  const [deleteModal, setDeleteModal] = useState(null) // { type, item, label }
  const [bulkModal, setBulkModal]     = useState(null) // { type, label, count }
  const [busy, setBusy]       = useState(false)

  // Load team info
  useEffect(() => {
    supabase.from('teams').select('*').eq('id', teamId).single()
      .then(({ data: t }) => setTeam(t))
  }, [teamId])

  // Load tab data
  const loadTab = useCallback(async (tab) => {
    setLoading(prev => ({ ...prev, [tab]: true }))
    let result = []

    if (tab === 'members') {
      const { data: d } = await supabase.from('users')
        .select('id, name, email, role, ign, lane, is_active, created_at')
        .eq('team_id', teamId).order('role').order('name')
      result = d || []
    } else if (tab === 'matches') {
      const { data: d } = await supabase.from('matches')
        .select('*, tournaments(name)')
        .eq('team_id', teamId).order('date', { ascending: false })
      result = d || []
    } else if (tab === 'tournaments') {
      const { data: d } = await supabase.from('tournaments')
        .select('*').eq('team_id', teamId).order('created_at', { ascending: false })
      result = d || []
    } else if (tab === 'schedules') {
      const { data: d } = await supabase.from('schedules')
        .select('*, schedule_availability(count)').eq('team_id', teamId).order('date', { ascending: false })
      result = d || []
    } else if (tab === 'activities') {
      const { data: d } = await supabase.from('player_activities')
        .select('*, users!inner(name, team_id)')
        .eq('users.team_id', teamId)
        .order('logged_at', { ascending: false }).limit(100)
      result = d || []
    } else if (tab === 'invites') {
      const { data: d } = await supabase.from('invite_tokens')
        .select('*, users!created_by(name)').eq('team_id', teamId).order('created_at', { ascending: false })
      result = d || []
    }

    setData(prev => ({ ...prev, [tab]: result }))
    setLoading(prev => ({ ...prev, [tab]: false }))
  }, [teamId])

  useEffect(() => {
    if (teamId) loadTab(activeTab)
  }, [activeTab, teamId, loadTab])

  // ── Single item delete ──
  async function handleDeleteItem() {
    if (!deleteModal) return
    setBusy(true)
    const { type, item } = deleteModal
    let error = null

    if (type === 'match') {
      await supabase.from('match_player_stats').delete().eq('match_id', item.id)
      ;({ error } = await supabase.from('matches').delete().eq('id', item.id))
    } else if (type === 'tournament') {
      // null out matches referencing this tournament
      await supabase.from('matches').update({ tournament_id: null }).eq('tournament_id', item.id)
      ;({ error } = await supabase.from('tournaments').delete().eq('id', item.id))
    } else if (type === 'schedule') {
      await supabase.from('schedule_availability').delete().eq('schedule_id', item.id)
      ;({ error } = await supabase.from('schedules').delete().eq('id', item.id))
    } else if (type === 'activity') {
      ;({ error } = await supabase.from('player_activities').delete().eq('id', item.id))
    } else if (type === 'invite') {
      ;({ error } = await supabase.from('invite_tokens').delete().eq('id', item.id))
    } else if (type === 'member') {
      // Unassign from team (don't delete auth user)
      ;({ error } = await supabase.from('users').update({ team_id: null, is_active: false }).eq('id', item.id))
    }

    if (error) {
      addToast({ message: `Gagal: ${error.message}`, type:'danger' })
    } else {
      setData(prev => ({ ...prev, [activeTab]: (prev[activeTab] || []).filter(x => x.id !== item.id) }))
      await logAudit(user?.id, `Hapus ${type} dari tim`, team?.name)
      addToast({ message: `${deleteModal.label} dihapus.`, type:'success' })
    }
    setDeleteModal(null)
    setBusy(false)
  }

  // ── Bulk delete by tab ──
  async function handleBulkDelete() {
    if (!bulkModal) return
    setBusy(true)
    const { type } = bulkModal
    let error = null

    if (type === 'matches') {
      const ids = (data.matches || []).map(m => m.id)
      if (ids.length) await supabase.from('match_player_stats').delete().in('match_id', ids)
      ;({ error } = await supabase.from('matches').delete().eq('team_id', teamId))
    } else if (type === 'tournaments') {
      await supabase.from('matches').update({ tournament_id: null }).eq('team_id', teamId)
      ;({ error } = await supabase.from('tournaments').delete().eq('team_id', teamId))
    } else if (type === 'schedules') {
      const ids = (data.schedules || []).map(s => s.id)
      if (ids.length) await supabase.from('schedule_availability').delete().in('schedule_id', ids)
      ;({ error } = await supabase.from('schedules').delete().eq('team_id', teamId))
    } else if (type === 'invites') {
      ;({ error } = await supabase.from('invite_tokens').delete().eq('team_id', teamId))
    }

    if (error) {
      addToast({ message: `Gagal bulk delete: ${error.message}`, type:'danger' })
    } else {
      setData(prev => ({ ...prev, [type]: [] }))
      await logAudit(user?.id, `Hapus semua ${type}`, team?.name)
      addToast({ message: `Semua ${bulkModal.label} dihapus.`, type:'success' })
    }
    setBulkModal(null)
    setBusy(false)
  }

  const currentData = data[activeTab] || []
  const isLoading   = loading[activeTab]
  const TabIcon     = TABS.find(t => t.key === activeTab)?.icon || Users

  return (
    <DashboardLayout title="Team Data Explorer">
      {/* Breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, fontSize:12, color:'var(--text-muted)' }}>
        <Link to="/super-admin/teams" style={{ color:'var(--text-muted)', textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
          <ArrowLeft size={12}/>Teams
        </Link>
        <ChevronRight size={10} />
        <span style={{ color:'var(--text-primary)' }}>{team?.name || '...'}</span>
        <ChevronRight size={10} />
        <span>Data Explorer</span>
      </div>

      {/* Team header */}
      {team && (
        <div className="card-hud" style={{ marginBottom:20, display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <p style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, color:'var(--text-primary)' }}>{team.name}</p>
              <span className={`badge ${team.is_active ? 'badge-green' : 'badge-slate'}`}>{team.is_active ? 'Aktif' : 'Nonaktif'}</span>
            </div>
            <p style={{ fontSize:12, color:'var(--text-muted)' }}>{team.game} · ID: <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:11 }}>{team.id}</span></p>
          </div>
          <button className="btn" style={{ gap:6 }} onClick={() => loadTab(activeTab)} title="Refresh">
            <RefreshCw size={12} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }}/>Refresh
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, flexWrap:'wrap', borderBottom:'1px solid var(--border-1)', paddingBottom:0 }}>
        {TABS.map(tab => {
          const Ic = tab.icon
          const count = data[tab.key]?.length
          const active = activeTab === tab.key
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
                fontSize:12, fontFamily:'DM Sans,sans-serif', fontWeight: active ? 600 : 400,
                background:'none', border:'none', cursor:'pointer',
                color: active ? 'var(--brand)' : 'var(--text-muted)',
                borderBottom: active ? '2px solid var(--brand)' : '2px solid transparent',
                marginBottom:-1, transition:'all 0.12s',
              }}>
              <Ic size={12}/>
              {tab.label}
              {count !== undefined && (
                <span style={{ fontSize:10, padding:'1px 5px', borderRadius:10,
                  background: active ? 'var(--brand-glow)' : 'var(--bg-elevated)',
                  color: active ? 'var(--brand)' : 'var(--text-dim)',
                  border: `1px solid ${active ? 'var(--brand-border)' : 'var(--border-1)'}` }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {/* Tab toolbar */}
        {!isLoading && currentData.length > 0 && !['members'].includes(activeTab) && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid var(--border-1)', background:'var(--bg-elevated)' }}>
            <p style={{ fontSize:12, color:'var(--text-muted)' }}>{currentData.length} record ditemukan</p>
            <button className="btn btn-danger" style={{ fontSize:11, gap:5 }}
              onClick={() => setBulkModal({ type: activeTab, label: TABS.find(t=>t.key===activeTab)?.label, count: currentData.length })}>
              <Trash2 size={11}/>Hapus Semua {TABS.find(t=>t.key===activeTab)?.label}
            </button>
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-dim)', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <Loader size={14} className="spin"/>Memuat...
          </div>
        ) : currentData.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-dim)', fontSize:12 }}>
            <TabIcon size={24} style={{ margin:'0 auto 8px', opacity:0.3 }}/>
            <p>Tidak ada data.</p>
          </div>
        ) : (
          <div className="table-scroll-container">
            <table style={{ width:'100%', minWidth:600 }}>
              <thead>
                <tr>
                  {activeTab === 'members' && ['Nama','Role','IGN','Status','Aksi'].map(h => <th key={h} className="table-th">{h}</th>)}
                  {activeTab === 'matches' && ['Tanggal','Lawan','Hasil','Tournament','Aksi'].map(h => <th key={h} className="table-th">{h}</th>)}
                  {activeTab === 'tournaments' && ['Nama','Platform','Status','Placement','Aksi'].map(h => <th key={h} className="table-th">{h}</th>)}
                  {activeTab === 'schedules' && ['Judul','Tipe','Tanggal','Waktu','Aksi'].map(h => <th key={h} className="table-th">{h}</th>)}
                  {activeTab === 'activities' && ['Player','Tipe','Durasi','Tanggal','Aksi'].map(h => <th key={h} className="table-th">{h}</th>)}
                  {activeTab === 'invites' && ['Token','Role','Dibuat','Expires','Status','Aksi'].map(h => <th key={h} className="table-th">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {currentData.map(item => (
                  <tr key={item.id}>
                    {activeTab === 'members' && <>
                      <td className="table-td">
                        <p style={{ fontWeight:500, color:'var(--text-primary)' }}>{item.name}</p>
                        <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:1 }}>{item.email}</p>
                      </td>
                      <td className="table-td"><span className="badge badge-cyan" style={{ fontSize:10 }}>{item.role}</span></td>
                      <td className="table-td" style={{ color:'var(--text-muted)' }}>{item.ign || '—'}</td>
                      <td className="table-td"><span className={`badge ${item.is_active ? 'badge-green' : 'badge-slate'}`}>{item.is_active ? 'aktif' : 'nonaktif'}</span></td>
                      <td className="table-td">
                        <button className="btn btn-danger" style={{ fontSize:11, padding:'4px 8px', gap:4 }}
                          onClick={() => setDeleteModal({ type:'member', item, label: item.name })}>
                          <Trash2 size={10}/>Keluarkan
                        </button>
                      </td>
                    </>}

                    {activeTab === 'matches' && <>
                      <td className="table-td" style={{ color:'var(--text-muted)', fontSize:12 }}>{format(new Date(item.date), 'd MMM yyyy', { locale: localeId })}</td>
                      <td className="table-td" style={{ fontWeight:500, color:'var(--text-primary)' }}>vs {item.opponent}</td>
                      <td className="table-td"><span className={`badge ${item.result === 'Win' ? 'badge-green' : 'badge-red'}`}>{item.result}</span></td>
                      <td className="table-td" style={{ color:'var(--text-muted)', fontSize:12 }}>{item.tournaments?.name || item.tournament || '—'}</td>
                      <td className="table-td">
                        <button className="btn btn-danger" style={{ fontSize:11, padding:'4px 8px', gap:4 }}
                          onClick={() => setDeleteModal({ type:'match', item, label: `Match vs ${item.opponent}` })}>
                          <Trash2 size={10}/>Hapus
                        </button>
                      </td>
                    </>}

                    {activeTab === 'tournaments' && <>
                      <td className="table-td" style={{ fontWeight:500, color:'var(--text-primary)' }}>{item.name}</td>
                      <td className="table-td" style={{ color:'var(--text-muted)' }}>{item.platform}</td>
                      <td className="table-td"><span className={`badge ${item.status === 'Completed' ? 'badge-green' : 'badge-amber'}`}>{item.status}</span></td>
                      <td className="table-td" style={{ color:'var(--text-muted)' }}>{item.placement || '—'}</td>
                      <td className="table-td">
                        <button className="btn btn-danger" style={{ fontSize:11, padding:'4px 8px', gap:4 }}
                          onClick={() => setDeleteModal({ type:'tournament', item, label: item.name })}>
                          <Trash2 size={10}/>Hapus
                        </button>
                      </td>
                    </>}

                    {activeTab === 'schedules' && <>
                      <td className="table-td" style={{ fontWeight:500, color:'var(--text-primary)' }}>{item.title}</td>
                      <td className="table-td"><span className="badge badge-cyan" style={{ fontSize:10 }}>{item.session_type}</span></td>
                      <td className="table-td" style={{ color:'var(--text-muted)', fontSize:12 }}>{format(new Date(item.date), 'd MMM yyyy', { locale: localeId })}</td>
                      <td className="table-td" style={{ color:'var(--text-muted)', fontSize:12 }}>{item.start_time} – {item.end_time}</td>
                      <td className="table-td">
                        <button className="btn btn-danger" style={{ fontSize:11, padding:'4px 8px', gap:4 }}
                          onClick={() => setDeleteModal({ type:'schedule', item, label: item.title })}>
                          <Trash2 size={10}/>Hapus
                        </button>
                      </td>
                    </>}

                    {activeTab === 'activities' && <>
                      <td className="table-td" style={{ fontWeight:500, color:'var(--text-primary)' }}>{item.users?.name || '—'}</td>
                      <td className="table-td"><span className="badge badge-blue" style={{ fontSize:10 }}>{item.activity_type}</span></td>
                      <td className="table-td" style={{ color:'var(--text-muted)' }}>{item.duration_minutes} mnt</td>
                      <td className="table-td" style={{ color:'var(--text-muted)', fontSize:12 }}>{format(new Date(item.logged_at), 'd MMM yyyy', { locale: localeId })}</td>
                      <td className="table-td">
                        <button className="btn btn-danger" style={{ fontSize:11, padding:'4px 8px', gap:4 }}
                          onClick={() => setDeleteModal({ type:'activity', item, label: `Activity: ${item.activity_type}` })}>
                          <Trash2 size={10}/>Hapus
                        </button>
                      </td>
                    </>}

                    {activeTab === 'invites' && <>
                      <td className="table-td"><code style={{ fontSize:10, fontFamily:'IBM Plex Mono,monospace', color:'var(--text-muted)' }}>{item.token?.slice(0,16)}...</code></td>
                      <td className="table-td"><span className="badge badge-purple" style={{ fontSize:10 }}>{item.role}</span></td>
                      <td className="table-td" style={{ fontSize:12, color:'var(--text-muted)' }}>{item.users?.name || '—'}</td>
                      <td className="table-td" style={{ fontSize:12, color: new Date(item.expires_at) < new Date() ? 'var(--red)' : 'var(--text-muted)' }}>
                        {format(new Date(item.expires_at), 'd MMM, HH:mm')}
                      </td>
                      <td className="table-td">
                        <span className={`badge ${item.used_at ? 'badge-green' : new Date(item.expires_at) < new Date() ? 'badge-red' : 'badge-amber'}`}>
                          {item.used_at ? 'Digunakan' : new Date(item.expires_at) < new Date() ? 'Expired' : 'Aktif'}
                        </span>
                      </td>
                      <td className="table-td">
                        <button className="btn btn-danger" style={{ fontSize:11, padding:'4px 8px', gap:4 }}
                          onClick={() => setDeleteModal({ type:'invite', item, label: `Invite token` })}>
                          <Trash2 size={10}/>Hapus
                        </button>
                      </td>
                    </>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Single delete confirm */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Konfirmasi Hapus" size="sm"
        footer={<><Button onClick={() => setDeleteModal(null)} disabled={busy}>Batal</Button><Button variant="danger" onClick={handleDeleteItem} disabled={busy}>{busy ? 'Menghapus...' : 'Hapus'}</Button></>}
      >
        <div style={{ display:'flex', gap:12, fontSize:13, color:'var(--text-secondary)' }}>
          <AlertTriangle size={16} style={{ color:'var(--red)', flexShrink:0, marginTop:1 }}/>
          <p>Hapus <strong style={{ color:'var(--text-primary)' }}>{deleteModal?.label}</strong>? Aksi ini tidak bisa dibatalkan.</p>
        </div>
      </Modal>

      {/* Bulk delete confirm */}
      <Modal open={!!bulkModal} onClose={() => setBulkModal(null)} title={`Hapus Semua ${bulkModal?.label}`} size="sm"
        footer={<><Button onClick={() => setBulkModal(null)} disabled={busy}>Batal</Button><Button variant="danger" onClick={handleBulkDelete} disabled={busy}>{busy ? 'Menghapus...' : `Hapus ${bulkModal?.count} Record`}</Button></>}
      >
        <div style={{ display:'flex', gap:12, fontSize:13, color:'var(--text-secondary)' }}>
          <AlertTriangle size={16} style={{ color:'var(--red)', flexShrink:0, marginTop:1 }}/>
          <div>
            <p>Hapus semua <strong style={{ color:'var(--text-primary)' }}>{bulkModal?.count} {bulkModal?.label}</strong> dari tim <strong style={{ color:'var(--text-primary)' }}>{team?.name}</strong>?</p>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:6 }}>Data terkait (stats, availability, dll) juga akan ikut terhapus. Tidak bisa dibatalkan.</p>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}