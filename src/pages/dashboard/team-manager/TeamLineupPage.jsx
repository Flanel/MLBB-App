// TeamLineupPage.jsx — v6
// Fix: player dipilih langsung dari Roster (nama + regional + posisi tampil)
// Hapus: Squad page references
// Desain: Notion-inspired warm whites

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  Plus, Trash2, Users, ChevronDown, ChevronUp,
  Crown, UserCheck, X, Bell, Shield, MapPin, Flag
} from 'lucide-react'

const TEAM_ROLES = ['Kapten','Jungle','Gold Lane','Exp Lane','Mid','Roam','Sub/Reserve']
const ROLE_COLOR = {
  Kapten:'#f59e0b','Jungle':'var(--brand)','Gold Lane':'#ca8a04',
  'Exp Lane':'var(--blue)','Mid':'var(--purple)','Roam':'#0891b2','Sub/Reserve':'var(--text-dim)',
}
const TEAM_STATUS = ['Active','Standby','Disbanded']
const STATUS_COLOR = { Active:'var(--green)', Standby:'var(--amber)', Disbanded:'var(--text-dim)' }

export default function TeamLineupPage() {
  const { user }     = useAuth()
  const { addToast } = useToast()

  const [lineups,   setLineups]   = useState([])
  const [roster,    setRoster]    = useState([])   // semua player aktif di tim
  const [teamId,    setTeamId]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState({})

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name:'', tag:'', description:'', status:'Active' })
  const [creating,   setCreating]   = useState(false)

  const [addTo,        setAddTo]        = useState(null)
  const [addForm,      setAddForm]      = useState({ player_id:'', role_in_team:'Jungle', is_captain:false })
  const [addingMember, setAddingMember] = useState(false)

  const [editCapTarget, setEditCapTarget] = useState(null)
  const [newCaptainId,  setNewCaptainId]  = useState('')

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data:me } = await supabase.from('users').select('team_id').eq('id', user.id).single()
      if (!me?.team_id) { setLoading(false); return }
      setTeamId(me.team_id)

      const [{ data:lu }, { data:pl }] = await Promise.all([
        supabase.from('team_lineups')
          .select('*, team_lineup_members(id, role_in_team, is_captain, users(id, name, ign, lane, province, city))')
          .eq('team_id', me.team_id)
          .order('created_at', { ascending:false }),
        // Ambil dari ROSTER: semua users aktif di tim ini
        supabase.from('users')
          .select('id, name, ign, lane, province, city, is_active, role')
          .eq('team_id', me.team_id)
          .eq('is_active', true)
          .in('role', ['player','staff'])
          .order('name'),
      ])

      setLineups(lu || [])
      setRoster(pl  || [])
      setLoading(false)
    }
    load()
  }, [user])

  async function handleCreate() {
    if (!createForm.name.trim()) { addToast({ message:'Nama tim wajib diisi.', type:'danger' }); return }
    setCreating(true)
    const { data, error } = await supabase.from('team_lineups').insert({
      team_id:     teamId,
      name:        createForm.name.trim(),
      tag:         createForm.tag.trim().toUpperCase() || null,
      description: createForm.description || null,
      status:      createForm.status,
      created_by:  user.id,
    }).select('*, team_lineup_members(id, role_in_team, is_captain, users(id, name, ign, lane, province, city))').single()

    if (error) { addToast({ message:'Gagal: '+error.message, type:'danger' }); setCreating(false); return }
    setLineups(prev => [data, ...prev])
    setExpanded(prev => ({ ...prev, [data.id]:true }))
    addToast({ message:`Tim "${createForm.name}" berhasil dibuat!`, type:'success' })
    setCreateForm({ name:'', tag:'', description:'', status:'Active' })
    setCreateOpen(false)
    setCreating(false)
  }

  async function handleAddMember() {
    if (!addForm.player_id) { addToast({ message:'Pilih pemain dari roster.', type:'danger' }); return }
    const lineup = addTo
    const isDup = lineup.team_lineup_members?.some(m => m.users?.id === addForm.player_id)
    if (isDup) { addToast({ message:'Pemain sudah ada di tim ini.', type:'danger' }); return }

    if (addForm.is_captain) {
      const old = lineup.team_lineup_members?.find(m => m.is_captain)
      if (old) await supabase.from('team_lineup_members').update({ is_captain:false }).eq('id', old.id)
    }

    setAddingMember(true)
    const { data, error } = await supabase.from('team_lineup_members').insert({
      lineup_id:    lineup.id,
      player_id:    addForm.player_id,
      role_in_team: addForm.role_in_team,
      is_captain:   addForm.is_captain,
    }).select('id, role_in_team, is_captain, users(id, name, ign, lane, province, city)').single()

    if (error) { addToast({ message:'Gagal: '+error.message, type:'danger' }); setAddingMember(false); return }

    setLineups(prev => prev.map(l =>
      l.id !== lineup.id ? l
        : { ...l, team_lineup_members: [...(l.team_lineup_members||[]), data] }
    ))

    // Notifikasi ke player
    const player = roster.find(p => p.id === addForm.player_id)
    if (player) {
      await supabase.from('notifications').insert({
        user_id: player.id,
        title:   `Kamu bergabung ke Tim "${lineup.name}"`,
        body:    `Manager telah menambahkan kamu ke Tim ${lineup.name} sebagai ${addForm.role_in_team}${addForm.is_captain?' (Kapten)':''}.`,
        type:    'squad',
        meta:    { lineup_id: lineup.id },
      }).then(()=>{}).catch(()=>{})
    }

    addToast({ message:`${player?.name||'Pemain'} ditambahkan ke tim.`, type:'success' })
    setAddForm({ player_id:'', role_in_team:'Jungle', is_captain:false })
    setAddTo(null)
    setAddingMember(false)
  }

  async function handleRemoveMember(lineup, memberId, playerName) {
    const { error } = await supabase.from('team_lineup_members').delete().eq('id', memberId)
    if (error) { addToast({ message:'Gagal hapus.', type:'danger' }); return }
    setLineups(prev => prev.map(l =>
      l.id !== lineup.id ? l : { ...l, team_lineup_members: l.team_lineup_members.filter(m => m.id !== memberId) }
    ))
    addToast({ message:`${playerName} dikeluarkan.`, type:'success' })
  }

  async function handleSetCaptain() {
    if (!newCaptainId || !editCapTarget) return
    const lineup = editCapTarget
    for (const m of lineup.team_lineup_members||[]) {
      if (m.is_captain) await supabase.from('team_lineup_members').update({ is_captain:false }).eq('id', m.id)
    }
    await supabase.from('team_lineup_members').update({ is_captain:true })
      .eq('lineup_id', lineup.id).eq('player_id', newCaptainId)
    setLineups(prev => prev.map(l =>
      l.id !== lineup.id ? l : { ...l, team_lineup_members: l.team_lineup_members.map(m => ({...m, is_captain: m.users?.id === newCaptainId})) }
    ))
    await supabase.from('notifications').insert({
      user_id: newCaptainId,
      title:   `Kamu menjadi Kapten Tim "${lineup.name}"`,
      body:    `Manager telah menunjuk kamu sebagai kapten Tim ${lineup.name}.`,
      type:    'squad', meta:{ lineup_id: lineup.id },
    }).then(()=>{}).catch(()=>{})
    addToast({ message:'Kapten diperbarui!', type:'success' })
    setEditCapTarget(null); setNewCaptainId('')
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('team_lineup_members').delete().eq('lineup_id', deleteTarget.id)
    const { error } = await supabase.from('team_lineups').delete().eq('id', deleteTarget.id)
    if (!error) { setLineups(prev => prev.filter(l => l.id !== deleteTarget.id)); addToast({ message:`Tim "${deleteTarget.name}" dihapus.`, type:'success' }) }
    setDeleteTarget(null); setDeleting(false)
  }

  function availablePlayers(lineup) {
    const used = new Set(lineup.team_lineup_members?.map(m => m.users?.id).filter(Boolean))
    return roster.filter(p => !used.has(p.id))
  }

  return (
    <DashboardLayout title="Tim">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 className="page-heading">Tim Kompetitif</h1>
          <p className="page-subheading">Lineup tetap untuk tournament. Terhubung ke Schedule, kirim notifikasi otomatis.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)} style={{ gap:6, flexShrink:0 }}>
          <Plus size={14}/> Buat Tim
        </button>
      </div>

      {/* Info banner */}
      <div style={{ background:'var(--canvas-alt)', border:'var(--border)', borderRadius:'var(--radius-lg)', padding:'12px 16px', marginBottom:20, display:'flex', gap:10 }}>
        <Shield size={14} style={{ color:'var(--blue)', flexShrink:0, marginTop:1 }} />
        <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>
          <strong style={{ color:'var(--text-primary)', fontWeight:600 }}>Tim</strong> adalah lineup tetap untuk tournament.
          Pemain ditambahkan langsung dari <strong style={{ color:'var(--text-primary)', fontWeight:600 }}>Roster</strong> aktif.
          Beda dengan Squad yang sifatnya fleksibel.
        </p>
      </div>

      {loading ? (
        <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'40px 0', fontSize:14 }}>Memuat...</p>
      ) : lineups.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'56px 0' }}>
          <div style={{ width:48, height:48, borderRadius:'var(--radius-lg)', background:'var(--canvas-alt)', border:'var(--border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <Users size={22} style={{ color:'var(--text-dim)' }}/>
          </div>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:14 }}>Belum ada tim. Buat lineup kompetitif pertama!</p>
          <button className="btn btn-primary" style={{ margin:'0 auto', display:'flex', gap:6 }} onClick={() => setCreateOpen(true)}>
            <Plus size={13}/> Buat Tim
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {lineups.map(lineup => {
            const isOpen  = !!expanded[lineup.id]
            const members = lineup.team_lineup_members || []
            const captain = members.find(m => m.is_captain)
            const statusC = STATUS_COLOR[lineup.status] || 'var(--text-dim)'

            return (
              <div key={lineup.id} className="card" style={{ borderLeft:`3px solid ${statusC}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                      {lineup.tag && (
                        <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, padding:'1px 7px', borderRadius:'var(--radius-sm)', background:'var(--brand-subtle)', color:'var(--brand)', border:'var(--brand-border)' }}>
                          [{lineup.tag}]
                        </span>
                      )}
                      <p style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', letterSpacing:'-0.1px' }}>{lineup.name}</p>
                      <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:'var(--radius-pill)', background:`${statusC}15`, color:statusC }}>{lineup.status}</span>
                      <span style={{ fontSize:12, color:'var(--text-dim)', display:'flex', alignItems:'center', gap:3 }}><Users size={11}/>{members.length}/5 pemain</span>
                      {captain && (
                        <span style={{ fontSize:11, color:'#ca8a04', display:'flex', alignItems:'center', gap:3 }}>
                          <Crown size={11} fill="#ca8a04"/> {captain.users?.ign || captain.users?.name}
                        </span>
                      )}
                    </div>
                    {lineup.description && <p style={{ fontSize:13, color:'var(--text-muted)' }}>{lineup.description}</p>}
                  </div>

                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn" style={{ fontSize:12, padding:'6px 10px', gap:5 }}
                      onClick={() => { setAddTo(lineup); setAddForm({ player_id:'', role_in_team:'Jungle', is_captain:false }) }}>
                      <UserCheck size={12}/> Tambah
                    </button>
                    <button className="btn" style={{ padding:'6px 8px' }} title="Ganti kapten"
                      onClick={() => { setEditCapTarget(lineup); setNewCaptainId(captain?.users?.id||'') }}>
                      <Crown size={12}/>
                    </button>
                    <button className="btn btn-danger" style={{ padding:'6px 8px' }} onClick={() => setDeleteTarget(lineup)}>
                      <Trash2 size={12}/>
                    </button>
                    <button className="btn" style={{ padding:'6px 8px' }}
                      onClick={() => setExpanded(prev => ({ ...prev, [lineup.id]:!isOpen }))}>
                      {isOpen ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:'var(--border)' }}>
                    {members.length === 0 ? (
                      <div style={{ textAlign:'center', padding:'20px 0' }}>
                        <p style={{ fontSize:13, color:'var(--text-dim)', marginBottom:10 }}>Belum ada anggota di tim ini.</p>
                        <button className="btn btn-cyan" style={{ fontSize:12, gap:5, margin:'0 auto', display:'flex' }}
                          onClick={() => { setAddTo(lineup); setAddForm({ player_id:'', role_in_team:'Jungle', is_captain:false }) }}>
                          <Plus size={11}/> Tambah dari Roster
                        </button>
                      </div>
                    ) : (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8 }}>
                        {members.map(m => {
                          const rc = ROLE_COLOR[m.role_in_team] || 'var(--text-dim)'
                          return (
                            <div key={m.id} style={{ background: m.is_captain ? 'rgba(251,191,36,0.06)' : 'var(--canvas-alt)', borderRadius:'var(--radius-md)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10, border: m.is_captain ? '1px solid rgba(251,191,36,0.2)' : 'var(--border)' }}>
                              <div style={{ width:34, height:34, borderRadius:'var(--radius-md)', background: m.is_captain ? 'rgba(251,191,36,0.12)' : 'var(--brand-subtle)', border: m.is_captain ? '1px solid rgba(251,191,36,0.25)' : 'var(--brand-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color: m.is_captain ? '#b45309' : 'var(--brand)', flexShrink:0 }}>
                                {m.is_captain ? <Crown size={15} fill="#b45309"/> : (m.users?.name||'?').charAt(0).toUpperCase()}
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                                  <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                    {m.users?.ign || m.users?.name || '—'}
                                  </p>
                                </div>
                                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                                  <span style={{ fontSize:9, fontWeight:600, padding:'1px 5px', borderRadius:'var(--radius-pill)', background:`${rc}18`, color:rc }}>
                                    {m.role_in_team}
                                  </span>
                                  {m.users?.province && (
                                    <span style={{ fontSize:9, color:'var(--text-dim)', display:'flex', alignItems:'center', gap:2 }}>
                                      <MapPin size={8}/>{m.users.province}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', padding:3, borderRadius:'var(--radius-sm)', flexShrink:0 }}
                                onClick={() => handleRemoveMember(lineup, m.id, m.users?.name||'?')}>
                                <X size={12}/>
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {members.length > 0 && members.length < 5 && lineup.status === 'Active' && (
                      <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(221,91,0,0.06)', border:'1px dashed rgba(221,91,0,0.25)', borderRadius:'var(--radius-md)' }}>
                        <p style={{ fontSize:12, color:'var(--amber)' }}>⚠ Tim kompetitif butuh 5 pemain inti. Saat ini {members.length} pemain.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Buat Tim Kompetitif" size="sm"
        footer={<><Button onClick={() => setCreateOpen(false)}>Batal</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating?'Membuat...':'Buat Tim'}</Button></>}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:10 }}>
            <div>
              <label className="form-label">Nama Tim *</label>
              <input className="form-input" placeholder="e.g. NXK Main Team" maxLength={60}
                value={createForm.name} onChange={e => setCreateForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div>
              <label className="form-label">Tag</label>
              <input className="form-input" placeholder="NXK" maxLength={5}
                style={{ textTransform:'uppercase' }}
                value={createForm.tag} onChange={e => setCreateForm(f=>({...f,tag:e.target.value.toUpperCase()}))} />
            </div>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-input" value={createForm.status} onChange={e => setCreateForm(f=>({...f,status:e.target.value}))}>
              {TEAM_STATUS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Deskripsi (opsional)</label>
            <textarea className="form-input" rows={2} placeholder="Keterangan tim..." maxLength={200}
              value={createForm.description} onChange={e => setCreateForm(f=>({...f,description:e.target.value}))} />
          </div>
          <div style={{ background:'rgba(26,174,57,0.06)', border:'1px solid rgba(26,174,57,0.15)', borderRadius:'var(--radius-md)', padding:'10px 12px', display:'flex', gap:8 }}>
            <Bell size={13} style={{ color:'var(--green)', flexShrink:0, marginTop:1 }}/>
            <p style={{ fontSize:12, color:'var(--green)', lineHeight:1.5 }}>Anggota tim ini akan otomatis mendapat notifikasi setiap jadwal baru yang di-assign ke tim ini.</p>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal — PILIH DARI ROSTER */}
      <Modal open={!!addTo} onClose={() => setAddTo(null)} title={`Tambah Pemain ke "${addTo?.name}"`} size="sm"
        footer={<><Button onClick={() => setAddTo(null)}>Batal</Button><Button variant="primary" onClick={handleAddMember} disabled={addingMember}>{addingMember?'Menambahkan...':'Tambahkan'}</Button></>}>
        {addTo && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label className="form-label">Pilih dari Roster *</label>
              {availablePlayers(addTo).length === 0 ? (
                <div style={{ padding:'12px', background:'var(--canvas-alt)', borderRadius:'var(--radius-md)', border:'var(--border)' }}>
                  <p style={{ fontSize:13, color:'var(--text-dim)', textAlign:'center' }}>
                    Semua pemain aktif di roster sudah ada di tim ini.
                  </p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:220, overflowY:'auto' }}>
                  {availablePlayers(addTo).map(p => (
                    <label key={p.id} style={{
                      display:'flex', alignItems:'center', gap:10,
                      padding:'9px 12px', borderRadius:'var(--radius-md)', cursor:'pointer',
                      border: addForm.player_id===p.id ? 'var(--brand-border)' : 'var(--border)',
                      background: addForm.player_id===p.id ? 'var(--brand-subtle)' : 'var(--canvas-alt)',
                      transition:'all 0.1s',
                    }}>
                      <input type="radio" name="player_pick" value={p.id} checked={addForm.player_id===p.id}
                        onChange={() => setAddForm(f=>({...f,player_id:p.id,role_in_team:p.lane||'Jungle'}))}
                        style={{ accentColor:'var(--brand)' }} />
                      <div style={{ width:30, height:30, borderRadius:'var(--radius-sm)', background: addForm.player_id===p.id ? 'var(--brand-glow)' : 'rgba(0,0,0,0.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color: addForm.player_id===p.id ? 'var(--brand)' : 'var(--text-dim)', flexShrink:0 }}>
                        {(p.name||'?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{p.name}{p.ign && p.ign!==p.name && <span style={{ fontSize:11, color:'var(--text-dim)', marginLeft:5, fontFamily:'monospace' }}>({p.ign})</span>}</p>
                        <div style={{ display:'flex', gap:8, marginTop:2 }}>
                          {p.lane && <span style={{ fontSize:10, color:'var(--text-dim)' }}>{p.lane}</span>}
                          {p.province && <span style={{ fontSize:10, color:'var(--text-dim)', display:'flex', alignItems:'center', gap:2 }}><MapPin size={8}/>{p.province}</span>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="form-label">Role di Tim</label>
              <select className="form-input" value={addForm.role_in_team} onChange={e => setAddForm(f=>({...f,role_in_team:e.target.value}))}>
                {TEAM_ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            <label style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:'var(--radius-md)', background:'rgba(251,191,36,0.05)', border:'1px solid rgba(251,191,36,0.18)', cursor:'pointer' }}>
              <input type="checkbox" checked={addForm.is_captain} onChange={e => setAddForm(f=>({...f,is_captain:e.target.checked}))} style={{ accentColor:'#ca8a04' }} />
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:'#b45309', display:'flex', alignItems:'center', gap:5 }}><Crown size={13}/> Jadikan Kapten</p>
                <p style={{ fontSize:11, color:'var(--text-dim)' }}>Kapten sebelumnya akan otomatis digantikan.</p>
              </div>
            </label>
          </div>
        )}
      </Modal>

      {/* Edit Captain Modal */}
      <Modal open={!!editCapTarget} onClose={() => setEditCapTarget(null)} title={`Ganti Kapten — ${editCapTarget?.name}`} size="sm"
        footer={<><Button onClick={() => setEditCapTarget(null)}>Batal</Button><Button variant="primary" onClick={handleSetCaptain} disabled={!newCaptainId}>Simpan</Button></>}>
        {editCapTarget && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label className="form-label">Pilih Kapten Baru</label>
              <select className="form-input" value={newCaptainId} onChange={e => setNewCaptainId(e.target.value)}>
                <option value="">— Pilih —</option>
                {(editCapTarget.team_lineup_members||[]).map(m => (
                  <option key={m.id} value={m.users?.id}>
                    {m.users?.ign||m.users?.name} — {m.role_in_team}{m.is_captain?' (Kapten saat ini)':''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Tim" size="sm"
        footer={<><Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Batal</Button><Button variant="danger" onClick={confirmDelete} disabled={deleting}>{deleting?'Menghapus...':'Hapus'}</Button></>}>
        <p style={{ fontSize:14, color:'var(--text-muted)' }}>
          Hapus tim <strong style={{ color:'var(--text-primary)' }}>"{deleteTarget?.name}"</strong>?
          Semua data anggota dan koneksi ke jadwal akan ikut terhapus.
        </p>
      </Modal>
    </DashboardLayout>
  )
}
