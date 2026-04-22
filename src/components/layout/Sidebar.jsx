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
      { to: '/team-manager',             label: 'Dashboard',    icon: LayoutDashboard },
    ]},
    { group: 'Team', items: [
      { to: '/team-manager/roster',      label: 'Roster',       icon: Users },
      { to: '/team-manager/matches',     label: 'Match Input',  icon: Swords },
      { to: '/team-manager/tournaments', label: 'Tournaments',  icon: Trophy },
      { to: '/team-manager/schedule',    label: 'Schedule',     icon: Calendar },
    ]},
    { group: 'Reports', items: [
      { to: '/team-manager/analytics',   label: 'Analytics',    icon: BarChart2 },
      { to: '/team-manager/winrate',     label: 'Party Win Rate', icon: TrendingUp },
    ]},
  ],
  staff: [
    { group: 'Main', items: [
      { to: '/team-manager',             label: 'Dashboard',    icon: LayoutDashboard },
      { to: '/team-manager/roster',      label: 'Roster',       icon: Users },
      { to: '/team-manager/matches',     label: 'Match Input',  icon: Swords },
      { to: '/team-manager/tournaments', label: 'Tournaments',  icon: Trophy },
      { to: '/team-manager/schedule',    label: 'Schedule',     icon: Calendar },
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

function NXKMark({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <polygon
        points="16,4 20,12 28,12 22,18 24,26 16,22 8,26 10,18 4,12 12,12"
        fill="none" stroke="var(--ocean-300)" strokeWidth="1.5" strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="3" fill="var(--ocean-400)" opacity="0.6"/>
    </svg>
  )
}

function SidebarContent({ onClose }) {
  const { user, role, signOut } = useAuth()
  const groups = navConfig[role] || []
  const initials = (user?.email || 'NK').slice(0, 2).toUpperCase()

  return (
    <aside style={{ width: 'var(--sidebar-width)', background: 'var(--bg-deep)', borderRight: '1px solid var(--border-1)', display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid var(--border-1)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'var(--bg-elevated)', border:'1px solid var(--border-2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <NXKMark size={18} />
          </div>
          <div>
            <p style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, letterSpacing:'0.15em', color:'var(--text-primary)', lineHeight:1 }}>NXK</p>
            <p style={{ fontSize:9, letterSpacing:'0.12em', color:'var(--text-dim)', lineHeight:1, marginTop:2 }}>ESPORTS</p>
          </div>
        </div>
        {/* Close button for mobile */}
        {onClose && (
          <button onClick={onClose} className="mobile-only" style={{ background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:4, borderRadius:6 }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex:1, overflowY:'auto', padding:'12px 10px' }}>
        {groups.map(group => (
          <div key={group.group} style={{ marginBottom: 20 }}>
            <p style={{ fontFamily:'Syne,sans-serif', fontSize:9, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-dim)', padding:'0 12px', marginBottom:4 }}>
              {group.group}
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              {group.items.map(item => {
                const Icon = item.icon
                return (
                  <NavLink key={item.to} to={item.to} end={item.to === '/team-manager' || item.to === '/player' || item.to === '/super-admin'}
                    className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
                    onClick={onClose}
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
      <div style={{ padding:'10px 12px', borderTop:'1px solid var(--border-1)', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:'rgba(14,165,233,0.12)', border:'1px solid rgba(14,165,233,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'var(--ocean-300)', fontFamily:'Syne,sans-serif', flexShrink:0 }}>
          {initials}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:12, fontWeight:500, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</p>
          <p style={{ fontSize:10, color:'var(--text-dim)' }}>{roleLabels[role] || role}</p>
        </div>
        <button onClick={signOut} title="Sign out" style={{ flexShrink:0, padding:6, borderRadius:6, background:'transparent', border:'none', color:'var(--text-dim)', cursor:'pointer', transition:'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color='var(--red)'; e.currentTarget.style.background='var(--red-bg)' }}
          onMouseLeave={e => { e.currentTarget.style.color='var(--text-dim)'; e.currentTarget.style.background='transparent' }}
        >
          <LogOut size={13} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  )
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="sidebar-desktop" style={{ flexShrink:0 }}>
        <SidebarContent />
      </div>

      {/* Mobile drawer */}
      <div className={`sidebar-drawer${mobileOpen ? ' open' : ''}`}>
        <SidebarContent onClose={onMobileClose} />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:30 }}
        />
      )}
    </>
  )
}
