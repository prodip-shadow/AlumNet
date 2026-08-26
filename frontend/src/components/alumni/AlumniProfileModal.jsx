'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Briefcase,
  MapPin,
  GraduationCap,
  Mail,
  Phone,
  MessageSquare,
  Lock,
  Check,
  UserPlus,
  Loader2,
  ShieldCheck,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { FaLinkedin, FaGithub, FaFacebook, FaGlobe } from 'react-icons/fa6';

const AlumniProfileModal = ({ userId, isOpen, onClose, onConnectionSent }) => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState(null);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchAlumniDetails = async () => {
      setLoading(true);
      setError(null);
      setRequestError(null);
      setRequestSent(false);

      try {
        const response = await api.get(`/api/alumni/${userId}`);
        if (response.data?.success && response.data?.profile) {
          setProfile(response.data.profile);
          setIsConnected(
            Boolean(response.data.isConnected) ||
              Number(currentUser?.id) === Number(userId),
          );
        } else {
          setError('Alumni profile details not found');
        }
      } catch (err) {
        console.error('Error fetching alumni profile:', err);
        setError(
          err.response?.data?.message ||
            'Could not load alumni profile details',
        );
      } finally {
        setLoading(false);
      }
    };

    queueMicrotask(() => {
      fetchAlumniDetails();
    });
  }, [isOpen, userId, currentUser]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSelf = Number(currentUser?.id) === Number(userId);

  const handleSendConnection = async () => {
    if (sendingRequest || requestSent || isSelf) return;

    setSendingRequest(true);
    setRequestError(null);

    try {
      const response = await api.post(`/api/connections/request/${userId}`);
      if (response.data?.success) {
        setRequestSent(true);
        if (onConnectionSent) onConnectionSent(userId);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Failed to send connection request';
      setRequestError(msg);
      // If already pending or connected, update state
      if (msg.toLowerCase().includes('already pending')) {
        setRequestSent(true);
      }
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
      >
        {/* Header Bar */}
        <div className="relative bg-muted/40 border-b border-border/70 p-6 pt-7 pb-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer z-10"
          >
            <X className="h-4 w-4" />
          </Button>

          {loading ? (
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-muted animate-pulse shrink-0 border border-border" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-40 bg-muted animate-pulse rounded" />
                <div className="h-4 w-52 bg-muted animate-pulse rounded" />
                <div className="h-3 w-36 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ) : profile ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4.5">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-border shadow-xs shrink-0">
                {profile.profileImageUrl ? (
                  <AvatarImage
                    src={profile.profileImageUrl}
                    alt={profile.name}
                  />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-base sm:text-lg font-bold">
                  {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'AL'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">
                    {profile.name}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="secondary_1"
                      className="px-2 py-0 text-[11px] font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-none"
                    >
                      Alumni
                    </Badge>
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>

                {(profile.currentPosition || profile.currentCompany) && (
                  <div className="flex items-center gap-1.5 text-xs text-foreground/90 font-medium">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>
                      {profile.currentPosition}
                      {profile.currentPosition && profile.currentCompany
                        ? ' at '
                        : ''}
                      {profile.currentCompany}
                    </span>
                  </div>
                )}

                {profile.currentLocation && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{profile.currentLocation}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-16 w-full bg-muted animate-pulse rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-20 w-full bg-muted animate-pulse rounded-lg" />
              </div>
            </div>
          ) : error ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-semibold text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs mt-2"
              >
                Close
              </Button>
            </div>
          ) : profile ? (
            <>
              {/* Bio Section */}
              {profile.bio && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    About
                  </h3>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line bg-muted/20 p-3.5 rounded-xl border border-border/50">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Academic Details */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span>Academic Background</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-border bg-card/60 space-y-1">
                    <span className="text-[11px] text-muted-foreground">
                      Faculty & Department
                    </span>
                    <p className="text-xs font-semibold text-foreground">
                      {profile.departmentName || profile.facultyName || 'PSTU'}
                    </p>
                    {profile.facultyName && profile.departmentName && (
                      <p className="text-[11px] text-muted-foreground">
                        {profile.facultyName}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-card/60 space-y-1">
                    <span className="text-[11px] text-muted-foreground">
                      Session & Graduation
                    </span>
                    <p className="text-xs font-semibold text-foreground">
                      Session: {profile.session || 'N/A'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Graduated:{' '}
                      <span className="text-foreground font-medium">
                        {profile.graduationYear || 'N/A'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Skills & Expertise</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge
                        key={skill.id}
                        variant="secondary"
                        className="px-2.5 py-1 text-xs font-medium bg-muted text-foreground border border-border/80"
                      >
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {(profile.linkedinLink ||
                profile.githubLink ||
                profile.personalWebsite ||
                profile.facebookLink) && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Online Presence
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {profile.linkedinLink && (
                      <a
                        href={
                          profile.linkedinLink.startsWith('http')
                            ? profile.linkedinLink
                            : `https://${profile.linkedinLink}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:text-primary hover:border-primary/50 transition-colors bg-card"
                      >
                        <FaLinkedin className="h-3.5 w-3.5 text-primary" />
                        <span>LinkedIn</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-60 ml-0.5" />
                      </a>
                    )}

                    {profile.githubLink && (
                      <a
                        href={
                          profile.githubLink.startsWith('http')
                            ? profile.githubLink
                            : `https://${profile.githubLink}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:text-primary hover:border-primary/50 transition-colors bg-card"
                      >
                        <FaGithub className="h-3.5 w-3.5" />
                        <span>GitHub</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-60 ml-0.5" />
                      </a>
                    )}

                    {profile.personalWebsite && (
                      <a
                        href={
                          profile.personalWebsite.startsWith('http')
                            ? profile.personalWebsite
                            : `https://${profile.personalWebsite}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:text-primary hover:border-primary/50 transition-colors bg-card"
                      >
                        <FaGlobe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Portfolio</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-60 ml-0.5" />
                      </a>
                    )}

                    {profile.facebookLink && (
                      <a
                        href={
                          profile.facebookLink.startsWith('http')
                            ? profile.facebookLink
                            : `https://${profile.facebookLink}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:text-primary hover:border-primary/50 transition-colors bg-card"
                      >
                        <FaFacebook className="h-3.5 w-3.5 text-blue-600" />
                        <span>Facebook</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-60 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Information (Privacy Sensitive) */}
              <div className="space-y-2.5 pt-2 border-t border-border/70">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Contact Information
                </h3>

                {isConnected || isSelf ? (
                  <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                    {profile.contactEmail && (
                      <div className="flex items-center gap-2.5 text-xs text-foreground">
                        <Mail className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">Email:</span>
                        <a
                          href={`mailto:${profile.contactEmail}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {profile.contactEmail}
                        </a>
                      </div>
                    )}

                    {profile.whatsappNumber && (
                      <div className="flex items-center gap-2.5 text-xs text-foreground">
                        <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-muted-foreground">
                          WhatsApp / Phone:
                        </span>
                        <a
                          href={`https://wa.me/${profile.whatsappNumber.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          {profile.whatsappNumber}
                        </a>
                      </div>
                    )}

                    {profile.preferredContactMethod && (
                      <div className="flex items-center gap-2.5 text-xs text-foreground">
                        <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">
                          Preferred Contact:
                        </span>
                        <span className="font-medium">
                          {profile.preferredContactMethod}
                        </span>
                      </div>
                    )}

                    {!profile.contactEmail &&
                      !profile.whatsappNumber &&
                      !profile.preferredContactMethod && (
                        <p className="text-xs text-muted-foreground">
                          No direct contact details provided by this alumni yet.
                        </p>
                      )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/30 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-semibold text-foreground">
                        Contact Details Protected
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Direct email and WhatsApp numbers are only visible to
                        accepted connections. Send a connection request to
                        connect.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-border/70 bg-card flex items-center justify-between gap-3">
          <div className="text-xs text-destructive font-medium">
            {requestError && <span>{requestError}</span>}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs px-4"
            >
              Close
            </Button>

            {!isSelf && (
              <Button
                size="sm"
                onClick={handleSendConnection}
                disabled={
                  sendingRequest || requestSent || isConnected || !currentUser
                }
                className="text-xs px-4 font-semibold gap-1.5 cursor-pointer"
              >
                {sendingRequest ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : isConnected ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Connected</span>
                  </>
                ) : requestSent ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Request Sent</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Connect</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniProfileModal;
