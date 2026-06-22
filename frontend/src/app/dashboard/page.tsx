'use client';

import React from 'react';
import { useAuth } from '@/features/auth/AuthContext';
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

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { name: 'Tổng số dự án', value: '1', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Báo cáo đã tạo', value: '0', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Thành viên hệ thống', value: '5', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { name: 'Chờ phê duyệt', value: '0', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const quickActions = [
    {
      title: 'Tạo báo cáo ngày',
      desc: 'Lập báo cáo thi công mới cho dự án đang triển khai.',
      href: '/dashboard/projects',
      icon: PlusCircle,
      btnText: 'Tạo mới',
    },
    {
      title: 'Danh sách dự án',
      desc: 'Quản lý thông tin, logo, đại diện chủ đầu tư và tư vấn giám sát.',
      href: '/dashboard/projects',
      icon: Briefcase,
      btnText: 'Xem danh sách',
    },
    {
      title: 'Cấu hình hệ thống',
      desc: 'Thay đổi cài đặt ngôn ngữ, cấu hình và phân quyền người dùng.',
      href: '/dashboard/settings',
      icon: SettingsIcon,
      btnText: 'Thiết lập',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/60 to-slate-950 border border-slate-800 p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Xin chào, <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{user?.name}</span>!
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Chào mừng bạn đến với hệ thống quản lý báo cáo công trường **SiteReport Pro**. Vai trò của bạn là **{user?.role}**. Bắt đầu ngày làm việc bằng cách tạo báo cáo mới hoặc kiểm tra tiến độ dự án.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 flex items-center justify-between shadow-md hover:border-slate-700 transition"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.name}</p>
                <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
              </div>
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activities */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Quick Actions Panel */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-blue-500" />
            Phím tắt tác vụ nhanh
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.title}
                  className="group bg-slate-900/30 hover:bg-slate-900/50 border border-slate-900 hover:border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-sm transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 group-hover:bg-blue-600/10 text-slate-400 group-hover:text-blue-400 transition-colors duration-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-white text-base group-hover:text-blue-400 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{action.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-900">
                    <Link
                      href={action.href}
                      className="inline-flex items-center text-xs font-bold text-blue-400 group-hover:text-blue-300 gap-1.5 transition"
                    >
                      {action.btnText}
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info panel */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Hoạt động gần đây</h2>
          <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center h-[260px]">
            <FileText className="h-10 w-10 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-400">Không có hoạt động nào</p>
            <p className="text-xs text-slate-500 mt-1">Lịch sử thao tác báo cáo sẽ hiển thị tại đây.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
