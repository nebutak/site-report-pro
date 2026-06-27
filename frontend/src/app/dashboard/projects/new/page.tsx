'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/features/auth/AuthContext';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Building, 
  Upload, 
  Loader2, 
  FileText,
  AlertCircle,
  X
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const projectSchema = z.object({
  name: z.string().min(1, { message: 'Tên dự án không được để trống' }),
  code: z
    .string()
    .min(1, { message: 'Mã dự án không được để trống' })
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: 'Mã dự án chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới',
    })
    .transform((val) => val.toUpperCase()),
  ownerName: z.string().optional(),
  supervisorName: z.string().optional(),
  contractorName: z.string().optional(),
  location: z.string().optional(),
  defaultReporterName: z.string().optional(),
  defaultReceiver: z.string().optional(),
  defaultCc: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function NewProjectPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const canManage = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  useEffect(() => {
    if (!authLoading && !canManage) {
      router.push('/dashboard/projects');
    }
  }, [canManage, authLoading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      code: '',
      ownerName: '',
      supervisorName: '',
      contractorName: '',
      location: '',
      defaultReporterName: '',
      defaultReceiver: '',
      defaultCc: '',
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Kích thước ảnh logo không được vượt quá 2MB');
        return;
      }
      if (!file.type.match(/\/(jpg|jpeg|png)$/)) {
        setError('Định dạng ảnh không hợp lệ. Chỉ chấp nhận tệp JPG, JPEG, PNG');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const onSubmit = async (data: ProjectFormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      // 1. Create the project metadata
      const newProject = await apiClient.post<{ id: number }>('/projects', data);

      // 2. If a logo file was selected, upload it
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);

        const response = await fetch(`http://localhost:3001/api/projects/${newProject.id}/logo`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Đã tạo dự án nhưng không thể tải lên file logo.');
        }
      }

      router.push('/dashboard/projects');
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Không thể tạo dự án. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !canManage) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header and Back Button */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/projects"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Thêm dự án mới</h1>
          <p className="text-slate-500 text-sm mt-1">
            Khai báo thông tin chi tiết và thiết lập mặc định cho dự án công trình
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-950/50 border border-red-800/60 p-4 text-sm text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: General Fields */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-6 space-y-6">
            <h2 className="text-base font-bold text-white tracking-tight border-b border-slate-800/40 pb-3 flex items-center gap-2">
              <Building className="h-4.5 w-4.5 text-blue-400" />
              Thông tin chung
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300">Tên dự án *</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Ví dụ: Cảng tổng hợp Hòn Khoai"
                  className={`mt-2 block w-full rounded-xl bg-slate-950/80 border ${
                    errors.name ? 'border-red-500/60 focus:ring-red-500/20' : 'border-slate-800/60 focus:ring-blue-500/20 focus:border-blue-500/50'
                  } py-2.5 px-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 transition-all duration-200`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400 font-medium">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Mã dự án *</label>
                <input
                  type="text"
                  {...register('code')}
                  placeholder="Ví dụ: HONKHOAI"
                  className={`mt-2 block w-full rounded-xl bg-slate-950/80 border ${
                    errors.code ? 'border-red-500/60 focus:ring-red-500/20' : 'border-slate-800/60 focus:ring-blue-500/20 focus:border-blue-500/50'
                  } py-2.5 px-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 transition-all duration-200 uppercase`}
                />
                {errors.code && (
                  <p className="mt-1 text-xs text-red-400 font-medium">{errors.code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Đại diện Chủ đầu tư</label>
                <input
                  type="text"
                  {...register('ownerName')}
                  placeholder="Ví dụ: Quân chủng Hải quân"
                  className="mt-2 block w-full rounded-xl bg-slate-950/80 border border-slate-800/60 py-2.5 px-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Tư vấn giám sát</label>
                <input
                  type="text"
                  {...register('supervisorName')}
                  placeholder="Ví dụ: Liên danh Công ty CP TVXD Hàng hải"
                  className="mt-2 block w-full rounded-xl bg-slate-950/80 border border-slate-800/60 py-2.5 px-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Nhà thầu chính</label>
                <input
                  type="text"
                  {...register('contractorName')}
                  placeholder="Ví dụ: Công ty TNHH ĐT XD Dacinco"
                  className="mt-2 block w-full rounded-xl bg-slate-950/80 border border-slate-800/60 py-2.5 px-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Địa điểm thi công</label>
                <input
                  type="text"
                  {...register('location')}
                  placeholder="Ví dụ: Xã Đất Mũi, Ngọc Hiển, Cà Mau"
                  className="mt-2 block w-full rounded-xl bg-slate-950/80 border border-slate-800/60 py-2.5 px-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Config fields */}
          <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-6 space-y-6">
            <h2 className="text-base font-bold text-white tracking-tight border-b border-slate-800/40 pb-3 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-blue-400" />
              Thiết lập Báo cáo mặc định
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300">Người lập báo cáo mặc định</label>
                <input
                  type="text"
                  {...register('defaultReporterName')}
                  placeholder="Ví dụ: Trần Mạnh Tuấn"
                  className="mt-2 block w-full rounded-xl bg-slate-950/80 border border-slate-800/60 py-2.5 px-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Đơn vị nhận báo cáo mặc định</label>
                <input
                  type="text"
                  {...register('defaultReceiver')}
                  placeholder="Ví dụ: Ban Lãnh đạo công ty"
                  className="mt-2 block w-full rounded-xl bg-slate-950/80 border border-slate-800/60 py-2.5 px-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300">CC mặc định (cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  {...register('defaultCc')}
                  placeholder="Ví dụ: Ban điều hành dự án, Phòng Kỹ thuật"
                  className="mt-2 block w-full rounded-xl bg-slate-950/80 border border-slate-800/60 py-2.5 px-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Logo Upload & Submit */}
        <div className="space-y-6">
          {/* Logo panel */}
          <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-6 space-y-4 flex flex-col items-center">
            <h2 className="text-sm font-bold text-white tracking-tight self-start border-b border-slate-800/40 pb-2 w-full">
              Logo dự án
            </h2>

            {logoPreview ? (
              <div className="relative w-full aspect-square max-w-[200px] border border-slate-800 rounded-xl overflow-hidden group bg-slate-950 flex items-center justify-center">
                <Image src={logoPreview} alt="Logo preview" fill className="object-contain p-2" />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-slate-900/80 hover:bg-red-650 text-slate-300 hover:text-white border border-slate-800 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="w-full aspect-square max-w-[200px] border-2 border-dashed border-slate-800 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center gap-3 p-4 cursor-pointer text-slate-500 hover:text-slate-300 bg-slate-950/40 transition">
                <Upload className="h-8 w-8 text-slate-600" />
                <span className="text-xs font-semibold text-center leading-relaxed">Kéo thả hoặc click để chọn ảnh Logo (Max 2MB)</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Submit Panel */}
          <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-6 space-y-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-4 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-blue-600/15 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang tạo dự án...
                </>
              ) : (
                'Tạo dự án'
              )}
            </button>

            <Link
              href="/dashboard/projects"
              className="w-full inline-flex items-center justify-center rounded-xl border border-slate-800/60 hover:bg-slate-800/40 py-3 px-4 text-sm font-semibold text-slate-400 hover:text-slate-200 active:scale-[0.98] transition-all duration-200"
            >
              Hủy bỏ
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
