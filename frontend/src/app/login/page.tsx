'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/features/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, AlertCircle, Loader2, Shield } from 'lucide-react';

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

  // Floating particles data
  const particles = [
    { size: 6, x: '10%', y: '20%', delay: '0s', duration: '7s' },
    { size: 5, x: '80%', y: '15%', delay: '1s', duration: '8s' },
    { size: 8, x: '25%', y: '70%', delay: '2s', duration: '6s' },
    { size: 5, x: '65%', y: '80%', delay: '0.5s', duration: '9s' },
    { size: 7, x: '90%', y: '50%', delay: '1.5s', duration: '7s' },
    { size: 10, x: '45%', y: '10%', delay: '3s', duration: '8s' },
    { size: 4, x: '15%', y: '85%', delay: '2.5s', duration: '6s' },
    { size: 6, x: '70%', y: '40%', delay: '0.8s', duration: '9s' },
    { size: 8, x: '35%', y: '55%', delay: '1.2s', duration: '7s' },
    { size: 5, x: '55%', y: '90%', delay: '2.8s', duration: '8s' },
    { size: 3, x: '5%', y: '45%', delay: '0.3s', duration: '10s' },
    { size: 7, x: '92%', y: '25%', delay: '1.8s', duration: '7.5s' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />

      {/* Gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-900/8 blur-[150px] animate-float" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/8 blur-[150px] animate-float" style={{ animationDelay: '3s' }} />
      <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-purple-900/5 blur-[120px]" />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-blue-400/10 animate-float"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: p.x,
            top: p.y,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}

      <div className="w-full max-w-md space-y-8 z-10 animate-fade-in-up">
        <div className="text-center">
          <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-2xl bg-blue-600 shadow-2xl shadow-blue-600/20 relative group cursor-default">
            <Shield className="h-9 w-9 text-white relative z-10" />
            <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -inset-1 rounded-2xl bg-blue-500 opacity-15 blur-md group-hover:opacity-25 transition-opacity duration-500" />
          </div>
          <h2 className="mt-7 text-3xl font-extrabold tracking-tight text-heading">
            SiteReport <span className="text-blue-500">Pro</span>
          </h2>
          <p className="mt-2 text-sm text-muted">
            Hệ thống quản lý báo cáo giám sát thi công
          </p>
        </div>

        {/* Card wrapper with enhanced glassmorphism */}
        <div className="glass-card rounded-2xl p-8" style={{ boxShadow: '0 25px 50px -12px var(--shadow-tint), 0 0 0 1px rgba(148, 163, 184, 0.06)' }}>
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-950/50 border border-red-800/40 p-4 text-sm text-red-200 animate-fade-in-down">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-body">
                Địa chỉ email
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-4.5 w-4.5 text-dim" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`block w-full rounded-xl bg-input-bg border ${
                    errors.email ? 'border-red-500/60 focus:ring-red-500/20' : 'border-border-input focus:ring-blue-500/20 focus:border-blue-500/50'
                  } py-3 pl-11 pr-4 text-foreground placeholder-dim focus:outline-none focus:ring-2 transition-all duration-200`}
                  placeholder="admin@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-body">
                Mật khẩu
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <KeyRound className="h-4.5 w-4.5 text-dim" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className={`block w-full rounded-xl bg-input-bg border ${
                    errors.password ? 'border-red-500/60 focus:ring-red-500/20' : 'border-border-input focus:ring-blue-500/20 focus:border-blue-500/50'
                  } py-3 pl-11 pr-4 text-foreground placeholder-dim focus:outline-none focus:ring-2 transition-all duration-200`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex w-full justify-center rounded-xl bg-blue-600 py-3 px-4 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-600/15 active:scale-[0.98] cursor-pointer overflow-hidden"
              >
                {/* Shimmer sweep effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
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

          {/* Forgot password link */}
          <div className="mt-5 text-center">
            <button className="text-xs text-dim hover:text-blue-400 transition-colors cursor-pointer">
              Quên mật khẩu?
            </button>
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs text-dim">
            &copy; {new Date().getFullYear()} SiteReport Pro. Toàn bộ bản quyền được bảo lưu.
          </p>
          <p className="text-[10px] text-dim font-mono">v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
