'use client';

import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { 
  User, 
  Shield, 
  Globe, 
  Settings, 
  Save, 
  CheckCircle,
  Clock,
  Check,
  X,
  Mail,
  Activity
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  
  // Settings states
  const [lang, setLang] = useState('vi');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'PROJECT_MANAGER':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'REPORTER':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'REVIEWER':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'PROJECT_MANAGER':
        return 'Quản lý dự án';
      case 'REPORTER':
        return 'Người lập báo cáo';
      case 'REVIEWER':
        return 'Người kiểm duyệt';
      default:
        return 'Người xem';
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    }, 800);
  };

  const systemRoles = [
    {
      name: 'ADMIN',
      label: 'Quản trị viên',
      desc: 'Toàn quyền cấu hình hệ thống, quản lý tài khoản, phân quyền và giám sát toàn bộ dự án.',
      capabilities: ['Quản lý dự án', 'Quản lý tài khoản & vai trò', 'Tạo/Duyệt mọi báo cáo', 'Cấu hình hệ thống']
    },
    {
      name: 'PROJECT_MANAGER',
      label: 'Quản lý dự án',
      desc: 'Quản lý thông tin dự án, phê duyệt báo cáo thi công và quản lý thành viên trong các dự án được giao.',
      capabilities: ['Quản lý chi tiết dự án', 'Phê duyệt/Từ chối báo cáo', 'Tạo bản điều chỉnh báo cáo', 'Xem nhật ký thay đổi']
    },
    {
      name: 'REPORTER',
      label: 'Người lập báo cáo',
      desc: 'Lập báo cáo thi công hàng ngày, chỉnh sửa báo cáo nháp và cập nhật số liệu tiến độ thực tế.',
      capabilities: ['Tạo mới báo cáo ngày', 'Chỉnh sửa báo cáo nháp', 'Xem báo cáo dự án được phân công']
    },
    {
      name: 'REVIEWER',
      label: 'Người kiểm duyệt',
      desc: 'Xem chi tiết các báo cáo thi công, đưa ra ý kiến phản hồi và thực hiện phê duyệt/từ chối báo cáo.',
      capabilities: ['Phê duyệt/Từ chối báo cáo', 'Nhận xét báo cáo', 'Xem báo cáo dự án']
    },
    {
      name: 'VIEWER',
      label: 'Người xem',
      desc: 'Chỉ xem báo cáo và tiến độ dự án mà không có quyền chỉnh sửa hay phê duyệt dữ liệu.',
      capabilities: ['Xem báo cáo thi công', 'Xem biểu đồ tiến độ', 'Không có quyền thay đổi dữ liệu']
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/50 pb-6 animate-fade-in">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
              <Settings className="h-5 w-5 text-blue-400" />
            </div>
            Cấu hình hệ thống
          </h1>
          <p className="text-slate-500 text-sm">
            Quản lý thông tin tài khoản cá nhân, tùy chỉnh ngôn ngữ, định dạng và tham khảo phân quyền hệ thống.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Forms & Profile */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Saved Notification */}
          {isSaved && (
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl animate-fade-in-down">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <div className="text-sm font-medium">
                Cập nhật cấu hình hệ thống thành công! Các thay đổi đã được áp dụng.
              </div>
              <button 
                onClick={() => setIsSaved(false)}
                className="ml-auto p-1 hover:bg-emerald-500/20 rounded-lg transition text-emerald-400 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* User Profile Card */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden animate-fade-in-up stagger-1">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800/40 pb-3">
              <User className="h-4.5 w-4.5 text-blue-400" />
              Thông tin tài khoản cá nhân
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3 sm:pr-6 sm:border-r sm:border-slate-800/40">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-white text-2xl font-bold shadow-xl shadow-blue-600/15">
                  {getInitials(user?.name || '')}
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-emerald-400" />
                  <span className="text-2xs text-emerald-400 font-semibold">Online</span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <span className="text-2xs text-slate-600 font-semibold uppercase tracking-wider">Họ và tên</span>
                  <p className="text-sm font-medium text-white">{user?.name || 'Chưa cập nhật'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-2xs text-slate-600 font-semibold uppercase tracking-wider">Địa chỉ Email</span>
                  <p className="text-sm font-medium text-white flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    {user?.email || 'Chưa cập nhật'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-2xs text-slate-600 font-semibold uppercase tracking-wider">Vai trò hệ thống</span>
                  <div className="pt-0.5">
                    <span className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-bold border ${getRoleColor(user?.role || '')}`}>
                      {getRoleLabel(user?.role || '')} ({user?.role})
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-2xs text-slate-600 font-semibold uppercase tracking-wider">Trạng thái</span>
                  <div className="pt-0.5">
                    <span className="inline-block rounded-lg px-2.5 py-0.5 text-xs font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Đang hoạt động
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Settings Form */}
          <form onSubmit={handleSave} className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-2">
            <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800/40 pb-3">
              <Globe className="h-4.5 w-4.5 text-blue-400" />
              Tùy chỉnh hệ thống
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Language Select */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Ngôn ngữ hiển thị</label>
                  <select 
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800/60 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                  >
                    <option value="vi">Tiếng Việt (vi-VN)</option>
                    <option value="en">English (en-US)</option>
                  </select>
                </div>

                {/* Timezone Select */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Múi giờ hệ thống</label>
                  <select 
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800/60 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                  >
                    <option value="Asia/Ho_Chi_Minh">Hà Nội (GMT+7)</option>
                    <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                    <option value="America/New_York">New York (GMT-5)</option>
                  </select>
                </div>

                {/* Date Format Select */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Định dạng ngày tháng</label>
                  <select 
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800/60 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Ví dụ: 22/06/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (Ví dụ: 2026-06-22)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (Ví dụ: 06/22/2026)</option>
                  </select>
                </div>

                {/* Interface Theme (Read-Only Mock) */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Giao diện (Theme)</label>
                  <div className="w-full bg-slate-950/80 border border-slate-800/60 rounded-xl px-4 py-2.5 text-sm text-slate-500 flex items-center justify-between">
                    <span>Chế độ tối (Dark Slate Mode)</span>
                    <span className="text-2xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg px-2 py-0.5 font-bold uppercase">Mặc định</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 border-t border-slate-800/40">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 active:scale-[0.98]"
                >
                  {loading ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Lưu cấu hình
                </button>
              </div>
            </div>
          </form>

        </div>

        {/* Right Column - Roles & Permissions Reference */}
        <div className="space-y-8">
          
          {/* Roles & Permissions Card */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-3">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-blue-400" />
              Danh mục vai trò & phân quyền
            </h2>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Cơ chế phân quyền dựa trên vai trò (RBAC) được cấu hình cố định trong hệ thống để bảo mật dữ liệu.
            </p>

            <div className="space-y-4">
              {systemRoles.map((role) => (
                <div 
                  key={role.name}
                  className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/40 hover:border-slate-700/60 hover:bg-slate-950/60 transition-all duration-300 space-y-2.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className={`inline-block rounded-lg px-2 py-0.5 text-2xs font-bold border ${getRoleColor(role.name)}`}>
                      {role.label}
                    </span>
                    <span className="text-3xs font-mono text-slate-700 group-hover:text-slate-600 transition-colors">{role.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {role.desc}
                  </p>
                  <div className="pt-2 border-t border-slate-900/40 space-y-1.5">
                    {role.capabilities.map((cap, index) => (
                      <div key={index} className="flex items-start gap-1.5 text-3xs text-slate-600">
                        <Check className="h-3.5 w-3.5 text-emerald-500/70 flex-shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
