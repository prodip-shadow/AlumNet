'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import DeactivatedScreen from '@/components/shared/DeactivatedScreen';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api.get('/api/auth/me');
      if (response.data?.success && response.data?.user) {
        setUser(response.data.user);
        setIsDeactivated(false);
        return response.data.user;
      } else {
        setUser(null);
        setIsDeactivated(false);
        return null;
      }
    } catch (error) {
      if (error.response?.data?.isDeactivated || error.response?.status === 403) {
        setIsDeactivated(true);
        if (error.response?.data?.user) {
          setUser(error.response.data.user);
        }
      } else {
        setUser(null);
        setIsDeactivated(false);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchCurrentUser();
    });

    const handleUnauthorized = () => {
      setUser(null);
      setIsDeactivated(false);
      if (typeof window !== 'undefined') {
        const publicPaths = ['/', '/login', '/register', '/forgot-password', '/alumni', '/events', '/opportunities'];
        const currentPath = window.location.pathname;
        const isPublic = publicPaths.some((p) => currentPath === p || currentPath.startsWith(p));
        if (!isPublic) {
          router.push('/login');
        }
      }
    };

    const handleDeactivated = () => {
      setIsDeactivated(true);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:deactivated', handleDeactivated);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:deactivated', handleDeactivated);
    };
  }, [fetchCurrentUser, router]);

  const logoutUser = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsDeactivated(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        isDeactivated,
        setIsDeactivated,
        fetchCurrentUser,
        logoutUser,
      }}
    >
      {isDeactivated ? <DeactivatedScreen /> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
