'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  X,
  Briefcase,
  MapPin,
  Globe,
  Mail,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Code,
  ShieldCheck,
  User,
  Loader2,
  Calendar,
} from 'lucide-react';
import { FaLinkedin, FaGithub, FaFacebook, FaWhatsapp } from 'react-icons/fa6';
import { SiCodeforces, SiLeetcode, SiCodechef, SiHackerrank } from 'react-icons/si';
import ProjectsSection from './ProjectsSection';

export default function UserProfileModal({ userId, isOpen, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !userId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchUserProfile = async () => {
      try {
        const res = await api.get(`/api/profile/user/${userId}`);
        if (isMounted && res.data?.success && res.data.profile) {
          setProfile(res.data.profile);
        } else {
          setError('Profile not found');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load user profile');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <Card className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">
              {profile?.role === 'STUDENT' ? 'Student Profile' : 'Member Profile'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading profile details...</p>
            </div>
          ) : error || !profile ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm font-semibold text-destructive">{error || 'Could not load profile'}</p>
              <Button size="sm" variant="outline" onClick={onClose} className="text-xs">
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Hero Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-md shrink-0">
                  {profile.profileImageUrl && (
                    <AvatarImage src={profile.profileImageUrl} alt={profile.name} className="object-cover" />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl">
                    {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'US'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-xl font-extrabold text-foreground">{profile.name}</h2>
                    <Badge
                      variant="secondary"
                      className={`text-xs font-semibold px-2.5 py-0.5 ${
                        profile.role === 'ALUMNI'
                          ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                          : profile.role === 'STUDENT'
                          ? 'bg-blue-500/10 text-blue-800 dark:text-blue-300'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {profile.role}
                    </Badge>
                  </div>

                  {(profile.currentPosition || profile.currentCompany) && (
                    <p className="text-xs font-medium text-foreground flex items-center justify-center sm:justify-start gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-primary" />
                      <span>
                        {profile.currentPosition}
                        {profile.currentCompany ? ` at ${profile.currentCompany}` : ''}
                      </span>
                    </p>
                  )}

                  {profile.district && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>District: {profile.district}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Academic Details */}
              {(profile.facultyName || profile.departmentName || profile.session || profile.currentSemester) && (
                <div className="p-4 bg-muted/30 rounded-2xl border border-border/80 space-y-2.5">
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 border-b border-border pb-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                    <span>Academic Information</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {profile.facultyName && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Faculty:</span>
                        <span className="font-semibold text-foreground">{profile.facultyName}</span>
                      </div>
                    )}
                    {profile.departmentName && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Department:</span>
                        <span className="font-semibold text-foreground">{profile.departmentName}</span>
                      </div>
                    )}
                    {profile.session && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Session:</span>
                        <span className="font-semibold text-foreground">{profile.session}</span>
                      </div>
                    )}
                    {profile.currentSemester && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Current Semester:</span>
                        <span className="font-semibold text-foreground">{profile.currentSemester}</span>
                      </div>
                    )}
                    {profile.expectedGraduationYear && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Expected Graduation:</span>
                        <span className="font-semibold text-foreground">{profile.expectedGraduationYear}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bio & Career Interests */}
              {(profile.bio || profile.careerInterests) && (
                <div className="p-4 bg-muted/30 rounded-2xl border border-border/80 space-y-2.5">
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 border-b border-border pb-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-primary" />
                    <span>About & Career Goals</span>
                  </h4>
                  {profile.bio && <p className="text-xs text-foreground leading-relaxed">{profile.bio}</p>}
                  {profile.careerInterests && (
                    <div className="text-xs pt-1">
                      <span className="text-muted-foreground block text-[10px]">Career Interests:</span>
                      <p className="font-medium text-foreground">{profile.careerInterests}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Competitive Programming & Coding Profiles */}
              {(profile.codeforcesLink || profile.leetcodeLink || profile.codechefLink || profile.hackerrankLink) && (
                <div className="p-4 bg-muted/30 rounded-2xl border border-border/80 space-y-2.5">
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 border-b border-border pb-1.5">
                    <Code className="h-3.5 w-3.5 text-primary" />
                    <span>Competitive Programming Profiles</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {profile.codeforcesLink && (
                      <a
                        href={profile.codeforcesLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 bg-card rounded-xl border border-border/70 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <SiCodeforces className="h-3.5 w-3.5 text-blue-500" />
                          <span>Codeforces</span>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    )}
                    {profile.leetcodeLink && (
                      <a
                        href={profile.leetcodeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 bg-card rounded-xl border border-border/70 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <SiLeetcode className="h-3.5 w-3.5 text-amber-500" />
                          <span>LeetCode</span>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    )}
                    {profile.codechefLink && (
                      <a
                        href={profile.codechefLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 bg-card rounded-xl border border-border/70 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <SiCodechef className="h-3.5 w-3.5 text-amber-700" />
                          <span>CodeChef</span>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    )}
                    {profile.hackerrankLink && (
                      <a
                        href={profile.hackerrankLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 bg-card rounded-xl border border-border/70 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <SiHackerrank className="h-3.5 w-3.5 text-emerald-600" />
                          <span>HackerRank</span>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="p-4 bg-muted/30 rounded-2xl border border-border/80 space-y-2">
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 border-b border-border pb-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>Skills</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profile.skills.map((s) => (
                      <Badge key={s.id} variant="outline" className="text-xs bg-background">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Social & Portfolio Links */}
              {(profile.githubLink || profile.linkedinLink || profile.facebookLink || profile.portfolioLink || profile.personalWebsite) && (
                <div className="p-4 bg-muted/30 rounded-2xl border border-border/80 space-y-2.5">
                  <h4 className="font-bold text-xs text-foreground border-b border-border pb-1.5">
                    Social & Portfolios
                  </h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {profile.linkedinLink && (
                      <a
                        href={profile.linkedinLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-xl hover:text-primary transition-colors"
                      >
                        <FaLinkedin className="h-3.5 w-3.5 text-primary" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {profile.githubLink && (
                      <a
                        href={profile.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-xl hover:text-foreground transition-colors"
                      >
                        <FaGithub className="h-3.5 w-3.5 text-foreground" />
                        <span>GitHub</span>
                      </a>
                    )}
                    {profile.facebookLink && (
                      <a
                        href={profile.facebookLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-xl hover:text-blue-600 transition-colors"
                      >
                        <FaFacebook className="h-3.5 w-3.5 text-blue-600" />
                        <span>Facebook</span>
                      </a>
                    )}
                    {(profile.portfolioLink || profile.personalWebsite) && (
                      <a
                        href={profile.portfolioLink || profile.personalWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-xl hover:text-emerald-600 transition-colors"
                      >
                        <Globe className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Portfolio</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Showcase Projects */}
              <div className="pt-2 border-t border-border">
                <ProjectsSection userId={userId} isOwner={false} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-muted/20 border-t border-border flex items-center justify-between">
          {profile?.role === 'ALUMNI' ? (
            <Link href={`/alumni/${profile.userId || userId}`} onClick={onClose}>
              <Button size="sm" className="text-xs font-semibold gap-1">
                <span>View Full Alumni Page</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : (
            <span className="text-[11px] text-muted-foreground">PSTU AlumNet Member</span>
          )}

          <Button size="sm" variant="outline" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
