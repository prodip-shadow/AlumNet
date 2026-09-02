'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from '@/components/dashboard/admin/AdminDashboard';
import AlumniDashboard from '@/components/dashboard/alumni/AlumniDashboard';
import StudentDashboard from '@/components/dashboard/student/StudentDashboard';
import UserDashboard from '@/components/dashboard/user/UserDashboard';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, ShieldCheck, GraduationCap, User } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role?.toUpperCase() || 'USER';

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {role === 'ADMIN' && 'Admin Control Center'}
              {role === 'ALUMNI' && 'Alumni Dashboard'}
              {role === 'STUDENT' && 'Student Dashboard'}
              {role === 'USER' && 'User Verification Hub'}
            </h1>
            <Badge
              variant="secondary_1"
              className={`px-2.5 py-0.5 text-xs font-bold border-none ${
                role === 'ADMIN'
                  ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300'
                  : role === 'ALUMNI'
                  ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                  : role === 'STUDENT'
                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
              }`}
            >
              {role}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {role === 'ADMIN' && 'Manage users, verify university members, approve migrations, and maintain faculties.'}
            {role === 'ALUMNI' && 'Manage your professional profile, post opportunities, view applicants, and connect.'}
            {role === 'STUDENT' && 'Manage your academic details, track job applications, and apply for alumni status.'}
            {role === 'USER' && 'Verify your university student or alumni identity to access the AlumNet network.'}
          </p>
        </div>
      </div>

      {/* Role-Specific Dashboard Renderer */}
      {role === 'ADMIN' && <AdminDashboard />}
      {role === 'ALUMNI' && <AlumniDashboard />}
      {role === 'STUDENT' && <StudentDashboard />}
      {role === 'USER' && <UserDashboard />}
    </div>
  );
}
