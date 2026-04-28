// SquadPage.jsx — Pembentukan Squad / Lineup tim
// Squad bisa ditarik ke Schedule, dapat notifikasi, dan punya role per posisi

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  Plus, Trash2, Users, Edit2, Shield, Swords, Trophy,
  ChevronDown, ChevronUp, UserCheck, Bell, X, CheckCircle
} from 'lucide-react'

const SQUAD_TYPES = ['Tournament', 'Scrim', 'Mix/Casual', 'Backup']
const TYPE_COLOR  = {
  Tournament: 'var(--amber)', Scrim: 'var(--blue)',
  'Mix/Casual': 'var(--green)', Backup: 'var(--text-dim)',
}

const POSITIONS = ['Jungle','Gold Lane','Exp Lane','Mid','Roam','Sub/Reserve']

export default function SquadPage() {
  const { user }     = useAuth()
  const { addToast } = useToast()

  const [squads,    setSquads]    = useState([])
  const [players,   setPlayers]   = useState([])
  const [teamId,    setTeamId]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState({})

  // Create squad modal
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name:'', type:'Scrim', description:'' })
  const [creating,   setCreating]   = useState(false)

  // Add member modal
  const [addMemberSquad,  setAddMemberSquad]  = useState(null)
  const [addMemberForm,   setAddMemberForm]   = useState({ player_id:'', position:'' })
  const [addingMember,    setAddingMember]    = useState(false)

  // Delete confirm
  const [deleteSquad, setDeleteSquad] = useState(null)
  const [deleting,    setDeleting]    = useState(false)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: me } = await supabase.from('users').select('team_id').eq('id', user.id).single()
      if (!me?.team_id) { setLoading(false); return }
      setTeamId(me.team_id)

      const [{ data: sq }, { data: pl }] = await Promise.all([
        supabase.from('squads')
          .select('*, squad_members(id, position, users(id, name, ign, lane))')
          .eq('team_id', me.team_id)
          .order('created_at', { ascending: false }),
        supabase.from('users')
          .select('id, name, ign, lane, is_active, role')
          .eq('team_id', me.team_id)
          .eq('is_active', true)
          .in('role', ['player', 'staff'])
          .order('name'),
      ])

      setSquads(sq || [])
      setPlayers(pl || [])
      setLoading(false)
    }
    load()
  }, [user])

  async function handleCreateSquad() {
    if (!createForm.name.trim()) { addToast({ message:'Nama squad wajib diisi.', type:'danger' }); return }
    setCreating(true)
    const { data, error } = await supabase.from('squads').insert({
      team_id:     teamId,
      name:        createForm.name.trim(),
      type:        createForm.type,
      description: createForm.description || null,
      created_by:  user.id,
      is_active:   true,
    }).select('*, squad_members(id, position, users(id, name, ign, lane))').single()

    if (error) { addToast({ message:'Gagal: ' + error.message, type:'danger' }); setCreating(false); return }
    setSquads(prev => [data, ...prev])
    setExpanded(prev => ({ ...prev, [data.id]: true }))
    addToast({ message:`Squad "${createForm.name}" berhasil dibuat!`, type:'success' })
    setCreateForm({ name:'', type:'Scrim', description:'' })
    setCreateOpen(false)
    setCreating(false)
  }

  async function handleAddMember() {
    if (!addMemberForm.player_id) { addToast({ message:'Pilih pemain terlebih dahulu.', type:'danger' }); return }
    const squad = addMemberSquad

    // Cek duplikat
    const isDup = squad.squad_members?.some(m => m.users?.id === addMemberForm.player_id)
    if (isDup) { addToast({ message:'Pemain sudah ada di squad ini.', type:'danger' }); return }

    setAddingMember(true)
    const { data, error } = await supabase.from('squad_members').insert({
      squad_id:  squad.id,
      player_id: addMemberForm.player_id,
      position:  addMemberForm.position || null,
    }).select('id, position, users(id, name, ign, lane)').single()

    if (error) { addToast({ message:'Gagal: ' + error.message, type:'danger' }); setAddingMember(false); return }

    setSquads(prev => prev.map(sq =>
      sq.id !== squad.id ? sq
        : { ...sq, squad_members: [...(sq.squad_members || []), data] }
    ))

    // Kirim notifikasi ke player
    const player = players.find(p => p.id === addMemberForm.player_id)
    if (player) {
      await supabase.from('notifications').insert({
        user_id: player.id,
        title:   `Kamu ditambahkan ke Squad "${squad.name}"`,
        body:    `Manager telah menambahkan kamu ke squad ${squad.name} (${squad.type})${addMemberForm.position ? ` sebagai ${addMemberForm.position}` : ''}.`,
        type:    'squad',
        meta:    { squad_id: squad.id },
      }).then(() => {}).catch(() => {})
    }

    addToast({ message:`${player?.name || 'Pemain'} ditambahkan ke squad.`, type:'success' })
    setAddMemberForm({ player_id:'', position:'' })
    setAddMemberSquad(null)
    setAddingMember(false)
  }

  async function handleRemoveMember(squad, memberId, playerName) {
    const { error } = await supabase.from('squad_members').delete().eq('id', memberId)
    if (error) { addToast({ message:'Gagal hapus.', type:'danger' }); return }
    setSquads(prev => prev.map(sq =>
      sq.id !== squad.id ? sq
        : { ...sq, squad_members: sq.squad_members.filter(m => m.id !== memberId) }
    ))
    addToast({ message:`${playerName} dikeluarkan dari squad.`, type:'success' })
  }

  async function confirmDeleteSquad() {
    if (!deleteSquad) return
    setDeleting(true)
    await supabase.from('squad_members').delete().eq('squad_id', deleteSquad.id)
    const { error } = await supabase.from('squads').delete().eq('id', deleteSquad.id)
    if (!error) {
      setSquads(prev => prev.filter(s => s.id !== deleteSquad.id))
      addToast({ message:`Squad "${deleteSquad.name}" dihapus.`, type:'success' })
    }
    setDeleteSquad(null)
    setDeleting(false)
  }

  // Players belum di squad tertentu
  function availablePlayers(squad) {
    const usedIds = new Set(squad.squad_members?.map(m => m.users?.id).filter(Boolean))
    return players.filter(p => !usedIds.has(p.id))
  }

  return (
    <DashboardLayout title="Squad">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Squad Management</h2>
          <p style={{ fontSize:12, color:'var(--text-muted)' }}>Bentuk lineup squad untuk tournament, scrim, dan sesi latihan. Squad terhubung ke Schedule & Notifikasi.</p>
        </div>
        <button className="btn btn-primary" style={{ gap:6 }} onClick={() => setCreateOpen(true)}>
          <Plus size={13} /> Buat Squad
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'40px 0', fontSize:12 }}>Memuat...</p>
      ) : squads.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'52px 0' }}>
          <Users size={32} style={{ color:'var(--text-dim)', margin:'0 auto 12px' }} />
          <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:14 }}>Belum ada squad. Buat lineup pertama kamu!</p>
          <button className="btn btn-primary" style={{ margin:'0 auto', display:'flex', gap:6 }} onClick={() => setCreateOpen(true)}>
            <Plus size={12} /> Buat Squad
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {squads.map(squad => {
            const isOpen = !!expanded[squad.id]
            const color  = TYPE_COLOR[squad.type] || 'var(--text-dim)'
            const members = squad.squad_members || []

            return (
              <div key={squad.id} className="card" style={{ borderLeft:`3px solid ${color}`, paddingLeft:16 }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                      <p style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{squad.name}</p>
                      <span style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background:`${color}22`, color, fontWeight:600 }}>
                        {squad.type}
                      </span>
                      <span style={{ fontSize:10, color:'var(--text-dim)', display:'flex', alignItems:'center', gap:4 }}>
                        <Users size={10} /> {members.length} pemain
                      </span>
                    </div>
                    {squad.description && (
                      <p style={{ fontSize:11, color:'var(--text-muted)' }}>{squad.description}</p>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn" style={{ padding:'5px 10px', fontSize:11, gap:5 }}
                      onClick={() => { setAddMemberSquad(squad); setAddMemberForm({ player_id:'', position:'' }) }}>
                      <UserCheck size={11} /> Tambah
                    </button>
                    <button className="btn btn-danger" style={{ padding:'5px 8px' }} onClick={() => setDeleteSquad(squad)}>
                      <Trash2 size={11} />
                    </button>
                    <button className="btn" style={{ padding:'5px 8px' }}
                      onClick={() => setExpanded(prev => ({ ...prev, [squad.id]: !isOpen }))}>
                      {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>

                {/* Members list */}
                {isOpen && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--border-1)' }}>
                    {members.length === 0 ? (
                      <div style={{ textAlign:'center', padding:'16px 0' }}>
                        <p style={{ fontSize:12, color:'var(--text-dim)', marginBottom:8 }}>Belum ada pemain di squad ini.</p>
                        <button className="btn" style={{ fontSize:11, gap:5, margin:'0 auto', display:'flex' }}
                          onClick={() => { setAddMemberSquad(squad); setAddMemberForm({ player_id:'', position:'' }) }}>
                          <Plus size={10} /> Tambah Pemain
                        </button>
                      </div>
                    ) : (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:8 }}>
                        {members.map(m => (
                          <div key={m.id} style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:32, height:32, borderRadius:8, background:'var(--brand-glow)', border:'1px solid rgba(225,29,72,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'var(--red)', fontFamily:'Syne,sans-serif', flexShrink:0 }}>
                              {(m.users?.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {m.users?.name || '—'}
                              </p>
                              <p style={{ fontSize:10, color:'var(--text-dim)' }}>
                                {m.position || m.users?.lane || '—'}
                              </p>
                            </div>
                            <button style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', padding:3, borderRadius:4 }}
                              onClick={() => handleRemoveMember(squad, m.id, m.users?.name || '?')}
                              title="Keluarkan dari squad">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Posisi yang belum terisi */}
                    {squad.type === 'Tournament' && members.length < 5 && (
                      <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(245,158,11,0.07)', border:'1px dashed rgba(245,158,11,0.3)', borderRadius:8 }}>
                        <p style={{ fontSize:11, color:'#f59e0b' }}>
                          ⚠️ Squad tournament butuh 5 pemain inti. Saat ini baru {members.length} pemain.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Squad Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Buat Squad Baru" size="sm"
        footer={<>
          <Button onClick={() => setCreateOpen(false)}>Batal</Button>
          <Button variant="primary" onClick={handleCreateSquad} disabled={creating}>
            {creating ? 'Membuat...' : 'Buat Squad'}
          </Button>
        </>}
      >
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label className="form-label">Nama Squad *</label>
            <input className="form-input" placeholder="e.g. NXK Main Squad, NXK Academy"
              value={createForm.name} onChange={e => setCreateForm(f=>({...f,name:e.target.value}))} maxLength={60} />
          </div>
          <div>
            <label className="form-label">Tipe Squad</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {SQUAD_TYPES.map(t => (
                <label key={t} style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'8px 10px', borderRadius:7, cursor:'pointer',
                  border:`1px solid ${createForm.type===t ? `${TYPE_COLOR[t]}66` : 'var(--border-1)'}`,
                  background: createForm.type===t ? `${TYPE_COLOR[t]}15` : 'var(--bg-elevated)',
                }}>
                  <input type="radio" name="squad_type" value={t} checked={createForm.type===t}
                    onChange={() => setCreateForm(f=>({...f,type:t}))} style={{ accentColor: TYPE_COLOR[t] }} />
                  <span style={{ fontSize:12, fontWeight:createForm.type===t?600:400, color: createForm.type===t ? TYPE_COLOR[t] : 'var(--text-muted)' }}>{t}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">Deskripsi (opsional)</label>
            <textarea className="form-input" rows={2} placeholder="Keterangan squad..."
              value={createForm.description} onChange={e => setCreateForm(f=>({...f,description:e.target.value}))} maxLength={200} />
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal open={!!addMemberSquad} onClose={() => setAddMemberSquad(null)} title={`Tambah ke "${addMemberSquad?.name}"`} size="sm"
        footer={<>
          <Button onClick={() => setAddMemberSquad(null)}>Batal</Button>
          <Button variant="primary" onClick={handleAddMember} disabled={addingMember}>
            {addingMember ? 'Menambahkan...' : 'Tambahkan'}
          </Button>
        </>}
      >
        {addMemberSquad && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label className="form-label">Pemain *</label>
              <select className="form-input" value={addMemberForm.player_id}
                onChange={e => setAddMemberForm(f=>({...f,player_id:e.target.value}))}>
                <option value="">— Pilih pemain —</option>
                {availablePlayers(addMemberSquad).map(p => (
                  <option key={p.id} value={p.id}>{p.name}{p.ign && p.ign!==p.name ? ` (${p.ign})` : ''} — {p.lane||'—'}</option>
                ))}
              </select>
              {availablePlayers(addMemberSquad).length === 0 && (
                <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:4 }}>Semua pemain aktif sudah ada di squad ini.</p>
              )}
            </div>
            <div>
              <label className="form-label">Posisi di Squad (opsional)</label>
              <select className="form-input" value={addMemberForm.position}
                onChange={e => setAddMemberForm(f=>({...f,position:e.target.value}))}>
                <option value="">Gunakan lane default</option>
                {POSITIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ background:'rgba(56,189,248,0.06)', border:'1px solid rgba(56,189,248,0.15)', borderRadius:8, padding:'10px 12px', display:'flex', gap:8, alignItems:'flex-start' }}>
              <Bell size={12} style={{ color:'#38bdf8', flexShrink:0, marginTop:1 }} />
              <p style={{ fontSize:11, color:'#38bdf8' }}>Pemain akan mendapat notifikasi bahwa mereka ditambahkan ke squad ini.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteSquad} onClose={() => setDeleteSquad(null)} title="Hapus Squad" size="sm"
        footer={<>
          <Button onClick={() => setDeleteSquad(null)} disabled={deleting}>Batal</Button>
          <Button variant="danger" onClick={confirmDeleteSquad} disabled={deleting}>
            {deleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </>}
      >
        <p style={{ fontSize:13, color:'var(--text-secondary)' }}>
          Hapus squad <strong style={{ color:'var(--text-primary)' }}>"{deleteSquad?.name}"</strong>?
          Semua data anggota squad juga akan dihapus.
        </p>
      </Modal>
    </DashboardLayout>
  )
}
