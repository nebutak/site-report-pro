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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="h-8 w-8 text-blue-500" />
            Danh sách dự án
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Quản lý và theo dõi các dự án công trình xây dựng
          </p>
        </div>

        {canManage && (
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/15 transition-all"
          >
            <Plus className="h-5 w-5" />
            Thêm dự án
          </Link>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row bg-slate-900/40 border border-slate-800 rounded-xl p-4">
        {/* Search */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm dự án theo tên hoặc mã..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="block w-full rounded-lg bg-slate-950/80 border border-slate-850 py-2.5 pl-10 pr-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
          />
        </div>

        {/* Status filter */}
        <div className="w-full sm:w-48">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block w-full rounded-lg bg-slate-950/80 border border-slate-850 py-2.5 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Ngưng hoạt động</option>
          </select>
        </div>
      </div>

      {/* Main content listing */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-3" />
          <p className="text-slate-400 text-sm">Đang tải danh sách dự án...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-800/40 bg-red-950/20 p-6 text-center text-red-200">
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-16 text-center">
          <FolderKanban className="h-12 w-12 text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">Không tìm thấy dự án</h3>
          <p className="text-xs text-slate-500 mt-1">Hãy thử tìm kiếm với từ khóa khác hoặc tạo dự án mới.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {projects.map((project) => {
            const logoSrc = project.logoUrl ? `${BACKEND_URL}${project.logoUrl}` : null;
            return (
              <div
                key={project.id}
                className="group relative flex flex-col justify-between rounded-xl bg-slate-900/30 hover:bg-slate-900/50 border border-slate-850 hover:border-slate-800 p-6 shadow-sm hover:shadow-lg transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    {/* Project Logo wrapper */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden relative">
                      {logoSrc ? (
                        <Image
                          src={logoSrc}
                          alt={`Logo ${project.name}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="text-xl font-bold bg-gradient-to-tr from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                          {project.code.substring(0, 2)}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-3xs font-bold ${
                          project.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}
                      >
                        {project.status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng'}
                      </span>
                      <span className="text-2xs font-mono text-slate-500">{project.code}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                      {project.name}
                    </h3>
                  </div>

                  {/* Details */}
                  <div className="mt-4 space-y-2 border-t border-slate-900/60 pt-4 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 shrink-0 text-slate-600" />
                      <span className="truncate">Chủ đầu tư: {project.ownerName || '---'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 shrink-0 text-slate-600" />
                      <span className="truncate">Giám sát: {project.supervisorName || '---'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-slate-600" />
                      <span className="truncate">Địa điểm: {project.location || '---'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-900 pt-4">
                  {canManage ? (
                    <Link
                      href={`/dashboard/projects/${project.id}/edit`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/20 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Sửa
                    </Link>
                  ) : (
                    <div />
                  )}

                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 group-hover:text-blue-300 hover:underline"
                  >
                    Chi tiết
                    <ChevronRight className="h-4 w-4" />
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
