'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { apiClient } from '@/lib/api-client';
import { 
  Briefcase, 
  FileText, 
  Users, 
  Settings as SettingsIcon, 
  Clock, 
  ArrowRight,
  PlusCircle,
  FileBarChart
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalProjects: number;
  totalReports: number;
  totalUsers: number;
  pendingApproval: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalReports: 0,
    totalUsers: 0,
    pendingApproval: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch real project count
        const projects = await apiClient.get<{ id: number }[]>('/projects');
        setStats(prev => ({ ...prev, totalProjects: projects.length }));
      } catch {
        // Silently fail for dashboard stats
      }
    };
    void fetchStats();
  }, []);

  const statCards = [
    { name: 'Tổng số dự án', value: String(stats.totalProjects), icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/5', lightBg: 'stat-card-blue' },
    { name: 'Báo cáo đã tạo', value: String(stats.totalReports), icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'shadow-emerald-500/5', lightBg: 'stat-card-emerald' },
    { name: 'Thành viên hệ thống', value: '5', icon: Users, color: 'text-slate-400', bg: 'bg-slate-500/10', glow: 'shadow-slate-500/5', lightBg: 'stat-card-purple' },
    { name: 'Chờ phê duyệt', value: String(stats.pendingApproval), icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', glow: 'shadow-amber-500/5', lightBg: 'stat-card-amber' },
  ];

  const quickActions = [
    {
      title: 'Tạo báo cáo ngày',
      desc: 'Lập báo cáo thi công mới cho dự án đang triển khai.',
      href: '/dashboard/projects',
      icon: PlusCircle,
      gradient: 'from-blue-500/10 to-blue-500/5',
      iconColor: 'text-blue-400',
      btnText: 'Tạo mới',
    },
    {
      title: 'Danh sách dự án',
      desc: 'Quản lý thông tin, logo, đại diện chủ đầu tư và tư vấn giám sát.',
      href: '/dashboard/projects',
      icon: Briefcase,
      gradient: 'from-emerald-500/10 to-teal-500/10',
      iconColor: 'text-emerald-400',
      btnText: 'Xem danh sách',
    },
    {
      title: 'Cấu hình hệ thống',
      desc: 'Thay đổi cài đặt ngôn ngữ, cấu hình và phân quyền người dùng.',
      href: '/dashboard/settings',
      icon: SettingsIcon,
      gradient: 'from-slate-500/10 to-slate-500/5',
      iconColor: 'text-slate-400',
      btnText: 'Thiết lập',
    },
  ];

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên';
      case 'PROJECT_MANAGER': return 'Quản lý dự án';
      case 'REPORTER': return 'Người lập báo cáo';
      case 'REVIEWER': return 'Người kiểm duyệt';
      default: return 'Người xem';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="welcome-banner rounded-2xl p-8 md:p-10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/[0.07] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/[0.05] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-sky-400/[0.04] rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Đang trực tuyến
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {getGreeting()}, <span className="text-blue-400">{user?.name}</span> 👋
            </h1>
            <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
              Vai trò <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-semibold text-xs border border-blue-500/15">{getRoleLabel(user?.role || '')}</span> — quản lý báo cáo công trường và tiến độ dự án.
            </p>
          </div>
          <Link
            href="/dashboard/projects"
            className="group relative inline-flex items-center gap-2.5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 shrink-0 overflow-hidden"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <PlusCircle className="h-4.5 w-4.5 relative z-10" />
            <span className="relative z-10">Tạo báo cáo mới</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className={`surface-raised card-interactive rounded-xl p-5 flex items-center justify-between hover:shadow-lg ${stat.glow} ${stat.lightBg}`}
            >
              <div className="space-y-1.5">
                <p className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">{stat.name}</p>
                <p className="text-3xl font-bold text-white tracking-tight tabular-nums">{stat.value === '0' ? '—' : stat.value}</p>
              </div>
              <div className={`p-3.5 rounded-xl ${stat.bg} ${stat.color} ring-1 ring-inset ring-white/5`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activities */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Quick Actions — compact row */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Truy cập nhanh</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group flex items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/40 hover:border-slate-700/60 hover:bg-slate-900/80 transition-all duration-200"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.iconColor} bg-slate-800/60 ring-1 ring-inset ring-white/5 group-hover:ring-blue-500/10 transition-all`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{action.title}</p>
                    <p className="text-xs text-slate-600 truncate">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-700 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activities panel */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Hoạt động gần đây</h2>
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/40 p-6 flex flex-col items-center justify-center text-center min-h-[240px]">
            <FileBarChart className="h-8 w-8 text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-400">Chưa có hoạt động</p>
            <p className="text-xs text-slate-600 mt-1 max-w-[220px]">
              Báo cáo và thao tác sẽ hiển thị tại đây.
            </p>
            <Link
              href="/dashboard/projects"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Đi đến Dự án
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
