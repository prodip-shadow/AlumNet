'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Users,
  Briefcase,
  Calendar,
  Sparkles,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { Button } from '../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { pressStart } from '@/fonts';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { confirmAlert } from '@/lib/swal';

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
  {
    title: 'Connections',
    href: '/connections',
  },
];

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logoutUser } = useAuth();
  const [theme, setTheme] = useState('light');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef(null);

  // Load saved theme
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

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingNotifs(true);
      const res = await api.get('/api/notifications');
      if (res.data?.success && Array.isArray(res.data.notifications)) {
        setNotifications(res.data.notifications);
        const unread = res.data.notifications.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.warn('Could not load notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);

      // Connect Socket.io client for real-time notifications
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
      const socket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        socket.emit('register', { userId: user.id });
      });

      socket.on('new_notification', (notif) => {
        fetchNotifications();
        if (notif?.message) {
          const cleanMsg = notif.message.replace(/{actor\s*}/gi, notif.actorName || 'Someone');
          toast.info(cleanMsg, { autoClose: 3500 });
        }
      });

      return () => {
        clearInterval(interval);
        socket.disconnect();
      };
    }
  }, [user, fetchNotifications]);

  // Handle Delete Single Notification
  const handleDeleteNotification = async (e, notifId) => {
    e.stopPropagation();
    try {
      const res = await api.delete(`/api/notifications/${notifId}`);
      if (res.data?.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notifId));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.warn('Error deleting notification:', err);
    }
  };

  // Handle Clear All Notifications
  const handleClearAllNotifications = async (e) => {
    e.stopPropagation();
    const isConfirmed = await confirmAlert({
      title: 'Clear All Notifications?',
      text: 'Are you sure you want to remove all notifications from your list?',
      confirmButtonText: 'Yes, Clear All',
    });
    if (!isConfirmed) return;
    try {
      const res = await api.delete('/api/notifications');
      if (res.data?.success) {
        setNotifications([]);
        setUnreadCount(0);
        toast.success('All notifications cleared');
      }
    } catch (err) {
      console.warn('Error clearing notifications:', err);
    }
  };

  // Handle open notifications: Automatically mark as read/seen in backend
  const handleToggleNotifications = async () => {
    const nextState = !notifOpen;
    setNotifOpen(nextState);

    if (nextState) {
      fetchNotifications();
      if (unreadCount > 0) {
        try {
          await api.patch('/api/notifications/read-all');
          setUnreadCount(0);
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
        } catch (err) {
          console.warn('Auto mark as read error:', err);
        }
      }
    }
  };

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notification click router: Automatically directs user to precise target tab/route
  const handleNotificationClick = (notif) => {
    setNotifOpen(false);
    const type = notif.type;
    const entityType = notif.entityType;
    const msg = notif.message?.toLowerCase() || '';

    // 1. Connection Requests & Acceptances
    if (type === 'CONNECTION_REQUEST' || msg.includes('connection request') || (msg.includes('request') && msg.includes('connect'))) {
      router.push('/connections?tab=incoming');
      return;
    }
    if (type === 'CONNECTION_ACCEPTED' || (msg.includes('accepted') && msg.includes('connection'))) {
      router.push('/connections?tab=connections');
      return;
    }

    // 2. Job Opportunities & Applications
    if (type === 'OPPORTUNITY_APPLICATION' || msg.includes('applied for') || msg.includes('applicant')) {
      if (user?.role === 'ALUMNI' || user?.role === 'ADMIN') {
        router.push('/dashboard?tab=opportunities');
      } else {
        router.push('/dashboard?tab=applications');
      }
      return;
    }
    if (type === 'OPPORTUNITY_STATUS_UPDATE') {
      router.push('/dashboard?tab=applications');
      return;
    }
    if (type === 'NEW_OPPORTUNITY' || msg.includes('opportunity') || msg.includes('job')) {
      router.push('/opportunities');
      return;
    }

    // 3. Events
    if (type === 'EVENT_REGISTRATION' && (user?.role === 'ALUMNI' || user?.role === 'ADMIN' || user?.canCreateEvent)) {
      router.push('/dashboard?tab=events');
      return;
    }
    if (type === 'NEW_EVENT' || type === 'EVENT_CANCELLED' || entityType === 'EVENT' || msg.includes('event')) {
      router.push('/events');
      return;
    }

    // 4. Verification & Migration
    if (type === 'MIGRATION_APPROVED' || type === 'MIGRATION_REJECTED' || msg.includes('migration')) {
      if (user?.role === 'ADMIN') {
        router.push('/dashboard?tab=migrations');
      } else {
        router.push('/dashboard?tab=migration');
      }
      return;
    }
    if (type === 'VERIFICATION_APPROVED' || type === 'VERIFICATION_REJECTED' || msg.includes('verification')) {
      if (user?.role === 'ADMIN') {
        router.push('/dashboard?tab=verifications');
      } else {
        router.push('/dashboard');
      }
      return;
    }

    // General fallback for connection-related
    if (msg.includes('connect')) {
      router.push('/connections?tab=incoming');
      return;
    }

    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 z-50 h-16 w-full border-b border-border bg-background/95 backdrop-blur-md shadow-xs transition-colors">
      <div className="mx-auto flex h-full max-w-[1750px] items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-foreground hover:bg-muted cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link
            href="/"
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary font-(family-name:--font-press-start) flex items-center gap-2"
          >
            <span>AlumNet</span>
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden h-full items-center gap-6 lg:gap-8 md:flex">
          {navLinks.map((nav, id) => {
            const isActive = pathname === nav.href;

            return (
              <Button
                key={id}
                className={`h-full rounded-none border-0 border-b-2 border-b-transparent px-2.5 text-sm font-medium transition-colors hover:border-b-primary ${
                  isActive ? 'border-b-primary text-primary' : 'text-foreground/80'
                }`}
                variant="none"
              >
                <Link
                  href={nav.href}
                  className={`font-medium transition-colors ${
                    isActive ? 'text-primary font-semibold' : 'hover:text-foreground'
                  }`}
                >
                  {nav.title}
                </Link>
              </Button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Light / Dark Theme Toggle Button (Larger & Comfortable) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="rounded-full h-10 w-10 hover:bg-muted text-foreground transition-all cursor-pointer border border-border/50 shadow-2xs"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-amber-400 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700 dark:text-slate-300 transition-transform duration-200 hover:-rotate-12" />
            )}
          </Button>

          {/* Notifications Button & Dropdown (Larger & Comfortable) */}
          {user && (
            <div className="relative" ref={notifRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleNotifications}
                className="relative rounded-full h-10 w-10 hover:bg-muted text-foreground transition-all cursor-pointer border border-border/50 shadow-2xs"
                title="Notifications"
              >
                <Bell className="h-5 w-5" strokeWidth={2} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-in zoom-in-50 ring-2 ring-background">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

              {/* Dropdown Popup */}
              {notifOpen && (
                <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between p-3.5 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">
                        Notifications
                      </h4>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {notifications.length} total
                      </Badge>
                    </div>

                    {notifications.length > 0 && (
                      <button
                        onClick={handleClearAllNotifications}
                        className="text-[11px] font-semibold text-destructive hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
                    {loadingNotifs ? (
                      <div className="p-8 text-center text-xs text-muted-foreground">
                        Loading notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                        <Bell className="h-6 w-6 mx-auto opacity-40 mb-2" />
                        <p className="font-medium text-foreground">No notifications yet</p>
                        <p className="text-[11px]">We'll notify you when someone connects or posts updates.</p>
                      </div>
                    ) : (
                      notifications.slice(0, 20).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className="p-3.5 text-xs transition-colors hover:bg-primary/10 cursor-pointer flex items-start justify-between gap-3 group"
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${notif.isRead ? 'bg-muted-foreground/40' : 'bg-primary'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-foreground leading-relaxed group-hover:text-primary transition-colors">
                                {notif.message?.replace(/{actor\s*}/gi, notif.actorName || 'Someone')}
                              </p>
                              <span className="text-[10px] text-muted-foreground mt-1 block">
                                {new Date(notif.createdAt).toLocaleDateString()}{' '}
                                {new Date(notif.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleDeleteNotification(e, notif.id)}
                            className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer shrink-0"
                            title="Delete notification"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile & Auth Controls */}
          {loading ? (
            <div className="h-10 w-20 bg-muted animate-pulse rounded-full" />
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/profile"
                title={`${user.name} (${user.role})`}
                className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Avatar className="h-10 w-10 border border-border cursor-pointer shadow-2xs">
                  {user.profileImageUrl && (
                    <AvatarImage src={user.profileImageUrl} alt={user.name || 'Profile'} />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                    {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <Button
                onClick={logoutUser}
                variant="ghost"
                size="sm"
                className="h-9 px-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer rounded-xl"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="h-9 px-3.5 text-xs font-semibold rounded-xl">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="h-9 px-3.5 text-xs font-semibold rounded-xl">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card p-4 space-y-2 animate-in slide-in-from-top-2">
          {navLinks.map((nav) => (
            <Link
              key={nav.href}
              href={nav.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                pathname === nav.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              {nav.title}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;
