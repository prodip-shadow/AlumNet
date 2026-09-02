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
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const [uploadingPic, setUploadingPic] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [currentPosition, setCurrentPosition] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
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
      const [profRes, skillsRes] = await Promise.allSettled([
        api.get('/api/profile/me'),
        api.get('/api/skills'),
      ]);

      if (profRes.status === 'fulfilled' && profRes.value.data?.success) {
        const p = profRes.value.data.profile || {};
        setProfile(p);
        if (p.name) setName(p.name);
        setBio(p.bio || '');
        setCurrentPosition(p.currentPosition || '');
        setCurrentCompany(p.currentCompany || '');
        setCurrentLocation(p.currentLocation || '');
        setGithubLink(p.githubLink || '');
        setLinkedinLink(p.linkedinLink || '');
        setPortfolioLink(p.portfolioLink || p.personalWebsite || '');

        const userSkills = profRes.value.data.skills || [];
        setSkills(userSkills);
        setSelectedSkillIds(userSkills.map((s) => s.id));
      }

      if (skillsRes.status === 'fulfilled' && skillsRes.value.data?.success) {
        setAllSkills(skillsRes.value.data.skills || []);
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
        bio,
        currentPosition,
        currentCompany,
        currentLocation,
        githubLink,
        linkedinLink,
        personalWebsite: portfolioLink,
        portfolioLink,
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
        <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground">Personal & Professional Info</h3>
            <p className="text-xs text-muted-foreground">Keep your profile details up-to-date.</p>
          </div>

          <div className="space-y-3.5 text-xs">
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
              <label className="font-semibold block mb-1">About Me / Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief introduction about yourself..."
                rows={3}
                className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
            </div>

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
                <label className="font-semibold block mb-1">Location / City</label>
                <Input
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  placeholder="e.g. Dhaka, Bangladesh"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Social Links */}
        <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground">Social & Portfolio Links</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="font-semibold block mb-1 flex items-center gap-1.5">
                <FaLinkedin className="h-3.5 w-3.5 text-primary" />
                <span>LinkedIn</span>
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
                <span>GitHub</span>
              </label>
              <Input
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                placeholder="https://github.com/..."
                className="h-9 text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold block mb-1 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-emerald-600" />
                <span>Personal Website</span>
              </label>
              <Input
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
                placeholder="https://..."
                className="h-9 text-xs"
              />
            </div>
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
