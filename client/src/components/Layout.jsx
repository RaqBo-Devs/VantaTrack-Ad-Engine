import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/Button';

const getNavigation = (user) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Campaigns', href: '/campaigns', icon: '🎯' },
    { name: 'Clients', href: '/clients', icon: '👥' },
    { name: 'Analytics', href: '/analytics', icon: '📈' },
    { name: 'Upload Data', href: '/upload', icon: '📤' },
    { name: 'Templates', href: '/templates', icon: '📋' },
  ];

  // Add admin navigation for agency_admin users
  if (user?.role === 'agency_admin') {
    baseNavigation.push({
      name: 'Admin Panel',
      href: '/admin',
      icon: '⚙️'
    });
  }

  return baseNavigation;
};

export function Layout({ children }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-end px-6 py-4 border-b border-gray-200">
          <button 
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Navigation - flex-1 allows it to expand and push user section to bottom */}
        <nav className="flex-1 mt-6 px-4 overflow-y-auto">
          <ul className="space-y-2 pb-20">
            {getNavigation(user).map((item) => {
              const isActive = location === item.href;
              return (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className={isActive ? 'nav-link-active' : 'nav-link'}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info and logout - fixed at bottom with no absolute positioning */}
        <div className="mt-auto p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-medium text-sm">
                {user?.fullName?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.fullName || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role?.replace('_', ' ')?.replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-gray-600"
            onClick={handleLogout}
            loading={logoutMutation.isPending}
          >
            Sign out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center space-x-4">
              <button
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-primary-600 hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="text-xl">☰</span>
              </button>
              
              {/* Logo and branding in main header */}
              <div className="flex items-center space-x-3">
                <div className="w-60 h-60 rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src="/images/vantatrack-logo.svg" 
                    alt="VantaTrack Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Ad Engine</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content - aligned with navigation items */}
        <main className="px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}