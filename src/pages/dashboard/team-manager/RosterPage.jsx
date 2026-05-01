// RosterPage.jsx — v3
// + Detail info registrasi (regional, birth, esport_type)
// + Filter regional (provinsi)
// + Squad assignment per pemain

import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Search, MapPin, User, Info, ChevronDown, Filter, Gamepad2, Calendar } from 'lucide-react'

const LANES = ['Gold Lane','Exp Lane','Mid','Jungle','Roam','Support','Analyst','Coach','Lainnya']

const ROLE_BADGE = { team_manager:'badge-ocean', staff:'badge-amber', player:'badge-green', super_admin:'badge-red' }
const ROLE_LABEL = { team_manager:'Manager', staff:'Staff', player:'Player', super_admin:'SA' }

export default function RosterPage() {
  const { user }     = useAuth()
  const { addToast } = useToast()

  const [players, setPlayers] = useState([])
  const [appData, setAppData] = useState({}) // userId → player_applications
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filterProv, setFilterProv] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [detailTarget, setDetailTarget] = useState(null) // for detail modal
  const [editTarget,   setEditTarget]   = useState(null)
  const [editForm,     setEditForm]     = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: me } = await supabase.from('users').select('team_id').eq('id', user.id).single()
      if (!me?.team_id) { setLoading(false); return }

      const [{ data: roster }, { data: apps }] = await Promise.all([
        supabase.from('users')
          .select('id,name,ign,lane,is_active,role,province,city,nickname,bio,phone')
          .eq('team_id', me.team_id)
          .neq('role','super_admin')
          .order('role').order('name'),
        supabase.from('player_applications')
          .select('user_id,full_name,birth_place,birth_date,province,city,esport_type,status,created_at')
          .eq('team_id', me.team_id),
      ])

      setPlayers(roster || [])
      // Map apps by user_id
      const aMap = {}
      ;(apps || []).forEach(a => { aMap[a.user_id] = a })
      setAppData(aMap)
      setLoading(false)
    }
    load()
  }, [user])

  // Provinces list from existing data
  const provinces = useMemo(() => {
    const set = new Set()
    players.forEach(p => { if (p.province) set.add(p.province) })
    return [...set].sort()
  }, [players])

  const filtered = useMemo(() => {
    return players.filter(p => {
      if (search && !(p.name+p.ign+p.lane+p.province+p.city).toLowerCase().includes(search.toLowerCase())) return false
      if (filterProv && p.province !== filterProv) return false
      if (filterRole && p.role !== filterRole) return false
      if (filterStatus === 'active'   && !p.is_active) return false
      if (filterStatus === 'inactive' &&  p.is_active) return false
      return true
    })
  }, [players, search, filterProv, filterRole, filterStatus])

  function openEdit(p) {
    setEditTarget(p)
    setEditForm({ name: p.name||'', ign: p.ign||'', lane: p.lane||'' })
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('users')
      .update({ name: editForm.name, ign: editForm.ign, lane: editForm.lane })
      .eq('id', editTarget.id)
    setSaving(false)
    if (error) { addToast({ message:'Gagal update.', type:'danger' }); return }
    setPlayers(prev => prev.map(p => p.id===editTarget.id ? {...p,...editForm} : p))
    addToast({ message:'Anggota diperbarui.', type:'success' })
    setEditTarget(null)
  }

  async function handleToggleActive(p) {
    const next = !p.is_active
    const { error } = await supabase.from('users').update({ is_active: next }).eq('id', p.id)
    if (!error) {
      setPlayers(prev => prev.map(x => x.id===p.id ? {...x, is_active:next} : x))
      addToast({ message:`${p.name || p.ign} ${next?'diaktifkan':'dinonaktifkan'}.`, type:'success' })
    }
  }

  return (
    <DashboardLayout title="Roster">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Roster Tim</h2>
          <p style={{ fontSize:12, color:'var(--text-muted)' }}>Semua anggota tim beserta informasi regional dan detail pendaftaran.</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:12, color:'var(--text-dim)' }}>
            {filtered.length} / {players.length} anggota
          </span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          {/* Search */}
          <div style={{ position:'relative', flex:1, minWidth:180 }}>
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-dim)' }} />
            <input className="form-input" style={{ paddingLeft:30 }} placeholder="Cari nama, IGN, kota..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          {/* Provinsi filter */}
          {provinces.length > 0 && (
            <select className="form-input" style={{ width:'auto', minWidth:150 }} value={filterProv} onChange={e=>setFilterProv(e.target.value)}>
              <option value="">Semua Provinsi</option>
              {provinces.map(p => <option key={p}>{p}</option>)}
            </select>
          )}
          {/* Role filter */}
          <select className="form-input" style={{ width:'auto' }} value={filterRole} onChange={e=>setFilterRole(e.target.value)}>
            <option value="">Semua Role</option>
            <option value="player">Player</option>
            <option value="staff">Staff</option>
            <option value="team_manager">Manager</option>
          </select>
          {/* Status filter */}
          <select className="form-input" style={{ width:'auto' }} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
          {(filterProv || filterRole || filterStatus || search) && (
            <button className="btn" style={{ fontSize:11, padding:'5px 10px', gap:5, flexShrink:0 }}
              onClick={() => { setSearch(''); setFilterProv(''); setFilterRole(''); setFilterStatus('') }}>
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Regional summary */}
      {provinces.length > 1 && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
          {provinces.map(prov => {
            const count = players.filter(p => p.province === prov).length
            return (
              <button key={prov}
                onClick={() => setFilterProv(filterProv === prov ? '' : prov)}
                style={{
                  display:'inline-flex', alignItems:'center', gap:5,
                  padding:'4px 10px', borderRadius:20, fontSize:10, fontWeight:600,
                  cursor:'pointer', fontFamily:'Syne,sans-serif',
                  background: filterProv===prov ? 'var(--brand-glow)' : 'var(--bg-elevated)',
                  border: `1px solid ${filterProv===prov ? 'rgba(225,29,72,0.3)' : 'var(--border-1)'}`,
                  color: filterProv===prov ? 'var(--red)' : 'var(--text-dim)',
                }}
              >
                <MapPin size={8} /> {prov} <span style={{ opacity:0.7 }}>({count})</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {loading ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontSize:12 }}>Memuat...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontSize:12 }}>Tidak ada anggota ditemukan.</p>
        ) : (
          <div className="table-scroll-container">
            <table style={{ width:'100%', minWidth:600 }}>
              <thead>
                <tr>{['Nama / IGN','Lane','Regional','Role','Status','Aksi'].map(h=>(
                  <th key={h} className="table-th">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const app = appData[p.id]
                  return (
                    <tr key={p.id}>
                      <td className="table-td">
                        <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{p.name||'—'}</p>
                        {p.ign && <p style={{ fontSize:10, color:'var(--text-dim)', fontFamily:'IBM Plex Mono,monospace' }}>{p.ign}</p>}
                      </td>
                      <td className="table-td" style={{ fontSize:12, color:'var(--text-muted)' }}>{p.lane||'—'}</td>
                      <td className="table-td">
                        {(p.province || p.city || app?.province || app?.city) ? (
                          <div style={{ display:'flex', alignItems:'flex-start', gap:5 }}>
                            <MapPin size={11} style={{ color:'var(--text-dim)', marginTop:2, flexShrink:0 }} />
                            <div>
                              <p style={{ fontSize:12, color:'var(--text-secondary)' }}>
                                {p.province || app?.province || '—'}
                              </p>
                              <p style={{ fontSize:10, color:'var(--text-dim)' }}>
                                {p.city || app?.city || ''}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize:11, color:'var(--text-dim)' }}>—</span>
                        )}
                      </td>
                      <td className="table-td">
                        <span className={`badge ${ROLE_BADGE[p.role]||'badge-slate'}`}>{ROLE_LABEL[p.role]||p.role}</span>
                      </td>
                      <td className="table-td">
                        <span className={`badge ${p.is_active?'badge-green':'badge-slate'}`}>
                          {p.is_active?'Aktif':'Nonaktif'}
                        </span>
                      </td>
                      <td className="table-td">
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn" style={{ fontSize:11, padding:'4px 8px', gap:4 }} onClick={() => setDetailTarget({...p, app})}>
                            <Info size={10}/> Detail
                          </button>
                          <button className="btn" style={{ fontSize:11, padding:'4px 8px' }} onClick={() => openEdit(p)}>Edit</button>
                          <button className={`btn ${p.is_active?'btn-danger':''}`} style={{ fontSize:11, padding:'4px 8px' }} onClick={() => handleToggleActive(p)}>
                            {p.is_active?'Nonaktif':'Aktifkan'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal open={!!detailTarget} onClose={() => setDetailTarget(null)} title="Detail Anggota" size="md"
        footer={<Button onClick={() => setDetailTarget(null)}>Tutup</Button>}
      >
        {detailTarget && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:'var(--brand-glow)', border:'1px solid rgba(225,29,72,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <User size={22} style={{ color:'var(--red)' }} />
              </div>
              <div>
                <p style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{detailTarget.name}</p>
                {detailTarget.ign && <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'IBM Plex Mono,monospace' }}>IGN: {detailTarget.ign}</p>}
                <div style={{ display:'flex', gap:6, marginTop:4 }}>
                  <span className={`badge ${ROLE_BADGE[detailTarget.role]||'badge-slate'}`} style={{ fontSize:10 }}>{ROLE_LABEL[detailTarget.role]||detailTarget.role}</span>
                  <span className={`badge ${detailTarget.is_active?'badge-green':'badge-slate'}`} style={{ fontSize:10 }}>{detailTarget.is_active?'Aktif':'Nonaktif'}</span>
                </div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
              {/* Regional */}
              <div style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'12px' }}>
                <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:8, fontFamily:'Syne,sans-serif' }}>Regional</p>
                <div style={{ display:'flex', gap:6, alignItems:'flex-start' }}>
                  <MapPin size={13} style={{ color:'var(--brand)', marginTop:1, flexShrink:0 }} />
                  <div>
                    <p style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>
                      {detailTarget.province || detailTarget.app?.province || '—'}
                    </p>
                    <p style={{ fontSize:11, color:'var(--text-muted)' }}>
                      {detailTarget.city || detailTarget.app?.city || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Game */}
              {detailTarget.app?.esport_type && (
                <div style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'12px' }}>
                  <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:8, fontFamily:'Syne,sans-serif' }}>Game</p>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <Gamepad2 size={13} style={{ color:'var(--brand)', flexShrink:0 }} />
                    <p style={{ fontSize:12, color:'var(--text-primary)' }}>{detailTarget.app.esport_type}</p>
                  </div>
                </div>
              )}

              {/* Data registrasi */}
              {detailTarget.app?.full_name && (
                <div style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'12px' }}>
                  <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:8, fontFamily:'Syne,sans-serif' }}>Data Diri</p>
                  <p style={{ fontSize:12, color:'var(--text-primary)', fontWeight:500 }}>{detailTarget.app.full_name}</p>
                  {detailTarget.app.birth_place && (
                    <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>
                      {detailTarget.app.birth_place}{detailTarget.app.birth_date ? `, ${new Date(detailTarget.app.birth_date).toLocaleDateString('id-ID')}` : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Lane */}
              {detailTarget.lane && (
                <div style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'12px' }}>
                  <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:8, fontFamily:'Syne,sans-serif' }}>Posisi</p>
                  <p style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{detailTarget.lane}</p>
                </div>
              )}

              {/* Bio */}
              {detailTarget.bio && (
                <div style={{ gridColumn:'1 / -1', background:'var(--bg-elevated)', borderRadius:8, padding:'12px' }}>
                  <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:6, fontFamily:'Syne,sans-serif' }}>Bio</p>
                  <p style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>{detailTarget.bio}</p>
                </div>
              )}

              {/* Tanggal daftar */}
              {detailTarget.app?.created_at && (
                <div style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'12px' }}>
                  <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:6, fontFamily:'Syne,sans-serif' }}>Bergabung</p>
                  <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                    <Calendar size={12} style={{ color:'var(--text-dim)' }} />
                    <p style={{ fontSize:12, color:'var(--text-muted)' }}>
                      {new Date(detailTarget.app.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Anggota"
        footer={<>
          <Button onClick={() => setEditTarget(null)}>Batal</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>{saving?'Menyimpan...':'Simpan'}</Button>
        </>}
      >
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div><label className="form-label">Nama</label><input className="form-input" value={editForm.name||''} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} /></div>
          <div><label className="form-label">IGN</label><input className="form-input" value={editForm.ign||''} onChange={e=>setEditForm(f=>({...f,ign:e.target.value}))} /></div>
          <div>
            <label className="form-label">Lane / Posisi</label>
            <select className="form-input" value={editForm.lane||''} onChange={e=>setEditForm(f=>({...f,lane:e.target.value}))}>
              <option value="">— Pilih lane —</option>
              {LANES.map(l=><option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
