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
  GraduationCap,
  Briefcase,
  Code2,
  Sparkles,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Send,
  Building,
  Globe,
  ExternalLink,
  ShieldAlert,
  Camera,
  Check,
  Plus,
  FolderGit2,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { FaLinkedin, FaGithub } from 'react-icons/fa6';
import { SiCodeforces, SiLeetcode, SiCodechef, SiHackerrank } from 'react-icons/si';
import { toast } from 'react-toastify';
import ProjectsSection from '@/components/shared/ProjectsSection';
import MyCreatedEventsSection from '@/components/shared/MyCreatedEventsSection';
import PaymentHistorySection from '@/components/shared/PaymentHistorySection';

const StudentDashboard = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef(null);

  // Profile State
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [careerInterests, setCareerInterests] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [codeforcesLink, setCodeforcesLink] = useState('');
  const [leetcodeLink, setLeetcodeLink] = useState('');
  const [codechefLink, setCodechefLink] = useState('');
  const [hackerrankLink, setHackerrankLink] = useState('');

  // Skills State
  const [allSkills, setAllSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Migration State
  const [migrationApp, setMigrationApp] = useState(null);
  const [loadingMigration, setLoadingMigration] = useState(false);
  const [migGradYear, setMigGradYear] = useState('');
  const [migPosition, setMigPosition] = useState('');
  const [migCompany, setMigCompany] = useState('');
  const [migLocation, setMigLocation] = useState('');
  const [migContactEmail, setMigContactEmail] = useState('');
  const [migWhatsapp, setMigWhatsapp] = useState('');
  const [submittingMigration, setSubmittingMigration] = useState(false);

  // My Applications State
  const [myApplications, setMyApplications] = useState([]);
  const [loadingMyApps, setLoadingMyApps] = useState(false);

  const showFeedback = (type, msg) => {
    if (type === 'success') toast.success(msg, { autoClose: 1500 });
    else if (type === 'error') toast.error(msg, { autoClose: 2000 });
    else toast.info(msg, { autoClose: 1500 });
  };

  // 1. Fetch Student Profile
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
        setCareerInterests(p.careerInterests || '');
        setGithubLink(p.githubLink || '');
        setLinkedinLink(p.linkedinLink || '');
        setPortfolioLink(p.portfolioLink || '');
        setCodeforcesLink(p.codeforcesLink || '');
        setLeetcodeLink(p.leetcodeLink || '');
        setCodechefLink(p.codechefLink || '');
        setHackerrankLink(p.hackerrankLink || '');

        const userSkills = profRes.value.data.skills || [];
        setSelectedSkills(userSkills.map((s) => s.id));
      }

      if (skillsRes.status === 'fulfilled' && skillsRes.value.data?.success) {
        setAllSkills(skillsRes.value.data.skills || []);
      }
    } catch (err) {
      console.warn('Error fetching student profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  // 2. Fetch My Migration Application
  const fetchMigrationApp = useCallback(async () => {
    setLoadingMigration(true);
    try {
      const res = await api.get('/api/alumni-migration/my-application');
      if (res.data?.success && res.data.application) {
        setMigrationApp(res.data.application);
      } else {
        setMigrationApp(null);
      }
    } catch (err) {
      setMigrationApp(null);
    } finally {
      setLoadingMigration(false);
    }
  }, []);

  // 3. Fetch Applied Opportunities
  const fetchMyApplications = useCallback(async () => {
    setLoadingMyApps(true);
    try {
      const res = await api.get('/api/opportunities/my-applications');
      if (res.data?.success && Array.isArray(res.data.applications)) {
        setMyApplications(res.data.applications);
      }
    } catch (err) {
      console.warn('Error fetching applied opportunities:', err);
    } finally {
      setLoadingMyApps(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchMigrationApp();
    fetchMyApplications();
  }, [fetchProfile, fetchMigrationApp, fetchMyApplications]);

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

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        name: name.trim(),
        bio,
        careerInterests,
        githubLink,
        linkedinLink,
        portfolioLink,
        codeforcesLink,
        leetcodeLink,
        codechefLink,
        hackerrankLink,
        skills: selectedSkills,
      };

      const res = await api.put('/api/profile/me', payload);
      if (res.data?.success) {
        showFeedback('success', 'Student profile updated successfully!');
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

  // Handle Submit Migration
  const handleSubmitMigration = async (e) => {
    e.preventDefault();
    if (!migGradYear) return;
    setSubmittingMigration(true);
    try {
      const payload = {
        graduationYear: Number(migGradYear),
        currentPosition: migPosition.trim() || null,
        currentCompany: migCompany.trim() || null,
        currentLocation: migLocation.trim() || null,
        contactEmail: migContactEmail.trim() || null,
        whatsappNumber: migWhatsapp.trim() || null,
      };

      const res = await api.post('/api/alumni-migration/apply', payload);
      if (res.data?.success) {
        showFeedback('success', 'Alumni migration application submitted successfully!');
        fetchMigrationApp();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to submit migration');
    } finally {
      setSubmittingMigration(false);
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
                  {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'ST'}
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
                <h3 className="text-lg font-bold text-foreground">{profile?.name || user?.name || 'Student'}</h3>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                  Verified Student
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Session: {profile?.session || 'N/A'} • {profile?.currentSemester || 'Semester N/A'}
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

          <Button
            size="sm"
            onClick={() => setActiveTab('migration')}
            className="text-xs font-semibold gap-1.5 cursor-pointer h-9 shadow-2xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Apply to Become Alumni</span>
          </Button>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border/80 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'profile', label: 'Academic Profile & Skills', icon: User },
          { id: 'projects', label: 'Projects Showcase', icon: FolderGit2 },
          { id: 'migration', label: 'Alumni Migration Hub', icon: GraduationCap },
          { id: 'applications', label: `My Job Applications (${myApplications.length})`, icon: Briefcase },
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

      {/* Tab 1: Profile & Skills */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6 max-w-3xl">
          {/* Academic Info Banner */}
          <Card className="border border-border bg-muted/20 p-4 rounded-xl text-xs space-y-2">
            <h4 className="font-bold text-foreground flex items-center gap-1.5">
              <Building className="h-4 w-4 text-primary" />
              <span>University Academic Information</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-muted-foreground pt-1">
              <div>
                <span className="block text-[10px]">Student ID:</span>
                <span className="font-semibold text-foreground">{profile?.universityId || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[10px]">Reg No:</span>
                <span className="font-semibold text-foreground">{profile?.registrationNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[10px]">Session:</span>
                <span className="font-semibold text-foreground">{profile?.session || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[10px]">Semester:</span>
                <span className="font-semibold text-foreground">{profile?.currentSemester || 'N/A'}</span>
              </div>
            </div>
          </Card>

          {/* Bio & Career Interests */}
          <Card className="border border-border bg-card p-5 rounded-2xl shadow-2xs space-y-4">
            <div className="border-b border-border pb-3">
              <h4 className="font-bold text-sm text-foreground">Personal Info & Bio</h4>
              <p className="text-xs text-muted-foreground">Keep your name, aspirations, and target career domains updated.</p>
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
                  placeholder="Tell alumni and recruiters about yourself..."
                  className="w-full h-20 p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Career Interests / Focus Areas</label>
                <Input
                  value={careerInterests}
                  onChange={(e) => setCareerInterests(e.target.value)}
                  placeholder="e.g. Full-Stack Web, Machine Learning, Cloud Architecture"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </Card>

          {/* Competitive Programming & Coding Profiles */}
          <Card className="border border-border bg-card p-5 rounded-2xl shadow-2xs space-y-4">
            <div className="border-b border-border pb-3">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Code2 className="h-4 w-4 text-primary" />
                <span>Coding & Competitive Programming Handles</span>
              </h4>
              <p className="text-xs text-muted-foreground">Showcase your problem-solving achievements on coding platforms.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1 flex items-center gap-1.5">
                  <SiCodeforces className="h-3.5 w-3.5 text-red-500" />
                  <span>Codeforces Profile</span>
                </label>
                <Input
                  value={codeforcesLink}
                  onChange={(e) => setCodeforcesLink(e.target.value)}
                  placeholder="https://codeforces.com/profile/handle"
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 flex items-center gap-1.5">
                  <SiLeetcode className="h-3.5 w-3.5 text-amber-500" />
                  <span>LeetCode Profile</span>
                </label>
                <Input
                  value={leetcodeLink}
                  onChange={(e) => setLeetcodeLink(e.target.value)}
                  placeholder="https://leetcode.com/u/handle"
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 flex items-center gap-1.5">
                  <SiCodechef className="h-3.5 w-3.5 text-amber-700" />
                  <span>CodeChef Profile</span>
                </label>
                <Input
                  value={codechefLink}
                  onChange={(e) => setCodechefLink(e.target.value)}
                  placeholder="https://codechef.com/users/handle"
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 flex items-center gap-1.5">
                  <SiHackerrank className="h-3.5 w-3.5 text-emerald-600" />
                  <span>HackerRank Profile</span>
                </label>
                <Input
                  value={hackerrankLink}
                  onChange={(e) => setHackerrankLink(e.target.value)}
                  placeholder="https://hackerrank.com/handle"
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
                  placeholder="https://github.com/handle"
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 flex items-center gap-1.5">
                  <FaLinkedin className="h-3.5 w-3.5 text-primary" />
                  <span>LinkedIn Profile</span>
                </label>
                <Input
                  value={linkedinLink}
                  onChange={(e) => setLinkedinLink(e.target.value)}
                  placeholder="https://linkedin.com/in/handle"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </Card>

          {/* Skills Tagging */}
          <Card className="border border-border bg-card p-5 rounded-2xl shadow-2xs space-y-4">
            <div className="border-b border-border pb-3">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Skills & Technologies</span>
              </h4>
              <p className="text-xs text-muted-foreground">Select the tech stack and tools you are proficient with.</p>
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

          <Button type="submit" disabled={savingProfile} className="h-10 px-6 text-xs font-semibold gap-1.5 cursor-pointer">
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            <span>Save Student Profile</span>
          </Button>
        </form>
      )}

      {/* Tab 2: Alumni Migration Hub */}
      {activeTab === 'migration' && (
        <div className="space-y-6 max-w-2xl">
          {/* Current Application Status Card */}
          {migrationApp ? (
            <Card className="border border-border bg-card p-5 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-foreground">Alumni Migration Status</h4>
                <Badge
                  variant="secondary"
                  className={`text-[10px] font-bold ${
                    migrationApp.status === 'APPROVED'
                      ? 'bg-emerald-500/10 text-emerald-700'
                      : migrationApp.status === 'REJECTED'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-amber-500/10 text-amber-700'
                  }`}
                >
                  {migrationApp.status}
                </Badge>
              </div>

              <div className="bg-muted/30 p-3.5 rounded-xl border border-border text-xs space-y-1">
                <p><strong>Graduation Year:</strong> {migrationApp.graduationYear}</p>
                {migrationApp.currentPosition && (
                  <p><strong>Job Title:</strong> {migrationApp.currentPosition} at {migrationApp.currentCompany || 'N/A'}</p>
                )}
                <p className="text-muted-foreground text-[11px]">
                  Applied on: {new Date(migrationApp.createdAt).toLocaleDateString()}
                </p>
                {migrationApp.rejectionReason && (
                  <p className="text-destructive font-semibold pt-1">
                    Rejection Reason: {migrationApp.rejectionReason}
                  </p>
                )}
              </div>

              {migrationApp.status === 'PENDING' && (
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Your migration application is currently under review by the university admin.</span>
                </div>
              )}
            </Card>
          ) : (
            <form onSubmit={handleSubmitMigration} className="space-y-4">
              <Card className="border border-border bg-card p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
                <div className="border-b border-border pb-3">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span>Apply for Alumni Status</span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Graduated students can apply to migrate their account to full Alumni status.
                  </p>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Graduation Year (Required)</label>
                    <Input
                      type="number"
                      value={migGradYear}
                      onChange={(e) => setMigGradYear(e.target.value)}
                      placeholder="e.g. 2024"
                      required
                      min={1950}
                      max={2100}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold block mb-1">Current Job Title / Position</label>
                      <Input
                        value={migPosition}
                        onChange={(e) => setMigPosition(e.target.value)}
                        placeholder="e.g. Software Engineer"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Company / Organization</label>
                      <Input
                        value={migCompany}
                        onChange={(e) => setMigCompany(e.target.value)}
                        placeholder="e.g. Google, Tech Ltd"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Current City / Location</label>
                    <Input
                      value={migLocation}
                      onChange={(e) => setMigLocation(e.target.value)}
                      placeholder="e.g. Dhaka, Bangladesh"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold block mb-1">Contact Email</label>
                      <Input
                        type="email"
                        value={migContactEmail}
                        onChange={(e) => setMigContactEmail(e.target.value)}
                        placeholder="alumni@workemail.com"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">WhatsApp / Phone</label>
                      <Input
                        value={migWhatsapp}
                        onChange={(e) => setMigWhatsapp(e.target.value)}
                        placeholder="+8801700000000"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={submittingMigration} className="h-9.5 text-xs font-semibold gap-1.5 w-full cursor-pointer">
                  {submittingMigration ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Submit Migration Application</span>
                </Button>
              </Card>
            </form>
          )}
        </div>
      )}

      {/* Tab 3: My Job Applications */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Opportunities Applied For</h3>
            <span className="text-xs text-muted-foreground">{myApplications.length} applications submitted</span>
          </div>

          {loadingMyApps ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              Loading your submitted applications...
            </div>
          ) : myApplications.length === 0 ? (
            <Card className="p-12 text-center text-xs text-muted-foreground border-dashed">
              <Briefcase className="h-8 w-8 mx-auto opacity-40 mb-2 text-primary" />
              <p className="font-semibold text-foreground text-sm">No applications submitted yet</p>
              <p className="mt-1">Browse the Opportunities page to find internships, jobs, and mentorship openings.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myApplications.map((app) => (
                <Card key={app.id} className="border border-border bg-card p-4.5 rounded-xl shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {app.type?.replace('_', ' ')}
                      </Badge>
                      <p className="text-xs font-semibold text-foreground mt-1">Opportunity #{app.opportunityId}</p>
                    </div>

                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-bold ${
                        app.status === 'ACCEPTED'
                          ? 'bg-emerald-500/10 text-emerald-700'
                          : app.status === 'REJECTED'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-amber-500/10 text-amber-700'
                      }`}
                    >
                      {app.status}
                    </Badge>
                  </div>

                  {app.message && (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/60">
                      "{app.message}"
                    </p>
                  )}

                  <div className="text-[11px] text-muted-foreground pt-1 border-t border-border flex items-center justify-between">
                    <span>Applied on: {new Date(app.createdAt).toLocaleDateString()}</span>
                    {app.cvUrl && (
                      <a href={app.cvUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 font-medium">
                        <span>View CV</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Projects Showcase */}
      {activeTab === 'projects' && <ProjectsSection isOwner={true} />}

      {/* Tab 5: Hosted Events & Registrations */}
      {activeTab === 'events' && <MyCreatedEventsSection />}

      {/* Tab 6: Payment History & Receipts */}
      {activeTab === 'payments' && <PaymentHistorySection />}
    </div>
  );
};

export default StudentDashboard;
