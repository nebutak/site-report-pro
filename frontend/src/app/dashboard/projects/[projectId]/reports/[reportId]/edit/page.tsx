'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/features/auth/AuthContext';
import { apiClient } from '@/lib/api-client';
import { 
  ArrowLeft, 
  Building, 
  MapPin, 
  User, 
  FileText, 
  Loader2, 
  AlertCircle,
  Save,
  Send,
  CheckCircle,
  Mail,
  CloudSun,
  Users,
  Wrench,
  Package,
  Layers,
  ImageIcon,
  History,
  Lock
} from 'lucide-react';
import Link from 'next/link';

// Next.js 15 uses useParams from 'next/navigation' instead of useRouter for params
import { useParams } from 'next/navigation';

interface Project {
  id: number;
  name: string;
  code: string;
  ownerName: string | null;
  supervisorName: string | null;
  contractorName: string | null;
  location: string | null;
  logoUrl: string | null;
  defaultReporterName: string | null;
  defaultReceiver: string | null;
  defaultCc: string | null;
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
  project: Project;
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
}

const editReportSchema = z.object({
  reportNo: z.string().min(1, { message: 'Số báo cáo không được để trống' }),
  title: z.string().min(1, { message: 'Tiêu đề không được để trống' }),
  issueDate: z.string().optional(),
});

type EditReportFormValues = z.infer<typeof editReportSchema>;

type TabKey = 'general' | 'weather' | 'manpower' | 'equipment' | 'materials' | 'workitems' | 'images' | 'history';

export default function ReportEditPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();

  const projectId = params.projectId;
  const reportId = params.reportId;

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Authorization flags
  const isAdmin = user?.role === 'ADMIN';
  const isPM = user?.role === 'PROJECT_MANAGER';
  const isReporter = user?.role === 'REPORTER';
  const isReviewer = user?.role === 'REVIEWER';

  const canEdit = isAdmin || isPM || isReporter;
  const canApprove = isAdmin || isPM || isReviewer;
  const canSend = isAdmin || isPM || isReporter;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<EditReportFormValues>({
    resolver: zodResolver(editReportSchema),
    defaultValues: {
      reportNo: '',
      title: '',
      issueDate: '',
    },
  });

  const fetchReport = async () => {
    if (!reportId) return;
    try {
      const data = await apiClient.get<Report>(`/reports/${reportId}`);
      setReport(data);

      // Pre-fill form values
      setValue('reportNo', data.reportNo || '');
      setValue('title', data.title || '');
      if (data.issueDate) {
        // extract YYYY-MM-DD
        const formattedDate = new Date(data.issueDate).toISOString().slice(0, 10);
        setValue('issueDate', formattedDate);
      } else {
        setValue('issueDate', '');
      }
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Không thể tải thông tin báo cáo');
    }
  };

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      if (!reportId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.get<Report>(`/reports/${reportId}`);
        if (active) {
          setReport(data);
          setValue('reportNo', data.reportNo || '');
          setValue('title', data.title || '');
          if (data.issueDate) {
            const formattedDate = new Date(data.issueDate).toISOString().slice(0, 10);
            setValue('issueDate', formattedDate);
          } else {
            setValue('issueDate', '');
          }
          setIsLoading(false);
        }
      } catch (err) {
        const apiError = err as { message?: string };
        if (active) {
          setError(apiError.message || 'Không thể tải thông tin báo cáo');
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, [reportId, setValue]);

  const onSaveMetadata = async (data: EditReportFormValues) => {
    if (!reportId) return;
    setError(null);
    setSuccessMsg(null);
    setIsSubmittingAction(true);
    try {
      await apiClient.patch(`/reports/${reportId}`, data);
      setSuccessMsg('Đã lưu thông tin chung thành công');
      await fetchReport();
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Lỗi khi cập nhật báo cáo');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleStatusChange = async (action: 'submit' | 'approve' | 'mark-sent') => {
    if (!reportId) return;
    setError(null);
    setSuccessMsg(null);
    setIsSubmittingAction(true);
    try {
      await apiClient.post(`/reports/${reportId}/${action}`, {});
      setSuccessMsg(`Báo cáo đã chuyển trạng thái thành công`);
      await fetchReport();
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || `Lỗi khi thực hiện thao tác`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight">Biên tập báo cáo ngày</h1>
        </div>
        <div className="flex items-start gap-3 rounded-lg bg-red-950/50 border border-red-800/60 p-4 text-sm text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const isFinalized = report.status === 'APPROVED' || report.status === 'SENT';

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
    return type;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-850 pb-5">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{report.title}</h1>
              {renderStatusBadge(report.status)}
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Dự án: <span className="text-white font-medium">{report.project.name}</span> | Số báo cáo: <span className="font-mono text-blue-450 font-bold">{report.reportNo}</span> | Ngày báo cáo: <span className="text-slate-200">{new Date(report.reportDate).toLocaleDateString('vi-VN', { timeZone: 'UTC' })}</span>
            </p>
          </div>
        </div>

        {/* Action controls based on status and roles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Submit Action */}
          {report.status === 'DRAFT' && canEdit && (
            <button
              onClick={() => void handleStatusChange('submit')}
              disabled={isSubmittingAction}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-650 hover:bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer"
            >
              <Send className="h-4 w-4" />
              Gửi duyệt
            </button>
          )}

          {/* Approve Action */}
          {report.status === 'IN_REVIEW' && canApprove && (
            <button
              onClick={() => void handleStatusChange('approve')}
              disabled={isSubmittingAction}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-650 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" />
              Duyệt báo cáo
            </button>
          )}

          {/* Send Action */}
          {report.status === 'APPROVED' && canSend && (
            <button
              onClick={() => void handleStatusChange('mark-sent')}
              disabled={isSubmittingAction}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-650 hover:bg-sky-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer"
            >
              <Mail className="h-4 w-4" />
              Đánh dấu đã gửi
            </button>
          )}

          {/* Return to Project page */}
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-350 hover:text-white transition"
          >
            Về trang dự án
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 p-4 text-sm text-emerald-200">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-450" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-950/50 border border-red-800/60 p-4 text-sm text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor Tabs Navigation */}
      <div className="border-b border-slate-850/80 overflow-x-auto flex gap-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'general'
              ? 'border-blue-500 text-blue-450'
              : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <FileText className="h-4 w-4" />
          Thông tin chung
        </button>

        <button
          onClick={() => setActiveTab('weather')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'weather'
              ? 'border-blue-500 text-blue-450'
              : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <CloudSun className="h-4 w-4" />
          Thời tiết
        </button>

        <button
          onClick={() => setActiveTab('manpower')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'manpower'
              ? 'border-blue-500 text-blue-450'
              : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          Nhân lực
        </button>

        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'equipment'
              ? 'border-blue-500 text-blue-450'
              : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <Wrench className="h-4 w-4" />
          Thiết bị
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'materials'
              ? 'border-blue-500 text-blue-450'
              : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <Package className="h-4 w-4" />
          Vật liệu
        </button>

        <button
          onClick={() => setActiveTab('workitems')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'workitems'
              ? 'border-blue-500 text-blue-450'
              : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          Khối lượng thi công
        </button>

        <button
          onClick={() => setActiveTab('images')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'images'
              ? 'border-blue-500 text-blue-450'
              : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          Hình ảnh
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'history'
              ? 'border-blue-500 text-blue-450'
              : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <History className="h-4 w-4" />
          Lịch sử
        </button>
      </div>

      {/* Tabs Content */}
      <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-6 shadow-md min-h-[400px]">
        {/* Tab 1: General Info Form */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {isFinalized && (
              <div className="flex items-start gap-3 rounded-lg bg-yellow-950/40 border border-yellow-800/40 p-4 text-sm text-yellow-200">
                <Lock className="h-5 w-5 shrink-0 text-yellow-450" />
                <span>
                  Báo cáo này đã được <strong>{report.status === 'APPROVED' ? 'duyệt' : 'gửi'}</strong> và bị khóa chỉnh sửa trực tiếp. Để cập nhật dữ liệu, vui lòng thực hiện &quot;Tạo bản điều chỉnh&quot; ở các Phase sau.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSaveMetadata)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side: General metadata edit form */}
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Thông tin Báo cáo
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-350">Số báo cáo *</label>
                      <input
                        type="text"
                        disabled={isFinalized || !canEdit}
                        {...register('reportNo')}
                        className={`mt-2 block w-full rounded-lg bg-slate-950/80 border ${
                          errors.reportNo ? 'border-red-500' : 'border-slate-800'
                        } py-2.5 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-550/20 focus:border-blue-550 disabled:opacity-50 disabled:cursor-not-allowed transition`}
                      />
                      {errors.reportNo && (
                        <p className="mt-1 text-xs text-red-400 font-medium">{errors.reportNo.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-350">Ngày báo cáo (Không thể sửa)</label>
                      <input
                        type="text"
                        disabled
                        value={new Date(report.reportDate).toLocaleDateString('vi-VN', { timeZone: 'UTC' })}
                        className="mt-2 block w-full rounded-lg bg-slate-950/40 border border-slate-850 py-2.5 px-3 text-slate-500 cursor-not-allowed font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-350">Tiêu đề báo cáo *</label>
                      <input
                        type="text"
                        disabled={isFinalized || !canEdit}
                        {...register('title')}
                        className={`mt-2 block w-full rounded-lg bg-slate-950/80 border ${
                          errors.title ? 'border-red-500' : 'border-slate-800'
                        } py-2.5 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-550/20 focus:border-blue-550 disabled:opacity-50 disabled:cursor-not-allowed transition`}
                      />
                      {errors.title && (
                        <p className="mt-1 text-xs text-red-400 font-medium">{errors.title.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-350">Ngày phát hành</label>
                      <input
                        type="date"
                        disabled={isFinalized || !canEdit}
                        {...register('issueDate')}
                        className="mt-2 block w-full rounded-lg bg-slate-950/80 border border-slate-800 py-2.5 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-550/20 focus:border-blue-550 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-350">Loại báo cáo</label>
                      <input
                        type="text"
                        disabled
                        value={getReportTypeLabel(report.reportType)}
                        className="mt-2 block w-full rounded-lg bg-slate-950/40 border border-slate-850 py-2.5 px-3 text-slate-500 cursor-not-allowed font-medium"
                      />
                    </div>
                  </div>
                </div>

                {!isFinalized && canEdit && (
                  <div className="pt-4 border-t border-slate-850 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingAction || !isDirty}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer shadow-md hover:shadow-blue-500/10"
                    >
                      <Save className="h-4 w-4" />
                      Lưu thay đổi
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side: Project defaults (Read-only for report reference) */}
              <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-5 space-y-5 h-fit text-sm">
                <h3 className="font-bold text-white tracking-tight border-b border-slate-850 pb-2.5 flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-550" />
                  Mặc định từ dự án
                </h3>

                <div className="space-y-3.5 leading-relaxed text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-3xs">Chủ đầu tư (ĐD)</span>
                    <p className="text-slate-200 font-semibold">{report.project.ownerName || '---'}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-3xs">Tư vấn giám sát</span>
                    <p className="text-slate-200 font-semibold">{report.project.supervisorName || '---'}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-3xs">Nhà thầu chính</span>
                    <p className="text-slate-200 font-semibold">{report.project.contractorName || '---'}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-3xs">Địa điểm thi công</span>
                    <div className="flex items-center gap-1 text-slate-200 font-semibold">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>{report.project.location || '---'}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-3xs">Người lập báo cáo mặc định</span>
                    <div className="flex items-center gap-1 text-slate-200 font-semibold">
                      <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>{report.project.defaultReporterName || '---'}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-3xs">Nơi nhận mặc định</span>
                    <p className="text-slate-200 font-semibold">{report.project.defaultReceiver || '---'}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-3xs">Cc mặc định</span>
                    <p className="text-slate-200 font-semibold">{report.project.defaultCc || '---'}</p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Weather Placeholder */}
        {activeTab === 'weather' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CloudSun className="h-12 w-12 text-slate-700 mb-3" />
            <h3 className="text-base font-semibold text-slate-350">Dữ liệu Thời tiết</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm">
              Tính năng nhập dữ liệu thời tiết (Sáng, Chiều, Tối) sẽ khả dụng trong **Phase 4: Weather, Manpower, Equipment, Materials**.
            </p>
          </div>
        )}

        {/* Tab 3: Manpower Placeholder */}
        {activeTab === 'manpower' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-slate-700 mb-3" />
            <h3 className="text-base font-semibold text-slate-350">Bảng Nhân lực công trường</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm">
              Tính năng nhập và tính lũy kế nhân sự sẽ khả dụng trong **Phase 4: Weather, Manpower, Equipment, Materials**.
            </p>
          </div>
        )}

        {/* Tab 4: Equipment Placeholder */}
        {activeTab === 'equipment' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Wrench className="h-12 w-12 text-slate-700 mb-3" />
            <h3 className="text-base font-semibold text-slate-350">Bảng Thiết bị thi công</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm">
              Tính năng khai báo thiết bị hoạt động/hỏng hóc sẽ khả dụng trong **Phase 4: Weather, Manpower, Equipment, Materials**.
            </p>
          </div>
        )}

        {/* Tab 5: Materials Placeholder */}
        {activeTab === 'materials' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-slate-700 mb-3" />
            <h3 className="text-base font-semibold text-slate-350">Bảng Vật liệu chính nhập kho</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm">
              Tính năng nhập vật liệu thi công chính sẽ khả dụng trong **Phase 4: Weather, Manpower, Equipment, Materials**.
            </p>
          </div>
        )}

        {/* Tab 6: Work Items Grid Placeholder */}
        {activeTab === 'workitems' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Layers className="h-12 w-12 text-slate-700 mb-3" />
            <h3 className="text-base font-semibold text-slate-350">Khối lượng hạng mục thi công (Excel-like Grid)</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-md">
              Tính năng nhập bảng khối lượng dạng cây phân cấp, tự động tính lũy kế và phần trăm hoàn thành, copy/paste trực tiếp từ Excel sẽ khả dụng trong **Phase 5: Work Item Excel-like Grid**.
            </p>
          </div>
        )}

        {/* Tab 7: Images Placeholder */}
        {activeTab === 'images' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ImageIcon className="h-12 w-12 text-slate-700 mb-3" />
            <h3 className="text-base font-semibold text-slate-350">Hình ảnh thi công & Sơ họa</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm">
              Tính năng tải lên, resize ảnh, ghi chú thích và sắp xếp thứ tự ảnh hiển thị sẽ khả dụng trong **Phase 6: Image Management**.
            </p>
          </div>
        )}

        {/* Tab 8: Audit History Placeholder */}
        {activeTab === 'history' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <History className="h-12 w-12 text-slate-700 mb-3" />
            <h3 className="text-base font-semibold text-slate-350">Lịch sử Chỉnh sửa & Phiên bản</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-md">
              Tính năng so sánh sự khác biệt giữa các phiên bản, quản lý version điều chỉnh và ghi audit log chi tiết đến cấp độ ô sẽ khả dụng trong **Phase 10: Versioning + Audit Log nâng cao**.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
