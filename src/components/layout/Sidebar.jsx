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
    { group: 'Monitoring', items: [
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
  super_admin: 'Super Admin', team_manager: 'Team Manager',
  staff: 'Staff', player: 'Player',
}

export default function Sidebar() {
  const { user, role, signOut } = useAuth()
  const groups = navConfig[role] || navConfig[role] || []

  return (
    <aside className="flex flex-col h-full bg-white border-r border-slate-200 flex-shrink-0" style={{ width: 'var(--sidebar-width)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-slate-100">
        <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L17 6V14L10 18L3 14V6L10 2Z" stroke="white" strokeWidth="1.8" fill="none"/>
            <path d="M10 6L14 8.5V13.5L10 16L6 13.5V8.5L10 6Z" fill="white" fillOpacity="0.45"/>
          </svg>
        </div>
        <span className="font-semibold text-slate-800 tracking-tight">Nexus</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {groups.map(group => (
          <div key={group.group}>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-2 mb-1">
              {group.group}
            </p>
            {group.items.map(item => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
                >
                  <Icon size={14} className="flex-shrink-0" />
                  {item.label}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-slate-100 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-semibold text-brand-700 flex-shrink-0 uppercase">
          {user?.email?.slice(0, 2) || 'NA'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-700 truncate">{user?.email}</p>
          <p className="text-[10px] text-slate-400">{roleLabels[role] || role}</p>
        </div>
        <button
          onClick={signOut}
          title="Sign out"
          className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={13} />
        </button>
      </div>
    </aside>
  )
}
