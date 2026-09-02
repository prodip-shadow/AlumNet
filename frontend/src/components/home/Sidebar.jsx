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
  User,
  ShieldCheck,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Alumni Directory',
    href: '/alumni',
    icon: GraduationCap,
  },
  {
    title: 'Opportunities',
    href: '/opportunities',
    icon: Briefcase,
  },
  {
    title: 'Events',
    href: '/events',
    icon: Calendar,
  },
  {
    title: 'My Connections',
    href: '/connections',
    icon: Users,
  },
  {
    title: 'My Profile',
    href: '/profile',
    icon: User,
  },
];

const Sidebar = () => {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const userRoleDisplay = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
    : 'Guest';

  return (
    <aside className="w-full lg:w-72 xl:w-80 shrink-0 sticky top-22 self-start max-h-[calc(100vh-6.5rem)] overflow-y-auto space-y-3 pr-2 scrollbar-none">
      <Link
        href={user?.id ? `/profile/${user.id}` : '/profile'}
        className="flex items-center gap-3.5 p-2.5 rounded-xl transition-all duration-150 group w-full bg-card border border-border shadow-2xs hover:border-primary/40"
      >
        <Avatar className="h-10 w-10 border border-border transition-transform shrink-0 group-hover:ring-2 group-hover:ring-primary/40">
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
            <h2 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {loading ? (
                <span className="inline-block w-24 h-4 bg-muted animate-pulse rounded" />
              ) : (
                user?.name || 'Guest User'
              )}
            </h2>
            {user?.role && (
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
          </div>

          <div className="mt-0.5">
            <Badge
              variant="secondary"
              className="px-2 py-0 text-[10px] font-semibold bg-primary/10 text-primary border-none"
            >
              {userRoleDisplay}
            </Badge>
          </div>
        </div>
      </Link>

      {/* Navigation List */}
      <nav className="space-y-1 w-full pt-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                  : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span>{item.title}</span>
              </div>
              <ChevronRight className={`h-3.5 w-3.5 opacity-50 ${isActive ? 'opacity-90' : ''}`} />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
