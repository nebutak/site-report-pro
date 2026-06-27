'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/features/theme/ThemeContext';
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
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <div className="absolute inset-0 h-10 w-10 rounded-full bg-blue-500/20 blur-xl" />
          </div>
          <p className="text-muted text-sm">Đang tải thông tin xác thực...</p>
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
      <div className="flex h-[68px] items-center px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3 font-bold text-xl text-heading group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20 group-hover:shadow-blue-500/30 transition-all duration-200 group-hover:scale-105">
            <Shield className="h-5 w-5 text-white relative z-10" />
            <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="tracking-tight">SiteReport <span className="text-blue-500">Pro</span></span>
        </Link>
      </div>

      {/* User Info Card */}
      <div className="p-4 mx-3 mt-4 mb-2 rounded-xl bg-surface border border-border">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/15">
              {getInitials(user.name)}
            </div>
            <div className="absolute -inset-0.5 rounded-full bg-blue-400 opacity-20 blur-[2px]" />
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-heading truncate">{user.name}</p>
            <span className={`inline-block mt-1 rounded-md px-2 py-0.5 text-2xs font-bold border ${getRoleColor(user.role)}`}>
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-dim uppercase tracking-widest">Menu</p>
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
                  ? 'bg-blue-500/10 text-heading border border-blue-500/15 shadow-sm'
                  : 'text-muted hover:bg-surface-hover hover:text-heading border border-transparent'
              }`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]" />
              )}
              <div className={`mr-3 flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-surface text-dim group-hover:text-muted'
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              {item.name}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.5)]" />
              )}
            </Link>
          );
        })}
      </nav>


    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden text-body">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-border transform transition-transform duration-300 ease-out md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: `linear-gradient(to bottom, var(--sidebar-from), var(--sidebar-to))` }}
      >
        {/* Close button */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-heading hover:bg-surface-hover transition z-10 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex md:w-64 md:flex-col border-r border-border"
        style={{ background: `linear-gradient(to bottom, var(--sidebar-from), var(--sidebar-to))` }}
      >
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header / Topbar */}
        <header className="flex h-14 items-center justify-between px-4 md:px-6 bg-header-bg backdrop-blur-xl border-b border-border z-10">
          {/* Left: Mobile menu + Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-heading hover:bg-surface-hover transition cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumbs (desktop) */}
            <nav className="hidden md:flex items-center gap-1.5 text-xs text-muted">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.href}>
                  {idx > 0 && <ChevronRight className="h-3 w-3 text-dim" />}
                  {idx === breadcrumbs.length - 1 ? (
                    <span className="text-heading font-semibold bg-surface px-2 py-0.5 rounded-md">{crumb.name}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-heading transition-colors">
                      {crumb.name}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle (header) */}
            <button
              onClick={toggleTheme}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-heading hover:bg-surface-hover transition cursor-pointer"
              title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
            >
              {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>


            <div className="h-5 w-px bg-border hidden sm:block" />

            {/* User mini badge */}
            <div className="hidden sm:flex items-center gap-2.5 pl-1">
              <div className="relative">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-2xs font-bold ring-2 ring-background">
                  {getInitials(user.name)}
                </div>
                <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-background" />
              </div>
              <span className="text-xs text-body font-semibold">{user.name.split(' ')[0]}</span>
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
        <main className="flex-1 overflow-y-auto bg-background p-5 md:p-8">
          <div className="max-w-[1400px] mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
