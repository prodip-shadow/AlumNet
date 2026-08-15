'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  Bookmark,
  Settings,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'All Connections',
    href: '/connections',
    icon: Users,
  },
  {
    title: 'Settings',
    href: '#',
    icon: Settings,
  },
];

const Sidebar = () => {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const userRoleDisplay = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Alumni';

  return (
    <aside className="w-full lg:w-72 xl:w-80 shrink-0 sticky top-[5.5rem] self-start max-h-[calc(100vh-6.5rem)] overflow-y-auto space-y-3 pr-2 scrollbar-none">
      {/* User Profile Item (Flat Facebook Style Row) */}
      <Link
        href="/profile"
        className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-all duration-150 group w-full"
      >
        <Avatar className="h-10 w-10 border border-emerald-500/30 group-hover:scale-105 transition-transform shrink-0">
          {user?.profileImageUrl ? (
            <AvatarImage
              src={user.profileImageUrl}
              alt={user?.name || 'Profile'}
            />
          ) : null}
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            {user?.name
              ? user.name.slice(0, 2).toUpperCase()
              : loading
              ? '...'
              : 'US'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-semibold text-sm text-foreground truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
              {loading ? (
                <span className="inline-block w-24 h-4 bg-muted animate-pulse rounded" />
              ) : (
                user?.name || 'Guest User'
              )}
            </h2>
            {user?.role && (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
          </div>

          <div className="mt-0.5">
            <Badge
              variant="secondary"
              className="px-2 py-0 text-[10px] font-medium bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-none"
            >
              {userRoleDisplay}
            </Badge>
          </div>
        </div>
      </Link>

      {/* Thin Separator */}
      <div className="h-px bg-border/60 mx-2" />

      {/* Navigation List (Full Width Flat Items) */}
      <nav className="space-y-1 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group w-full ${
                isActive
                  ? 'bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 font-semibold'
                  : 'text-foreground/80 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span>{item.title}</span>
              </div>

              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          );
        })}
      </nav>


      <div className="h-px bg-border/60 mx-2" />

   

      {/* Footer Links */}
      <div className="pt-3 px-3 text-[10px] text-muted-foreground flex flex-wrap gap-x-2 gap-y-1 w-full">
        <a href="#" className="hover:underline">
          Privacy
        </a>
        <span>•</span>
        <a href="#" className="hover:underline">
          Terms
        </a>
        <span>•</span>
        <a href="#" className="hover:underline">
          AlumNet © 2026
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
