'use client';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Project } from '@/lib/types';
import Link from 'next/link';

export default function ProjectsPage() {
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Projects</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} found</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-4xl mb-3">◫</div>
          <p className="font-medium">No projects yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {projects.map((project: Project) => (
            <div key={project.id} className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 hover:bg-white/8 hover:border-white/15 transition-all group">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-white font-semibold text-base sm:text-lg truncate">{project.name}</h2>
                  {project.client && (
                    <p className="text-slate-500 text-xs mt-1">Client: {project.client.name}</p>
                  )}
                </div>
                <span className="text-xs px-2 sm:px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/20 font-medium flex-shrink-0 ml-2">
                  {project._count?.tasks ?? 0} tasks
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              {user?.role !== 'INTERNAL_TEAM' && (
                <Link
                  href={`/dashboard/tasks?projectId=${project.id}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-violet-400 text-sm font-medium hover:text-violet-300 transition-colors group-hover:gap-2.5"
                >
                  View Tasks →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
