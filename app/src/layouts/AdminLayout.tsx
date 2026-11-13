import { useState, type ReactNode } from 'react';
import { Outlet, Link, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../utils/helpers';
import { Menu, X, Bell, User, LogOut, ChevronLeft, ChevronRight, ChevronDown, Search, FileText, ClipboardList, Archive, Settings, Upload, Plus, Home, Clock, Shield, Users, BarChart2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { OpporaMark } from '../components/brand';
import { Button } from '../components/ui';
import { Avatar } from '../components/ui';
import { ToastContainer } from '../components/ui';

type SidebarItem = { label: string; href: string; icon: ReactNode; isLogout?: boolean };

const ADMIN_SIDEBAR_OVERVIEW: SidebarItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <Home className="w-5 h-5" /> },
  { label: 'All Notices', href: '/admin/notices', icon: <FileText className="w-5 h-5" /> },
  { label: 'Upload Notice', href: '/admin/notices/upload', icon: <Upload className="w-5 h-5" /> },
  { label: 'Review Queue', href: '/admin/review', icon: <ClipboardList className="w-5 h-5" /> },
] as const;

const ADMIN_SIDEBAR_MANAGEMENT: SidebarItem[] = [
  { label: 'Draft Notices', href: '/admin/notices?status=DRAFT', icon: <FileText className="w-5 h-5" /> },
  { label: 'Published Notices', href: '/admin/notices?status=PUBLISHED', icon: <Shield className="w-5 h-5" /> },
  { label: 'Archived Notices', href: '/admin/notices?status=ARCHIVED', icon: <Archive className="w-5 h-5" /> },
] as const;

const ADMIN_SIDEBAR_SYSTEM: SidebarItem[] = [
  { label: 'Profile', href: '/admin/profile', icon: <User className="w-5 h-5" /> },
  { label: 'Logout', href: '#', icon: <LogOut className="w-5 h-5" />, isLogout: true },
] as const;

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, toasts, removeToast } = useUIStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavClick = (href: string) => {
    if (href === '#') return;
    navigate(href);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-bg-elevated border-r border-border transition-[width,transform,margin] duration-normal ease',
          'flex flex-col',
          sidebarCollapsed ? 'w-[64px]' : 'w-[280px]',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Admin navigation"
      >
        {/* Logo */}
        <div className={cn('flex h-16 items-center justify-between px-4 border-b border-border', sidebarCollapsed && 'justify-center')}>
          <Link to="/admin/dashboard" className="flex items-center gap-2" aria-label="Oppora Admin Home">
            <OpporaMark size="md" />
            {!sidebarCollapsed && (
              <span className="truncate font-display text-h3 font-bold tracking-[-0.03em] text-text">
                Oppora Admin
              </span>
            )}
          </Link>
          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-sm text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
              aria-label="Expand sidebar"
              aria-expanded="false"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1" role="navigation" aria-label="Admin menu">
          {/* Overview */}
          <div>
            {!sidebarCollapsed && (
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Overview
              </p>
            )}
            {ADMIN_SIDEBAR_OVERVIEW.map((item) => {
              const isActive = location.pathname === item.href || (item.href.includes('?') && location.pathname.startsWith(item.href.split('?')[0]));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-sm text-body font-medium transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:ring-offset-2',
                    isActive
                      ? 'bg-accent text-loud-ink'
                      : 'text-text-muted hover:text-text hover:bg-bg-hover',
                    sidebarCollapsed && 'justify-center'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* Management */}
          <div>
            {!sidebarCollapsed && (
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted mt-4">
                Management
              </p>
            )}
            {ADMIN_SIDEBAR_MANAGEMENT.map((item) => {
              const isActive = location.pathname === item.href || (item.href.includes('?') && location.pathname.startsWith(item.href.split('?')[0]));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-sm text-body font-medium transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:ring-offset-2',
                    isActive
                      ? 'bg-accent text-loud-ink'
                      : 'text-text-muted hover:text-text hover:bg-bg-hover',
                    sidebarCollapsed && 'justify-center'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* System */}
          <div className="pt-4 border-t border-border">
            {!sidebarCollapsed && (
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                System
              </p>
            )}
            {ADMIN_SIDEBAR_SYSTEM.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.isLogout) handleLogout();
                  else handleNavClick(item.href);
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-sm text-body font-medium transition-colors w-full text-left',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:ring-offset-2',
                  item.isLogout ? 'text-danger hover:text-danger hover:bg-danger-soft' : 'text-text-muted hover:text-text hover:bg-bg-hover',
                  sidebarCollapsed && 'justify-center'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>

        {/* Collapsed Toggle */}
        {sidebarCollapsed && (
          <div className="p-3 border-t border-border">
            <button
              onClick={toggleSidebar}
              className="w-full p-1.5 rounded-sm text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
              aria-label="Collapse sidebar"
              aria-expanded="true"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}
      </aside>

      {/* Top Navbar */}
      <header className={cn(
        'fixed top-0 right-0 z-40 h-16 bg-bg-elevated/95 backdrop-blur border-b border-border transition-[width,transform,margin] duration-normal ease',
        sidebarCollapsed ? 'left-[64px]' : 'left-[280px]'
      )}>
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-sm text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileSidebarOpen}
            aria-controls="mobile-sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Page Title */}
          <div className="flex-1 hidden md:block">
            <h1 className="text-h3 font-semibold text-text">Admin Portal</h1>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {/* Notifications Bell */}
            <button
              className="relative p-2 rounded-sm text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-sm hover:bg-bg-hover transition-colors"
                aria-expanded={profileMenuOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                <Avatar name={user?.name} size="md" />
                {!sidebarCollapsed && (
                  <span className="text-body font-medium text-text hidden sm:block truncate max-w-[150px]">
                    {user?.name}
                  </span>
                )}
                <ChevronDown className="w-4 h-4 text-text-muted hidden sm:block" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-bg-elevated border border-border rounded-md shadow-lg animate-fade-in z-50">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-body-sm font-medium text-text truncate">{user?.name}</p>
                    <p className="text-body-sm text-text-muted truncate">{user?.email}</p>
                    <p className="text-caption text-text-muted capitalize">Administrator</p>
                  </div>
                  <Link
                    to="/admin/profile"
                    className="flex items-center gap-2 px-3 py-2 text-body text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 text-body text-danger hover:bg-danger-soft transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        'pt-16 min-h-screen transition-[width,transform,margin] duration-normal ease',
        sidebarCollapsed ? 'lg:pl-[64px]' : 'lg:pl-[280px]'
      )}>
        <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Toasts */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}



