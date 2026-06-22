'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  Settings, 
  LogOut, 
  Loader2, 
  Menu,
  X,
  Shield,
  Bell,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <div className="absolute inset-0 h-10 w-10 rounded-full bg-blue-500/20 blur-xl" />
          </div>
          <p className="text-slate-400 text-sm">Đang tải thông tin xác thực...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Dự án', href: '/dashboard/projects', icon: Briefcase },
    { name: 'Cài đặt', href: '/dashboard/settings', icon: Settings },
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

  // Generate user initials for avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate breadcrumbs from pathname
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const crumbs: { name: string; href: string }[] = [];
    
    const labelMap: Record<string, string> = {
      'dashboard': 'Tổng quan',
      'projects': 'Dự án',
      'settings': 'Cài đặt',
      'new': 'Thêm mới',
      'edit': 'Chỉnh sửa',
      'reports': 'Báo cáo',
    };

    let currentPath = '';
    for (const seg of segments) {
      currentPath += `/${seg}`;
      const label = labelMap[seg] || (seg.match(/^\d+$/) ? `#${seg}` : seg);
      crumbs.push({ name: label, href: currentPath });
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Sidebar content (shared between desktop and mobile)
  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex h-16 items-center px-6 border-b border-slate-800/60">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-xl text-white group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/20 group-hover:shadow-blue-600/40 transition-shadow duration-300">
            <Shield className="h-5 w-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="tracking-tight">SiteReport <span className="gradient-text-primary">Pro</span></span>
        </Link>
      </div>

      {/* User Info Card */}
      <div className="p-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-blue-600/15 flex-shrink-0">
            {getInitials(user.name)}
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
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-lg shadow-blue-600/15'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]" />
              )}
              <Icon className={`mr-3 h-[18px] w-[18px] transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
              }`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Logout */}
      <div className="p-3 border-t border-slate-800/60">
        <button
          onClick={logout}
          className="flex w-full items-center px-3 py-2.5 text-sm font-medium text-red-400/80 rounded-xl hover:bg-red-950/30 hover:text-red-300 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="mr-3 h-[18px] w-[18px]" />
          Đăng xuất
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/60 transform transition-transform duration-300 ease-out md:hidden ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Close button */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition z-10 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/60">
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header / Topbar */}
        <header className="flex h-14 items-center justify-between px-4 md:px-6 bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 z-10">
          {/* Left: Mobile menu + Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumbs (desktop) */}
            <nav className="hidden md:flex items-center gap-1 text-xs text-slate-500">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.href}>
                  {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-700 mx-0.5" />}
                  {idx === breadcrumbs.length - 1 ? (
                    <span className="text-slate-300 font-medium">{crumb.name}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-slate-300 transition">
                      {crumb.name}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer">
              <Bell className="h-[18px] w-[18px]" />
            </button>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            {/* User mini badge */}
            <div className="hidden sm:flex items-center gap-2 pl-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xs font-bold">
                {getInitials(user.name)}
              </div>
              <span className="text-xs text-slate-400 font-medium">{user.name.split(' ')[0]}</span>
            </div>

            {/* Logout (desktop) */}
            <button
              onClick={logout}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-400/80 rounded-lg hover:bg-red-950/30 hover:text-red-300 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* Main Content Wrapper */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-5 md:p-8">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
