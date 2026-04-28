import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { NXKLogoMark } from '@/components/layout/NXKLogo'
import {
  LayoutDashboard, Users, Shield, ClipboardList, Settings,
  Swords, Trophy, BarChart2, UserCircle, History,
  LogOut, Calendar, TrendingUp, X, Link2, CheckSquare,
  UserCog, Zap, Flag
} from 'lucide-react'

const navConfig = {
  super_admin: [
    { group: 'Main', items: [
      { to: '/super-admin',           label: 'Overview',      icon: LayoutDashboard },
      { to: '/super-admin/teams',     label: 'Teams',         icon: Shield },
      { to: '/super-admin/users',     label: 'Users',         icon: Users },
    ]},
    { group: 'Management', items: [
      { to: '/super-admin/approvals', label: 'Approvals',     icon: CheckSquare },
      { to: '/super-admin/invite',    label: 'Invite Staff',  icon: Link2 },
    ]},
    { group: 'System', items: [
      { to: '/super-admin/audit',     label: 'Audit Log',     icon: ClipboardList },
      { to: '/super-admin/settings',  label: 'Settings',      icon: Settings },
    ]},
    { group: 'Account', items: [
      { to: '/topup',   label: 'Top Up',       icon: Zap },
      { to: '/profile', label: 'Profil Saya',  icon: UserCog },
    ]},
  ],
  team_manager: [
    { group: 'Main', items: [
      { to: '/team-manager', label: 'Dashboard', icon: LayoutDashboard },
    ]},
    { group: 'Team', items: [
      { to: '/team-manager/roster',      label: 'Roster',         icon: Users },
      { to: '/team-manager/team-lineup', label: 'Tim',            icon: Flag },
      { to: '/team-manager/matches',     label: 'Match Input',    icon: Swords },
      { to: '/team-manager/tournaments', label: 'Tournaments',    icon: Trophy },
      { to: '/team-manager/schedule',    label: 'Schedule',       icon: Calendar },
    ]},
    { group: 'Reports', items: [
      { to: '/team-manager/analytics',   label: 'Analytics',      icon: BarChart2 },
      { to: '/team-manager/winrate',     label: 'Party Win Rate', icon: TrendingUp },
    ]},
    { group: 'Player Mgmt', items: [
      { to: '/team-manager/invite',      label: 'Invite Players', icon: Link2 },
      { to: '/team-manager/approvals',   label: 'Approvals',      icon: CheckSquare },
    ]},
    { group: 'Account', items: [
      { to: '/topup',   label: 'Top Up',       icon: Zap },
      { to: '/profile', label: 'Profil Saya',  icon: UserCog },
    ]},
  ],
  staff: [
    { group: 'Main', items: [
      { to: '/team-manager',             label: 'Dashboard',      icon: LayoutDashboard },
      { to: '/team-manager/roster',      label: 'Roster',         icon: Users },
      { to: '/team-manager/team-lineup', label: 'Tim',            icon: Flag },
      { to: '/team-manager/matches',     label: 'Match Input',    icon: Swords },
      { to: '/team-manager/tournaments', label: 'Tournaments',    icon: Trophy },
      { to: '/team-manager/schedule',    label: 'Schedule',       icon: Calendar },
    ]},
    { group: 'Player Mgmt', items: [
      { to: '/team-manager/invite', label: 'Invite Players', icon: Link2 },
    ]},
    { group: 'Account', items: [
      { to: '/topup',   label: 'Top Up',       icon: Zap },
      { to: '/profile', label: 'Profil Saya',  icon: UserCog },
    ]},
  ],
  player: [
    { group: 'Main', items: [
      { to: '/player', label: 'Dashboard', icon: UserCircle },
    ]},
    { group: 'Stats', items: [
      { to: '/player/history',     label: 'Match History', icon: History },
      { to: '/player/tournaments', label: 'Tournaments',   icon: Trophy },
    ]},
    { group: 'Team', items: [
      { to: '/player/schedule', label: 'Schedule', icon: Calendar },
    ]},
    { group: 'Account', items: [
      { to: '/topup',   label: 'Top Up',       icon: Zap },
      { to: '/profile', label: 'Profil Saya',  icon: UserCog },
    ]},
  ],
}

const roleLabels = {
  super_admin: 'Super Admin', team_manager: 'Team Manager',
  staff: 'Staff', player: 'Player',
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, role, signOut } = useAuth()
  const groups   = navConfig[role] || []
  const initials = (user?.email || 'NK').slice(0, 2).toUpperCase()

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:30, backdropFilter:'blur(2px)' }}
          className="mobile-backdrop"
        />
      )}

      <aside
        className={`app-sidebar${mobileOpen ? ' open' : ''}`}
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--bg-deep)',
          borderRight: '1px solid var(--border-1)',
          display: 'flex', flexDirection: 'column',
          height: '100%', flexShrink: 0,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 14px 12px',
          borderBottom: '1px solid var(--border-1)',
          flexShrink: 0,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:28, height:28, borderRadius:7, overflow:'hidden', flexShrink:0 }}>
              <NXKLogoMark size={28} />
            </div>
            <div>
              <p style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:800, letterSpacing:'0.12em', color:'var(--text-primary)', lineHeight:1 }}>NXK</p>
              <p style={{ fontSize:8.5, letterSpacing:'0.14em', color:'var(--text-dim)', lineHeight:1, marginTop:2 }}>ESPORTS</p>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="sidebar-close-btn"
            style={{ background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:4, borderRadius:5, display:'none' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', padding:'10px 8px' }}>
          {groups.map(group => (
            <div key={group.group} style={{ marginBottom:18 }}>
              <p style={{
                fontFamily: 'Syne,sans-serif',
                fontSize: 8.5, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                color: 'var(--text-dim)',
                padding: '0 10px', marginBottom: 3,
              }}>
                {group.group}
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
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
                      <Icon size={13} strokeWidth={1.75} style={{ flexShrink:0, opacity:0.75 }} />
                      <span style={{ flex:1 }}>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div style={{
          padding: '10px 10px',
          borderTop: '1px solid var(--border-1)',
          display: 'flex', alignItems: 'center', gap: 8,
          flexShrink: 0,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: 'var(--brand-glow)',
            border: '1px solid var(--brand-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9.5, fontWeight: 700, color: 'var(--brand)',
            fontFamily: 'Syne,sans-serif', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:12, fontWeight:500, color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.email}
            </p>
            <p style={{ fontSize:9.5, color:'var(--text-dim)', marginTop:1 }}>{roleLabels[role] || role}</p>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            style={{ flexShrink:0, padding:5, borderRadius:5, background:'transparent', border:'1px solid transparent', color:'var(--text-dim)', cursor:'pointer', transition:'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.color='var(--red)'; e.currentTarget.style.borderColor='var(--red-border)'; e.currentTarget.style.background='var(--red-bg)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='var(--text-dim)'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.background='transparent'; }}
          >
            <LogOut size={12} strokeWidth={1.75} />
          </button>
        </div>
      </aside>
    </>
  )
}
