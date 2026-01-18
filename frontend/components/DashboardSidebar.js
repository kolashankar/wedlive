'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Home,
  Video,
  Music,
  Globe,
  User,
  Settings,
  Menu,
  X,
  Crown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

export default function DashboardSidebar({ isOpen, onToggle, user }) {
  const pathname = usePathname();
  const [storageInfo, setStorageInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const response = await api.get('/api/music/storage');
      setStorageInfo(response.data);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Weddings', href: '/weddings', icon: Video },
    { name: 'Music Library', href: '/dashboard/music', icon: Music },
    { name: 'Browse Weddings', href: '/browse', icon: Globe },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const isPremium = user?.subscription_plan === 'monthly' || user?.subscription_plan === 'yearly';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out",
          "w-64 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Video className="w-6 h-6 text-rose-500" />
              <h2 className="font-semibold text-lg">WedLive</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onToggle}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group",
                    isActive
                      ? "bg-rose-50 text-rose-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                >
                  <Icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-rose-600" : "text-gray-400 group-hover:text-gray-600"
                  )} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-4">
            {/* Storage Widget */}
            {!loading && storageInfo && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">Storage</span>
                  <span className="text-xs text-gray-500">
                    {storageInfo.percentage}%
                  </span>
                </div>
                <Progress value={storageInfo.percentage} className="h-2 mb-2" />
                <div className="text-xs text-gray-500">
                  {storageInfo.storage_used_formatted} / {storageInfo.storage_limit_formatted}
                </div>
                {storageInfo.percentage > 80 && (
                  <p className="text-xs text-orange-600 mt-1">
                    Storage almost full!
                  </p>
                )}
              </div>
            )}

            {/* Premium Badge */}
            {isPremium ? (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-3 text-white">
                <div className="flex items-center space-x-2 mb-1">
                  <Crown className="w-4 h-4" />
                  <span className="text-sm font-semibold">Premium Plan</span>
                </div>
                <p className="text-xs opacity-90 capitalize">
                  {user?.subscription_plan} subscription
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-rose-500 to-purple-500 rounded-lg p-3 text-white">
                <div className="flex items-center space-x-2 mb-2">
                  <Crown className="w-4 h-4" />
                  <span className="text-sm font-semibold">Upgrade to Premium</span>
                </div>
                <p className="text-xs opacity-90 mb-2">
                  Get more storage and features
                </p>
                <Link href="/premium">
                  <Button
                    size="sm"
                    className="w-full bg-white text-rose-600 hover:bg-gray-100"
                  >
                    View Plans
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
