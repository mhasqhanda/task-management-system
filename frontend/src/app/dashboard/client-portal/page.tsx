'use client';
import { useQuery } from '@tanstack/react-query';
import { projectsApi, tasksApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Task } from '@/lib/types';

export default function ClientPortalPage() {
  const { user } = useAuth();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
    enabled: user?.role === 'CLIENT_GUEST',
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.list(),
    enabled: user?.role === 'CLIENT_GUEST',
  });

  if (user?.role !== 'CLIENT_GUEST') {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <div className="text-center"><div className="text-4xl mb-3">⊗</div><p>Client Portal is for Client Guests only.</p></div>
      </div>
    );
  }

  const total = tasks.length;
  const done = tasks.filter((t: Task) => t.status === 'DONE').length;
  const inProgress = tasks.filter((t: Task) => t.status === 'IN_PROGRESS').length;
  const todo = total - done - inProgress;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const statusConfig = [
    { label: 'To Do', count: todo, color: 'bg-slate-500', text: 'text-slate-300' },
    { label: 'In Progress', count: inProgress, color: 'bg-amber-500', text: 'text-amber-300' },
    { label: 'Completed', count: done, color: 'bg-emerald-500', text: 'text-emerald-300' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Client Portal</h1>
        <p className="text-slate-400 text-sm mt-1">Track your project progress in real time</p>
      </div>

      {/* Projects */}
      <div className="mb-6">
        <h2 className="text-white font-semibold mb-3">Your Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.map((p: any) => (
            <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-white font-medium">{p.name}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-sm sm:text-base">Overall Completion</h2>
          <span className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">{pct}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-violet-500 to-indigo-500 h-3 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {statusConfig.map((s) => (
            <div key={s.label} className="bg-white/5 rounded-lg p-2 sm:p-3 text-center">
              <div className={`text-lg sm:text-2xl font-bold ${s.text}`}>{s.count}</div>
              <div className="text-slate-500 text-[10px] sm:text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Visible Tasks */}
      <div>
        <h2 className="text-white font-semibold mb-3">Task Activity</h2>
        <div className="space-y-2">
          {tasks.length === 0 && (
            <div className="text-center py-12 text-slate-600">No visible tasks yet</div>
          )}
          {tasks.map((task: Task) => (
            <div key={task.id} className="bg-white/5 border border-white/10 rounded-xl p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-white text-sm font-medium leading-snug">{task.title}</h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Assigned to: <span className="text-slate-400">Internal Member</span>
                </p>
              </div>
              <span className={`self-start sm:self-auto text-xs px-3 py-1 rounded-full font-medium border ${
                task.status === 'DONE' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' :
                task.status === 'IN_PROGRESS' ? 'bg-amber-500/15 text-amber-300 border-amber-500/20' :
                'bg-slate-500/15 text-slate-300 border-slate-500/20'
              }`}>
                {task.status === 'IN_PROGRESS' ? 'In Progress' : task.status === 'DONE' ? 'Done' : 'To Do'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
