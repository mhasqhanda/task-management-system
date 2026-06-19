'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, usersApi, projectsApi, commentsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Task, TaskStatus, Comment } from '@/lib/types';
import toast from 'react-hot-toast';
import { useState, useRef, useEffect } from 'react';

const COLUMNS: { status: TaskStatus; label: string; color: string; borderGlow: string; dot: string; icon: string }[] = [
  { status: 'TODO', label: 'To Do', color: 'border-slate-500/30 bg-slate-500/5', borderGlow: 'border-slate-400/50 bg-slate-500/10', dot: 'bg-slate-400', icon: '○' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: 'border-amber-500/30 bg-amber-500/5', borderGlow: 'border-amber-400/50 bg-amber-500/10', dot: 'bg-amber-400', icon: '◐' },
  { status: 'DONE', label: 'Done', color: 'border-emerald-500/30 bg-emerald-500/5', borderGlow: 'border-emerald-400/50 bg-emerald-500/10', dot: 'bg-emerald-400', icon: '●' },
];

// ─── TaskCard Component ────────────────────────────────────────────────────────

function TaskCard({
  task,
  onStatusChange,
  user,
  onEdit,
  onDelete,
  onViewDetails,
}: {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus, version: number) => void;
  user: any;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onViewDetails: (task: Task) => void;
}) {
  const isBlocked = task.dependsOn?.some((d) => d.dependsOn.status !== 'DONE');
  const isAssignedToMe = task.assignedToId === user?.id;
  const isPM = user?.role === 'PRODUCT_MANAGER';
  const isTeam = user?.role === 'INTERNAL_TEAM';
  const [showMenu, setShowMenu] = useState(false);

  const canDrag = (() => {
    if (user?.role === 'CLIENT_GUEST') return false;
    if (isPM) return true;
    if (isTeam && isAssignedToMe) return true;
    return false;
  })();

  const getAvailableTransitions = (): { status: TaskStatus; label: string }[] => {
    if (user?.role === 'CLIENT_GUEST') return [];
    const transitions: { status: TaskStatus; label: string }[] = [];
    if (isTeam) {
      if (!isAssignedToMe) return [];
      if (task.status === 'TODO') transitions.push({ status: 'IN_PROGRESS', label: '▸ Start' });
      if (task.status === 'IN_PROGRESS') transitions.push({ status: 'TODO', label: '◂ Pause' });
      return transitions;
    }
    if (task.status === 'TODO') {
      transitions.push({ status: 'IN_PROGRESS', label: '▸ Start' });
    }
    if (task.status === 'IN_PROGRESS') {
      transitions.push({ status: 'TODO', label: '◂ Back' });
      transitions.push({ status: 'DONE', label: '✓ Approve' });
    }
    if (task.status === 'DONE') {
      transitions.push({ status: 'IN_PROGRESS', label: '↺ Reopen' });
    }
    return transitions;
  };

  const handleTransition = (targetStatus: TaskStatus) => {
    if (isBlocked && (targetStatus === 'IN_PROGRESS' || targetStatus === 'DONE')) {
      const blockingNames = task.dependsOn
        ?.filter((d) => d.dependsOn.status !== 'DONE')
        .map((d) => `"${d.dependsOn.title}"`)
        .join(', ');
      toast.error(`🔒 Blocked! Depends on ${blockingNames} which must be DONE first.`, { duration: 5000 });
      return;
    }
    if (isTeam && targetStatus === 'DONE') {
      toast.error('Only Product Managers can approve tasks as DONE.', { duration: 4000 });
      return;
    }
    onStatusChange(task.id, targetStatus, task.version);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!canDrag) { e.preventDefault(); return; }
    e.dataTransfer.setData('application/json', JSON.stringify({
      taskId: task.id,
      version: task.version,
      fromStatus: task.status,
      isBlocked,
      assignedToId: task.assignedToId,
    }));
    e.dataTransfer.effectAllowed = 'move';
    (e.currentTarget as HTMLElement).style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
  };

  const transitions = getAvailableTransitions();

  return (
    <div
      draggable={canDrag}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onViewDetails(task)}
      className={`bg-[#0d0d18] border rounded-xl p-4 group transition-all hover:shadow-lg hover:shadow-black/20 cursor-pointer ${
        canDrag ? 'cursor-grab active:cursor-grabbing' : ''
      } ${isBlocked ? 'border-red-500/20 bg-red-500/[0.02]' : 'border-white/8 hover:border-white/15'}`}
    >
      {/* Blocked badge */}
      {isBlocked && (
        <div className="flex items-center gap-1.5 mb-2.5 px-2.5 py-1.5 bg-red-500/10 border border-red-500/15 rounded-lg">
          <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-red-400 text-[10px] font-medium">
            Blocked by:{' '}
            {task.dependsOn
              ?.filter((d) => d.dependsOn.status !== 'DONE')
              .map((d) => d.dependsOn.title)
              .join(', ')}
          </span>
        </div>
      )}

      {/* Header: Title + Menu */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-white text-sm font-medium leading-snug flex-1">{task.title}</h3>
        {isPM && (
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="text-slate-600 hover:text-slate-300 transition-colors p-0.5 rounded hover:bg-white/10"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 z-20 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl py-1 min-w-[120px]">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(task); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 flex items-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Edit Task
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(task); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {task.description && (
        <p className="text-slate-500 text-xs mb-3 line-clamp-2 mt-1">{task.description}</p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {task.assignedTo && (
          <div className="flex items-center gap-1.5 bg-white/5 rounded-full pl-0.5 pr-2.5 py-0.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold">
              {task.assignedTo.name.charAt(0)}
            </div>
            <span className="text-slate-400 text-[10px] truncate max-w-[100px]">
              {task.assignedTo.name}
              {task.assignedTo.department && (
                <span className="text-slate-600"> ({task.assignedTo.department})</span>
              )}
            </span>
          </div>
        )}
        {task.isClientVisible && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            👁 Visible
          </span>
        )}
        {!task.isClientVisible && isPM && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20 font-medium">
            🔒 Internal
          </span>
        )}
      </div>

      {/* Transition buttons */}
      {transitions.length > 0 && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5">
          {transitions.map((t) => (
            <button
              key={t.status}
              onClick={(e) => { e.stopPropagation(); handleTransition(t.status); }}
              className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                t.status === 'DONE'
                  ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/20'
                  : t.status === 'TODO'
                  ? 'bg-slate-500/15 text-slate-300 hover:bg-slate-500/25'
                  : 'bg-violet-500/15 text-violet-300 hover:bg-violet-500/25'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Create Task Modal ─────────────────────────────────────────────────────────

function CreateTaskModal({
  onClose,
  onSubmit,
  isSubmitting,
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState({ title: '', description: '', projectId: '', assignedToId: '', isClientVisible: false });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => projectsApi.list() });
  const { data: teamMembers = [] } = useQuery({ queryKey: ['team-members'], queryFn: () => usersApi.listTeam() });

  const handleSubmit = () => {
    if (!form.title.trim() || !form.projectId) { toast.error('Title and Project are required'); return; }
    onSubmit({ ...form, assignedToId: form.assignedToId || undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#13131f] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg">Create New Task</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm block mb-1.5">Title <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all" placeholder="Enter task title..." />
          </div>
          <div>
            <label className="text-slate-300 text-sm block mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none transition-all" placeholder="Optional description..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 text-sm block mb-1.5">Project <span className="text-red-400">*</span></label>
              <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                <option value="" className="bg-[#13131f]">Select project...</option>
                {projects.map((p: any) => (<option key={p.id} value={p.id} className="bg-[#13131f]">{p.name}</option>))}
              </select>
            </div>
            <div>
              <label className="text-slate-300 text-sm block mb-1.5">Assignee</label>
              <select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                <option value="" className="bg-[#13131f]">Unassigned</option>
                {teamMembers.map((u: any) => (<option key={u.id} value={u.id} className="bg-[#13131f]">{u.name} ({u.department || 'No dept'})</option>))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3">
            <div>
              <label className="text-slate-300 text-sm font-medium block">Visible to Client</label>
              <p className="text-slate-500 text-xs mt-0.5">Client can see this task</p>
            </div>
            <button type="button" onClick={() => setForm({ ...form, isClientVisible: !form.isClientVisible })} className={`relative w-11 h-6 rounded-full transition-all duration-200 ${form.isClientVisible ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25' : 'bg-white/10'}`}>
              <span className={`block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${form.isClientVisible ? 'translate-x-6' : 'translate-x-1'}`} style={{ marginTop: '4px' }} />
            </button>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-white/10 text-slate-400 rounded-lg text-sm hover:bg-white/5 transition-all font-medium">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.title.trim() || !form.projectId || isSubmitting} className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25">
            {isSubmitting ? <span className="flex items-center justify-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating…</span> : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Task Modal (PM only) ─────────────────────────────────────────────────

function EditTaskModal({
  task,
  allTasks,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  task: Task;
  allTasks: Task[];
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    assignedToId: task.assignedToId || '',
    isClientVisible: task.isClientVisible,
  });
  const { data: teamMembers = [] } = useQuery({ queryKey: ['team-members'], queryFn: () => usersApi.listTeam() });
  const qc = useQueryClient();

  // Dependency management
  const currentDeps = task.dependsOn || [];
  const availableDeps = allTasks.filter((t) => t.id !== task.id && t.projectId === task.projectId && !currentDeps.some((d) => d.dependsOn.id === t.id));

  const addDepMut = useMutation({
    mutationFn: (depTaskId: string) => tasksApi.addDependency(task.id, depTaskId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Dependency added'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  const removeDepMut = useMutation({
    mutationFn: (depTaskId: string) => tasksApi.removeDependency(task.id, depTaskId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Dependency removed'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    onSubmit({ ...form, assignedToId: form.assignedToId || undefined, version: task.version });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#13131f] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg">Edit Task</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm block mb-1.5">Title <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all" />
          </div>
          <div>
            <label className="text-slate-300 text-sm block mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none transition-all" />
          </div>
          <div>
            <label className="text-slate-300 text-sm block mb-1.5">Assignee</label>
            <select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50">
              <option value="" className="bg-[#13131f]">Unassigned</option>
              {teamMembers.map((u: any) => (<option key={u.id} value={u.id} className="bg-[#13131f]">{u.name} ({u.department || 'No dept'})</option>))}
            </select>
          </div>
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3">
            <div>
              <label className="text-slate-300 text-sm font-medium block">Visible to Client</label>
              <p className="text-slate-500 text-xs mt-0.5">Client can see this task</p>
            </div>
            <button type="button" onClick={() => setForm({ ...form, isClientVisible: !form.isClientVisible })} className={`relative w-11 h-6 rounded-full transition-all duration-200 ${form.isClientVisible ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25' : 'bg-white/10'}`}>
              <span className={`block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${form.isClientVisible ? 'translate-x-6' : 'translate-x-1'}`} style={{ marginTop: '4px' }} />
            </button>
          </div>

          {/* Dependencies section */}
          <div className="border border-white/10 rounded-lg p-4 bg-white/[0.02]">
            <label className="text-slate-300 text-sm font-medium block mb-2">🔗 Dependencies</label>
            {currentDeps.length > 0 ? (
              <div className="space-y-1.5 mb-3">
                {currentDeps.map((dep) => (
                  <div key={dep.dependsOn.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-xs text-slate-300">{dep.dependsOn.title}
                      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${dep.dependsOn.status === 'DONE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                        {dep.dependsOn.status}
                      </span>
                    </span>
                    <button onClick={() => removeDepMut.mutate(dep.dependsOn.id)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-xs mb-3">No dependencies set.</p>
            )}
            {availableDeps.length > 0 && (
              <select
                defaultValue=""
                onChange={(e) => { if (e.target.value) addDepMut.mutate(e.target.value); e.target.value = ''; }}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                <option value="" className="bg-[#13131f]">+ Add prerequisite task...</option>
                {availableDeps.map((t) => (<option key={t.id} value={t.id} className="bg-[#13131f]">{t.title}</option>))}
              </select>
            )}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-white/10 text-slate-400 rounded-lg text-sm hover:bg-white/5 transition-all font-medium">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.title.trim() || isSubmitting} className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25">
            {isSubmitting ? <span className="flex items-center justify-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</span> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ──────────────────────────────────────────────────

function DeleteConfirmModal({
  task,
  onClose,
  onConfirm,
  isDeleting,
}: {
  task: Task;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#13131f] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">Delete Task</h3>
            <p className="text-slate-500 text-xs">This action can be undone by an admin</p>
          </div>
        </div>
        <p className="text-slate-300 text-sm mb-5">Are you sure you want to delete <strong className="text-white">&quot;{task.title}&quot;</strong>?</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-white/10 text-slate-400 rounded-lg text-sm hover:bg-white/5 transition-all font-medium">Cancel</button>
          <button onClick={onConfirm} disabled={isDeleting} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-all">
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Detail Drawer with Comments ───────────────────────────────────────────

function TaskDetailDrawer({
  task,
  onClose,
  user,
}: {
  task: Task;
  onClose: () => void;
  user: any;
}) {
  const qc = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', task.id],
    queryFn: () => commentsApi.list(task.id),
  });

  const addCommentMut = useMutation({
    mutationFn: (content: string) => commentsApi.create(task.id, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', task.id] });
      setNewComment('');
      toast.success('Comment added');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to add comment'),
  });

  const deleteCommentMut = useMutation({
    mutationFn: (commentId: string) => commentsApi.delete(commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', task.id] });
      toast.success('Comment deleted');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete comment'),
  });

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    addCommentMut.mutate(newComment.trim());
  };

  const isPM = user?.role === 'PRODUCT_MANAGER';
  const statusColors: Record<string, string> = {
    TODO: 'bg-slate-500/15 text-slate-300',
    IN_PROGRESS: 'bg-amber-500/15 text-amber-300',
    DONE: 'bg-emerald-500/15 text-emerald-300',
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Drawer */}
      <div className="w-full max-w-md bg-[#0e0e1a] border-l border-white/10 flex flex-col shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[task.status] || ''}`}>{task.status.replace('_', ' ')}</span>
            {task.isClientVisible && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">👁 Client</span>}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="text-white text-lg font-bold">{task.title}</h2>
            {task.description && <p className="text-slate-400 text-sm mt-2 leading-relaxed">{task.description}</p>}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-1">Project</p>
              <p className="text-white text-xs font-medium">{task.project?.name || '—'}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-1">Assigned To</p>
              <p className="text-white text-xs font-medium">{task.assignedTo?.name || 'Unassigned'}</p>
            </div>
          </div>

          {/* Dependencies */}
          {task.dependsOn && task.dependsOn.length > 0 && (
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-2">🔗 Dependencies</p>
              <div className="space-y-1.5">
                {task.dependsOn.map((dep) => (
                  <div key={dep.dependsOn.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                    <span className={`w-2 h-2 rounded-full ${dep.dependsOn.status === 'DONE' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="text-xs text-slate-300 flex-1">{dep.dependsOn.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${dep.dependsOn.status === 'DONE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                      {dep.dependsOn.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="border-t border-white/10 pt-5">
            <p className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2">
              💬 Comments
              <span className="text-slate-600 text-xs font-normal">({comments.length})</span>
            </p>

            {commentsLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 text-xs">No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-3 mb-3">
                {comments.map((comment: Comment) => (
                  <div key={comment.id} className="bg-white/[0.03] border border-white/5 rounded-lg p-3 group/comment">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                          {comment.user.name.charAt(0)}
                        </div>
                        <span className="text-slate-300 text-xs font-medium">{comment.user.name}</span>
                        {comment.user.department && (
                          <span className="text-slate-600 text-[10px]">({comment.user.department})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 text-[10px]">{new Date(comment.createdAt).toLocaleString()}</span>
                        {(comment.userId === user?.id || isPM) && (
                          <button
                            onClick={() => deleteCommentMut.mutate(comment.id)}
                            className="opacity-0 group-hover/comment:opacity-100 text-red-400/60 hover:text-red-400 transition-all text-xs"
                            title="Delete comment"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed pl-8">{comment.content}</p>
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            )}

            {/* Comment input */}
            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                placeholder="Write a comment..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || addCommentMut.isPending}
                className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 hover:from-violet-500 hover:to-indigo-500 transition-all"
              >
                {addCommentMut.isPending ? '…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}

// ─── Main Tasks Page ───────────────────────────────────────────────────────────

export default function TasksPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [filterProject, setFilterProject] = useState('');
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', filterProject],
    queryFn: () => tasksApi.list(filterProject || undefined),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      tasksApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated!');
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || 'Failed to update task';
      const message = Array.isArray(msg) ? msg[0] : msg;
      if (status === 409) {
        toast.error('⚠️ Data conflict. Someone else updated this task. Refreshing…', { duration: 6000, icon: '🔄' });
        qc.invalidateQueries({ queryKey: ['tasks'] });
      } else if (status === 400) {
        toast.error(`🔒 ${message}`, { duration: 5000 });
      } else if (status === 403) {
        toast.error(`🚫 ${message}`, { duration: 4000 });
      } else {
        toast.error(message);
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => tasksApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('✅ Task created successfully!');
      setShowCreateModal(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to create task';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
      setDeletingTask(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to delete task';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  // ─── Drag and Drop Handlers ──────────────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent, colStatus: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colStatus);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { taskId, version, fromStatus, isBlocked, assignedToId } = data;

      if (fromStatus === targetStatus) return;

      // Client-side RBAC checks
      const isTeam = user?.role === 'INTERNAL_TEAM';
      const isPM = user?.role === 'PRODUCT_MANAGER';
      const isMyTask = assignedToId === user?.id;

      if (isTeam && !isMyTask) {
        toast.error('🚫 You can only move tasks assigned to you.', { duration: 4000 });
        return;
      }

      if (isTeam && targetStatus === 'DONE') {
        toast.error('🚫 Only Product Managers can approve tasks as DONE.', { duration: 4000 });
        return;
      }

      if (isBlocked && (targetStatus === 'IN_PROGRESS' || targetStatus === 'DONE')) {
        toast.error('🔒 This task has unfinished dependencies.', { duration: 5000 });
        return;
      }

      updateMutation.mutate({ id: taskId, status: targetStatus, version });
    } catch {
      // Invalid drag data, ignore
    }
  };

  const columns = COLUMNS.map((col) => ({
    ...col,
    tasks: tasks.filter((t: Task) => t.status === col.status),
  }));

  const total = tasks.length;
  const done = tasks.filter((t: Task) => t.status === 'DONE').length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Task Board</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-400 text-sm">{total} tasks • {pct}% complete</p>
            {user?.role === 'INTERNAL_TEAM' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20 font-medium">
                Showing your tasks only
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            <option value="" className="bg-[#13131f]">All Projects</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id} className="bg-[#13131f]">{p.name}</option>
            ))}
          </select>

          {user?.role === 'PRODUCT_MANAGER' && (
            <button
              id="create-task-btn"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-violet-500/25"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Role info banner */}
      {user?.role === 'INTERNAL_TEAM' && (
        <div className="mb-6 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-blue-300 text-xs">
            <strong>Team Member View:</strong> Drag your tasks between To Do ↔ In Progress. Only a Product Manager can approve tasks as Done.
          </p>
        </div>
      )}

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {columns.map((col) => (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`border rounded-xl p-4 transition-all duration-200 ${
                dragOverCol === col.status ? col.borderGlow + ' ring-1 ring-white/10 scale-[1.01]' : col.color
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">{col.icon}</span>
                <h2 className="text-white font-semibold text-sm">{col.label}</h2>
                <span className="ml-auto text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{col.tasks.length}</span>
                {col.status === 'DONE' && user?.role === 'INTERNAL_TEAM' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">PM only</span>
                )}
              </div>
              <div className="space-y-3 min-h-[200px]">
                {col.tasks.map((task: Task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    user={user}
                    onStatusChange={(id, status, version) =>
                      updateMutation.mutate({ id, status, version })
                    }
                    onEdit={(t) => setEditingTask(t)}
                    onDelete={(t) => setDeletingTask(t)}
                    onViewDetails={(t) => setDetailTask(t)}
                  />
                ))}
                {col.tasks.length === 0 && (
                  <div className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg transition-all ${
                    dragOverCol === col.status ? 'border-white/20 bg-white/[0.02]' : 'border-white/5'
                  }`}>
                    <span className="text-xl text-slate-700 mb-1">{col.icon}</span>
                    <p className="text-slate-600 text-xs">{dragOverCol === col.status ? 'Drop here' : 'No tasks'}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          allTasks={tasks}
          onClose={() => setEditingTask(null)}
          onSubmit={(data) => {
            updateMutation.mutate({ id: editingTask.id, ...data }, {
              onSuccess: () => setEditingTask(null),
            });
          }}
          isSubmitting={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTask && (
        <DeleteConfirmModal
          task={deletingTask}
          onClose={() => setDeletingTask(null)}
          onConfirm={() => deleteMutation.mutate(deletingTask.id)}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {/* Task Detail Drawer */}
      {detailTask && (
        <TaskDetailDrawer
          task={detailTask}
          onClose={() => setDetailTask(null)}
          user={user}
        />
      )}
    </div>
  );
}
