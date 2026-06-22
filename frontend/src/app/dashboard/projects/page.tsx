'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { apiClient } from '@/lib/api-client';
import { 
  Plus, 
  Search, 
  MapPin, 
  Building, 
  ChevronRight, 
  Loader2, 
  Edit3, 
  FolderKanban 
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Project {
  id: number;
  name: string;
  code: string;
  ownerName: string | null;
  supervisorName: string | null;
  contractorName: string | null;
  location: string | null;
  logoUrl: string | null;
  status: string;
}

const BACKEND_URL = 'http://localhost:3001';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const canManage = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.get<Project[]>('/projects', {
          params: {
            status,
            keyword,
          },
        });
        setProjects(data);
      } catch (err) {
        const apiError = err as { message?: string };
        setError(apiError.message || 'Không thể tải danh sách dự án');
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      void fetchProjects();
    }, 300); // Debounce search

    return () => clearTimeout(delayDebounceFn);
  }, [keyword, status]);

  // Skeleton card component
  const SkeletonCard = () => (
    <div className="rounded-xl glass-card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="h-14 w-14 rounded-xl bg-slate-800 animate-shimmer" />
        <div className="h-5 w-20 rounded bg-slate-800 animate-shimmer" />
      </div>
      <div className="h-5 w-3/4 rounded bg-slate-800 animate-shimmer" />
      <div className="space-y-2 pt-3 border-t border-slate-800/40">
        <div className="h-3 w-full rounded bg-slate-800/60 animate-shimmer" />
        <div className="h-3 w-4/5 rounded bg-slate-800/60 animate-shimmer" />
        <div className="h-3 w-3/5 rounded bg-slate-800/60 animate-shimmer" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
              <FolderKanban className="h-5 w-5 text-blue-400" />
            </div>
            Danh sách dự án
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">
            Quản lý và theo dõi các dự án công trình xây dựng
          </p>
        </div>

        {canManage && (
          <Link
            href="/dashboard/projects/new"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/15 hover:shadow-blue-600/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <Plus className="h-4.5 w-4.5" />
            Thêm dự án
          </Link>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row glass-card rounded-xl p-3 animate-fade-in-up stagger-1">
        {/* Search */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Search className="h-4.5 w-4.5 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm dự án theo tên hoặc mã..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="block w-full rounded-xl bg-slate-950/80 border border-slate-800/60 py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200 text-sm"
          />
        </div>

        {/* Status filter */}
        <div className="w-full sm:w-48">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block w-full rounded-xl bg-slate-950/80 border border-slate-800/60 py-2.5 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200 text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Ngưng hoạt động</option>
          </select>
        </div>
      </div>

      {/* Main content listing */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-800/30 bg-red-950/15 p-8 text-center text-red-200 animate-fade-in">
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl glass-card p-16 text-center animate-fade-in-up">
          <div className="relative inline-block mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center mx-auto border border-dashed border-slate-700 animate-pulse-glow">
              <FolderKanban className="h-7 w-7 text-slate-600" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-slate-300">Không tìm thấy dự án</h3>
          <p className="text-xs text-slate-600 mt-1.5 max-w-xs mx-auto">
            Hãy thử tìm kiếm với từ khóa khác hoặc tạo dự án mới.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {projects.map((project, idx) => {
            const logoSrc = project.logoUrl ? `${BACKEND_URL}${project.logoUrl}` : null;
            return (
              <div
                key={project.id}
                className={`group relative flex flex-col justify-between rounded-xl glass-card glass-card-hover p-6 transition-all duration-300 hover:-translate-y-0.5 animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    {/* Project Logo wrapper */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-950/80 border border-slate-800/60 overflow-hidden relative group-hover:border-slate-700 transition-colors duration-300">
                      {logoSrc ? (
                        <Image
                          src={logoSrc}
                          alt={`Logo ${project.name}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="text-xl font-bold gradient-text-primary">
                          {project.code.substring(0, 2)}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`inline-block rounded-lg px-2.5 py-0.5 text-3xs font-bold ${
                          project.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}
                      >
                        {project.status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng'}
                      </span>
                      <span className="text-2xs font-mono text-slate-600">{project.code}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors duration-200">
                      {project.name}
                    </h3>
                  </div>

                  {/* Details */}
                  <div className="mt-4 space-y-2 border-t border-slate-800/30 pt-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                      <span className="truncate">Chủ đầu tư: <span className="text-slate-400">{project.ownerName || '---'}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                      <span className="truncate">Giám sát: <span className="text-slate-400">{project.supervisorName || '---'}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                      <span className="truncate">Địa điểm: <span className="text-slate-400">{project.location || '---'}</span></span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-800/30 pt-4">
                  {canManage ? (
                    <Link
                      href={`/dashboard/projects/${project.id}/edit`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800/60 hover:border-slate-700 bg-slate-950/30 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all duration-200"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Sửa
                    </Link>
                  ) : (
                    <div />
                  )}

                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 group-hover:text-blue-300 hover:underline transition"
                  >
                    Chi tiết
                    <ChevronRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
