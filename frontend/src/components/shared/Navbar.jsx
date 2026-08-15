'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, LogOut, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { pressStart } from '@/fonts';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  {
    title: 'Home',
    href: '/',
  },
  {
    title: 'Alumni',
    href: '/alumni',
  },
  {
    title: 'Opportunities',
    href: '/opportunities',
  },
  {
    title: 'Events',
    href: '/events',
  },
];

const Navbar = () => {
  const pathname = usePathname();
  const { user, loading, logoutUser } = useAuth();
  const [theme, setTheme] = useState('light');

  // Load saved theme or system preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    const initialTheme =
      savedTheme === 'dark' || (!savedTheme && systemPrefersDark)
        ? 'dark'
        : 'light';

    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    queueMicrotask(() => {
      setTheme(initialTheme);
    });
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="fixed top-0 left-0 z-50 h-16 w-full border-b border-border bg-background shadow-xs transition-colors">
      <div className="mx-auto flex h-full max-w-[1750px] items-center justify-between px-6">
        <Link
          href="/"
          className="text-3xl md:text-4xl font-extrabold text-primary font-(family-name:--font-press-start)"
        >
          AlumNet
        </Link>

        <nav className="hidden h-full items-center gap-8 md:flex">
          {navLinks.map((nav, id) => {
            const isActive = pathname === nav.href;

            return (
              <Button
                key={id}
                className={`h-full rounded-none border-0 border-b-2 border-b-transparent px-3 text-sm font-medium transition-colors hover:border-b-primary ${
                  isActive ? 'border-b-primary' : ''
                }`}
                variant="none"
              >
                <Link
                  href={nav.href}
                  className={`font-medium transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-foreground/80 hover:text-foreground'
                  }`}
                >
                  {nav.title}
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 md:gap-6">
          {/* Light / Dark Theme Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="rounded-full border-0 p-2 hover:bg-muted text-foreground transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-amber-400 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700 dark:text-slate-300 transition-transform duration-200 hover:-rotate-12" />
            )}
          </Button>

          {/* Notifications Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border-0 p-2 hover:bg-muted text-foreground transition-colors cursor-pointer"
          >
            <Bell className="h-5 w-5" strokeWidth={2} />
          </Button>

          {loading ? (
            <div className="h-9 w-16 bg-muted animate-pulse rounded-md" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                title={user.name || 'User Profile'}
                className="flex items-center gap-2"
              >
                <Avatar className="h-9 w-9 border border-border cursor-pointer hover:opacity-90 transition-opacity">
                  {user.profileImageUrl && (
                    <AvatarImage
                      src={user.profileImageUrl}
                      alt={user.name || 'Profile'}
                    />
                  )}

                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                    {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <Button
                onClick={logoutUser}
                variant="destructive"
                className="h-8 px-2.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button
                variant="default"
                className={`h-9 text-xs font-bold px-4 ${pressStart.variable}`}
              >
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
