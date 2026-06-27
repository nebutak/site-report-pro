'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/features/auth/AuthContext';
import { apiClient } from '@/lib/api-client';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Building, 
  MapPin, 
  User, 
  FileText, 
  Loader2, 
  Edit3, 
  Plus,
  Calendar,
  AlertCircle,
  X,
  Trash2,
  Copy,
  ChevronRight
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
  defaultReporterName: string | null;
  defaultReceiver: string | null;
  defaultCc: string | null;
  createdAt: string;
}

interface Report {
  id: number;
  projectId: number;
  reportType: string;
  reportNo: string | null;
  reportDate: string;
  issueDate: string | null;
  title: string | null;
  status: string;
  sourceReportId: number | null;
  createdById: number;
  approvedById: number | null;
  approvedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  createdBy?: {
    id: number;
    name: string;
    email: string;
  };
}

const BACKEND_URL = 'http://localhost:3001';

const getLocalDateString = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
};

const reportSchema = z.object({
  reportDate: z.string().min(1, { message: 'Ngày báo cáo không được để trống' }),
  reportType: z.enum(['DAILY', 'SUMMARY', 'V2', 'MESSAGE', 'WEEKLY', 'ADJUSTMENT'], {
    message: 'Vui lòng chọn loại báo cáo',
  }),
  cloneFromPrevious: z.boolean(),
  sourceReportId: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function ProjectDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const canManage = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';
  const canReport = canManage || user?.role === 'REPORTER';

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportDate: getLocalDateString(),
      reportType: 'DAILY',
      cloneFromPrevious: false,
      sourceReportId: '',
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchClone = watch('cloneFromPrevious');

  const fetchReports = useCallback(async () => {
    if (!projectId) return;
    setReportsLoading(true);
    setReportsError(null);
    try {
      const data = await apiClient.get<Report[]>(`/reports?projectId=${projectId}`);
      setReports(data);
    } catch (err) {
      const apiError = err as { message?: string };
      setReportsError(apiError.message || 'Không thể tải danh sách báo cáo');
    } finally {
      setReportsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.get<Project>(`/projects/${projectId}`);
        setProject(data);
      } catch (err) {
        const apiError = err as { message?: string };
        setError(apiError.message || 'Không thể tải chi tiết dự án');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProject();
    void fetchReports();
  }, [projectId, fetchReports]);

  const onSubmit = async (values: ReportFormValues) => {
    setModalError(null);
    setIsCreating(true);
    try {
      const payload = {
        projectId: Number(projectId),
        reportType: values.reportType,
        reportDate: values.reportDate,
        sourceReportId: values.cloneFromPrevious && values.sourceReportId 
          ? Number(values.sourceReportId) 
          : undefined,
      };

      const newReport = await apiClient.post<{ id: number }>('/reports', payload);
      setIsModalOpen(false);
      reset();
      router.push(`/dashboard/projects/${projectId}/reports/${newReport.id}/edit`);
    } catch (err) {
      const apiError = err as { message?: string };
      setModalError(apiError.message || 'Không thể tạo báo cáo. Vui lòng kiểm tra lại.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hoàn toàn báo cáo này và tất cả các bảng dữ liệu liên quan?')) return;
    try {
      await apiClient.delete(`/reports/${reportId}`);
      await fetchReports();
    } catch (err) {
      const apiError = err as { message?: string };
      alert(apiError.message || 'Không thể xóa báo cáo');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/projects"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight">Chi tiết dự án</h1>
        </div>
        <div className="flex items-start gap-3 rounded-lg bg-red-950/50 border border-red-800/60 p-4 text-sm text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{error || 'Không tìm thấy dữ liệu dự án.'}</span>
        </div>
      </div>
    );
  }

  const logoSrc = project.logoUrl ? `${BACKEND_URL}${project.logoUrl}` : null;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center rounded-md bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/20">
            Bản nháp
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            Chờ duyệt
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            Đã duyệt
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center rounded-md bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/20">
            Đã gửi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  const getReportTypeLabel = (type: string) => {
    if (type === 'DAILY') return 'Báo cáo ngày';
    if (type === 'SUMMARY') return 'Báo cáo tóm tắt';
    if (type === 'V2') return 'Báo cáo V2';
    if (type === 'MESSAGE') return 'Lời dẫn';
    if (type === 'WEEKLY') return 'Báo cáo tuần';
    if (type === 'ADJUSTMENT') return 'Báo cáo điều chỉnh';
    return type;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/projects"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{project.name}</h1>
            <p className="text-slate-500 text-sm mt-1">Mã dự án: <span className="font-mono text-blue-400 font-semibold">{project.code}</span></p>
          </div>
        </div>

        {canManage && (
          <Link
            href={`/dashboard/projects/${project.id}/edit`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800/60 hover:text-white active:scale-[0.98] transition-all duration-200"
          >
            <Edit3 className="h-4 w-4" />
            Chỉnh sửa thông tin
          </Link>
        )}
      </div>

      {/* Grid containing Project Info card & logo view */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Info panel */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-6 space-y-6">
            <h2 className="text-base font-bold text-white tracking-tight border-b border-slate-800/40 pb-3 flex items-center gap-2">
              <Building className="h-4.5 w-4.5 text-blue-400" />
              Thông tin dự án
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm leading-relaxed">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Chủ đầu tư (ĐD)</span>
                <p className="text-slate-200 font-semibold">{project.ownerName || '---'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Tư vấn giám sát</span>
                <p className="text-slate-200 font-semibold">{project.supervisorName || '---'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Nhà thầu chính</span>
                <p className="text-slate-200 font-semibold">{project.contractorName || '---'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Địa điểm</span>
                <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                  <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>{project.location || '---'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Người lập báo cáo mặc định</span>
                <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                  <User className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>{project.defaultReporterName || '---'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Nơi nhận mặc định</span>
                <p className="text-slate-200 font-semibold">{project.defaultReceiver || '---'}</p>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <span className="text-xs text-slate-500 font-medium">Cc mặc định</span>
                <p className="text-slate-200 font-semibold">{project.defaultCc || '---'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Logo & Status Card */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-6 pt-10 flex flex-col items-center justify-center text-center relative">
            <div className="absolute top-2 right-2">
              <span
                className={`inline-block rounded px-2 py-0.5 text-3xs font-bold border ${
                  project.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}
              >
                {project.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngưng hoạt động'}
              </span>
            </div>

            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden relative shadow-lg mb-4">
              {logoSrc ? (
                <Image
                  src={logoSrc}
                  alt={`Logo ${project.name}`}
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              ) : (
                <div className="text-3xl font-bold text-blue-400">
                  {project.code}
                </div>
              )}
            </div>
            
            <h3 className="font-bold text-white text-base">{project.name}</h3>
            <p className="text-xs text-slate-500 mt-1">Khởi tạo ngày: {new Date(project.createdAt).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
      </div>

      {/* Daily Reports list (Phase 3) */}
      <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/40 pb-4">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-blue-400" />
            Lịch sử Báo cáo
          </h2>

          {canReport && (
            <button
              onClick={() => {
                reset();
                setModalError(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-blue-600/15 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Lập báo cáo ngày
            </button>
          )}
        </div>

        {reportsError && (
          <div className="flex items-start gap-3 rounded-lg bg-red-950/50 border border-red-800/60 p-4 text-sm text-red-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{reportsError}</span>
          </div>
        )}

        {reportsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-10 w-10 text-slate-700 mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">Chưa có báo cáo nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Dự án này chưa có báo cáo ngày. Hãy bấm nút &quot;Lập báo cáo ngày&quot; ở trên để khởi tạo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800/40 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Số báo cáo</th>
                  <th className="py-3.5 px-4">Ngày báo cáo</th>
                  <th className="py-3.5 px-4">Loại</th>
                  <th className="py-3.5 px-4">Tiêu đề</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4">Người tạo</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-4 font-semibold text-white font-mono text-xs">{report.reportNo || '---'}</td>
                    <td className="py-4 px-4">{new Date(report.reportDate).toLocaleDateString('vi-VN', { timeZone: 'UTC' })}</td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-400">{getReportTypeLabel(report.reportType)}</td>
                    <td className="py-4 px-4 font-medium text-slate-200">{report.title || '---'}</td>
                    <td className="py-4 px-4">{renderStatusBadge(report.status)}</td>
                    <td className="py-4 px-4 text-xs text-slate-400">{report.createdBy?.name || '---'}</td>
                    <td className="py-4 px-4 text-right space-x-1">
                      <Link
                        href={`/dashboard/projects/${projectId}/reports/${report.id}/edit`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800/60 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="Chỉnh sửa & Xem chi tiết"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                      
                      {canReport && (report.status === 'DRAFT' || report.status === 'IN_REVIEW') && (
                        <button
                          onClick={() => {
                            reset({
                              reportDate: getLocalDateString(),
                              reportType: 'DAILY',
                              cloneFromPrevious: true,
                              sourceReportId: String(report.id),
                            });
                            setModalError(null);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800/60 bg-slate-900/50 text-blue-400 hover:text-blue-300 hover:bg-slate-800 transition cursor-pointer"
                          title="Sao chép từ báo cáo này"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      )}

                      {canManage && (
                        <button
                          onClick={() => void handleDeleteReport(report.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800/60 bg-slate-900/50 text-red-400 hover:text-red-300 hover:bg-red-950/20 transition cursor-pointer"
                          title="Xóa báo cáo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Lập báo cáo ngày mới
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="flex items-start gap-3 rounded-lg bg-red-950/50 border border-red-800/60 p-3.5 text-xs text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Ngày báo cáo *</label>
                <input
                  type="date"
                  {...register('reportDate')}
                  className={`mt-2 block w-full rounded-xl bg-slate-950 border ${
                    errors.reportDate ? 'border-red-500/60' : 'border-slate-800/60'
                  } py-2.5 px-3.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200`}
                />
                {errors.reportDate && (
                  <p className="mt-1 text-xs text-red-400 font-medium">{errors.reportDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Loại báo cáo *</label>
                <select
                  {...register('reportType')}
                  className="mt-2 block w-full rounded-xl bg-slate-950 border border-slate-800/60 py-2.5 px-3.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                >
                  <option value="DAILY">Báo cáo ngày (DAILY)</option>
                  <option value="SUMMARY">Báo cáo tóm tắt (SUMMARY)</option>
                  <option value="V2">Báo cáo V2</option>
                  <option value="MESSAGE">Lời dẫn báo cáo (MESSAGE)</option>
                  <option value="WEEKLY">Báo cáo tuần (WEEKLY)</option>
                  <option value="ADJUSTMENT">Báo cáo điều chỉnh (ADJUSTMENT)</option>
                </select>
              </div>

              {reports.length > 0 && (
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 font-medium select-none">
                    <input
                      type="checkbox"
                      {...register('cloneFromPrevious')}
                      className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500/20 h-4 w-4"
                    />
                    Sao chép dữ liệu từ báo cáo trước
                  </label>

                  {watchClone && (
                    <div className="animate-fade-in pl-6">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Chọn báo cáo nguồn *</label>
                      <select
                        {...register('sourceReportId')}
                        className="mt-2 block w-full rounded-xl bg-slate-950 border border-slate-800/60 py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                      >
                        <option value="">-- Chọn báo cáo nguồn --</option>
                        {reports.map((r) => (
                          <option key={r.id} value={r.id}>
                            [{getReportTypeLabel(r.reportType)}] {r.reportNo || `BC-${r.id}`} ({new Date(r.reportDate).toLocaleDateString('vi-VN', { timeZone: 'UTC' })}) - {r.title || 'Không tiêu đề'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-800/60 hover:bg-slate-800/40 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang khởi tạo...
                    </>
                  ) : (
                    'Khởi tạo báo cáo'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
