'use client';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { AuditLog } from '@/lib/types';

const actionColors: Record<string, string> = {
  POST: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  PATCH: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  DELETE: 'bg-red-500/15 text-red-300 border-red-500/20',
};

export default function AuditPage() {
  const { user } = useAuth();
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-all'],
    queryFn: () => tasksApi.getAllAudit(),
    enabled: user?.role === 'PRODUCT_MANAGER',
  });

  if (user?.role !== 'PRODUCT_MANAGER') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-slate-500">
          <div className="text-4xl mb-3">⊗</div>
          <p className="font-medium">Access Denied</p>
          <p className="text-sm mt-1">Audit logs are only visible to Product Managers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-slate-400 text-sm mt-1">Immutable trail of all task mutations</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-slate-400 font-medium px-5 py-3">Task</th>
                <th className="text-left text-slate-400 font-medium px-5 py-3">Actor</th>
                <th className="text-left text-slate-400 font-medium px-5 py-3">Action</th>
                <th className="text-left text-slate-400 font-medium px-5 py-3">Change</th>
                <th className="text-left text-slate-400 font-medium px-5 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log: AuditLog) => (
                <tr key={log.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3 text-white font-medium">{log.task?.title ?? log.taskId.slice(0, 8)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                        {log.user?.name?.charAt(0) ?? '?'}
                      </div>
                      <span className="text-slate-300">{log.user?.name ?? 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${actionColors[log.action] ?? 'bg-slate-500/15 text-slate-300 border-slate-500/20'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs font-mono max-w-[200px] truncate">
                    {log.oldValue && log.newValue
                      ? `${JSON.stringify(log.oldValue)} → ${JSON.stringify(log.newValue)}`
                      : log.newValue ? JSON.stringify(log.newValue) : '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-600">No audit entries yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
