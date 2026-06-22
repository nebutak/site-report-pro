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
  FileBarChart,
  Activity,
  TrendingUp
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
    { name: 'Tổng số dự án', value: String(stats.totalProjects), icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/5' },
    { name: 'Báo cáo đã tạo', value: String(stats.totalReports), icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'shadow-emerald-500/5' },
    { name: 'Thành viên hệ thống', value: '5', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10', glow: 'shadow-indigo-500/5' },
    { name: 'Chờ phê duyệt', value: String(stats.pendingApproval), icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', glow: 'shadow-amber-500/5' },
  ];

  const quickActions = [
    {
      title: 'Tạo báo cáo ngày',
      desc: 'Lập báo cáo thi công mới cho dự án đang triển khai.',
      href: '/dashboard/projects',
      icon: PlusCircle,
      gradient: 'from-blue-500/10 to-indigo-500/10',
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
      gradient: 'from-purple-500/10 to-indigo-500/10',
      iconColor: 'text-purple-400',
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

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800/60 p-8 shadow-xl relative overflow-hidden animate-fade-in-up animate-border-glow">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-indigo-600/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-4 right-4 flex gap-1.5 opacity-20">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          ))}
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium uppercase tracking-wider">
            <Activity className="h-3.5 w-3.5" />
            Dashboard Overview
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Xin chào, <span className="gradient-text-primary">{user?.name}</span>!
          </h1>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
            Chào mừng bạn đến với hệ thống quản lý báo cáo công trường <strong className="text-slate-300">SiteReport Pro</strong>. 
            Vai trò của bạn là <strong className="text-blue-400">{getRoleLabel(user?.role || '')}</strong>. 
            Bắt đầu ngày làm việc bằng cách tạo báo cáo mới hoặc kiểm tra tiến độ dự án.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className={`surface-raised rounded-xl p-5 flex items-center justify-between hover:-translate-y-1 transition-all duration-300 hover:shadow-lg ${stat.glow} animate-fade-in-up stagger-${idx + 1}`}
            >
              <div className="space-y-1">
                <p className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">{stat.name}</p>
                <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
              </div>
              <div className={`p-3.5 rounded-xl ${stat.bg} ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activities */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Quick Actions Panel */}
        <div className="lg:col-span-2 space-y-5">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Tác vụ nhanh
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.title}
                  className={`group glass-card glass-card-hover rounded-xl p-5 flex flex-col justify-between transition-all duration-300 animate-fade-in-up stagger-${idx + 1}`}
                >
                  <div className="space-y-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} ${action.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors duration-200">
                      {action.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{action.desc}</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-800/40">
                    <Link
                      href={action.href}
                      className="inline-flex items-center text-xs font-bold text-blue-400 group-hover:text-blue-300 gap-1.5 transition"
                    >
                      {action.btnText}
                      <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activities panel */}
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-white tracking-tight">Hoạt động gần đây</h2>
          <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[260px]">
            <div className="relative mb-4">
              <FileBarChart className="h-10 w-10 text-slate-700" />
              <div className="absolute inset-0 bg-slate-700/10 blur-xl rounded-full" />
            </div>
            <p className="text-sm font-semibold text-slate-400">Không có hoạt động nào</p>
            <p className="text-xs text-slate-600 mt-1.5 max-w-[200px] leading-relaxed">
              Lịch sử thao tác báo cáo sẽ hiển thị tại đây khi bạn bắt đầu làm việc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
