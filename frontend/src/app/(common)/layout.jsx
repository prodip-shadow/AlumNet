'use client';

import Navbar from '@/components/shared/Navbar';
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const MainLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role?.toUpperCase() === 'USER') {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && user.role?.toUpperCase() === 'USER') {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="pt-20">{children}</main>
    </>
  );
};

export default MainLayout;