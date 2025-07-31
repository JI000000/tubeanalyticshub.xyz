'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { LoginForm } from '@/components/auth/login-form';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Settings, User, Menu, X, Home, Video, Users, MessageSquare, Download, Zap, HelpCircle, LogOut } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { t } = useTranslation();
  
  const currentLocale = pathname.split('/')[1] || 'en-US';

  // 如果用户未认证，显示登录界面
  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <LoginForm onSuccess={() => window.location.reload()} />
      </div>
    );
  }

  // 如果正在加载，显示加载界面
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('app.loading')}</p>
        </div>
      </div>
    );
  }
  
  const navigation = [
    { name: t('navigation.dashboard'), href: `/${currentLocale}`, icon: Home },
    { name: t('navigation.videos'), href: `/${currentLocale}/videos`, icon: Video },
    { name: t('navigation.channels'), href: `/${currentLocale}/channels`, icon: Users },
    { name: t('navigation.comments'), href: `/${currentLocale}/comments`, icon: MessageSquare },
    { name: t('navigation.competitor'), href: `/${currentLocale}/competitor`, icon: Users },
    { name: t('navigation.insights'), href: `/${currentLocale}/insights`, icon: BarChart3 },
    { name: t('navigation.reports'), href: `/${currentLocale}/reports`, icon: Download },
    { name: t('navigation.export'), href: `/${currentLocale}/export`, icon: Download },
  ];

  const secondaryNavigation = [
    { name: t('navigation.settings'), href: `/${currentLocale}/settings`, icon: Settings },
    { name: t('navigation.help'), href: `/${currentLocale}/help`, icon: HelpCircle },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
            <div className="flex items-center min-w-0 flex-1">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <h1 className="text-base font-semibold text-gray-900 truncate">
                  {t('app.title')}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">{t('app.subtitle')}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden flex-shrink-0 ml-2"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User info */}
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || 'User'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {user?.plan || 'Free'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {user?.quota_used || 0}/{user?.quota_limit || 50} quota
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive 
                      ? 'text-blue-500' 
                      : 'text-gray-400 group-hover:text-gray-500'
                    }
                  `} />
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* Upgrade banner */}
          <div className="px-4 py-5">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('app.upgradeTitle')}</p>
                  <p className="text-xs opacity-90">{t('app.upgradeDescription')}</p>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full mt-3 bg-white text-blue-600 hover:bg-gray-100"
              >
                {t('app.upgradeButton')}
              </Button>
            </div>
          </div>

          {/* Secondary navigation */}
          <div className="px-4 py-5 border-t border-gray-200 space-y-1">
            {secondaryNavigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="group flex items-center px-3 py-3 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
              >
                <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                {item.name}
              </a>
            ))}
            
            {/* Logout button */}
            <button
              onClick={logout}
              className="w-full group flex items-center px-3 py-3 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              {t('navigation.signOut')}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 flex justify-center lg:justify-start">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('app.dataConsole')}
              </h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center text-sm text-gray-500">
                <span>{t('app.quota')}: </span>
                <Badge variant="outline" className="ml-1">
                  {user?.quota_used || 0}/{user?.quota_limit || 50}
                </Badge>
              </div>
              
              <LanguageSwitcher />
              
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}