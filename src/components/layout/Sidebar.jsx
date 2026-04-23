import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { NXKLogoMark } from '@/components/layout/NXKLogo'
import {
  LayoutDashboard, Users, Shield, ClipboardList, Settings,
  Swords, Trophy, BarChart2, UserCircle, History, Activity,
  LogOut, Calendar, TrendingUp, X, Link2, CheckSquare, UserCog
} from 'lucide-react'

const navConfig = {
  super_admin: [
    { group: 'Main', items: [
      { to: '/super-admin',            label: 'Overview',    icon: LayoutDashboard },
      { to: '/super-admin/teams',      label: 'Teams',       icon: Shield },
      { to: '/super-admin/users',      label: 'Users',       icon: Users },
    ]},
    { group: 'Management', items: [
      { to: '/super-admin/approvals',  label: 'Approvals',   icon: CheckSquare, badge: 'approvals' },
      { to: '/super-admin/invite',     label: 'Invite Staff', icon: Link2 },
    ]},
    { group: 'System', items: [
      { to: '/super-admin/audit',      label: 'Audit Log',   icon: ClipboardList },
      { to: '/super-admin/settings',   label: 'Settings',    icon: Settings },
    ]},
  ],
  team_manager: [
    { group: 'Main', items: [
      { to: '/team-manager',           label: 'Dashboard',      icon: LayoutDashboard },
    ]},
    { group: 'Team', items: [
      { to: '/team-manager/roster',    label: 'Roster',         icon: Users },
      { to: '/team-manager/matches',   label: 'Match Input',    icon: Swords },
      { to: '/team-manager/tournaments', label: 'Tournaments',  icon: Trophy },
      { to: '/team-manager/schedule',  label: 'Schedule',       icon: Calendar },
    ]},
    { group: 'Reports', items: [
      { to: '/team-manager/analytics', label: 'Analytics',      icon: BarChart2 },
      { to: '/team-manager/winrate',   label: 'Party Win Rate', icon: TrendingUp },
    ]},
    { group: 'Player Management', items: [
      { to: '/team-manager/invite',    label: 'Invite Players', icon: Link2 },
      { to: '/team-manager/approvals', label: 'Approvals',      icon: CheckSquare, badge: 'approvals' },
    ]},
  ],
  staff: [
    { group: 'Main', items: [
      { to: '/team-manager',           label: 'Dashboard',   icon: LayoutDashboard },
      { to: '/team-manager/roster',    label: 'Roster',      icon: Users },
      { to: '/team-manager/matches',   label: 'Match Input', icon: Swords },
      { to: '/team-manager/tournaments', label: 'Tournaments', icon: Trophy },
      { to: '/team-manager/schedule',  label: 'Schedule',    icon: Calendar },
    ]},
    { group: 'Player Management', items: [
      { to: '/team-manager/invite',    label: 'Invite Players', icon: Link2 },
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

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, role, signOut } = useAuth()
  const groups = navConfig[role] || []
  const initials = (user?.email || 'NK').slice(0, 2).toUpperCase()

  const sidebarStyle = {
    width: 'var(--sidebar-width)',
    background: '#060810',
    borderRight: '1px solid var(--border-1)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flexShrink: 0,
  }

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 30 }}
          className="mobile-backdrop"
        />
      )}

      <aside className={`app-sidebar${mobileOpen ? ' open' : ''}`} style={sidebarStyle}>
        {/* Logo — uses real NXK logo */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderBottom:'1px solid var(--border-1)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:32, height:32, borderRadius:8, overflow:'hidden', flexShrink:0 }}>
              <NXKLogoMark size={32} />
            </div>
            <div>
              <p style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:800, letterSpacing:'0.14em', color:'var(--text-primary)', lineHeight:1 }}>NXK</p>
              <p style={{ fontSize:9, letterSpacing:'0.12em', color:'var(--text-dim)', lineHeight:1, marginTop:2 }}>ESPORTS</p>
            </div>
          </div>
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
                      <span style={{ flex:1 }}>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding:'10px 12px', borderTop:'1px solid var(--border-1)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:'var(--brand-glow)', border:'1px solid var(--brand-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'var(--brand)', fontFamily:'Syne,sans-serif', flexShrink:0 }}>
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