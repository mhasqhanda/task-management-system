'use client';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { tasksApi, projectsApi } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  });

  const todo = tasks.filter((t: any) => t.status === 'TODO').length;
  const inProgress = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
  const done = tasks.filter((t: any) => t.status === 'DONE').length;
  const total = tasks.length;

  const stats = [
    { label: 'Total Tasks', value: total, color: 'from-violet-500 to-indigo-600', icon: '◈' },
    { label: 'In Progress', value: inProgress, color: 'from-amber-500 to-orange-600', icon: '◉' },
    { label: 'Completed', value: done, color: 'from-emerald-500 to-teal-600', icon: '◎' },
    { label: 'Projects', value: projects.length, color: 'from-blue-500 to-cyan-600', icon: '◫' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Welcome back, <span className="text-violet-400">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-slate-400 mt-1 text-xs sm:text-sm">Here's what's happening across your workspace today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-3.5 sm:p-5 hover:bg-white/8 transition-all">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white text-base sm:text-lg mb-2 sm:mb-3 shadow-lg`}>
              {stat.icon}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
            <div className="text-slate-400 text-xs sm:text-sm mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold text-sm sm:text-base">Overall Progress</h2>
            <span className="text-violet-400 font-bold text-sm sm:text-base">{Math.round((done / total) * 100)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 sm:h-2.5">
            <div
              className="bg-gradient-to-r from-violet-500 to-indigo-500 h-2 sm:h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${Math.round((done / total) * 100)}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-6 mt-3 sm:mt-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />Todo: {todo}</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />In Progress: {inProgress}</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Done: {done}</span>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {user?.role !== 'CLIENT_GUEST' && (
          <Link href="/dashboard/tasks" className="group bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all">
            <div className="flex items-center gap-3 mb-1.5 sm:mb-2">
              <span className="text-xl sm:text-2xl">◧</span>
              <h3 className="text-white font-semibold text-sm sm:text-base">Task Board</h3>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm">View and manage tasks on the Kanban board</p>
          </Link>
        )}
        {user?.role === 'CLIENT_GUEST' && (
          <Link href="/dashboard/client-portal" className="group bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-3 mb-1.5 sm:mb-2">
              <span className="text-xl sm:text-2xl">◨</span>
              <h3 className="text-white font-semibold text-sm sm:text-base">My Portal</h3>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm">View your project progress and activity</p>
          </Link>
        )}
        <Link href="/dashboard/projects" className="group bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-3 mb-1.5 sm:mb-2">
            <span className="text-xl sm:text-2xl">◫</span>
            <h3 className="text-white font-semibold text-sm sm:text-base">Projects</h3>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">{projects.length} active project{projects.length !== 1 ? 's' : ''}</p>
        </Link>
      </div>
    </div>
  );
}
