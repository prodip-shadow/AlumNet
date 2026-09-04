'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Edit3,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  Pencil,
  Eye,
  AlertTriangle,
  Building,
  Sparkles,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { confirmAlert } from '@/lib/swal';
import MyCreatedEventsSection from '@/components/shared/MyCreatedEventsSection';
import PaymentHistorySection from '@/components/shared/PaymentHistorySection';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');

  // Stats State
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingVerifications: 0,
    pendingMigrations: 0,
    totalFaculties: 0,
  });

  // Users State
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Selected User Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleChangeUserId, setRoleChangeUserId] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState('STUDENT');
  const [savingRole, setSavingRole] = useState(false);

  // Verifications State
  const [verifications, setVerifications] = useState([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [rejectModalAppId, setRejectModalAppId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Migrations State
  const [migrations, setMigrations] = useState([]);
  const [loadingMigrations, setLoadingMigrations] = useState(false);
  const [rejectMigrationId, setRejectMigrationId] = useState(null);
  const [migrationRejectReason, setMigrationRejectReason] = useState('');

  // Academics State
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingAcademics, setLoadingAcademics] = useState(false);
  const [newFacultyName, setNewFacultyName] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptFacultyId, setNewDeptFacultyId] = useState('');
  const [savingAcademic, setSavingAcademic] = useState(false);

  // Skills State
  const [skillsList, setSkillsList] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [savingSkill, setSavingSkill] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [editingSkillName, setEditingSkillName] = useState('');
  const [savingEditSkill, setSavingEditSkill] = useState(false);

  // Event Permissions State
  const [permittedUsers, setPermittedUsers] = useState([]);
  const [loadingPermitted, setLoadingPermitted] = useState(false);
  const [permCandidateRole, setPermCandidateRole] = useState('ALL');
  const [permCandidateSearch, setPermCandidateSearch] = useState('');
  const [candidateUsers, setCandidateUsers] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [actionLoadingPermId, setActionLoadingPermId] = useState(null);

  const showFeedback = (type, msg) => {
    if (type === 'success') {
      toast.success(msg, { autoClose: 1500 });
    } else if (type === 'error') {
      toast.error(msg, { autoClose: 2000 });
    } else {
      toast.info(msg, { autoClose: 1500 });
    }
  };

  // 1. Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (userSearch.trim()) params.append('search', userSearch.trim());
      if (userRoleFilter) params.append('role', userRoleFilter);
      params.append('page', String(userPage));
      params.append('limit', '10');

      const res = await api.get(`/api/admin/users?${params.toString()}`);
      if (res.data?.success) {
        setUsersList(res.data.users || []);
        setUserTotalPages(res.data.pagination?.totalPages || 1);
        setStats((prev) => ({
          ...prev,
          totalUsers: res.data.pagination?.total || prev.totalUsers,
        }));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [userSearch, userRoleFilter, userPage]);

  // 2. Fetch Verifications
  const fetchVerifications = useCallback(async () => {
    setLoadingVerifications(true);
    try {
      const res = await api.get('/api/verification/pending');
      if (res.data?.success && Array.isArray(res.data.applications)) {
        setVerifications(res.data.applications);
        setStats((prev) => ({
          ...prev,
          pendingVerifications: res.data.applications.length,
        }));
      }
    } catch (err) {
      console.warn('Error fetching verifications:', err);
    } finally {
      setLoadingVerifications(false);
    }
  }, []);

  // 3. Fetch Migrations
  const fetchMigrations = useCallback(async () => {
    setLoadingMigrations(true);
    try {
      const res = await api.get('/api/alumni-migration/pending');
      if (res.data?.success && Array.isArray(res.data.applications)) {
        setMigrations(res.data.applications);
        setStats((prev) => ({
          ...prev,
          pendingMigrations: res.data.applications.length,
        }));
      }
    } catch (err) {
      console.warn('Error fetching migrations:', err);
    } finally {
      setLoadingMigrations(false);
    }
  }, []);

  // 4. Fetch Academics
  const fetchAcademics = useCallback(async () => {
    setLoadingAcademics(true);
    try {
      const [facRes, deptRes] = await Promise.allSettled([
        api.get('/api/faculties'),
        api.get('/api/departments'),
      ]);

      if (facRes.status === 'fulfilled' && facRes.value.data?.success) {
        setFaculties(facRes.value.data.faculties || []);
        setStats((prev) => ({
          ...prev,
          totalFaculties: facRes.value.data.faculties?.length || 0,
        }));
      }
      if (deptRes.status === 'fulfilled' && deptRes.value.data?.success) {
        setDepartments(deptRes.value.data.departments || []);
      }
    } catch (err) {
      console.warn('Error fetching academics:', err);
    } finally {
      setLoadingAcademics(false);
    }
  }, []);

  // 5. Fetch Event Permissions
  const fetchEventPermissions = useCallback(async () => {
    setLoadingPermitted(true);
    try {
      const res = await api.get('/api/events/permissions');
      if (res.data?.success && Array.isArray(res.data.permittedUsers)) {
        setPermittedUsers(res.data.permittedUsers);
      }
    } catch (err) {
      console.warn('Error fetching event permissions:', err);
    } finally {
      setLoadingPermitted(false);
    }
  }, []);

  // 6. Fetch Candidates for Event Permission
  const fetchPermCandidates = useCallback(async () => {
    setLoadingCandidates(true);
    try {
      const params = new URLSearchParams();
      if (permCandidateSearch.trim()) params.append('search', permCandidateSearch.trim());
      if (permCandidateRole !== 'ALL') params.append('role', permCandidateRole);
      params.append('page', '1');
      params.append('limit', '50');

      const res = await api.get(`/api/admin/users?${params.toString()}`);
      if (res.data?.success) {
        const eligible = (res.data.users || []).filter((u) => ['STUDENT', 'ALUMNI'].includes(u.role));
        setCandidateUsers(eligible);
      }
    } catch (err) {
      console.warn('Error fetching permission candidates:', err);
    } finally {
      setLoadingCandidates(false);
    }
  }, [permCandidateSearch, permCandidateRole]);

  // 7. Fetch Skills
  const fetchSkills = useCallback(async () => {
    setLoadingSkills(true);
    try {
      const res = await api.get('/api/skills');
      if (res.data?.success && Array.isArray(res.data.skills)) {
        setSkillsList(res.data.skills);
      }
    } catch (err) {
      console.warn('Error fetching skills:', err);
    } finally {
      setLoadingSkills(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchVerifications();
    fetchMigrations();
    fetchAcademics();
    fetchEventPermissions();
    fetchSkills();
  }, [fetchUsers, fetchVerifications, fetchMigrations, fetchAcademics, fetchEventPermissions, fetchSkills]);

  useEffect(() => {
    if (activeTab === 'permissions') {
      fetchPermCandidates();
    }
  }, [activeTab, fetchPermCandidates]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) {
        setActiveTab(tab);
      }
    }
  }, []);

  // User Actions
  const handleToggleUserStatus = async (userId) => {
    try {
      const res = await api.patch(`/api/admin/users/${userId}/toggle-status`);
      if (res.data?.success) {
        showFeedback('success', res.data.message);
        fetchUsers();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to toggle user status');
    }
  };

  const handleOpenUserDetails = async (userId) => {
    setLoadingUserDetails(true);
    try {
      const res = await api.get(`/api/admin/users/${userId}`);
      if (res.data?.success && res.data.data) {
        setSelectedUser(res.data.data);
      }
    } catch (err) {
      showFeedback('error', 'Could not load user details');
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const [editingAdminUser, setEditingAdminUser] = useState(null);
  const [editAdminUserName, setEditAdminUserName] = useState('');
  const [savingAdminUserEdit, setSavingAdminUserEdit] = useState(false);
  const [deletingAdminUserId, setDeletingAdminUserId] = useState(null);

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete the account of "${userName}"? This cannot be undone.`)) return;
    setDeletingAdminUserId(userId);
    try {
      const res = await api.delete(`/api/admin/users/${userId}`);
      if (res.data?.success) {
        showFeedback('success', 'User account deleted successfully');
        fetchUsers();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingAdminUserId(null);
    }
  };

  const handleSaveAdminUserEdit = async (e) => {
    e.preventDefault();
    if (!editingAdminUser || !editAdminUserName.trim()) return;
    setSavingAdminUserEdit(true);
    try {
      const res = await api.put(`/api/admin/users/${editingAdminUser.id}`, {
        name: editAdminUserName.trim(),
      });
      if (res.data?.success) {
        showFeedback('success', 'User profile updated successfully');
        setEditingAdminUser(null);
        fetchUsers();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to update user profile');
    } finally {
      setSavingAdminUserEdit(false);
    }
  };

  const handleChangeUserRole = async () => {
    if (!roleChangeUserId || !selectedNewRole) return;
    setSavingRole(true);
    try {
      const res = await api.patch(`/api/admin/users/${roleChangeUserId}/role`, {
        role: selectedNewRole,
      });
      if (res.data?.success) {
        showFeedback('success', res.data.message);
        setIsRoleModalOpen(false);
        setRoleChangeUserId(null);
        fetchUsers();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to change user role');
    } finally {
      setSavingRole(false);
    }
  };

  // Verification Actions
  const handleApproveVerification = async (appId) => {
    setActionLoadingId(appId);
    try {
      const res = await api.patch(`/api/verification/${appId}/approve`);
      if (res.data?.success) {
        showFeedback('success', 'Verification approved successfully');
        fetchVerifications();
        fetchUsers();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to approve verification');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectVerification = async () => {
    if (!rejectModalAppId || !rejectReason.trim()) return;
    setActionLoadingId(rejectModalAppId);
    try {
      const res = await api.patch(`/api/verification/${rejectModalAppId}/reject`, {
        rejectionReason: rejectReason.trim(),
      });
      if (res.data?.success) {
        showFeedback('success', 'Verification rejected');
        setRejectModalAppId(null);
        setRejectReason('');
        fetchVerifications();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to reject verification');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Migration Actions
  const handleApproveMigration = async (migId) => {
    setActionLoadingId(migId);
    try {
      const res = await api.patch(`/api/alumni-migration/${migId}/approve`);
      if (res.data?.success) {
        showFeedback('success', 'Alumni migration approved successfully');
        fetchMigrations();
        fetchUsers();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to approve migration');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectMigration = async () => {
    if (!rejectMigrationId || !migrationRejectReason.trim()) return;
    setActionLoadingId(rejectMigrationId);
    try {
      const res = await api.patch(`/api/alumni-migration/${rejectMigrationId}/reject`, {
        rejectionReason: migrationRejectReason.trim(),
      });
      if (res.data?.success) {
        showFeedback('success', 'Alumni migration rejected');
        setRejectMigrationId(null);
        setMigrationRejectReason('');
        fetchMigrations();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to reject migration');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Academic Actions
  const handleAddFaculty = async (e) => {
    e.preventDefault();
    if (!newFacultyName.trim()) return;
    setSavingAcademic(true);
    try {
      const res = await api.post('/api/faculties', { name: newFacultyName.trim() });
      if (res.data?.success) {
        showFeedback('success', 'Faculty added successfully');
        setNewFacultyName('');
        fetchAcademics();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to add faculty');
    } finally {
      setSavingAcademic(false);
    }
  };

  const handleDeleteFaculty = async (facId) => {
    if (!confirm('Are you sure you want to delete this faculty?')) return;
    try {
      const res = await api.delete(`/api/faculties/${facId}`);
      if (res.data?.success) {
        showFeedback('success', 'Faculty deleted');
        fetchAcademics();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to delete faculty');
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptFacultyId) return;
    setSavingAcademic(true);
    try {
      const res = await api.post('/api/departments', {
        name: newDeptName.trim(),
        facultyId: Number(newDeptFacultyId),
      });
      if (res.data?.success) {
        showFeedback('success', 'Department added successfully');
        setNewDeptName('');
        setNewDeptFacultyId('');
        fetchAcademics();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to add department');
    } finally {
      setSavingAcademic(false);
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      const res = await api.delete(`/api/departments/${deptId}`);
      if (res.data?.success) {
        showFeedback('success', 'Department deleted');
        fetchAcademics();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to delete department');
    }
  };

  // Event Perm Actions
  const handleGrantPerm = async (userId) => {
    setActionLoadingPermId(userId);
    try {
      const res = await api.post(`/api/events/permissions/${userId}`);
      if (res.data?.success) {
        showFeedback('success', res.data.message || 'Event creator permission granted');
        fetchEventPermissions();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to grant permission');
    } finally {
      setActionLoadingPermId(null);
    }
  };

  const handleRevokePerm = async (userId) => {
    setActionLoadingPermId(userId);
    try {
      const res = await api.delete(`/api/events/permissions/${userId}`);
      if (res.data?.success) {
        showFeedback('success', res.data.message || 'Permission revoked');
        fetchEventPermissions();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to revoke permission');
    } finally {
      setActionLoadingPermId(null);
    }
  };

  // Skill Actions
  const handleCreateSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    setSavingSkill(true);
    try {
      const res = await api.post('/api/skills', { name: newSkillName.trim() });
      if (res.data?.success) {
        showFeedback('success', 'Skill created successfully');
        setNewSkillName('');
        fetchSkills();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to create skill');
    } finally {
      setSavingSkill(false);
    }
  };

  const handleUpdateSkill = async (skillId) => {
    if (!editingSkillName.trim()) return;
    setSavingEditSkill(true);
    try {
      const res = await api.put(`/api/skills/${skillId}`, { name: editingSkillName.trim() });
      if (res.data?.success) {
        showFeedback('success', 'Skill updated successfully');
        setEditingSkillId(null);
        setEditingSkillName('');
        fetchSkills();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to update skill');
    } finally {
      setSavingEditSkill(false);
    }
  };

  const handleDeleteSkill = async (skillId, skillName) => {
    const isConfirmed = await confirmAlert({
      title: 'Delete Skill?',
      text: `Are you sure you want to delete the skill "${skillName}"?`,
      confirmButtonText: 'Yes, Delete Skill',
    });
    if (!isConfirmed) return;
    try {
      const res = await api.delete(`/api/skills/${skillId}`);
      if (res.data?.success) {
        showFeedback('success', 'Skill deleted successfully');
        fetchSkills();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to delete skill');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="border border-border bg-card p-4 rounded-xl shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Total Users</p>
              <h3 className="text-xl font-bold text-foreground">{stats.totalUsers}</h3>
            </div>
          </div>
        </Card>

        <Card className="border border-border bg-card p-4 rounded-xl shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Pending Verifications</p>
              <h3 className="text-xl font-bold text-foreground">{stats.pendingVerifications}</h3>
            </div>
          </div>
        </Card>

        <Card className="border border-border bg-card p-4 rounded-xl shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Pending Migrations</p>
              <h3 className="text-xl font-bold text-foreground">{stats.pendingMigrations}</h3>
            </div>
          </div>
        </Card>

        <Card className="border border-border bg-card p-4 rounded-xl shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Faculties</p>
              <h3 className="text-xl font-bold text-foreground">{stats.totalFaculties}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Admin Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border/80 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'users', label: 'Users Directory', icon: Users },
          {
            id: 'verifications',
            label: `Verifications (${stats.pendingVerifications})`,
            icon: ShieldCheck,
          },
          {
            id: 'migrations',
            label: `Alumni Migrations (${stats.pendingMigrations})`,
            icon: GraduationCap,
          },
          { id: 'academics', label: 'Faculties & Departments', icon: Building },
          { id: 'skills', label: `Skills (${skillsList.length})`, icon: Sparkles },
          { id: 'permissions', label: 'Event Permissions', icon: CalendarCheck },
          { id: 'events', label: 'Hosted Events', icon: Calendar },
          { id: 'payments', label: 'Payment History', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={`h-9 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer shrink-0 rounded-lg ${
                isActive ? 'shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Tab 1: Users Directory */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-card border border-border p-3.5 rounded-xl shadow-2xs">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                placeholder="Search user by name or email..."
                className="pl-9 h-9 text-xs"
              />
            </div>

            <select
              value={userRoleFilter}
              onChange={(e) => {
                setUserRoleFilter(e.target.value);
                setUserPage(1);
              }}
              className="h-9 px-3 text-xs bg-background border border-border rounded-lg text-foreground cursor-pointer w-full sm:w-40"
            >
              <option value="">All Roles</option>
              <option value="STUDENT">Student</option>
              <option value="ALUMNI">Alumni</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User (Unverified)</option>
            </select>
          </div>

          {/* Users Table */}
          <Card className="border border-border bg-card rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Registered</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                        Loading users list...
                      </td>
                    </tr>
                  ) : usersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No users found matching filters.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border border-border shrink-0">
                              {u.profileImageUrl ? (
                                <AvatarImage src={u.profileImageUrl} alt={u.name} />
                              ) : null}
                              <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                                {u.name ? u.name.slice(0, 2).toUpperCase() : 'US'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-foreground">{u.name}</p>
                              <span className="text-[10px] text-muted-foreground">ID: #{u.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-muted-foreground">{u.email}</td>
                        <td className="p-3.5">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-2 py-0.5 font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300'
                                : u.role === 'ALUMNI'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                : u.role === 'STUDENT'
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {u.role}
                          </Badge>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                              u.isActive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-destructive'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                u.isActive ? 'bg-emerald-500' : 'bg-destructive'
                              }`}
                            />
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3.5 text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenUserDetails(u.id)}
                              className="h-7 px-2 text-[11px] gap-1 cursor-pointer"
                              title="View full profile"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Details</span>
                            </Button>

                             <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingAdminUser(u);
                                setEditAdminUserName(u.name || '');
                              }}
                              className="h-7 px-2 text-[11px] gap-1 cursor-pointer"
                              title="Edit user profile"
                            >
                              <Pencil className="h-3 w-3" />
                              <span>Edit</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRoleChangeUserId(u.id);
                                setSelectedNewRole(u.role);
                                setIsRoleModalOpen(true);
                              }}
                              className="h-7 px-2 text-[11px] gap-1 cursor-pointer"
                              title="Change Role"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>Role</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleUserStatus(u.id)}
                              className={`h-7 px-2 text-[11px] cursor-pointer ${
                                u.isActive
                                  ? 'text-destructive hover:bg-destructive/10'
                                  : 'text-emerald-600 hover:bg-emerald-500/10'
                              }`}
                              title={u.isActive ? 'Deactivate user' : 'Activate user'}
                            >
                              {u.isActive ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              disabled={deletingAdminUserId === u.id}
                              className="h-7 p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                              title="Permanently Delete User"
                            >
                              {deletingAdminUserId === u.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {userTotalPages > 1 && (
              <div className="p-3.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Page {userPage} of {userTotalPages}</span>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={userPage <= 1}
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2.5 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={userPage >= userTotalPages}
                    onClick={() => setUserPage((p) => p + 1)}
                    className="h-7 px-2.5 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: Verifications Approvals */}
      {activeTab === 'verifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Pending Student & Alumni Verifications
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchVerifications}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh</span>
            </Button>
          </div>

          {loadingVerifications ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              Loading pending verification applications...
            </div>
          ) : verifications.length === 0 ? (
            <Card className="p-12 text-center text-xs text-muted-foreground border-dashed">
              <ShieldCheck className="h-8 w-8 mx-auto opacity-40 mb-2 text-emerald-500" />
              <p className="font-semibold text-foreground text-sm">All verifications cleared!</p>
              <p className="mt-1">No pending verification applications currently awaiting review.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verifications.map((app) => (
                <Card key={app.id} className="border border-border bg-card p-4.5 rounded-xl shadow-2xs space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground">{app.userName || `User #${app.userId}`}</h4>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-bold ${
                            app.applicationType === 'ALUMNI'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {app.applicationType}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{app.userEmail}</p>
                    </div>

                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Academic Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 p-3 rounded-lg border border-border/60">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Student/Univ ID:</span>
                      <span className="font-semibold">{app.universityId}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Reg Number:</span>
                      <span className="font-semibold">{app.registrationNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Session:</span>
                      <span className="font-semibold">{app.session}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">District:</span>
                      <span className="font-semibold">{app.district}</span>
                    </div>
                    {app.currentSemester && (
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Semester:</span>
                        <span className="font-semibold">{app.currentSemester}</span>
                      </div>
                    )}
                    {app.graduationYear && (
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Graduation:</span>
                        <span className="font-semibold">{app.graduationYear}</span>
                      </div>
                    )}
                    {(app.currentPosition || app.currentCompany) && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-muted-foreground block">Job / Company:</span>
                        <span className="font-semibold">
                          {app.currentPosition} {app.currentCompany ? `@ ${app.currentCompany}` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleApproveVerification(app.id)}
                      disabled={actionLoadingId === app.id}
                      className="flex-1 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer h-8.5"
                    >
                      {actionLoadingId === app.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5" />
                      )}
                      <span>Approve</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setRejectModalAppId(app.id);
                        setRejectReason('');
                      }}
                      disabled={actionLoadingId === app.id}
                      className="flex-1 text-xs font-semibold gap-1.5 cursor-pointer h-8.5"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Alumni Migrations */}
      {activeTab === 'migrations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Pending Student to Alumni Migration Requests
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMigrations}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh</span>
            </Button>
          </div>

          {loadingMigrations ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              Loading alumni migration applications...
            </div>
          ) : migrations.length === 0 ? (
            <Card className="p-12 text-center text-xs text-muted-foreground border-dashed">
              <GraduationCap className="h-8 w-8 mx-auto opacity-40 mb-2 text-primary" />
              <p className="font-semibold text-foreground text-sm">No pending migrations</p>
              <p className="mt-1">All student graduation migration requests have been processed.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {migrations.map((mig) => (
                <Card key={mig.id} className="border border-border bg-card p-4.5 rounded-xl shadow-2xs space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{mig.userName || `User #${mig.userId}`}</h4>
                      <p className="text-xs text-muted-foreground">{mig.userEmail}</p>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 text-[10px]">
                      Graduated: {mig.graduationYear}
                    </Badge>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-lg border border-border/60 text-xs space-y-1.5">
                    {mig.currentPosition && (
                      <p className="font-medium text-foreground flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{mig.currentPosition} {mig.currentCompany ? `at ${mig.currentCompany}` : ''}</span>
                      </p>
                    )}
                    {mig.currentLocation && (
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{mig.currentLocation}</span>
                      </p>
                    )}
                    {mig.contactEmail && (
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{mig.contactEmail}</span>
                      </p>
                    )}
                    {mig.whatsappNumber && (
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{mig.whatsappNumber}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleApproveMigration(mig.id)}
                      disabled={actionLoadingId === mig.id}
                      className="flex-1 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer h-8.5"
                    >
                      {actionLoadingId === mig.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5" />
                      )}
                      <span>Approve Migration</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setRejectMigrationId(mig.id);
                        setMigrationRejectReason('');
                      }}
                      disabled={actionLoadingId === mig.id}
                      className="flex-1 text-xs font-semibold gap-1.5 cursor-pointer h-8.5"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Academics Management */}
      {activeTab === 'academics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Faculties Card */}
          <Card className="border border-border bg-card p-5 rounded-xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h4 className="font-bold text-sm text-foreground">Faculties</h4>
                <p className="text-xs text-muted-foreground">Manage University Faculties</p>
              </div>
              <Badge variant="secondary">{faculties.length}</Badge>
            </div>

            <form onSubmit={handleAddFaculty} className="flex gap-2">
              <Input
                value={newFacultyName}
                onChange={(e) => setNewFacultyName(e.target.value)}
                placeholder="e.g. Faculty of Computer Science"
                className="h-9 text-xs"
              />
              <Button type="submit" size="sm" disabled={savingAcademic} className="h-9 text-xs gap-1 cursor-pointer">
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </Button>
            </form>

            <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
              {faculties.map((f) => (
                <div key={f.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-foreground">{f.name}</span>
                    <span className="text-[10px] text-muted-foreground block">ID: #{f.id}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteFaculty(f.id)}
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    title="Delete faculty"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Departments Card */}
          <Card className="border border-border bg-card p-5 rounded-xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h4 className="font-bold text-sm text-foreground">Departments</h4>
                <p className="text-xs text-muted-foreground">Manage Departments within Faculties</p>
              </div>
              <Badge variant="secondary">{departments.length}</Badge>
            </div>

            <form onSubmit={handleAddDepartment} className="space-y-2">
              <Input
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="e.g. Dept of CSE"
                className="h-9 text-xs"
              />
              <div className="flex gap-2">
                <select
                  value={newDeptFacultyId}
                  onChange={(e) => setNewDeptFacultyId(e.target.value)}
                  className="flex-1 h-9 px-3 text-xs bg-background border border-border rounded-lg text-foreground cursor-pointer"
                >
                  <option value="">Select Faculty...</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" disabled={savingAcademic} className="h-9 text-xs gap-1 cursor-pointer">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Dept</span>
                </Button>
              </div>
            </form>

            <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
              {departments.map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-foreground">{d.name}</span>
                    <span className="text-[10px] text-muted-foreground block">
                      Faculty: {d.facultyName || `Faculty #${d.facultyId}`}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteDepartment(d.id)}
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    title="Delete department"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: Event Creator Permissions */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {/* Active Permitted Creators Card */}
          <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  <span>Authorized Event Creators ({permittedUsers.length})</span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Students and Alumni who currently have permission to publish campus events.
                </p>
              </div>
            </div>

            <div className="divide-y divide-border/60 max-h-80 overflow-y-auto">
              {loadingPermitted ? (
                <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Loading authorized creators...</span>
                </div>
              ) : permittedUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">No authorized creators yet</p>
                  <p className="text-[11px]">Search and grant event creation permission to students and alumni below.</p>
                </div>
              ) : (
                permittedUsers.map((p) => (
                  <div key={p.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                          {p.userName?.slice(0, 2).toUpperCase() || 'US'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{p.userName || `User #${p.userId}`}</span>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-bold ${
                              p.userRole === 'ALUMNI'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                            }`}
                          >
                            {p.userRole || 'USER'}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground block">{p.userEmail}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenUserDetails(p.userId)}
                        className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Profile</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionLoadingPermId === p.userId}
                        onClick={() => handleRevokePerm(p.userId)}
                        className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer font-medium"
                      >
                        {actionLoadingPermId === p.userId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserX className="h-3.5 w-3.5 mr-1" />
                        )}
                        <span>Revoke Permission</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Search & Grant Permission to Students & Alumni Card */}
          <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
            <div className="border-b border-border pb-3">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Search & Grant Permission</span>
              </h4>
              <p className="text-xs text-muted-foreground">
                Search students and alumni across the university network to grant event publishing permissions.
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Role filter buttons */}
              <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/60 self-stretch sm:self-auto">
                {[
                  { id: 'ALL', label: 'All Candidates' },
                  { id: 'STUDENT', label: 'Students' },
                  { id: 'ALUMNI', label: 'Alumni' },
                ].map((rf) => (
                  <Button
                    key={rf.id}
                    type="button"
                    variant={permCandidateRole === rf.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPermCandidateRole(rf.id)}
                    className={`h-7.5 px-3 text-xs font-semibold rounded-lg cursor-pointer ${
                      permCandidateRole === rf.id ? 'shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {rf.label}
                  </Button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={permCandidateSearch}
                  onChange={(e) => setPermCandidateSearch(e.target.value)}
                  placeholder="Search candidate by name, email..."
                  className="h-9.5 pl-8.5 text-xs bg-background"
                />
              </div>
            </div>

            {/* Candidate List */}
            {loadingCandidates ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading eligible candidates...</span>
              </div>
            ) : candidateUsers.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No matching students or alumni found.
              </div>
            ) : (
              <div className="divide-y divide-border/60 max-h-96 overflow-y-auto">
                {candidateUsers.map((user) => {
                  const isAlreadyPermitted = permittedUsers.some(
                    (p) => Number(p.userId) === Number(user.id)
                  );
                  const isActionLoading = actionLoadingPermId === user.id;

                  return (
                    <div
                      key={user.id}
                      className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-muted/20 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border">
                          {user.profileImageUrl && (
                            <AvatarImage src={user.profileImageUrl} alt={user.name} />
                          )}
                          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                            {user.name?.slice(0, 2).toUpperCase() || 'US'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{user.name}</span>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] font-bold ${
                                user.role === 'ALUMNI'
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                              }`}
                            >
                              {user.role}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-muted-foreground block">{user.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenUserDetails(user.id)}
                          className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Profile</span>
                        </Button>

                        {isAlreadyPermitted ? (
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] font-semibold py-1 px-2">
                              <CheckCircle className="h-3 w-3 mr-1 inline" /> Permitted
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isActionLoading}
                              onClick={() => handleRevokePerm(user.id)}
                              className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                            >
                              {isActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Revoke'}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isActionLoading}
                            onClick={() => handleGrantPerm(user.id)}
                            className="h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer bg-primary text-primary-foreground"
                          >
                            {isActionLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5" />
                            )}
                            <span>Grant Permission</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 6: Skills Management */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          {/* Create Skill Card */}
          <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs">
            <div className="border-b border-border pb-3 mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Add Global Skill</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Add global technical and domain skills for students and alumni to showcase on their profiles.
              </p>
            </div>

            <form onSubmit={handleCreateSkill} className="flex flex-col sm:flex-row gap-3">
              <Input
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="e.g. Next.js, Python, DevOps, Machine Learning, UI/UX Design"
                className="h-10 text-xs flex-1"
                required
              />
              <Button
                type="submit"
                disabled={savingSkill || !newSkillName.trim()}
                className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer shrink-0"
              >
                {savingSkill ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                <span>Add Skill</span>
              </Button>
            </form>
          </Card>

          {/* Skills Directory Card */}
          <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Available Skills ({skillsList.length})
                </h3>
                <p className="text-xs text-muted-foreground">Manage and edit global system skill tags.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Search skills..."
                  className="h-8.5 pl-8 text-xs bg-background"
                />
              </div>
            </div>

            {loadingSkills ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading skills directory...</span>
              </div>
            ) : skillsList.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No skills found. Use the form above to add your first skill!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
                {skillsList
                  .filter((s) => s.name.toLowerCase().includes(skillSearch.toLowerCase().trim()))
                  .map((skill) => {
                    const isEditing = editingSkillId === skill.id;
                    return (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between gap-2 p-3 bg-muted/20 hover:bg-muted/40 transition-colors border border-border/80 rounded-xl"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <Input
                              value={editingSkillName}
                              onChange={(e) => setEditingSkillName(e.target.value)}
                              className="h-7 text-xs px-2 py-0"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateSkill(skill.id);
                                if (e.key === 'Escape') setEditingSkillId(null);
                              }}
                            />
                            <Button
                              size="sm"
                              disabled={savingEditSkill}
                              onClick={() => handleUpdateSkill(skill.id)}
                              className="h-7 px-2 text-[10px] font-semibold"
                            >
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingSkillId(null)}
                              className="h-7 px-2 text-[10px]"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="h-2 w-2 rounded-full bg-primary/70 shrink-0" />
                              <span className="text-xs font-semibold text-foreground truncate" title={skill.name}>
                                {skill.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingSkillId(skill.id);
                                  setEditingSkillName(skill.name);
                                }}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Edit Skill"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSkill(skill.id, skill.name)}
                                className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                title="Delete Skill"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Modal: Change Role */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-card border border-border p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-foreground">Change User Role</h3>
            <p className="text-xs text-muted-foreground">
              Select the new account role for User #{roleChangeUserId}.
            </p>

            <select
              value={selectedNewRole}
              onChange={(e) => setSelectedNewRole(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-background border border-border rounded-lg text-foreground cursor-pointer"
            >
              <option value="STUDENT">Student</option>
              <option value="ALUMNI">Alumni</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User (Unverified)</option>
            </select>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRoleModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={savingRole}
                onClick={handleChangeUserRole}
                className="h-8 text-xs font-semibold"
              >
                {savingRole ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Role'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject Verification */}
      {rejectModalAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-card border border-border p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-foreground">Reject Verification Application</h3>
            <p className="text-xs text-muted-foreground">Please provide a reason for the rejection:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Student ID does not match records..."
              className="w-full h-20 p-2.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setRejectModalAppId(null)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!rejectReason.trim()}
                onClick={handleRejectVerification}
                className="h-8 text-xs"
              >
                Reject Application
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject Migration */}
      {rejectMigrationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-card border border-border p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-foreground">Reject Alumni Migration</h3>
            <p className="text-xs text-muted-foreground">Please provide a reason for the rejection:</p>
            <textarea
              value={migrationRejectReason}
              onChange={(e) => setMigrationRejectReason(e.target.value)}
              placeholder="e.g. Graduation year could not be verified..."
              className="w-full h-20 p-2.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setRejectMigrationId(null)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!migrationRejectReason.trim()}
                onClick={handleRejectMigration}
                className="h-8 text-xs"
              >
                Reject Migration
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: User Details Full View */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-card border border-border p-6 rounded-2xl shadow-xl space-y-4 my-auto">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-border">
                  {selectedUser.user.profileImageUrl && (
                    <AvatarImage src={selectedUser.user.profileImageUrl} alt={selectedUser.user.name} />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {selectedUser.user.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-base text-foreground">{selectedUser.user.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedUser.user.email}</p>
                </div>
              </div>
              <Badge variant="secondary">{selectedUser.user.role}</Badge>
            </div>

            {/* Profile Info */}
            <div className="space-y-2 text-xs">
              {selectedUser.studentProfile && (
                <div className="p-3 bg-muted/30 rounded-xl space-y-1 border border-border">
                  <span className="font-semibold text-foreground block">Student Academic Profile:</span>
                  <p className="text-muted-foreground">Reg No: {selectedUser.studentProfile.registrationNumber}</p>
                  <p className="text-muted-foreground">Session: {selectedUser.studentProfile.session} | Semester: {selectedUser.studentProfile.currentSemester}</p>
                  <p className="text-muted-foreground">Faculty: {selectedUser.studentProfile.facultyName || 'N/A'}</p>
                </div>
              )}

              {selectedUser.alumniProfile && (
                <div className="p-3 bg-muted/30 rounded-xl space-y-1 border border-border">
                  <span className="font-semibold text-foreground block">Alumni Profile:</span>
                  <p className="text-muted-foreground">Graduation: {selectedUser.alumniProfile.graduationYear}</p>
                  <p className="text-muted-foreground">
                    Position: {selectedUser.alumniProfile.currentPosition} at {selectedUser.alumniProfile.currentCompany}
                  </p>
                  <p className="text-muted-foreground">Location: {selectedUser.alumniProfile.currentLocation || 'N/A'}</p>
                </div>
              )}

              {selectedUser.skills && selectedUser.skills.length > 0 && (
                <div className="pt-2">
                  <span className="font-semibold text-muted-foreground block mb-1.5">Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.skills.map((s) => (
                      <Badge key={s.id} variant="outline" className="text-[10px]">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Edit User Profile (Admin) */}
      {editingAdminUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <form onSubmit={handleSaveAdminUserEdit} className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-xl space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">Edit User Account</h3>
              <p className="text-xs text-muted-foreground">{editingAdminUser.email} (ID: #{editingAdminUser.id})</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Full Name</label>
                <Input
                  value={editAdminUserName}
                  onChange={(e) => setEditAdminUserName(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingAdminUser(null)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={savingAdminUserEdit} className="h-9 text-xs font-semibold">
                {savingAdminUserEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Hosted Events & Attendees */}
      {activeTab === 'events' && <MyCreatedEventsSection isAdmin={true} />}

      {/* Tab: Payment History */}
      {activeTab === 'payments' && <PaymentHistorySection />}
    </div>
  );
};

export default AdminDashboard;
