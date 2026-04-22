import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

const GAMES = ['Mobile Legends','Valorant','PUBG Mobile','Free Fire','Dota 2','League of Legends','Other']
const EMPTY = { name: '', game: 'Mobile Legends' }

export default function TeamFormModal({ open, onClose, onSubmit, team = null, loading = false }) {
  const isEdit = !!team
  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) { setForm(team ? { name: team.name, game: team.game } : EMPTY); setErrors({}) }
  }, [open, team])

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama tim wajib diisi.'
    if (form.name.trim().length > 60) e.name = 'Maksimal 60 karakter.'
    if (!form.game) e.game = 'Game wajib dipilih.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ name: form.name.trim(), game: form.game })
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Tim' : 'Buat Tim Baru'} size="sm"
      footer={<><Button onClick={onClose} disabled={loading}>Batal</Button><Button variant="primary" onClick={handleSubmit} disabled={loading}>{loading ? (isEdit?'Menyimpan...':'Membuat...') : (isEdit?'Simpan':'Buat Tim')}</Button></>}
    >
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label className="form-label">Nama Tim</label>
          <input className="form-input" placeholder="e.g. Phantom Five" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} autoFocus />
          {errors.name && <p style={{ fontSize:11, marginTop:4, color:'var(--red)' }}>{errors.name}</p>}
        </div>
        <div>
          <label className="form-label">Game</label>
          <select className="form-input" value={form.game} onChange={e=>setForm(f=>({...f,game:e.target.value}))}>
            {GAMES.map(g=><option key={g} value={g}>{g}</option>)}
          </select>
          {errors.game && <p style={{ fontSize:11, marginTop:4, color:'var(--red)' }}>{errors.game}</p>}
        </div>
      </form>
    </Modal>
  )
}
