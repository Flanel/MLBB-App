// TopUpPage.jsx — Redirect ke gamevaulto.com
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ExternalLink, Zap, Shield, Clock } from 'lucide-react'

const TARGET_URL = 'https://gamevaulto.com'

export default function TopUpPage() {
  return (
    <DashboardLayout title="Top Up">
      <div style={{ maxWidth:520, margin:'0 auto', paddingTop:24 }}>
        <h1 className="page-heading" style={{ marginBottom:6 }}>Top Up Diamond & Koin</h1>
        <p className="page-subheading" style={{ marginBottom:32 }}>
          Isi ulang diamond atau koin game favorit kamu dengan cepat dan aman.
        </p>

        {/* Main card */}
        <div className="card" style={{ textAlign:'center', padding:'40px 32px' }}>
          {/* Icon */}
          <div style={{ width:64, height:64, borderRadius:'var(--radius-xl)', background:'var(--brand-subtle)', border:'var(--brand-border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <Zap size={28} style={{ color:'var(--brand)' }}/>
          </div>

          <h2 style={{ fontSize:20, fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.25px', marginBottom:8 }}>
            Game Vaulto
          </h2>
          <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.6, marginBottom:28, maxWidth:340, margin:'0 auto 28px' }}>
            Kami bermitra dengan <strong style={{ color:'var(--text-primary)' }}>gamevaulto.com</strong> untuk layanan top up
            game yang cepat, aman, dan terpercaya.
          </p>

          <button
            onClick={() => window.open(TARGET_URL, '_blank', 'noopener,noreferrer')}
            className="btn btn-primary"
            style={{ padding:'10px 28px', fontSize:15, fontWeight:600, gap:8, margin:'0 auto', display:'inline-flex' }}>
            <ExternalLink size={15}/>
            Buka gamevaulto.com
          </button>

          <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:16 }}>
            Kamu akan diarahkan ke website gamevaulto.com di tab baru.
          </p>
        </div>

        {/* Tips */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10, marginTop:16 }}>
          {[
            { icon:Shield, label:'Aman & Terpercaya', desc:'Website mitra resmi' },
            { icon:Clock,  label:'Proses Cepat',      desc:'Masuk dalam menit' },
            { icon:Zap,    label:'Semua Game',         desc:'ML, FF, PUBG, & lainnya' },
          ].map(({ icon:Icon, label, desc }) => (
            <div key={label} className="card-inset" style={{ textAlign:'center', padding:'14px 10px' }}>
              <Icon size={18} style={{ color:'var(--text-dim)', margin:'0 auto 8px' }}/>
              <p style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', marginBottom:2 }}>{label}</p>
              <p style={{ fontSize:11, color:'var(--text-dim)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
