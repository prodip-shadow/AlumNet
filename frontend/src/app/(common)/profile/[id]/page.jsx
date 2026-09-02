'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Globe,
  Mail,
  Lock,
  GraduationCap,
  Sparkles,
  Building,
  UserPlus,
  UserMinus,
  Check,
  Loader2,
  Calendar,
  ExternalLink,
  User,
  BookOpen,
  Code,
  Compass,
  Phone,
  PhoneCall,
} from 'lucide-react';
import { FaLinkedin, FaGithub, FaFacebook, FaWhatsapp } from 'react-icons/fa6';
import { SiCodeforces, SiLeetcode, SiCodechef, SiHackerrank } from 'react-icons/si';
import { toast } from 'react-toastify';
import ProjectsSection from '@/components/shared/ProjectsSection';

export default function UserProfileDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id;
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const isSelf = currentUser && Number(currentUser.id) === Number(userId);

  const fetchUserProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/profile/user/${userId}`);
      if (res.data?.success && res.data.profile) {
        setProfile(res.data.profile);
        setIsConnected(Boolean(res.data.isConnected));
        if (res.data.connectionId) {
          setConnectionId(res.data.connectionId);
        }
      } else {
        setError('User profile could not be found.');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err.response?.data?.message || 'Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Check pending outgoing requests
  const checkOutgoingRequests = useCallback(async () => {
    if (!currentUser || isSelf || !userId) return;
    try {
      const outRes = await api.get('/api/connections/outgoing');
      if (outRes.data?.success) {
        const hasOut = (outRes.data.requests || []).some(
          (r) => Number(r.recipientId) === Number(userId)
        );
        if (hasOut) setIsPending(true);
      }
    } catch (e) {
      // Ignore
    }
  }, [currentUser, isSelf, userId]);

  useEffect(() => {
    fetchUserProfile();
    checkOutgoingRequests();
  }, [fetchUserProfile, checkOutgoingRequests]);

  // Handle Send Connection
  const handleSendConnection = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (connecting || isPending || isConnected || isSelf) return;

    setConnecting(true);
    try {
      const res = await api.post(`/api/connections/request/${userId}`);
      if (res.data?.success) {
        setIsPending(true);
        toast.success(`Connection request sent to ${profile?.name || 'user'}!`, { autoClose: 1500 });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send connection request';
      toast.error(msg, { autoClose: 2000 });
      if (msg.toLowerCase().includes('already')) {
        setIsPending(true);
      }
    } finally {
      setConnecting(false);
    }
  };

  // Handle Disconnect (Unfriend)
  const handleDisconnect = async () => {
    if (!currentUser || disconnecting || !isConnected) return;
    if (!confirm(`Are you sure you want to disconnect from ${profile?.name || 'this user'}?`)) return;

    setDisconnecting(true);
    try {
      let targetConnId = connectionId;
      if (!targetConnId) {
        const connRes = await api.get('/api/connections');
        const match = (connRes.data?.connections || []).find(
          (c) => Number(c.connectedUserId) === Number(userId)
        );
        targetConnId = match?.connectionId || match?.id;
      }

      if (targetConnId) {
        await api.delete(`/api/connections/${targetConnId}`);
        setIsConnected(false);
        setConnectionId(null);
        toast.info(`Disconnected from ${profile?.name || 'user'}`, { autoClose: 1500 });
        fetchUserProfile();
      }
    } catch (err) {
      console.error('Error disconnecting:', err);
      toast.error('Failed to disconnect. Please try again.', { autoClose: 2000 });
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading profile details...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-[60vh] max-w-lg mx-auto flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-3 bg-destructive/10 text-destructive rounded-full">
          <GraduationCap className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-foreground">{error || 'Profile Not Found'}</h2>
        <p className="text-xs text-muted-foreground">
          The requested profile may not exist or has been removed.
        </p>
        <Button size="sm" variant="outline" onClick={() => router.back()} className="text-xs gap-1.5 cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Go Back</span>
        </Button>
      </div>
    );
  }

  const role = profile.role || 'USER';
  const isAlumni = role === 'ALUMNI';
  const isStudent = role === 'STUDENT';

  // Check if viewer has full contact access (Accepted Connection, Self, or Admin)
  const isAdmin = currentUser && currentUser.role === 'ADMIN';
  const hasAccess = isConnected || isSelf || isAdmin;

  // Parse contact methods selected by alumni
  let selectedContactMethods = [];
  if (profile.visibleContactMethods) {
    try {
      selectedContactMethods = typeof profile.visibleContactMethods === 'string'
        ? JSON.parse(profile.visibleContactMethods)
        : profile.visibleContactMethods;
    } catch (e) {
      selectedContactMethods = [];
    }
  }

  // Strict check: Friends/Connections ONLY
  const isMethodAllowed = (methodKey) => {
    if (!hasAccess) return false; // STRICT: Hide contact info if not friends/self/admin!
    if (!Array.isArray(selectedContactMethods) || selectedContactMethods.length === 0) {
      return true; // Default: Allow provided channels if connected
    }
    return selectedContactMethods.includes(methodKey);
  };

  const canShowEmail = profile.contactEmail && isMethodAllowed('email');
  const canShowWhatsapp = profile.whatsappNumber && isMethodAllowed('whatsapp');
  const canShowLinkedin = profile.linkedinLink && isMethodAllowed('linkedin');
  const canShowGithub = profile.githubLink && isMethodAllowed('github');
  const canShowWebsite = (profile.personalWebsite || profile.portfolioLink) && isMethodAllowed('website');
  const canShowFacebook = profile.facebookLink && isMethodAllowed('facebook');
  const canShowBio = Boolean(profile.bio);
  const canShowLocation = Boolean(profile.currentLocation);

  const cpProfiles = [
    { name: 'Codeforces', handle: profile.codeforcesLink, icon: SiCodeforces, color: 'text-amber-500 hover:text-amber-400', url: profile.codeforcesLink?.startsWith('http') ? profile.codeforcesLink : `https://codeforces.com/profile/${profile.codeforcesLink}` },
    { name: 'LeetCode', handle: profile.leetcodeLink, icon: SiLeetcode, color: 'text-yellow-600 hover:text-yellow-500', url: profile.leetcodeLink?.startsWith('http') ? profile.leetcodeLink : `https://leetcode.com/${profile.leetcodeLink}` },
    { name: 'CodeChef', handle: profile.codechefLink, icon: SiCodechef, color: 'text-amber-700 hover:text-amber-600', url: profile.codechefLink?.startsWith('http') ? profile.codechefLink : `https://www.codechef.com/users/${profile.codechefLink}` },
    { name: 'HackerRank', handle: profile.hackerrankLink, icon: SiHackerrank, color: 'text-emerald-600 hover:text-emerald-500', url: profile.hackerrankLink?.startsWith('http') ? profile.hackerrankLink : `https://www.hackerrank.com/${profile.hackerrankLink}` },
  ].filter((cp) => Boolean(cp.handle));

  return (
    <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back</span>
        </button>

        {isSelf && (
          <Link href="/dashboard">
            <Button size="sm" variant="outline" className="h-8 text-xs font-semibold cursor-pointer">
              Edit My Profile
            </Button>
          </Link>
        )}
      </div>

      {/* Main Hero Card */}
      <Card className="border border-border bg-card p-6 md:p-8 rounded-3xl shadow-2xs space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-background shadow-md">
              {profile.profileImageUrl && <AvatarImage src={profile.profileImageUrl} alt={profile.name} />}
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl md:text-3xl">
                {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'US'}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Core Info */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                    {profile.name}
                  </h1>
                  <Badge
                    variant="secondary"
                    className={`text-xs px-2.5 py-0.5 font-bold ${
                      isAlumni
                        ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
                        : isStudent
                        ? 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/20'
                        : 'bg-primary/10 text-primary border-primary/20'
                    }`}
                  >
                    {isAlumni ? 'Verified Alumni' : isStudent ? 'Current Student' : role}
                  </Badge>
                </div>

                {isAlumni && (
                  <p className="text-sm font-semibold text-foreground mt-1 flex items-center justify-center md:justify-start gap-1.5">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <span>
                      {profile.currentPosition
                        ? `${profile.currentPosition} at ${profile.currentCompany || 'Organization'}`
                        : 'PSTU Alumni Member'}
                    </span>
                  </p>
                )}

                {isStudent && (
                  <p className="text-sm font-semibold text-foreground mt-1 flex items-center justify-center md:justify-start gap-1.5">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span>
                      {profile.departmentName || profile.facultyName || 'PSTU Student'}
                    </span>
                  </p>
                )}
              </div>

              {/* Action Button: Connect / Disconnect / Self */}
              {!isSelf && (
                <div className="flex items-center justify-center md:justify-end gap-2 shrink-0">
                  {isConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="h-9 px-4 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border cursor-pointer transition-colors"
                    >
                      {disconnecting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserMinus className="h-3.5 w-3.5" />
                      )}
                      <span>Disconnect</span>
                    </Button>
                  ) : isPending ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled
                      className="h-9 px-4 text-xs font-semibold gap-1.5 opacity-80 cursor-default"
                    >
                      <Check className="h-3.5 w-3.5 text-primary" />
                      <span>Request Pending</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleSendConnection}
                      disabled={connecting}
                      className="h-9 px-4 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {connecting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                      )}
                      <span>Connect</span>
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Sub-meta tags */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-4 text-xs text-muted-foreground pt-1">
              {profile.facultyName && (
                <div className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{profile.facultyName}</span>
                </div>
              )}

              {profile.departmentName && (
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{profile.departmentName}</span>
                </div>
              )}

              {profile.graduationYear && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Batch of {profile.graduationYear}</span>
                </div>
              )}

              {profile.expectedGraduationYear && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Graduating {profile.expectedGraduationYear}</span>
                </div>
              )}

              {canShowLocation && profile.currentLocation && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{profile.currentLocation}</span>
                </div>
              )}

              {profile.district && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{profile.district}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Grid: Details and Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Bio, Career Interests, Academic Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* About / Bio Card */}
          {canShowBio && profile.bio && (
            <Card className="border border-border bg-card p-6 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <User className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">About / Biography</h3>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            </Card>
          )}

          {/* Student Career Interests */}
          {isStudent && profile.careerInterests && (
            <Card className="border border-border bg-card p-6 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Compass className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Career Goals & Interests</h3>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {profile.careerInterests}
              </p>
            </Card>
          )}

          {/* Academic & University Profile */}
          <Card className="border border-border bg-card p-6 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <GraduationCap className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Academic Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium block">Faculty</span>
                <span className="font-semibold text-foreground">{profile.facultyName || 'PSTU'}</span>
              </div>

              <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium block">Department</span>
                <span className="font-semibold text-foreground">{profile.departmentName || 'General'}</span>
              </div>

              {isStudent && profile.universityId && (
                <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium block">Student ID</span>
                  <span className="font-semibold text-foreground">{profile.universityId}</span>
                </div>
              )}

              {isStudent && profile.registrationNumber && (
                <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium block">Reg Number</span>
                  <span className="font-semibold text-foreground">{profile.registrationNumber}</span>
                </div>
              )}

              {isStudent && profile.session && (
                <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium block">Academic Session</span>
                  <span className="font-semibold text-foreground">{profile.session}</span>
                </div>
              )}

              {isStudent && profile.currentSemester && (
                <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium block">Current Semester</span>
                  <span className="font-semibold text-foreground">{profile.currentSemester}</span>
                </div>
              )}

              {isAlumni && profile.graduationYear && (
                <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium block">Graduation Year</span>
                  <span className="font-semibold text-foreground">{profile.graduationYear}</span>
                </div>
              )}

              {profile.district && (
                <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium block">Home District</span>
                  <span className="font-semibold text-foreground">{profile.district}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Competitive Programming Handles (for Students & Coders) */}
          {cpProfiles.length > 0 && (
            <Card className="border border-border bg-card p-6 rounded-2xl shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Code className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Competitive Programming & Coding</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {cpProfiles.map((cp) => {
                  const Icon = cp.icon;
                  return (
                    <a
                      key={cp.name}
                      href={cp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 bg-muted/40 hover:bg-muted/80 rounded-xl border border-border flex items-center justify-between gap-3 group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${cp.color}`} />
                        <div>
                          <span className="text-[11px] text-muted-foreground font-medium block">{cp.name}</span>
                          <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            {cp.handle}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground opacity-60" />
                    </a>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Showcase Projects */}
          <Card className="border border-border bg-card p-6 rounded-2xl shadow-2xs">
            <ProjectsSection userId={userId} isOwner={isSelf} />
          </Card>
        </div>

        {/* Right 1 Col: Contact Information & Skills */}
        <div className="space-y-6">
          {/* Dedicated Contact Information Card */}
          <Card className="border border-border bg-card p-6 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              {hasAccess ? (
                <PhoneCall className="h-4 w-4 text-primary" />
              ) : (
                <Lock className="h-4 w-4 text-amber-500" />
              )}
              <h3 className="font-bold text-sm text-foreground">Contact Information</h3>
            </div>

            {hasAccess ? (
              <div className="space-y-3 text-xs">
                {(canShowEmail || canShowWhatsapp || canShowLinkedin || canShowGithub || canShowWebsite || canShowFacebook) ? (
                  <div className="grid grid-cols-1 gap-2.5">
                    {canShowEmail && (
                      <a
                        href={`mailto:${profile.contactEmail}`}
                        className="p-3 bg-muted/30 hover:bg-muted/70 rounded-xl border border-border flex items-center justify-between gap-2.5 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
                            <Mail className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <span className="text-[10px] text-muted-foreground block font-medium">Email Address</span>
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate block">
                              {profile.contactEmail}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground opacity-60 shrink-0" />
                      </a>
                    )}

                    {canShowWhatsapp && (
                      <a
                        href={`https://wa.me/${profile.whatsappNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-muted/30 hover:bg-muted/70 rounded-xl border border-border flex items-center justify-between gap-2.5 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                            <FaWhatsapp className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <span className="text-[10px] text-muted-foreground block font-medium">WhatsApp / Phone</span>
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate block">
                              {profile.whatsappNumber}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground opacity-60 shrink-0" />
                      </a>
                    )}

                    {canShowLinkedin && (
                      <a
                        href={profile.linkedinLink.startsWith('http') ? profile.linkedinLink : `https://${profile.linkedinLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-muted/30 hover:bg-muted/70 rounded-xl border border-border flex items-center justify-between gap-2.5 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                            <FaLinkedin className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <span className="text-[10px] text-muted-foreground block font-medium">LinkedIn Profile</span>
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate block">
                              {profile.linkedinLink}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground opacity-60 shrink-0" />
                      </a>
                    )}

                    {canShowGithub && (
                      <a
                        href={profile.githubLink.startsWith('http') ? profile.githubLink : `https://${profile.githubLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-muted/30 hover:bg-muted/70 rounded-xl border border-border flex items-center justify-between gap-2.5 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-neutral-500/10 text-foreground rounded-lg shrink-0">
                            <FaGithub className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <span className="text-[10px] text-muted-foreground block font-medium">GitHub Profile</span>
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate block">
                              {profile.githubLink}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground opacity-60 shrink-0" />
                      </a>
                    )}

                    {canShowWebsite && (
                      <a
                        href={
                          (profile.personalWebsite || profile.portfolioLink).startsWith('http')
                            ? profile.personalWebsite || profile.portfolioLink
                            : `https://${profile.personalWebsite || profile.portfolioLink}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-muted/30 hover:bg-muted/70 rounded-xl border border-border flex items-center justify-between gap-2.5 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                            <Globe className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <span className="text-[10px] text-muted-foreground block font-medium">Personal Website / Portfolio</span>
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate block">
                              {profile.personalWebsite || profile.portfolioLink}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground opacity-60 shrink-0" />
                      </a>
                    )}

                    {canShowFacebook && (
                      <a
                        href={profile.facebookLink.startsWith('http') ? profile.facebookLink : `https://${profile.facebookLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-muted/30 hover:bg-muted/70 rounded-xl border border-border flex items-center justify-between gap-2.5 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-blue-600/10 text-blue-500 rounded-lg shrink-0">
                            <FaFacebook className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <span className="text-[10px] text-muted-foreground block font-medium">Facebook Profile</span>
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate block">
                              {profile.facebookLink}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground opacity-60 shrink-0" />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No contact channels shared by this user.</p>
                )}
              </div>
            ) : (
              <div className="p-4 bg-muted/20 border border-border/80 rounded-xl space-y-3 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-foreground">Contact Details Protected</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Contact details and social links (LinkedIn, GitHub, Email, WhatsApp, Facebook, Portfolio) are private. Connect with <strong>{profile.name}</strong> to view their verified contact channels.
                  </p>
                </div>
                {!isSelf && (
                  <div className="pt-1 flex justify-center">
                    {!isPending ? (
                      <Button
                        size="sm"
                        onClick={handleSendConnection}
                        disabled={connecting}
                        className="h-8 px-4 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                        <span>Connect to View Contacts</span>
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="px-3 py-1 text-xs gap-1.5 font-medium">
                        <Check className="h-3.5 w-3.5 text-primary" />
                        <span>Connection Pending</span>
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Skills & Expertise */}
          <Card className="border border-border bg-card p-6 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Skills & Expertise</h3>
            </div>

            {profile.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge
                    key={skill.id || skill.name}
                    variant="outline"
                    className="bg-primary/5 text-foreground border-primary/20 text-xs px-2.5 py-1 font-medium hover:bg-primary/10 transition-colors"
                  >
                    {skill.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No skills listed yet.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
