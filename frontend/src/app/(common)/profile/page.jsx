'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  User,
  Camera,
  Mail,
  Building,
  GraduationCap,
  Briefcase,
  Globe,
  MapPin,
  Sparkles,
  LayoutDashboard,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Code2,
  Check,
  Plus,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldAlert,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import { FaLinkedin, FaGithub } from 'react-icons/fa6';
import { toast } from 'react-toastify';

export default function ProfilePage() {
  const { user, setUser, loading: authLoading, fetchCurrentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const [uploadingPic, setUploadingPic] = useState(false);

  // Active Profile Tab State (Default: 'personal')
  const [activeTab, setActiveTab] = useState('personal');

  // Academics State
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facultyId, setFacultyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [session, setSession] = useState('');
  const [currentSemester, setCurrentSemester] = useState('');
  const [graduationYear, setGraduationYear] = useState('');

  // Personal Form State
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [bio, setBio] = useState('');
  const [careerInterests, setCareerInterests] = useState('');
  const [currentPosition, setCurrentPosition] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');

  // Contact State
  const [contactEmail, setContactEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Links State
  const [githubLink, setGithubLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');

  // CP Links State
  const [codeforcesLink, setCodeforcesLink] = useState('');
  const [codechefLink, setCodechefLink] = useState('');
  const [leetcodeLink, setLeetcodeLink] = useState('');
  const [hackerrankLink, setHackerrankLink] = useState('');

  const [selectedSkillIds, setSelectedSkillIds] = useState([]);
  const [saving, setSaving] = useState(false);

  // Security Tab States
  // 1. Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // 2. Email Change State
  const [newEmail, setNewEmail] = useState('');
  const [emailAccountPassword, setEmailAccountPassword] = useState('');
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);

  // 3. 2FA Toggle State
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [tfPassword, setTfPassword] = useState('');
  const [showTfPass, setShowTfPass] = useState(false);
  const [toggling2FA, setToggling2FA] = useState(false);

  const showFeedback = (type, msg) => {
    if (type === 'success') toast.success(msg, { autoClose: 1500 });
    else if (type === 'error') toast.error(msg, { autoClose: 2000 });
    else toast.info(msg, { autoClose: 1500 });
  };

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setName(user.name || '');
    setIs2FAEnabled(Boolean(user.isTwoFactorEnabled));

    try {
      const [profRes, skillsRes, facRes, deptRes] = await Promise.allSettled([
        api.get('/api/profile/me'),
        api.get('/api/skills'),
        api.get('/api/faculties'),
        api.get('/api/departments'),
      ]);

      if (profRes.status === 'fulfilled' && profRes.value.data?.success) {
        const p = profRes.value.data.profile || {};
        setProfile(p);
        if (p.name) setName(p.name);
        setDistrict(p.district || '');
        setBio(p.bio || '');
        setCareerInterests(p.careerInterests || '');
        setCurrentPosition(p.currentPosition || '');
        setCurrentCompany(p.currentCompany || '');
        setCurrentLocation(p.currentLocation || '');
        setContactEmail(p.contactEmail || '');
        setWhatsappNumber(p.whatsappNumber || '');
        setFacultyId(p.facultyId ? String(p.facultyId) : '');
        setDepartmentId(p.departmentId ? String(p.departmentId) : '');
        setSession(p.session || '');
        setCurrentSemester(p.currentSemester || '');
        setGraduationYear(p.expectedGraduationYear || p.graduationYear || '');
        setGithubLink(p.githubLink || '');
        setLinkedinLink(p.linkedinLink || '');
        setFacebookLink(p.facebookLink || '');
        setPortfolioLink(p.portfolioLink || '');
        setCodeforcesLink(p.codeforcesLink || '');
        setCodechefLink(p.codechefLink || '');
        setLeetcodeLink(p.leetcodeLink || '');
        setHackerrankLink(p.hackerrankLink || '');
        setSelectedSkillIds((p.skills || []).map((s) => s.id));
      }

      if (skillsRes.status === 'fulfilled' && skillsRes.value.data?.success) {
        setAllSkills(skillsRes.value.data.skills || []);
      }

      if (facRes.status === 'fulfilled' && facRes.value.data?.success) {
        setFaculties(facRes.value.data.faculties || []);
      }

      if (deptRes.status === 'fulfilled' && deptRes.value.data?.success) {
        setDepartments(deptRes.value.data.departments || []);
      }
    } catch (err) {
      showFeedback('error', 'Failed to load profile details');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setNewEmail('');
    setEmailAccountPassword('');
    setTfPassword('');
  }, [activeTab]);

  const filteredDepartments = departments.filter(
    (d) => String(d.facultyId) === String(facultyId)
  );

  const toggleSkill = (skillId) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPic(true);
      const formData = new FormData();
      formData.append('profileImage', file);

      const res = await api.put('/api/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        showFeedback('success', 'Profile picture updated successfully!');
        if (res.data.profileImageUrl && setUser) {
          setUser((prev) => ({ ...prev, profileImageUrl: res.data.profileImageUrl }));
        }
        fetchProfile();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPic(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name,
        district,
        bio,
        careerInterests,
        currentPosition,
        currentCompany,
        currentLocation,
        contactEmail,
        whatsappNumber,
        facultyId: facultyId ? parseInt(facultyId) : null,
        departmentId: departmentId ? parseInt(departmentId) : null,
        session,
        currentSemester,
        expectedGraduationYear: graduationYear,
        graduationYear,
        githubLink,
        linkedinLink,
        facebookLink,
        portfolioLink,
        codeforcesLink,
        codechefLink,
        leetcodeLink,
        hackerrankLink,
        skillIds: selectedSkillIds,
      };

      const res = await api.put('/api/profile/update', payload);

      if (res.data?.success) {
        showFeedback('success', 'Profile updated successfully!');
        if (setUser && name) {
          setUser((prev) => ({ ...prev, name }));
        }
        fetchProfile();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Security Handlers
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    try {
      setChangingPass(true);
      const res = await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPass(false);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!newEmail || !emailAccountPassword) {
      toast.error('Please enter new email and account password');
      return;
    }

    try {
      setChangingEmail(true);
      const res = await api.post('/api/auth/change-email', {
        newEmail,
        password: emailAccountPassword,
      });

      if (res.data?.success) {
        toast.success('Email updated successfully!');
        setNewEmail('');
        setEmailAccountPassword('');
        fetchCurrentUser();
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update email');
    } finally {
      setChangingEmail(false);
    }
  };

  const handleToggle2FA = async (e) => {
    e.preventDefault();
    if (!tfPassword) {
      toast.error('Please enter your account password to confirm 2FA change');
      return;
    }

    const targetStatus = !is2FAEnabled;

    try {
      setToggling2FA(true);
      const res = await api.post('/api/auth/toggle-2fa', {
        password: tfPassword,
        enable: targetStatus,
      });

      if (res.data?.success) {
        toast.success(res.data.message);
        setIs2FAEnabled(targetStatus);
        setTfPassword('');
        fetchCurrentUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update 2FA status');
    } finally {
      setToggling2FA(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-semibold">Loading Profile Data...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const role = user.role?.toUpperCase() || 'USER';

  const navTabs = [
    { id: 'personal', label: 'Personal & Profile Info', icon: User },
    { id: 'academic', label: 'Academic Info', icon: GraduationCap },
    { id: 'contact', label: 'Contact & Social Links', icon: Mail },
    { id: 'cp', label: 'CP Handles', icon: Code2 },
    { id: 'security', label: 'Security & 2FA', icon: Lock },
  ];

  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto space-y-6">
      {/* Profile Header Banner */}
      <Card className="border border-border bg-card p-6 rounded-2xl shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with Camera Overlay */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="h-24 w-24 border-2 border-border shadow-xs">
                {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} alt={user.name} />}
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                </AvatarFallback>
              </Avatar>

              <div
                className="absolute inset-0 bg-background/70 backdrop-blur-2xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-foreground"
                title="Click to change picture"
              >
                {uploadingPic ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPic}
              className="h-7 px-2.5 text-[11px] font-semibold gap-1 rounded-lg border-border cursor-pointer shadow-2xs"
            >
              {uploadingPic ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Camera className="h-3 w-3 text-primary" />
                  <span>Change Photo</span>
                </>
              )}
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePictureChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* User Summary Info */}
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
              <Badge
                variant="secondary"
                className={`self-center sm:self-auto text-xs font-bold ${
                  role === 'ADMIN'
                    ? 'bg-purple-500/10 text-purple-700'
                    : role === 'ALUMNI'
                    ? 'bg-emerald-500/10 text-emerald-700'
                    : role === 'STUDENT'
                    ? 'bg-blue-500/10 text-blue-700'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {role}
              </Badge>
              {is2FAEnabled && (
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 self-center sm:self-auto">
                  <ShieldCheck className="h-3 w-3" />
                  2FA Active
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              <span>{user.email}</span>
            </p>

            {(profile?.facultyName || profile?.departmentName) && (
              <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                <Building className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>
                  {profile.facultyName || 'No Faculty'}
                  {profile.departmentName ? ` — ${profile.departmentName}` : ''}
                </span>
              </p>
            )}

            {(currentPosition || currentCompany) && (
              <p className="text-xs font-medium text-foreground flex items-center justify-center sm:justify-start gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{currentPosition} {currentCompany ? `at ${currentCompany}` : ''}</span>
              </p>
            )}

            {district && (
              <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>Home District: <strong className="text-foreground">{district}</strong></span>
              </p>
            )}
          </div>

          <Link href="/dashboard">
            <Button size="sm" className="text-xs font-semibold gap-1.5 cursor-pointer h-9 shadow-2xs">
              <LayoutDashboard className="h-4 w-4" />
              <span>Open Dashboard</span>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Profile Section Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border no-scrollbar scroll-smooth">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREA */}
      <div>
        {/* TAB 1: Personal & Profile Info (DEFAULT FIRST TAB) */}
        {activeTab === 'personal' && (
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span>Personal & Professional Info</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">Manage your name, district, bio, location, and career details.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Full Name</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Home District</label>
                  <Input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Patuakhali, Dhaka, Barishal"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Current Role / Job Title</label>
                  <Input
                    type="text"
                    value={currentPosition}
                    onChange={(e) => setCurrentPosition(e.target.value)}
                    placeholder="e.g. Software Engineer / Student"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Current Company / Institution</label>
                  <Input
                    type="text"
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    placeholder="e.g. Google / PSTU"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Current Location (City / Country)</label>
                  <Input
                    type="text"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    placeholder="e.g. Dhaka, Bangladesh"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Career Interests</label>
                  <Input
                    type="text"
                    value={careerInterests}
                    onChange={(e) => setCareerInterests(e.target.value)}
                    placeholder="e.g. Web Development, AI, Data Science"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">Bio Summary</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the community about yourself, your background, and experience..."
                    className="w-full p-3 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>
              </div>

              {/* Skills Selector */}
              {allSkills.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <label className="font-semibold block text-xs mb-2">Select Your Skills</label>
                  <div className="flex flex-wrap gap-1.5">
                    {allSkills.map((s) => {
                      const isSel = selectedSkillIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleSkill(s.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all flex items-center gap-1 cursor-pointer ${
                            isSel
                              ? 'bg-primary/10 text-primary border-primary/30'
                              : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
                          }`}
                        >
                          {isSel ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3 opacity-50" />}
                          <span>{s.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-border flex justify-end">
                <Button type="submit" disabled={saving} className="text-xs font-semibold gap-1.5 cursor-pointer">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span>Save Personal Info</span>
                </Button>
              </div>
            </Card>
          </form>
        )}

        {/* TAB 2: Academic Information */}
        {activeTab === 'academic' && (
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
              <div className="border-b border-border pb-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span>Academic Information</span>
                </h3>
                <p className="text-xs text-muted-foreground">Manage your Faculty, Department, Session & Graduation details.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Faculty</label>
                  <select
                    value={facultyId}
                    onChange={(e) => {
                      setFacultyId(e.target.value);
                      setDepartmentId('');
                    }}
                    className="w-full h-9 px-3 text-xs bg-background border border-border rounded-xl text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Select Faculty --</option>
                    {faculties.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    disabled={!facultyId || filteredDepartments.length === 0}
                    className="w-full h-9 px-3 text-xs bg-background border border-border rounded-xl text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Select Department --</option>
                    {filteredDepartments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Session (e.g. 2020-2021)</label>
                  <Input
                    type="text"
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    placeholder="e.g. 2020-2021"
                    className="h-9 text-xs"
                  />
                </div>

                {role === 'STUDENT' ? (
                  <div>
                    <label className="font-semibold block mb-1">Current Semester</label>
                    <Input
                      type="text"
                      value={currentSemester}
                      onChange={(e) => setCurrentSemester(e.target.value)}
                      placeholder="e.g. 4th Year 1st Semester"
                      className="h-9 text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="font-semibold block mb-1">Graduation Year</label>
                    <Input
                      type="text"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      placeholder="e.g. 2024"
                      className="h-9 text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <Button type="submit" disabled={saving} className="text-xs font-semibold gap-1.5 cursor-pointer">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span>Save Academic Details</span>
                </Button>
              </div>
            </Card>
          </form>
        )}

        {/* TAB 3: Contact & Social Links */}
        {activeTab === 'contact' && (
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
              <div className="border-b border-border pb-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>Contact & Social Profiles</span>
                </h3>
                <p className="text-xs text-muted-foreground">Manage your contact email, WhatsApp, and social media handles.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Contact Email</label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="public.contact@email.com"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">WhatsApp Number</label>
                  <Input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+8801700000000"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">GitHub Link</label>
                  <Input
                    type="url"
                    value={githubLink}
                    onChange={(e) => setGithubLink(e.target.value)}
                    placeholder="https://github.com/username"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">LinkedIn Link</label>
                  <Input
                    type="url"
                    value={linkedinLink}
                    onChange={(e) => setLinkedinLink(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Facebook Link</label>
                  <Input
                    type="url"
                    value={facebookLink}
                    onChange={(e) => setFacebookLink(e.target.value)}
                    placeholder="https://facebook.com/username"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Portfolio / Website Link</label>
                  <Input
                    type="url"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <Button type="submit" disabled={saving} className="text-xs font-semibold gap-1.5 cursor-pointer">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span>Save Contact Details</span>
                </Button>
              </div>
            </Card>
          </form>
        )}

        {/* TAB 4: Competitive Programming Handles */}
        {activeTab === 'cp' && (
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
              <div className="border-b border-border pb-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" />
                  <span>Competitive Programming Handles</span>
                </h3>
                <p className="text-xs text-muted-foreground">Share your coding profile handles across top platforms.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Codeforces Profile / Handle</label>
                  <Input
                    type="text"
                    value={codeforcesLink}
                    onChange={(e) => setCodeforcesLink(e.target.value)}
                    placeholder="e.g. tourist or full URL"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">CodeChef Profile / Handle</label>
                  <Input
                    type="text"
                    value={codechefLink}
                    onChange={(e) => setCodechefLink(e.target.value)}
                    placeholder="e.g. username or full URL"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">LeetCode Profile / Handle</label>
                  <Input
                    type="text"
                    value={leetcodeLink}
                    onChange={(e) => setLeetcodeLink(e.target.value)}
                    placeholder="e.g. username or full URL"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">HackerRank Profile / Handle</label>
                  <Input
                    type="text"
                    value={hackerrankLink}
                    onChange={(e) => setHackerrankLink(e.target.value)}
                    placeholder="e.g. username or full URL"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <Button type="submit" disabled={saving} className="text-xs font-semibold gap-1.5 cursor-pointer">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span>Save CP Handles</span>
                </Button>
              </div>
            </Card>
          </form>
        )}

        {/* TAB 5: Security & 2FA (NEW SECURITY TAB) */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Card 1: Change Password */}
            <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
              <div className="border-b border-border pb-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <span>Change Password</span>
                </h3>
                <p className="text-xs text-muted-foreground">Update your account password. Requires your current password.</p>
              </div>

              <form onSubmit={handleChangePassword} autoComplete="off" className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Current Password</label>
                  <div className="relative">
                    <Input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="h-9 text-xs pr-9"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold block mb-1">New Password</label>
                    <div className="relative">
                      <Input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                        className="h-9 text-xs pr-9"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showNewPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Confirm New Password</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        autoComplete="new-password"
                        className="h-9 text-xs pr-9"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showConfirmPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={changingPass}
                    className="text-xs font-semibold gap-1.5 cursor-pointer bg-primary text-primary-foreground"
                  >
                    {changingPass ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                    <span>Update Password</span>
                  </Button>
                </div>
              </form>
            </Card>

            {/* Card 2: Change Registered Email */}
            <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
              <div className="border-b border-border pb-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>Change Email Address</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Current Email: <span className="font-semibold text-foreground">{user?.email}</span>
                </p>
              </div>

              <form onSubmit={handleChangeEmail} autoComplete="off" className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold block mb-1">New Email Address</label>
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="new.email@pstu.ac.bd"
                      autoComplete="off"
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Account Password (for confirmation)</label>
                    <div className="relative">
                      <Input
                        type={showEmailPass ? 'text' : 'password'}
                        value={emailAccountPassword}
                        onChange={(e) => setEmailAccountPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="h-9 text-xs pr-9"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmailPass(!showEmailPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showEmailPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={changingEmail}
                    className="text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    {changingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                    <span>Update Email Address</span>
                  </Button>
                </div>
              </form>
            </Card>

            {/* Card 3: Two-Factor Authentication (2FA) */}
            <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-primary" />
                    <span>Two-Factor Authentication (2FA)</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add an extra layer of security to your account during login.
                  </p>
                </div>

                <Badge
                  variant={is2FAEnabled ? 'default' : 'secondary'}
                  className={`text-xs font-bold px-2.5 py-1 ${
                    is2FAEnabled
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {is2FAEnabled ? '2FA Enabled' : '2FA Disabled'}
                </Badge>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-2 text-xs">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  How 2FA Protection Works:
                </p>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  When Two-Factor Authentication is enabled, signing in with your email and password will require entering a
                  6-digit verification code sent to your email. The verification code is valid for 5 minutes.
                </p>
              </div>

              <form onSubmit={handleToggle2FA} autoComplete="off" className="space-y-4 text-xs pt-1">
                <div>
                  <label className="font-semibold block mb-1">
                    Enter your Account Password to {is2FAEnabled ? 'Disable' : 'Enable'} 2FA
                  </label>
                  <div className="relative max-w-sm">
                    <Input
                      type={showTfPass ? 'text' : 'password'}
                      value={tfPassword}
                      onChange={(e) => setTfPassword(e.target.value)}
                      placeholder="Enter account password"
                      autoComplete="new-password"
                      className="h-9 text-xs pr-9"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowTfPass(!showTfPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showTfPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={toggling2FA || !tfPassword}
                  variant={is2FAEnabled ? 'destructive' : 'default'}
                  className="text-xs font-semibold gap-1.5 cursor-pointer h-9"
                >
                  {toggling2FA ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : is2FAEnabled ? (
                    <ShieldAlert className="h-3.5 w-3.5" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  )}
                  <span>{is2FAEnabled ? 'Disable 2FA Protection' : 'Enable 2FA Protection'}</span>
                </Button>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
