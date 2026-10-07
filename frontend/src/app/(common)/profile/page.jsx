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
} from 'lucide-react';
import Link from 'next/link';
import { FaLinkedin, FaGithub } from 'react-icons/fa6';
import { toast } from 'react-toastify';

export default function ProfilePage() {
  const { user, setUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const [uploadingPic, setUploadingPic] = useState(false);

  // Academics State
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facultyId, setFacultyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [session, setSession] = useState('');
  const [currentSemester, setCurrentSemester] = useState('');
  const [graduationYear, setGraduationYear] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [bio, setBio] = useState('');
  const [careerInterests, setCareerInterests] = useState('');
  const [currentPosition, setCurrentPosition] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Links State
  const [githubLink, setGithubLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');

  // CP Links State (Students)
  const [codeforcesLink, setCodeforcesLink] = useState('');
  const [codechefLink, setCodechefLink] = useState('');
  const [leetcodeLink, setLeetcodeLink] = useState('');
  const [hackerrankLink, setHackerrankLink] = useState('');

  const [selectedSkillIds, setSelectedSkillIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const showFeedback = (type, msg) => {
    if (type === 'success') toast.success(msg, { autoClose: 1500 });
    else if (type === 'error') toast.error(msg, { autoClose: 2000 });
    else toast.info(msg, { autoClose: 1500 });
  };

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setName(user.name || '');
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
        setFacultyId(p.facultyId ? String(p.facultyId) : '');
        setDepartmentId(p.departmentId ? String(p.departmentId) : '');
        setSession(p.session || '');
        setCurrentSemester(p.currentSemester || '');
        setGraduationYear(p.graduationYear || p.expectedGraduationYear || '');
        setBio(p.bio || '');
        setCareerInterests(p.careerInterests || '');
        setCurrentPosition(p.currentPosition || '');
        setCurrentCompany(p.currentCompany || '');
        setCurrentLocation(p.currentLocation || '');
        setContactEmail(p.contactEmail || '');
        setWhatsappNumber(p.whatsappNumber || '');
        setGithubLink(p.githubLink || '');
        setLinkedinLink(p.linkedinLink || '');
        setFacebookLink(p.facebookLink || '');
        setPortfolioLink(p.portfolioLink || p.personalWebsite || '');
        setCodeforcesLink(p.codeforcesLink || '');
        setCodechefLink(p.codechefLink || '');
        setLeetcodeLink(p.leetcodeLink || '');
        setHackerrankLink(p.hackerrankLink || '');

        const userSkills = profRes.value.data.skills || [];
        setSkills(userSkills);
        setSelectedSkillIds(userSkills.map((s) => s.id));
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
      console.warn('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Filtered Departments based on selected faculty
  const filteredDepartments = facultyId
    ? departments.filter((d) => Number(d.facultyId) === Number(facultyId))
    : [];

  // Handle Profile Picture Upload
  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profileImage', file);

    setUploadingPic(true);
    try {
      const res = await api.put('/api/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data.profileImageUrl) {
        showFeedback('success', 'Profile picture updated successfully!');
        const updatedUser = { ...user, profileImageUrl: res.data.profileImageUrl };
        if (setUser) setUser(updatedUser);
        try {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (e) {}
        fetchProfile();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPic(false);
    }
  };

  // Handle Save
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        district: district.trim(),
        facultyId: facultyId ? Number(facultyId) : null,
        departmentId: departmentId ? Number(departmentId) : null,
        session: session.trim(),
        currentSemester: currentSemester.trim(),
        expectedGraduationYear: graduationYear ? Number(graduationYear) : null,
        graduationYear: graduationYear ? Number(graduationYear) : null,
        bio,
        careerInterests,
        currentPosition,
        currentCompany,
        currentLocation,
        contactEmail: contactEmail.trim(),
        whatsappNumber: whatsappNumber.trim(),
        githubLink,
        linkedinLink,
        facebookLink,
        personalWebsite: portfolioLink,
        portfolioLink,
        codeforcesLink,
        codechefLink,
        leetcodeLink,
        hackerrankLink,
        skills: Array.isArray(selectedSkillIds)
          ? selectedSkillIds
              .filter((id) => Number.isInteger(Number(id)) && Number(id) > 0)
              .map(Number)
          : [],
      };

      const res = await api.put('/api/profile/me', payload);
      if (res.data?.success) {
        showFeedback('success', 'Profile updated successfully!');
        const updatedUser = { ...user, name: name.trim() };
        if (setUser) setUser(updatedUser);
        try {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (e) {}
        fetchProfile();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto space-y-6">
        <Card className="border border-border bg-card p-6 rounded-2xl shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="h-24 w-24 rounded-full bg-muted animate-pulse shrink-0 border border-border" />
            <div className="flex-1 space-y-3 w-full text-center sm:text-left">
              <div className="h-6 w-48 bg-muted animate-pulse rounded mx-auto sm:mx-0" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded mx-auto sm:mx-0" />
              <div className="h-4 w-40 bg-muted animate-pulse rounded mx-auto sm:mx-0" />
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border border-border bg-card p-6 rounded-2xl shadow-2xs space-y-4">
            <div className="h-5 w-40 bg-muted animate-pulse rounded" />
            <div className="space-y-3">
              <div className="h-9 w-full bg-muted animate-pulse rounded-xl" />
              <div className="h-20 w-full bg-muted animate-pulse rounded-xl" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="h-9 w-full bg-muted animate-pulse rounded-xl" />
                <div className="h-9 w-full bg-muted animate-pulse rounded-xl" />
              </div>
            </div>
          </Card>

          <Card className="border border-border bg-card p-6 rounded-2xl shadow-2xs space-y-4">
            <div className="h-5 w-44 bg-muted animate-pulse rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="h-9 w-full bg-muted animate-pulse rounded-xl" />
              <div className="h-9 w-full bg-muted animate-pulse rounded-xl" />
            </div>
          </Card>

          <Card className="border border-border bg-card p-6 rounded-2xl shadow-2xs space-y-4">
            <div className="h-5 w-36 bg-muted animate-pulse rounded" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-7 w-20 bg-muted animate-pulse rounded-full" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <User className="h-12 w-12 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-bold text-foreground">Sign In to View Profile</h2>
        <Link href="/login">
          <Button size="sm" className="text-xs font-semibold">
            Log In
          </Button>
        </Link>
      </div>
    );
  }

  const role = user.role?.toUpperCase() || 'USER';

  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto space-y-6">
      {/* Profile Header Banner */}
      <Card className="border border-border bg-card p-6 rounded-2xl shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with Camera Overlay & Button */}
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

          {/* User Details */}
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

            {currentLocation && (
              <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{currentLocation}</span>
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

      {/* Edit Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Academic Information (Faculty, Department, Session, Semester, Year) Card */}
        <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span>Academic Information</span>
            </h3>
            <p className="text-xs text-muted-foreground">Manage your Faculty, Department, Session & Graduation details.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
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
                <option value="">
                  {!facultyId
                    ? '-- Select Faculty First --'
                    : filteredDepartments.length === 0
                    ? '-- No Departments Available --'
                    : '-- Select Department --'}
                </option>
                {filteredDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">Session</label>
              <Input
                value={session}
                onChange={(e) => setSession(e.target.value)}
                placeholder="e.g. 2020-2021"
                className="h-9 text-xs"
              />
            </div>

            {role === 'STUDENT' ? (
              <>
                <div>
                  <label className="font-semibold block mb-1">Current Semester</label>
                  <Input
                    value={currentSemester}
                    onChange={(e) => setCurrentSemester(e.target.value)}
                    placeholder="e.g. 8th Semester"
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Expected Graduation Year</label>
                  <Input
                    type="number"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="e.g. 2025"
                    className="h-9 text-xs"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="font-semibold block mb-1">Graduation Year</label>
                <Input
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  placeholder="e.g. 2023"
                  className="h-9 text-xs"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Personal & Professional Info Card */}
        <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground">Personal & Professional Info</h3>
            <p className="text-xs text-muted-foreground">Keep your name, home district, and bio updated.</p>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-semibold block mb-1">Full Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Home District</label>
                <Input
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Patuakhali, Dhaka, Barishal"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">About Me / Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief introduction about yourself..."
                rows={3}
                className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
            </div>

            {role === 'ALUMNI' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold block mb-1">Job Title / Position</label>
                  <Input
                    value={currentPosition}
                    onChange={(e) => setCurrentPosition(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Company / Organization</label>
                  <Input
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    placeholder="e.g. Tech Corp"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">Current City / Location</label>
                  <Input
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    placeholder="e.g. Dhaka, Bangladesh"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            )}

            {role === 'STUDENT' && (
              <div>
                <label className="font-semibold block mb-1">Career Interests</label>
                <Input
                  value={careerInterests}
                  onChange={(e) => setCareerInterests(e.target.value)}
                  placeholder="e.g. Full Stack Development, Data Science, Competitive Programming"
                  className="h-9 text-xs"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Contact Information (Email & Phone / WhatsApp) */}
        {role === 'ALUMNI' && (
          <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-primary" />
                <span>Direct Contact Info</span>
              </h3>
              <p className="text-xs text-muted-foreground">Your contact info can be made private to friends from your Alumni Dashboard.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">Contact Email</label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. yourname@example.com"
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">WhatsApp / Phone Number</label>
                <Input
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. +8801700000000"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Social Links & Coding Handles */}
        <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground">Social & Portfolio Links</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="font-semibold block mb-1 flex items-center gap-1.5">
                <FaLinkedin className="h-3.5 w-3.5 text-primary" />
                <span>LinkedIn Profile</span>
              </label>
              <Input
                value={linkedinLink}
                onChange={(e) => setLinkedinLink(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 flex items-center gap-1.5">
                <FaGithub className="h-3.5 w-3.5" />
                <span>GitHub Profile</span>
              </label>
              <Input
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                placeholder="https://github.com/..."
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-emerald-600" />
                <span>Personal Website / Portfolio</span>
              </label>
              <Input
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
                placeholder="https://..."
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-blue-600" />
                <span>Facebook Profile</span>
              </label>
              <Input
                value={facebookLink}
                onChange={(e) => setFacebookLink(e.target.value)}
                placeholder="https://facebook.com/..."
                className="h-9 text-xs"
              />
            </div>

            {role === 'STUDENT' && (
              <>
                <div>
                  <label className="font-semibold block mb-1">Codeforces Handle / Link</label>
                  <Input
                    value={codeforcesLink}
                    onChange={(e) => setCodeforcesLink(e.target.value)}
                    placeholder="e.g. handle or profile link"
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">LeetCode Handle / Link</label>
                  <Input
                    value={leetcodeLink}
                    onChange={(e) => setLeetcodeLink(e.target.value)}
                    placeholder="e.g. handle or profile link"
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">CodeChef Handle / Link</label>
                  <Input
                    value={codechefLink}
                    onChange={(e) => setCodechefLink(e.target.value)}
                    placeholder="e.g. handle or profile link"
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">HackerRank Handle / Link</label>
                  <Input
                    value={hackerrankLink}
                    onChange={(e) => setHackerrankLink(e.target.value)}
                    placeholder="e.g. handle or profile link"
                    className="h-9 text-xs"
                  />
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Skills Tagging */}
        <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Skills & Expertise</span>
            </h3>
          </div>

          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {allSkills.map((s) => {
              const isSelected = selectedSkillIds.includes(s.id);
              return (
                <Badge
                  key={s.id}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedSkillIds(selectedSkillIds.filter((id) => id !== s.id));
                    } else {
                      setSelectedSkillIds([...selectedSkillIds, s.id]);
                    }
                  }}
                  className={`cursor-pointer text-xs px-3 py-1 font-medium transition-all inline-flex items-center gap-1.5 ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'hover:border-primary/50'
                  }`}
                >
                  {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  <span>{s.name}</span>
                </Badge>
              );
            })}
          </div>
        </Card>

        <Button type="submit" disabled={saving} className="h-10 px-6 text-xs font-semibold gap-1.5 cursor-pointer">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          <span>Save Changes</span>
        </Button>
      </form>
    </div>
  );
}
