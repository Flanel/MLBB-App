import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, Users, Shield, ClipboardList, Settings,
  Swords, Trophy, BarChart2, UserCircle, History, Activity,
  LogOut, Calendar, TrendingUp, X
} from 'lucide-react'

const navConfig = {
  super_admin: [
    { group: 'Main', items: [
      { to: '/super-admin',          label: 'Overview',    icon: LayoutDashboard },
      { to: '/super-admin/teams',    label: 'Teams',       icon: Shield },
      { to: '/super-admin/users',    label: 'Users',       icon: Users },
    ]},
    { group: 'System', items: [
      { to: '/super-admin/audit',    label: 'Audit Log',   icon: ClipboardList },
      { to: '/super-admin/settings', label: 'Settings',    icon: Settings },
    ]},
  ],
  team_manager: [
    { group: 'Main', items: [
      { to: '/team-manager',             label: 'Dashboard',      icon: LayoutDashboard },
    ]},
    { group: 'Team', items: [
      { to: '/team-manager/roster',      label: 'Roster',         icon: Users },
      { to: '/team-manager/matches',     label: 'Match Input',    icon: Swords },
      { to: '/team-manager/tournaments', label: 'Tournaments',    icon: Trophy },
      { to: '/team-manager/schedule',    label: 'Schedule',       icon: Calendar },
    ]},
    { group: 'Reports', items: [
      { to: '/team-manager/analytics',   label: 'Analytics',      icon: BarChart2 },
      { to: '/team-manager/winrate',     label: 'Party Win Rate', icon: TrendingUp },
    ]},
  ],
  staff: [
    { group: 'Main', items: [
      { to: '/team-manager',             label: 'Dashboard',   icon: LayoutDashboard },
      { to: '/team-manager/roster',      label: 'Roster',      icon: Users },
      { to: '/team-manager/matches',     label: 'Match Input', icon: Swords },
      { to: '/team-manager/tournaments', label: 'Tournaments', icon: Trophy },
      { to: '/team-manager/schedule',    label: 'Schedule',    icon: Calendar },
    ]},
  ],
  player: [
    { group: 'Main', items: [
      { to: '/player',             label: 'Dashboard',     icon: UserCircle },
    ]},
    { group: 'Stats', items: [
      { to: '/player/history',     label: 'Match History', icon: History },
      { to: '/player/tournaments', label: 'Tournaments',   icon: Trophy },
      { to: '/player/activity',    label: 'Activity Log',  icon: Activity },
    ]},
    { group: 'Team', items: [
      { to: '/player/schedule',    label: 'Schedule',      icon: Calendar },
    ]},
  ],
}

const roleLabels = {
  super_admin: 'Super Admin', team_manager: 'Team Manager',
  staff: 'Staff', player: 'Player',
}

function NXKMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M4 18L7 10L11 15L14 7L17 15L21 10L24 18H4Z"
        fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 18H24V20H4V18Z" fill="currentColor" opacity="0.4" />
      <circle cx="14" cy="7" r="2" fill="#e11d48" />
    </svg>
  )
}

// Single Sidebar component — no duplication
// On desktop: always visible as part of flex layout
// On mobile: fixed overlay, shown/hidden via prop
export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, role, signOut } = useAuth()
  const groups = navConfig[role] || []
  const initials = (user?.email || 'NK').slice(0, 2).toUpperCase()

  const sidebarStyle = {
    width: 'var(--sidebar-width)',
    background: '#0c0d18',
    borderRight: '1px solid var(--border-1)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flexShrink: 0,
    // Mobile: fixed overlay
    // Desktop: normal flow — controlled by media query below
  }

  return (
    <>
      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          style={{
            display: 'none', // shown via CSS media query
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 30,
          }}
          className="mobile-backdrop"
        />
      )}

      {/* ── Single Sidebar element ── */}
      <aside className={`app-sidebar${mobileOpen ? ' open' : ''}`} style={sidebarStyle}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid var(--border-1)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#1e2135 0%,#161828 100%)', border:'1px solid var(--border-2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}>
              <NXKMark size={18} />
            </div>
            <div>
              <p style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, letterSpacing:'0.15em', color:'var(--text-primary)', lineHeight:1 }}>NXK</p>
              <p style={{ fontSize:9, letterSpacing:'0.12em', color:'var(--text-dim)', lineHeight:1, marginTop:2 }}>ESPORTS</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onMobileClose}
            className="sidebar-close-btn"
            style={{ background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:4, borderRadius:6, display:'none' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', padding:'12px 10px' }}>
          {groups.map(group => (
            <div key={group.group} style={{ marginBottom:20 }}>
              <p style={{ fontFamily:'Syne,sans-serif', fontSize:9, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-dim)', padding:'0 12px', marginBottom:4 }}>
                {group.group}
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                {group.items.map(item => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={['/team-manager','/player','/super-admin'].includes(item.to)}
                      className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
                      onClick={onMobileClose}
                    >
                      <Icon size={14} strokeWidth={1.75} style={{ flexShrink:0 }} />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding:'10px 12px', borderTop:'1px solid var(--border-1)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:'rgba(225,29,72,0.12)', border:'1px solid rgba(225,29,72,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fb4c6c', fontFamily:'Syne,sans-serif', flexShrink:0 }}>
            {initials}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:12, fontWeight:500, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</p>
            <p style={{ fontSize:10, color:'var(--text-dim)' }}>{roleLabels[role] || role}</p>
          </div>
          <button onClick={signOut} title="Sign out"
            style={{ flexShrink:0, padding:6, borderRadius:6, background:'transparent', border:'none', color:'var(--text-dim)', cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color='var(--red)'; e.currentTarget.style.background='var(--red-bg)' }}
            onMouseLeave={e => { e.currentTarget.style.color='var(--text-dim)'; e.currentTarget.style.background='transparent' }}
          >
            <LogOut size={13} strokeWidth={1.75} />
          </button>
        </div>
      </aside>
    </>
  )
}
