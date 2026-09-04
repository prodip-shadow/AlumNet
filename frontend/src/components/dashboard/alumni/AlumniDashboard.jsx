'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  User,
  Briefcase,
  Calendar,
  Users,
  Plus,
  Edit3,
  Trash2,
  Lock,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  Globe,
  FileText,
  Mail,
  Phone,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Camera,
  Check,
  FolderGit2,
  CreditCard,
} from 'lucide-react';
import { FaLinkedin, FaGithub, FaFacebook } from 'react-icons/fa6';
import { toast } from 'react-toastify';
import ProjectsSection from '@/components/shared/ProjectsSection';
import MyCreatedEventsSection from '@/components/shared/MyCreatedEventsSection';
import PaymentHistorySection from '@/components/shared/PaymentHistorySection';

const AlumniDashboard = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef(null);

  // Profile State
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  // Form Profile State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [currentPosition, setCurrentPosition] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [personalWebsite, setPersonalWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState('email');
  const [visibleContactMethods, setVisibleContactMethods] = useState(['email']);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);

  // Opportunities State
  const [myOpportunities, setMyOpportunities] = useState([]);
  const [loadingOpps, setLoadingOpps] = useState(false);
  const [isCreateOppModalOpen, setIsCreateOppModalOpen] = useState(false);
  const [oppType, setOppType] = useState('FULL_TIME');
  const [oppContent, setOppContent] = useState('');
  const [oppIsCvRequired, setOppIsCvRequired] = useState(true);
  const [savingOpp, setSavingOpp] = useState(false);

  // Applicants Viewer State
  const [viewingOppId, setViewingOppId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // Events State
  const [myEvents, setMyEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventMaxAttendees, setEventMaxAttendees] = useState(100);
  const [eventIsPaid, setEventIsPaid] = useState(false);
  const [eventPrice, setEventPrice] = useState(0);
  const [savingEvent, setSavingEvent] = useState(false);

  const showFeedback = (type, msg) => {
    if (type === 'success') toast.success(msg, { autoClose: 1500 });
    else if (type === 'error') toast.error(msg, { autoClose: 2000 });
    else toast.info(msg, { autoClose: 1500 });
  };

  // 1. Fetch Profile
  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    if (user?.name) setName(user.name);
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
        setFacebookLink(p.facebookLink || '');
        setPersonalWebsite(p.personalWebsite || '');
        setContactEmail(p.contactEmail || '');
        setWhatsappNumber(p.whatsappNumber || '');
        setPreferredContactMethod(p.preferredContactMethod || 'email');

        let visMethods = ['email'];
        if (p.visibleContactMethods) {
          try {
            visMethods = typeof p.visibleContactMethods === 'string'
              ? JSON.parse(p.visibleContactMethods)
              : p.visibleContactMethods;
          } catch (e) {
            visMethods = ['email'];
          }
        }
        setVisibleContactMethods(visMethods || ['email']);

        const userSkills = profRes.value.data.skills || [];
        setSelectedSkills(userSkills.map((s) => s.id));
      }

      if (skillsRes.status === 'fulfilled' && skillsRes.value.data?.success) {
        setAllSkills(skillsRes.value.data.skills || []);
      }
    } catch (err) {
      console.warn('Error fetching profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

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

  // 2. Fetch My Opportunities
  const fetchMyOpportunities = useCallback(async () => {
    setLoadingOpps(true);
    try {
      const res = await api.get('/api/opportunities/my');
      if (res.data?.success && Array.isArray(res.data.opportunities)) {
        setMyOpportunities(res.data.opportunities);
      }
    } catch (err) {
      console.warn('Error fetching opportunities:', err);
    } finally {
      setLoadingOpps(false);
    }
  }, []);

  // 3. Fetch My Events
  const fetchMyEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await api.get('/api/events/my');
      if (res.data?.success && Array.isArray(res.data.events)) {
        setMyEvents(res.data.events);
      }
    } catch (err) {
      console.warn('Error fetching events:', err);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchMyOpportunities();
    fetchMyEvents();
  }, [fetchProfile, fetchMyOpportunities, fetchMyEvents]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) {
        setActiveTab(tab);
      }
    }
  }, []);

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        name: name.trim(),
        bio,
        currentPosition,
        currentCompany,
        currentLocation,
        githubLink,
        linkedinLink,
        facebookLink,
        personalWebsite,
        contactEmail,
        whatsappNumber,
        visibleContactMethods: Array.isArray(visibleContactMethods)
          ? visibleContactMethods
          : [],
        skills: Array.isArray(selectedSkills)
          ? selectedSkills
              .filter((id) => Number.isInteger(Number(id)) && Number(id) > 0)
              .map(Number)
          : [],
      };

      const res = await api.put('/api/profile/me', payload);
      if (res.data?.success) {
        showFeedback('success', 'Profile and privacy settings updated successfully!');
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
      setSavingProfile(false);
    }
  };

  // Handle Create Opportunity
  const handleCreateOpportunity = async (e) => {
    e.preventDefault();
    if (!oppContent.trim()) return;
    setSavingOpp(true);
    try {
      const res = await api.post('/api/opportunities', {
        type: oppType,
        content: oppContent.trim(),
        isCvRequired: oppIsCvRequired,
      });

      if (res.data?.success) {
        showFeedback('success', 'Opportunity posted successfully!');
        setIsCreateOppModalOpen(false);
        setOppContent('');
        fetchMyOpportunities();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to create opportunity');
    } finally {
      setSavingOpp(false);
    }
  };

  // Handle Close Opportunity
  const handleCloseOpportunity = async (oppId) => {
    try {
      const res = await api.patch(`/api/opportunities/${oppId}/close`);
      if (res.data?.success) {
        showFeedback('success', 'Opportunity marked as closed');
        fetchMyOpportunities();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to close opportunity');
    }
  };

  // Handle View Applicants
  const handleViewApplicants = async (oppId) => {
    setViewingOppId(oppId);
    setLoadingApplicants(true);
    try {
      const res = await api.get(`/api/opportunities/${oppId}/applications`);
      if (res.data?.success && Array.isArray(res.data.applications)) {
        setApplicants(res.data.applications);
      }
    } catch (err) {
      showFeedback('error', 'Could not load applicants');
    } finally {
      setLoadingApplicants(false);
    }
  };

  // Handle Review Applicant Status
  const handleUpdateApplicantStatus = async (appId, status) => {
    try {
      const res = await api.patch(`/api/opportunities/applications/${appId}/status`, { status });
      if (res.data?.success) {
        showFeedback('success', `Applicant status updated to ${status}`);
        if (viewingOppId) handleViewApplicants(viewingOppId);
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to update applicant status');
    }
  };

  // Handle Create Event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate || !eventLocation.trim()) return;
    setSavingEvent(true);
    try {
      const res = await api.post('/api/events', {
        title: eventTitle.trim(),
        description: eventDesc.trim() || eventTitle.trim(),
        eventDate,
        registrationDeadline: eventDate,
        location: eventLocation.trim(),
        contactInfo: user?.email || 'events@pstu.ac.bd',
        maxAttendees: Number(eventMaxAttendees) || 100,
        isPaid: eventIsPaid,
        price: eventIsPaid ? Number(eventPrice) : 0,
      });

      if (res.data?.success) {
        showFeedback('success', 'Event created successfully!');
        setIsCreateEventOpen(false);
        setEventTitle('');
        setEventDesc('');
        setEventDate('');
        setEventLocation('');
        await fetchMyEvents();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to create event. (Make sure you have creator permissions)');
    } finally {
      setSavingEvent(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Profile Summary */}
      <Card className="border border-border bg-card p-5 rounded-2xl shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="h-16 w-16 border-2 border-border shadow-xs">
                {profile?.profileImageUrl && <AvatarImage src={profile.profileImageUrl} />}
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-base">
                  {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'AL'}
                </AvatarFallback>
              </Avatar>

              <div
                className="absolute inset-0 bg-background/70 backdrop-blur-2xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-foreground"
                title="Change Photo"
              >
                {uploadingPic ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">{profile?.name || user?.name || 'Alumni'}</h3>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  Verified Alumni
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentPosition ? `${currentPosition} at ${currentCompany || 'Company'}` : 'PSTU Alumni Member'}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPic}
                className="h-6 px-1.5 text-[11px] text-primary hover:bg-primary/10 mt-1 cursor-pointer font-medium p-0"
              >
                <Camera className="h-3 w-3 mr-1" />
                <span>{uploadingPic ? 'Uploading photo...' : 'Change Profile Picture'}</span>
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePictureChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsCreateOppModalOpen(true)}
              className="text-xs font-semibold gap-1.5 cursor-pointer h-9 shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Post Opportunity</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border/80 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'profile', label: 'My Profile & Privacy', icon: User },
          { id: 'projects', label: 'My Projects Showcase', icon: FolderGit2 },
          { id: 'opportunities', label: `My Opportunities (${myOpportunities.length})`, icon: Briefcase },
          ...(user && (user.role === 'ADMIN' || user.canCreateEvent) ? [{ id: 'events', label: `My Events (${myEvents.length})`, icon: Calendar }] : []),
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

      {/* Tab 1: Profile & Contact Privacy */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6 max-w-3xl">
          <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4.5">
            <div className="border-b border-border pb-3">
              <h4 className="font-bold text-sm text-foreground">Professional & Bio Details</h4>
              <p className="text-xs text-muted-foreground">Share your name, current role, company, and career bio with the network.</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Full Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">About / Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short bio about your professional journey..."
                  className="w-full h-24 p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Job Title / Current Position</label>
                  <Input
                    value={currentPosition}
                    onChange={(e) => setCurrentPosition(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground block mb-1">Current Company / Organization</label>
                  <Input
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    placeholder="e.g. Google, Brain Station 23"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-foreground block mb-1">Current Location / City</label>
                  <Input
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    placeholder="e.g. Dhaka, Bangladesh or Berlin, Germany"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Social Links */}
          <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
            <div className="border-b border-border pb-3">
              <h4 className="font-bold text-sm text-foreground">Social & Portfolio Links</h4>
              <p className="text-xs text-muted-foreground">Allow students and fellow alumni to connect with your public profiles.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1 flex items-center gap-1.5">
                  <FaLinkedin className="h-3.5 w-3.5 text-primary" />
                  <span>LinkedIn Profile</span>
                </label>
                <Input
                  value={linkedinLink}
                  onChange={(e) => setLinkedinLink(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1 flex items-center gap-1.5">
                  <FaGithub className="h-3.5 w-3.5" />
                  <span>GitHub Profile</span>
                </label>
                <Input
                  value={githubLink}
                  onChange={(e) => setGithubLink(e.target.value)}
                  placeholder="https://github.com/username"
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Personal Website / Portfolio</span>
                </label>
                <Input
                  value={personalWebsite}
                  onChange={(e) => setPersonalWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1 flex items-center gap-1.5">
                  <FaFacebook className="h-3.5 w-3.5 text-blue-600" />
                  <span>Facebook Profile</span>
                </label>
                <Input
                  value={facebookLink}
                  onChange={(e) => setFacebookLink(e.target.value)}
                  placeholder="https://facebook.com/username"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </Card>

          {/* Contact Privacy Settings (Exclusive Alumni Protection) */}
          <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
            <div className="border-b border-border pb-3 flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-primary" />
                  <span>Contact Info & Privacy Settings</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-amber-500 shrink-0" />
                  <span>Direct email and WhatsApp are hidden from public and only shown to accepted connections based on your visibility settings.</span>
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-foreground block mb-1 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span>Direct Contact Email</span>
                  </label>
                  <Input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="alumni@workemail.com"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    <span>WhatsApp / Phone</span>
                  </label>
                  <Input
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+8801700000000"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Comprehensive Privacy Matrix (Select what is private to friends) */}
              <div className="p-4 bg-muted/30 rounded-2xl border border-border/80 space-y-3">
                <div>
                  <span className="font-bold text-xs text-foreground block flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    <span>Privacy & Friends-Only Settings</span>
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Check the items below that you wish to keep <strong>Private (Visible only to your Accepted Friends/Connections)</strong>. Unchecked items remain public to all visitors.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {[
                    { id: 'email', label: 'Direct Email Address', icon: Mail },
                    { id: 'whatsapp', label: 'WhatsApp / Phone Number', icon: Phone },
                    { id: 'linkedin', label: 'LinkedIn Profile', icon: FaLinkedin },
                    { id: 'github', label: 'GitHub Profile', icon: FaGithub },
                    { id: 'facebook', label: 'Facebook Profile', icon: FaFacebook },
                    { id: 'website', label: 'Personal Website / Portfolio', icon: Globe },
                    { id: 'location', label: 'Current City & Location', icon: MapPin },
                    { id: 'bio', label: 'About Me & Bio Summary', icon: User },
                  ].map((item) => {
                    const isChecked = visibleContactMethods.includes(item.id);
                    const Icon = item.icon;

                    return (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                          isChecked
                            ? 'bg-primary/5 border-primary/40 text-foreground font-medium'
                            : 'bg-background border-border text-muted-foreground hover:border-border/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setVisibleContactMethods([...visibleContactMethods, item.id]);
                              } else {
                                setVisibleContactMethods(
                                  visibleContactMethods.filter((m) => m !== item.id)
                                );
                              }
                            }}
                            className="rounded text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                          />
                          <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isChecked ? (
                          <span className="text-[10px] text-primary font-semibold px-2 py-0.5 bg-primary/10 rounded-md shrink-0">
                            Friends Only
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground px-2 py-0.5 bg-muted rounded-md shrink-0">
                            Public
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Skills Selection */}
          <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
            <div className="border-b border-border pb-3">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Skills & Expertise</span>
              </h4>
              <p className="text-xs text-muted-foreground">Select the skills you can mentor or offer opportunities in.</p>
            </div>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
              {allSkills.map((s) => {
                const isSelected = selectedSkills.includes(s.id);
                return (
                  <Badge
                    key={s.id}
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSkills(selectedSkills.filter((id) => id !== s.id));
                      } else {
                        setSelectedSkills([...selectedSkills, s.id]);
                      }
                    }}
                    className={`cursor-pointer text-xs px-3 py-1 font-medium transition-all inline-flex items-center gap-1.5 ${
                      isSelected ? 'bg-primary text-primary-foreground shadow-2xs' : 'hover:border-primary/50'
                    }`}
                  >
                    {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    <span>{s.name}</span>
                  </Badge>
                );
              })}
            </div>
          </Card>

          <Button type="submit" disabled={savingProfile} className="h-10 px-6 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer">
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            <span>Save Profile & Privacy</span>
          </Button>
        </form>
      )}

      {/* Tab 2: My Opportunities */}
      {activeTab === 'opportunities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">My Posted Opportunities</h3>
              <p className="text-xs text-muted-foreground">Manage your posted internships, full-time jobs, and review applicants.</p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreateOppModalOpen(true)}
              className="text-xs font-semibold gap-1.5 cursor-pointer h-8.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Post New Opportunity</span>
            </Button>
          </div>

          {loadingOpps ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              Loading opportunities...
            </div>
          ) : myOpportunities.length === 0 ? (
            <Card className="p-12 text-center text-xs text-muted-foreground border-dashed">
              <Briefcase className="h-8 w-8 mx-auto opacity-40 mb-2 text-primary" />
              <p className="font-semibold text-foreground text-sm">No opportunities posted yet</p>
              <p className="mt-1">Help students and alumni discover job openings or internships at your company.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myOpportunities.map((opp) => (
                <Card key={opp.id} className="border border-border bg-card p-4.5 rounded-xl shadow-2xs space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {opp.type.replace('_', ' ')}
                      </Badge>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        opp.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {opp.status}
                      </span>
                    </div>

                    <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed line-clamp-3">
                      {opp.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3 text-primary" />
                        <span>{opp.applicationCount || 0} Applicants</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{new Date(opp.createdAt).toLocaleDateString()}</span>
                      </span>
                      {opp.isCvRequired && (
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span>CV Required</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/70">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewApplicants(opp.id)}
                      className="flex-1 text-xs gap-1 cursor-pointer h-8"
                    >
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span>View Applicants ({opp.applicationCount || 0})</span>
                    </Button>

                    {opp.status === 'ACTIVE' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCloseOpportunity(opp.id)}
                        className="text-xs text-muted-foreground hover:text-foreground h-8 cursor-pointer"
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: My Events */}
      {activeTab === 'events' && Boolean(user && (user.role === 'ADMIN' || user.canCreateEvent)) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">My Organized Events</h3>
              <p className="text-xs text-muted-foreground">Host meetups, webinars, and reunion events.</p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreateEventOpen(true)}
              className="text-xs font-semibold gap-1.5 cursor-pointer h-8.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Event</span>
            </Button>
          </div>

          {loadingEvents ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              Loading events...
            </div>
          ) : myEvents.length === 0 ? (
            <Card className="p-12 text-center text-xs text-muted-foreground border-dashed">
              <Calendar className="h-8 w-8 mx-auto opacity-40 mb-2 text-primary" />
              <p className="font-semibold text-foreground text-sm">No events organized yet</p>
              <p className="mt-1">Host alumni reunions or tech webinars.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myEvents.map((ev) => (
                <Card key={ev.id} className="border border-border bg-card p-4.5 rounded-xl shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{ev.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{ev.location}</span>
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {new Date(ev.eventDate).toLocaleDateString()}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">{ev.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                    <span>{ev.isPaid ? `Fee: ৳${ev.price}` : 'Free Event'}</span>
                    <span>Status: {ev.status}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Post New Opportunity */}
      {isCreateOppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <form onSubmit={handleCreateOpportunity} className="w-full max-w-lg bg-card border border-border p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Post New Job / Opportunity</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Opportunity Type</label>
                <select
                  value={oppType}
                  onChange={(e) => setOppType(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-background border border-border rounded-lg text-foreground cursor-pointer"
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="FREELANCE">Freelance</option>
                  <option value="RESEARCH">Research</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Job Description & Requirements</label>
                <textarea
                  value={oppContent}
                  onChange={(e) => setOppContent(e.target.value)}
                  placeholder="Describe the role, responsibilities, tech stack, and how to apply..."
                  required
                  className="w-full h-32 p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={oppIsCvRequired}
                  onChange={(e) => setOppIsCvRequired(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>Require Applicants to upload / provide CV link</span>
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsCreateOppModalOpen(false)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={savingOpp} className="h-9 text-xs font-semibold">
                {savingOpp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Publish Opportunity'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: View Applicants on Opportunity */}
      {viewingOppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-card border border-border p-6 rounded-2xl shadow-xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Applicants List</h3>
                <p className="text-xs text-muted-foreground">Review candidate CVs and messages for Opportunity #{viewingOppId}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingOppId(null)} className="text-xs">
                Close
              </Button>
            </div>

            {loadingApplicants ? (
              <div className="p-8 text-center text-xs text-muted-foreground">Loading applicants...</div>
            ) : applicants.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">No applicants have applied yet.</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto divide-y divide-border/60">
                {applicants.map((app) => (
                  <div key={app.id} className="pt-3 first:pt-0 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-foreground">{app.userName || `User #${app.userId}`}</h4>
                        <p className="text-[11px] text-muted-foreground">{app.userEmail}</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          app.status === 'ACCEPTED'
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : app.status === 'REJECTED'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {app.status}
                      </Badge>
                    </div>

                    {app.message && (
                      <p className="text-foreground/90 bg-muted/30 p-2.5 rounded-lg border border-border/60">
                        "{app.message}"
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      {app.cvUrl ? (
                        <a
                          href={app.cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-semibold flex items-center gap-1"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>View Submitted CV</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">No CV Attached</span>
                      )}

                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateApplicantStatus(app.id, 'ACCEPTED')}
                          className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUpdateApplicantStatus(app.id, 'REJECTED')}
                          className="h-7 text-[11px]"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Event */}
      {isCreateEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <form onSubmit={handleCreateEvent} className="w-full max-w-lg bg-card border border-border p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Create New Event</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Event Title</label>
                <Input
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. PSTU CSE Alumni Tech Talk 2026"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description</label>
                <textarea
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Event agenda, speaker details, venue info..."
                  className="w-full h-20 p-2.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Event Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Location / Online Link</label>
                  <Input
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="e.g. Auditorium / Zoom Link"
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsCreateEventOpen(false)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={savingEvent} className="h-9 text-xs font-semibold">
                {savingEvent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Create Event'}
              </Button>
            </div>
          </form>
        </div>
      )}
      {/* Tab: Projects Showcase */}
      {activeTab === 'projects' && <ProjectsSection isOwner={true} />}

      {/* Tab: Hosted Events */}
      {activeTab === 'events' && <MyCreatedEventsSection />}

      {/* Tab: Payment History */}
      {activeTab === 'payments' && <PaymentHistorySection />}
    </div>
  );
};

export default AlumniDashboard;
