'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  Settings, 
  LogOut, 
  Loader2, 
  Menu,
  User as UserIcon,
  Shield
} from 'lucide-react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-slate-400 text-sm">Đang tải thông tin xác thực...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      name: 'Tổng quan',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Dự án',
      href: '/dashboard/projects',
      icon: Briefcase,
    },
    {
      name: 'Cài đặt',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  // Helper to colorize role badge
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

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-slate-900 border-r border-slate-800">
        {/* Brand */}
        <div className="flex h-16 items-center px-6 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Shield className="h-5 w-5" />
            </div>
            <span>SiteReport <span className="text-blue-500">Pro</span></span>
          </Link>
        </div>

        {/* User Info Card */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 border border-slate-700">
              <UserIcon className="h-5 w-5 text-slate-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <span className={`inline-block mt-0.5 rounded px-2 py-0.5 text-2xs font-bold border ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex w-full items-center px-3 py-2.5 text-sm font-medium text-red-400 rounded-lg hover:bg-red-950/20 hover:text-red-300 transition duration-150"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Mobile & Top bar */}
        <header className="flex h-16 items-center justify-between px-6 bg-slate-900 border-b border-slate-800 md:justify-end">
          <button className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 text-slate-400">
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 hidden sm:inline-block">
              Hệ thống giám sát xây dựng
            </span>
            <div className="h-4 w-px bg-slate-800 hidden sm:inline-block" />
            <button
              onClick={logout}
              className="md:flex hidden items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-500/10 rounded-lg hover:bg-red-950/20 hover:text-red-300 transition"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Main Content Wrapper */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
