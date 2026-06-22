'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/features/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, AlertCircle, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email không được để trống' })
    .email({ message: 'Email không hợp lệ' }),
  password: z
    .string()
    .min(1, { message: 'Mật khẩu không được để trống' })
    .min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Không thể đăng nhập. Vui lòng kiểm tra lại kết nối.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-900/10 blur-[120px]" />

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-indigo-500/20">
            <KeyRound className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
            SiteReport <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Pro</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Hệ thống quản lý báo cáo giám sát thi công
          </p>
        </div>

        {/* Card wrapper with glassmorphism styling */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-950/50 border border-red-800/60 p-4 text-sm text-red-200">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Địa chỉ email
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`block w-full rounded-lg bg-slate-950/80 border ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-blue-500 focus:border-blue-500'
                  } py-3 pl-10 pr-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 transition duration-200`}
                  placeholder="admin@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-400 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Mật khẩu
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <KeyRound className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className={`block w-full rounded-lg bg-slate-950/80 border ${
                    errors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-blue-500 focus:border-blue-500'
                  } py-3 pl-10 pr-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 transition duration-200`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex w-full justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-3 px-4 text-sm font-semibold text-white hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} SiteReport Pro. Toàn bộ bản quyền được bảo lưu.
        </div>
      </div>
    </div>
  );
}
