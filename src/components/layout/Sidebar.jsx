import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, Users, Shield, ClipboardList, Settings,
  Swords, Trophy, BarChart2, UserCircle, History, Activity, LogOut
} from 'lucide-react'

const navConfig = {
  super_admin: [
    { group: 'Main', items: [
      { to: '/super-admin',          label: 'Overview',  icon: LayoutDashboard },
      { to: '/super-admin/teams',    label: 'Teams',     icon: Shield },
      { to: '/super-admin/users',    label: 'Users',     icon: Users },
    ]},
    { group: 'System', items: [
      { to: '/super-admin/audit',    label: 'Audit Log', icon: ClipboardList },
      { to: '/super-admin/settings', label: 'Settings',  icon: Settings },
    ]},
  ],
  team_manager: [
    { group: 'Main', items: [
      { to: '/team-manager',             label: 'Dashboard',   icon: LayoutDashboard },
    ]},
    { group: 'Team', items: [
      { to: '/team-manager/roster',      label: 'Roster',      icon: Users },
      { to: '/team-manager/matches',     label: 'Match Input', icon: Swords },
      { to: '/team-manager/tournaments', label: 'Tournaments', icon: Trophy },
    ]},
    { group: 'Reports', items: [
      { to: '/team-manager/analytics',   label: 'Analytics',   icon: BarChart2 },
    ]},
  ],
  staff: [
    { group: 'Main', items: [
      { to: '/team-manager',             label: 'Dashboard',   icon: LayoutDashboard },
      { to: '/team-manager/roster',      label: 'Roster',      icon: Users },
      { to: '/team-manager/matches',     label: 'Match Input', icon: Swords },
      { to: '/team-manager/tournaments', label: 'Tournaments', icon: Trophy },
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
  ],
}

const roleLabels = {
  super_admin: 'Super Admin',
  team_manager: 'Team Manager',
  staff: 'Staff',
  player: 'Player',
}

// NXK crown logo mark — SVG inline
function NXKMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* Crown points */}
      <path
        d="M4 18L7 10L11 15L14 7L17 15L21 10L24 18H4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Base */}
      <path
        d="M4 18H24V20H4V18Z"
        fill="currentColor"
        opacity="0.4"
      />
      {/* Red gem */}
      <circle cx="14" cy="7" r="2" fill="#e11d48" />
    </svg>
  )
}

export default function Sidebar() {
  const { user, role, signOut } = useAuth()
  const groups = navConfig[role] || []
  const initials = (user?.email || 'NK').slice(0, 2).toUpperCase()

  return (
    <aside
      className="flex flex-col h-full flex-shrink-0"
      style={{
        width: 'var(--sidebar-width)',
        background: '#0c0d18',
        borderRight: '1px solid #1e2135',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid #1a1d30' }}
      >
        <div
          className="flex items-center justify-center flex-shrink-0 text-slate-800"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #1e2135 0%, #161828 100%)',
            border: '1px solid #252840',
          }}
        >
          <NXKMark size={18} />
        </div>
        <div>
          <p
            className="text-xs font-bold leading-none tracking-widest uppercase"
            style={{ fontFamily: 'Syne, sans-serif', color: '#dde0ef', letterSpacing: '0.1em' }}
          >
            NXK
          </p>
          <p className="text-[9px] leading-none mt-0.5" style={{ color: '#555a78', letterSpacing: '0.05em' }}>
            ESPORTS
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
        {groups.map(group => (
          <div key={group.group}>
            <p
              className="text-[9px] font-semibold uppercase tracking-widest px-3 mb-1.5"
              style={{ fontFamily: 'Syne, sans-serif', color: '#3a3f5c', letterSpacing: '0.12em' }}
            >
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
                  >
                    <Icon size={14} className="flex-shrink-0" strokeWidth={1.75} />
                    <span style={{ fontFamily: 'DM Sans, sans-serif' }}>{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div
        className="px-3 py-3 flex items-center gap-2.5 flex-shrink-0"
        style={{ borderTop: '1px solid #1a1d30' }}
      >
        <div
          className="flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(225, 29, 72, 0.15)',
            color: '#fb4c6c',
            fontFamily: 'Syne, sans-serif',
            fontSize: 10,
            border: '1px solid rgba(225, 29, 72, 0.2)',
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: '#c2c5d8' }}>
            {user?.email}
          </p>
          <p className="text-[10px]" style={{ color: '#555a78' }}>
            {roleLabels[role] || role}
          </p>
        </div>
        <button
          onClick={signOut}
          title="Sign out"
          className="flex-shrink-0 p-1.5 rounded-md transition-colors"
          style={{ color: '#3a3f5c' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fb4c6c'; e.currentTarget.style.background = 'rgba(225,29,72,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#3a3f5c'; e.currentTarget.style.background = 'transparent' }}
        >
          <LogOut size={13} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  )
}