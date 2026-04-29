// TeamPage.jsx — Player view: info tim + captain input match via foto (Gemini Flash)
// Gemini Vision API gratis via Google AI Studio → VITE_GEMINI_API_KEY

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  Users, Crown, Flag, MapPin, Swords,
  Upload, Loader2, CheckCircle, Image, X,
  Shield, Star, AlertCircle, ChevronDown, ChevronUp, Zap
} from 'lucide-react'

/* ─── konstanta warna ─── */
const ROLE_COLOR = {
  Kapten: '#f59e0b',
  Jungle: 'var(--brand)',
  'Gold Lane': '#ca8a04',
  'Exp Lane': 'var(--blue)',
  Mid: 'var(--purple)',
  Roam: '#0891b2',
  'Sub/Reserve': 'var(--text-dim)',
}
const STATUS_COLOR = {
  Active: 'var(--green)',
  Standby: 'var(--amber)',
  Disbanded: 'var(--text-dim)',
}

/* ─── helper: konvert File → base64 (tanpa prefix) ─── */
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result.split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

/* ─── Gemini Vision: baca screenshot hasil match MLBB ─── */
async function analyzeMatchImage(base64, mimeType = 'image/jpeg') {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY belum diset di file .env')

  const prompt = `Kamu adalah asisten esports yang ahli membaca screenshot hasil match Mobile Legends: Bang Bang.
Analisis gambar ini dan ekstrak informasinya.
Catatan penting:
- result harus PERSIS "Win" atau "Loss"
- mvp: true hanya jika ada ikon MVP/bintang di sebelah pemain tersebut
- score, tournament, round bisa dikosongkan jika tidak ada.`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        }],
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              opponent:   { type: 'STRING' },
              result:     { type: 'STRING' },
              score:      { type: 'STRING' },
              tournament: { type: 'STRING' },
              round:      { type: 'STRING' },
              players: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    ign:     { type: 'STRING'  },
                    hero:    { type: 'STRING'  },
                    kills:   { type: 'INTEGER' },
                    deaths:  { type: 'INTEGER' },
                    assists: { type: 'INTEGER' },
                    mvp:     { type: 'BOOLEAN' },
                  },
                },
              },
            },
          },
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message || `Gemini error ${res.status}`)
  }

  const data = await res.json()
  const candidate = data.candidates?.[0]

  if (candidate?.finishReason === 'SAFETY') {
    throw new Error('Analisis diblokir sistem Google. Coba crop gambar bagian skornya saja.')
  }

  const text  = candidate?.content?.parts?.[0]?.text || ''
  const clean = text.replace(/```json|```/gi, '').trim()

  if (!clean) throw new Error('Server merespons kosong. Pastikan screenshot terlihat jelas.')

  try {
    return JSON.parse(clean)
  } catch {
    console.error('Gagal parse JSON dari AI. Raw text:', text)
    throw new Error('Server AI tidak stabil, data terpotong. Silakan coba lagi.')
  }
}

/* ═══════════════════════════════════════════════════════
   Sub-komponen: Badge role
═══════════════════════════════════════════════════════ */
function RoleBadge({ role }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
      background: `${ROLE_COLOR[role] || 'var(--text-dim)'}22`,
      color: ROLE_COLOR[role] || 'var(--text-dim)',
      border: `1px solid ${ROLE_COLOR[role] || 'var(--text-dim)'}44`,
      fontFamily: 'Syne, sans-serif', letterSpacing: '0.04em',
    }}>{role}</span>
  )
}

/* ═══════════════════════════════════════════════════════
   Sub-komponen: Kartu lineup
═══════════════════════════════════════════════════════ */
function LineupCard({ lineup, isCaptain, currentUserId, onInputMatch }) {
  const [open, setOpen] = useState(lineup.status === 'Active')
  const members = lineup.team_lineup_members || []
  const captain = members.find(m => m.is_captain)

  return (
    <div className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
      {/* header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <Flag size={15} style={{ color: 'var(--brand)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
              {lineup.tag ? `[${lineup.tag}] ` : ''}{lineup.name}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
              color: STATUS_COLOR[lineup.status] || 'var(--text-dim)',
              background: `${STATUS_COLOR[lineup.status] || 'var(--text-dim)'}18`,
              border: `1px solid ${STATUS_COLOR[lineup.status] || 'var(--text-dim)'}33`,
              fontFamily: 'Syne, sans-serif',
            }}>{lineup.status}</span>
          </div>
          {lineup.description && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{lineup.description}</p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{members.length} pemain</span>
          {open ? <ChevronUp size={14} style={{ color: 'var(--text-dim)' }} />
                : <ChevronDown size={14} style={{ color: 'var(--text-dim)' }} />}
        </div>
      </button>

      {/* member list */}
      {open && (
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.09)', padding: '14px 18px' }}>
          {members.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', padding: '8px 0' }}>
              Belum ada anggota.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(m => {
                const u = m.users || {}
                const isMe = u.id === currentUserId
                return (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8,
                    background: isMe ? 'rgba(225,29,72,0.04)' : 'var(--canvas-alt)',
                    border: isMe ? '1px solid rgba(225,29,72,0.15)' : '1px solid rgba(0,0,0,0.09)',
                  }}>
                    {/* avatar */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: m.is_captain ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                      border: m.is_captain ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(0,0,0,0.09)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      color: m.is_captain ? '#f59e0b' : 'var(--text-muted)',
                    }}>
                      {m.is_captain ? <Crown size={14} /> : (u.name?.[0] || '?').toUpperCase()}
                    </div>
                    {/* info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 13, fontWeight: 600,
                          color: isMe ? 'var(--brand)' : 'var(--text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {u.name || '—'} {isMe && <span style={{ fontSize: 10, color: 'var(--brand)' }}>(kamu)</span>}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                        {u.ign && (
                          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'var(--red)' }}>
                            {u.ign}
                          </span>
                        )}
                        {(u.province || u.city) && (
                          <span style={{ fontSize: 10, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <MapPin size={9} />{u.city || u.province}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* role badge */}
                    <RoleBadge role={m.role_in_team} />
                  </div>
                )
              })}
            </div>
          )}

          {/* Tombol input match — hanya untuk kapten lineup ini */}
          {isCaptain && captain?.users?.id === currentUserId && lineup.status === 'Active' && (
            <button
              onClick={() => onInputMatch(lineup)}
              style={{
                marginTop: 14, width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, padding: '9px 16px',
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: 'rgba(225,29,72,0.08)',
                border: '1px dashed rgba(225,29,72,0.35)',
                color: 'var(--brand)', transition: 'all 0.15s', fontFamily: 'Syne, sans-serif',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(225,29,72,0.14)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(225,29,72,0.08)' }}
            >
              <Swords size={14} /> Input Hasil Match (Kapten)
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   Sub-komponen: Modal input match via foto
═══════════════════════════════════════════════════════ */
function MatchInputModal({ lineup, teamId, userId, addToast, onClose, onSuccess }) {
  const [step, setStep] = useState('upload') // upload | review | saving | done
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiError, setAiError] = useState(null)
  const [form, setForm] = useState({
    opponent: '', result: 'Win', score: '', tournament: '', round: '',
  })
  const [stats, setStats] = useState([])
  const [saving,     setSaving]     = useState(false)
  const [savedMatch, setSavedMatch] = useState(null) // data yang sudah tersimpan
  const fileRef = useRef()

  const members = (lineup?.team_lineup_members || []).filter(m => m.users)

  function handleFile(file) {
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setAiResult(null)
    setAiError(null)
    setStep('upload')
  }

  async function handleAnalyze() {
    if (!imageFile) return
    setAnalyzing(true)
    setAiError(null)
    try {
      const base64 = await fileToBase64(imageFile)
      const result = await analyzeMatchImage(base64, imageFile.type)
      setAiResult(result)

      // isi form dari hasil AI
      setForm({
        opponent:   result.opponent   || '',
        result:     result.result     === 'Win' ? 'Win' : 'Loss',
        score:      result.score      || '',
        tournament: result.tournament || '',
        round:      result.round      || '',
      })

      // cocokkan IGN player dengan anggota lineup
      const initialStats = members.map(m => {
        const u = m.users
        const aiPlayer = result.players?.find(p =>
          p.ign && u.ign && p.ign.toLowerCase().includes(u.ign.toLowerCase().slice(0, 4))
        )
        return {
          player_id: u.id,
          name:      u.name,
          ign:       u.ign || '',
          hero:      aiPlayer?.hero    || '',
          kills:     aiPlayer?.kills   ?? '',
          deaths:    aiPlayer?.deaths  ?? '',
          assists:   aiPlayer?.assists ?? '',
          mvp:       aiPlayer?.mvp    || false,
        }
      })
      setStats(initialStats)
      setStep('review')
    } catch (err) {
      setAiError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  function updateStat(idx, field, value) {
    setStats(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  async function handleSave() {
    if (!form.opponent.trim()) { addToast({ message: 'Isi nama lawan!', type: 'danger' }); return }
    setSaving(true)
    try {
      const { data: match, error } = await supabase.from('matches').insert({
        team_id:      teamId,
        tournament:   form.tournament || null,
        date:         new Date().toISOString().split('T')[0],
        opponent:     form.opponent,
        result:       form.result,
        score:        form.score || null,
        round:        form.round || null,
        created_by:   userId,
      }).select().single()

      if (error) throw new Error(error.message)

      const statsToInsert = stats.filter(s => s.hero.trim()).map(s => ({
        match_id:  match.id,
        player_id: s.player_id,
        hero:      s.hero,
        kills:     parseInt(s.kills)   || 0,
        deaths:    parseInt(s.deaths)  || 0,
        assists:   parseInt(s.assists) || 0,
        mvp:       s.mvp,
      }))
      if (statsToInsert.length) await supabase.from('match_player_stats').insert(statsToInsert)

      await supabase.from('audit_logs').insert({
        user_id: userId, role: 'player',
        action: 'Captain input match via foto',
        target: `vs ${form.opponent} (${form.result})`,
      })

      // Simpan data untuk ditampilkan di step done (tanpa auto close)
      setSavedMatch({ match, form, stats: statsToInsert })
      setStep('done')
      onSuccess?.()
      addToast({ message: `Match vs ${form.opponent} berhasil disimpan!`, type: 'success' })
    } catch (err) {
      addToast({ message: 'Gagal simpan: ' + err.message, type: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '7px 10px', fontSize: 12, borderRadius: 7,
    background: '#f6f5f4', border: '1px solid rgba(0,0,0,0.12)',
    color: '#1a1a1a', outline: 'none',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)',
        borderRadius: 16, width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.14)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.09)',
        }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
              ⚔️ Input Hasil Match
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {lineup?.name} · Upload foto screenshot hasil match
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: 'var(--text-dim)',
            cursor: 'pointer', padding: 4, borderRadius: 6,
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>

          {/* STEP: upload */}
          {step !== 'done' && (
            <>
              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
                style={{
                  border: `2px dashed ${imageFile ? 'rgba(225,29,72,0.4)' : 'rgba(0,0,0,0.18)'}`,
                  borderRadius: 12, padding: 20, textAlign: 'center', cursor: 'pointer',
                  background: imageFile ? 'rgba(225,29,72,0.03)' : '#f9f8f7',
                  marginBottom: 14, transition: 'all 0.15s',
                }}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="preview"
                    style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} />
                ) : (
                  <>
                    <Image size={28} style={{ color: 'var(--text-dim)', marginBottom: 8 }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                      Klik atau drag foto hasil match
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                      JPG, PNG, WebP · Screenshot scoreboard MLBB
                    </p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])} />

              {/* Info API key */}
              {!import.meta.env.VITE_GEMINI_API_KEY && (
                <div style={{
                  display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 8, marginBottom: 14,
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                }}>
                  <AlertCircle size={14} style={{ color: '#f59e0b', marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: 11, color: '#f59e0b', lineHeight: 1.5 }}>
                    <strong>VITE_GEMINI_API_KEY</strong> belum diset. Daftar gratis di{' '}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                      style={{ color: '#f59e0b' }}>aistudio.google.com</a>{' '}
                    lalu tambahkan ke file <code>.env</code>.
                  </p>
                </div>
              )}

              {aiError && (
                <div style={{
                  display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 8, marginBottom: 14,
                  background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.25)',
                }}>
                  <AlertCircle size={14} style={{ color: 'var(--brand)', marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: 11, color: 'var(--brand)' }}>{aiError}</p>
                </div>
              )}

              {/* Tombol analisis */}
              {imageFile && step === 'upload' && (
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  style={{
                    width: '100%', padding: '10px 16px', borderRadius: 8,
                    background: analyzing ? '#f0efee' : 'var(--brand)',
                    border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
                    cursor: analyzing ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: 'Syne, sans-serif',
                  }}
                >
                  {analyzing ? (
                    <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Gemini sedang membaca foto...</>
                  ) : (
                    <><Zap size={14} /> Analisis dengan Gemini AI</>
                  )}
                </button>
              )}
            </>
          )}

          {/* STEP: review */}
          {step === 'review' && (
            <div>
              {/* Info result AI */}
              <div style={{
                display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 8, marginBottom: 16,
                background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)',
              }}>
                <CheckCircle size={14} style={{ color: 'var(--green)', marginTop: 1, flexShrink: 0 }} />
                <p style={{ fontSize: 11, color: 'var(--green)', lineHeight: 1.5 }}>
                  Gemini AI berhasil membaca foto. Periksa & koreksi data di bawah sebelum menyimpan.
                </p>
              </div>

              {/* Form detail match */}
              <div className="card" style={{ marginBottom: 14, padding: 14 }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: 'var(--text-dim)', marginBottom: 12, fontFamily: 'Syne, sans-serif',
                }}>Detail Match</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nama Lawan *</label>
                    <input style={inputStyle} value={form.opponent}
                      onChange={e => setForm(f => ({ ...f, opponent: e.target.value }))} placeholder="Nama tim lawan" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Hasil</label>
                    <select style={inputStyle} value={form.result}
                      onChange={e => setForm(f => ({ ...f, result: e.target.value }))}>
                      <option value="Win">Win</option>
                      <option value="Loss">Loss</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Skor</label>
                    <input style={inputStyle} value={form.score}
                      onChange={e => setForm(f => ({ ...f, score: e.target.value }))} placeholder="cth: 3-1" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Tournament</label>
                    <input style={inputStyle} value={form.tournament}
                      onChange={e => setForm(f => ({ ...f, tournament: e.target.value }))} placeholder="Nama tournament" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Babak</label>
                    <input style={inputStyle} value={form.round}
                      onChange={e => setForm(f => ({ ...f, round: e.target.value }))} placeholder="cth: Final" />
                  </div>
                </div>
              </div>

              {/* Stats pemain */}
              {stats.length > 0 && (
                <div className="card" style={{ padding: 14, marginBottom: 14 }}>
                  <p style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: 'var(--text-dim)', marginBottom: 12, fontFamily: 'Syne, sans-serif',
                  }}>Stats Pemain</p>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          {['Pemain', 'Hero', 'K', 'D', 'A', 'MVP'].map(h => (
                            <th key={h} className="table-th" style={{ padding: '6px 8px', fontSize: 10 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.map((s, i) => (
                          <tr key={i}>
                            <td className="table-td" style={{ padding: '6px 8px' }}>
                              <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{s.name}</p>
                              {s.ign && <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'var(--red)' }}>{s.ign}</p>}
                            </td>
                            <td className="table-td" style={{ padding: '4px 6px' }}>
                              <input value={s.hero} onChange={e => updateStat(i, 'hero', e.target.value)}
                                placeholder="Hero" style={{ ...inputStyle, padding: '4px 6px', width: 90 }} />
                            </td>
                            {['kills', 'deaths', 'assists'].map(f => (
                              <td key={f} className="table-td" style={{ padding: '4px 6px' }}>
                                <input type="number" min={0} value={s[f]} onChange={e => updateStat(i, f, e.target.value)}
                                  style={{ ...inputStyle, padding: '4px 6px', width: 44, textAlign: 'center' }} />
                              </td>
                            ))}
                            <td className="table-td" style={{ padding: '4px 8px', textAlign: 'center' }}>
                              <input type="checkbox" checked={s.mvp}
                                onChange={e => updateStat(i, 'mvp', e.target.checked)}
                                style={{ accentColor: 'var(--brand)', width: 14, height: 14, cursor: 'pointer' }} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tombol simpan & ulang */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setStep('upload'); setAiResult(null) }}
                  style={{
                    flex: 1, padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: '#f0efee', border: '1px solid rgba(0,0,0,0.12)',
                    color: '#615d59', cursor: 'pointer', fontFamily: 'Syne, sans-serif',
                  }}>
                  Ganti Foto
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    flex: 2, padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: saving ? '#f0efee' : 'var(--brand)',
                    border: saving ? '1px solid rgba(0,0,0,0.09)' : 'none', color: saving ? '#615d59' : '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: 'Syne, sans-serif',
                  }}>
                  {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</> : '✅ Simpan Match'}
                </button>
              </div>
            </div>
          )}

          {/* STEP: done — tampilkan ringkasan data tersimpan */}
          {step === 'done' && savedMatch && (
            <div>
              {/* Banner sukses */}
              <div style={{ display:'flex', gap:10, padding:'12px 14px', borderRadius:10, marginBottom:16,
                background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle size={16} style={{ color:'var(--green)', flexShrink:0, marginTop:1 }} />
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'#065f46', fontFamily:'Syne,sans-serif' }}>Match berhasil disimpan!</p>
                  <p style={{ fontSize:11, color:'#047857', marginTop:2 }}>Data di bawah sudah tersimpan. Kamu bisa edit langsung dari sini.</p>
                </div>
              </div>

              {/* Ringkasan match */}
              <div style={{ background:'#f9f8f7', borderRadius:10, padding:14, marginBottom:14, border:'1px solid rgba(0,0,0,0.07)' }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#a39e98', marginBottom:10, fontFamily:'Syne,sans-serif' }}>Ringkasan Match</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:12 }}>
                  {[
                    ['Lawan', savedMatch.form.opponent],
                    ['Hasil', savedMatch.form.result],
                    ['Skor', savedMatch.form.score || '—'],
                    ['Tournament', savedMatch.form.tournament || '—'],
                    ['Babak', savedMatch.form.round || '—'],
                  ].map(([l,v]) => (
                    <div key={l}>
                      <p style={{ fontSize:10, color:'#a39e98' }}>{l}</p>
                      <p style={{ fontWeight:600, color: v==='Win'?'var(--green)':v==='Loss'?'var(--red)':'#1a1a1a', marginTop:1 }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats pemain */}
              {savedMatch.stats?.length > 0 && (
                <div style={{ background:'#f9f8f7', borderRadius:10, padding:14, marginBottom:14, border:'1px solid rgba(0,0,0,0.07)' }}>
                  <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#a39e98', marginBottom:10, fontFamily:'Syne,sans-serif' }}>Stats Pemain</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {savedMatch.stats.map((s, i) => {
                      const member = members.find(m => m.users?.id === s.player_id)
                      const kda = s.deaths === 0 ? (s.kills + s.assists) : ((s.kills + s.assists) / s.deaths)
                      return (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 10px', borderRadius:7, background:'#fff', border:'1px solid rgba(0,0,0,0.07)' }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontWeight:600, fontSize:12, color:'#1a1a1a' }}>{member?.users?.name || '—'}</p>
                            <p style={{ fontSize:11, color:'#a39e98', marginTop:1 }}>{s.hero}</p>
                          </div>
                          <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:11, color:'#1a1a1a' }}>{s.kills}/{s.deaths}/{s.assists}</span>
                          <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:11, fontWeight:700, color:'var(--red)' }}>{kda.toFixed(2)}</span>
                          {s.mvp && <span style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, background:'rgba(245,158,11,0.15)', color:'#b45309' }}>MVP</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Aksi */}
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={onClose}
                  style={{ flex:1, padding:'9px 0', borderRadius:8, fontSize:12, fontWeight:600, background:'#f0efee', border:'1px solid rgba(0,0,0,0.1)', color:'#615d59', cursor:'pointer', fontFamily:'Syne,sans-serif' }}>
                  Tutup
                </button>
                <button
                  onClick={() => { onClose(); window.location.href = '/player/history' }}
                  style={{ flex:2, padding:'9px 0', borderRadius:8, fontSize:12, fontWeight:700, background:'var(--brand)', border:'none', color:'#fff', cursor:'pointer', fontFamily:'Syne,sans-serif' }}>
                  ✏️ Lihat & Edit di Match History
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS spin */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function PlayerTeamPage() {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [profile, setProfile]   = useState(null)
  const [team,    setTeam]       = useState(null)
  const [lineups, setLineups]    = useState([])
  const [loading, setLoading]    = useState(true)
  const [isCaptain, setIsCaptain] = useState(false)

  // modal
  const [matchModal, setMatchModal] = useState(null) // lineup object

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: me } = await supabase.from('users')
        .select('id, name, ign, lane, team_id, teams(id, name, game)')
        .eq('id', user.id).single()

      setProfile(me)
      if (!me?.team_id) { setLoading(false); return }
      setTeam(me.teams)

      const { data: lu } = await supabase.from('team_lineups')
        .select('*, team_lineup_members(id, role_in_team, is_captain, users(id, name, ign, lane, province, city))')
        .eq('team_id', me.team_id)
        .order('created_at', { ascending: false })

      setLineups(lu || [])

      // cek apakah current user adalah kapten di salah satu lineup aktif
      const captain = (lu || []).some(l =>
        l.status === 'Active' &&
        l.team_lineup_members?.some(m => m.is_captain && m.users?.id === user.id)
      )
      setIsCaptain(captain)
      setLoading(false)
    }
    load()
  }, [user])

  const activeLineups  = lineups.filter(l => l.status === 'Active')
  const otherLineups   = lineups.filter(l => l.status !== 'Active')

  return (
    <DashboardLayout title={team?.name || 'Tim'} subtitle="Info Tim">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={22} style={{ color: 'var(--brand)', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : !profile?.team_id ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Shield size={32} style={{ color: 'var(--text-dim)', marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Kamu belum tergabung dalam tim.</p>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>Hubungi manager untuk mendapatkan undangan.</p>
        </div>
      ) : (
        <>
          {/* Kartu tim */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: 'rgba(225,29,72,0.10)', border: '1px solid rgba(225,29,72,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={22} style={{ color: 'var(--brand)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
                {team?.name}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{team?.game || 'Mobile Legends'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Role kamu</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginTop: 3 }}>{profile?.lane || '—'}</p>
            </div>
            {isCaptain && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6,
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
              }}>
                <Crown size={12} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', fontFamily: 'Syne, sans-serif' }}>Kapten</span>
              </div>
            )}
          </div>

          {/* Info kapten */}
          {isCaptain && (
            <div style={{
              display: 'flex', gap: 10, padding: '12px 16px', borderRadius: 10, marginBottom: 16,
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
            }}>
              <Star size={14} style={{ color: '#f59e0b', marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#ca8a04', lineHeight: 1.6 }}>
                Kamu adalah <strong>Kapten Tim</strong>. Kamu dapat menginput hasil match langsung dari screenshot
                dengan bantuan AI — klik tombol <em>"Input Hasil Match"</em> di lineup aktifmu.
              </p>
            </div>
          )}

          {/* Lineup aktif */}
          {activeLineups.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--green)', marginBottom: 10, fontFamily: 'Syne, sans-serif',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                Lineup Aktif
              </p>
              {activeLineups.map(l => (
                <LineupCard key={l.id} lineup={l} isCaptain={isCaptain}
                  currentUserId={user?.id} onInputMatch={setMatchModal} />
              ))}
            </div>
          )}

          {/* Lineup lainnya */}
          {otherLineups.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--text-dim)', marginBottom: 10, fontFamily: 'Syne, sans-serif',
              }}>
                Lineup Lainnya
              </p>
              {otherLineups.map(l => (
                <LineupCard key={l.id} lineup={l} isCaptain={false}
                  currentUserId={user?.id} onInputMatch={() => {}} />
              ))}
            </div>
          )}

          {lineups.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '36px 24px' }}>
              <Users size={28} style={{ color: 'var(--text-dim)', marginBottom: 10 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Belum ada lineup dibuat.</p>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Manager akan membuat lineup tim di panel mereka.</p>
            </div>
          )}
        </>
      )}

      {/* Modal input match */}
      {matchModal && (
        <MatchInputModal
          lineup={matchModal}
          teamId={profile?.team_id}
          userId={user?.id}
          addToast={addToast}
          onClose={() => setMatchModal(null)}
          onSuccess={() => {}}
        />
      )}
    </DashboardLayout>
  )
}