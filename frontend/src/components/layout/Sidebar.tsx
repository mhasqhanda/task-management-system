'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: '⊞',
    roles: ['PRODUCT_MANAGER', 'INTERNAL_TEAM', 'CLIENT_GUEST'],
    exact: true,
  },
  {
    href: '/dashboard/projects',
    label: 'Projects',
    icon: '◫',
    roles: ['PRODUCT_MANAGER', 'CLIENT_GUEST'],
  },
  {
    href: '/dashboard/tasks',
    label: 'Task Board',
    icon: '◧',
    roles: ['PRODUCT_MANAGER', 'INTERNAL_TEAM'],
  },
  {
    href: '/dashboard/audit',
    label: 'Audit Log',
    icon: '◩',
    roles: ['PRODUCT_MANAGER'],
  },
  {
    href: '/dashboard/client-portal',
    label: 'My Portal',
    icon: '◨',
    roles: ['CLIENT_GUEST'],
  },
];

const roleColors: Record<string, string> = {
  PRODUCT_MANAGER: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  INTERNAL_TEAM: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  CLIENT_GUEST: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};
const roleLabels: Record<string, string> = {
  PRODUCT_MANAGER: 'Product Manager',
  INTERNAL_TEAM: 'Team Member',
  CLIENT_GUEST: 'Client Guest',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const visible = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="w-64 min-h-screen bg-[#0d0d14] border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">TaskFlow</span>
        </div>
      </div>

      {/* User profile */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border mt-0.5 ${roleColors[user.role]}`}>
              {roleLabels[user.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visible.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                ${isActive
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
            >
              <span className="text-base opacity-80">{item.icon}</span>
              {item.label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          id="logout-btn"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
