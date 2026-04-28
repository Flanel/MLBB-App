// TopUpPage.jsx — Halaman Top Up Diamond/Koin game
// Berfungsi sebagai redirect/penyalur ke website top up yang sudah ada

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { ExternalLink, Zap, Shield, Clock, Star, ChevronRight } from 'lucide-react'

// Konfigurasi top up services — bisa diubah sesuai kebutuhan
// URL target bisa disesuaikan ke website topup tim/sponsor
const TOPUP_SERVICES = [
  {
    id: 'mlbb',
    game: 'Mobile Legends: Bang Bang',
    icon: '⚔️',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
    currency: 'Diamond',
    url: 'https://shop.moonton.com', // ganti ke URL topup milik tim
    description: 'Top up Diamond ML resmi via Moonton atau mitra authorized.',
    recommended: true,
    items: ['86 Diamond', '172 Diamond', '257 Diamond', '706 Diamond', '2195 Diamond'],
  },
  {
    id: 'pubg',
    game: 'PUBG Mobile',
    icon: '🎯',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    currency: 'UC',
    url: 'https://www.midasbuy.com',
    description: 'Top up UC PUBG Mobile via MidasBuy resmi.',
    recommended: false,
    items: ['60 UC', '325 UC', '660 UC', '1800 UC', '8100 UC'],
  },
  {
    id: 'ff',
    game: 'Free Fire',
    icon: '🔥',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    currency: 'Diamond',
    url: 'https://ff.garena.com',
    description: 'Top up Diamond Free Fire via Garena resmi.',
    recommended: false,
    items: ['50 Diamond', '100 Diamond', '310 Diamond', '520 Diamond', '2180 Diamond'],
  },
]

const TIPS = [
  { icon: Shield, text: 'Selalu top up via website resmi atau mitra yang ditampilkan di sini.' },
  { icon: Clock,  text: 'Diamond/UC biasanya masuk dalam 1–5 menit setelah pembayaran.' },
  { icon: Star,   text: 'Simpan bukti transaksi (screenshot) untuk klaim jika ada masalah.' },
]

export default function TopUpPage() {
  const [visited, setVisited] = useState({})

  function handleTopUp(service) {
    setVisited(prev => ({ ...prev, [service.id]: true }))
    window.open(service.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <DashboardLayout title="Top Up">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Top Up Game</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Pilih game dan klik tombol untuk diarahkan ke website top up resmi.</p>
      </div>

      {/* Tips keamanan */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
        {TIPS.map(({ icon: Icon, text }) => (
          <div key={text} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-1)', borderRadius:10, padding:'10px 12px', display:'flex', gap:8, alignItems:'flex-start' }}>
            <Icon size={13} style={{ color:'var(--brand)', flexShrink:0, marginTop:1 }} />
            <p style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.5 }}>{text}</p>
          </div>
        ))}
      </div>

      {/* Service cards */}
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {TOPUP_SERVICES.map(service => (
          <div key={service.id} className="card" style={{ borderLeft:`3px solid ${service.color}`, paddingLeft:16, position:'relative', overflow:'hidden' }}>
            {service.recommended && (
              <div style={{ position:'absolute', top:0, right:0, background:service.color, color:'white', fontSize:9, fontWeight:700, padding:'3px 10px', fontFamily:'Syne,sans-serif', letterSpacing:'0.05em', borderBottomLeftRadius:8 }}>
                REKOMENDASI
              </div>
            )}
            <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
              {/* Icon */}
              <div style={{ width:44, height:44, borderRadius:12, background:service.bg, border:`1px solid ${service.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                {service.icon}
              </div>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <p style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{service.game}</p>
                  <span style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background:service.bg, color:service.color, fontWeight:600 }}>
                    {service.currency}
                  </span>
                </div>
                <p style={{ fontSize:11, color:'var(--text-muted)', marginBottom:10, lineHeight:1.5 }}>{service.description}</p>

                {/* Denomination hints */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
                  {service.items.map(item => (
                    <span key={item} style={{ fontSize:10, padding:'2px 8px', borderRadius:5, background:'var(--bg-elevated)', border:'1px solid var(--border-1)', color:'var(--text-dim)' }}>
                      {item}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleTopUp(service)}
                  style={{
                    display:'inline-flex', alignItems:'center', gap:7,
                    padding:'8px 16px', borderRadius:9, fontSize:12, fontWeight:600,
                    fontFamily:'Syne,sans-serif', cursor:'pointer', transition:'all 0.15s',
                    background: visited[service.id] ? 'var(--bg-elevated)' : service.color,
                    color: visited[service.id] ? 'var(--text-muted)' : 'white',
                    border: `1px solid ${visited[service.id] ? 'var(--border-1)' : service.color}`,
                  }}
                >
                  <ExternalLink size={12} />
                  {visited[service.id] ? 'Buka Lagi' : `Top Up ${service.currency}`}
                  <ChevronRight size={11} />
                </button>
                {visited[service.id] && (
                  <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:6 }}>
                    ✓ Halaman top up sudah dibuka di tab baru.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:20, padding:'12px 16px', background:'var(--bg-elevated)', borderRadius:10, border:'1px solid var(--border-1)', textAlign:'center' }}>
        <p style={{ fontSize:11, color:'var(--text-dim)', lineHeight:1.6 }}>
          Memiliki website top up sendiri? Hubungi Super Admin untuk mengkonfigurasi URL top up tim kamu.
        </p>
      </div>
    </DashboardLayout>
  )
}
