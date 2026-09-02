'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Briefcase,
  Search,
  Filter,
  FileText,
  Send,
  Plus,
  Loader2,
  CheckCircle,
  Clock,
  ExternalLink,
  Users,
  Building,
  Sparkles,
  Pencil,
  Trash2,
  Upload,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { confirmAlert } from '@/lib/swal';
import Link from 'next/link';

const OpportunityTypes = [
  { id: '', label: 'All Opportunities' },
  { id: 'FULL_TIME', label: 'Full Time' },
  { id: 'PART_TIME', label: 'Part Time' },
  { id: 'INTERNSHIP', label: 'Internship' },
  { id: 'CONTRACT', label: 'Contract' },
  { id: 'FREELANCE', label: 'Freelance' },
  { id: 'RESEARCH', label: 'Research' },
];

const OpportunityPage = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Apply Modal State
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyCvUrl, setApplyCvUrl] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [applying, setApplying] = useState(false);

  // Post / Edit Opportunity Modal (Alumni/Admin)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);
  const [newOppType, setNewOppType] = useState('FULL_TIME');
  const [newOppContent, setNewOppContent] = useState('');
  const [newOppIsCvRequired, setNewOppIsCvRequired] = useState(true);
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Applicants Viewer State
  const [viewingApplicantsOpp, setViewingApplicantsOpp] = useState(null);
  const [applicantsList, setApplicantsList] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const showFeedback = (type, msg) => {
    if (type === 'success') toast.success(msg, { autoClose: 1500 });
    else if (type === 'error') toast.error(msg, { autoClose: 2000 });
    else toast.info(msg, { autoClose: 1500 });
  };

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType) params.append('type', selectedType);
      params.append('page', String(page));
      params.append('pageSize', '12');

      const res = await api.get(`/api/opportunities?${params.toString()}`);
      if (res.data?.success && Array.isArray(res.data.opportunities)) {
        setOpportunities(res.data.opportunities);
      } else {
        setOpportunities([]);
      }
    } catch (err) {
      console.error('Error loading opportunities:', err);
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }, [selectedType, page]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Handle Apply (Supports PDF CV File Upload via FormData or URL link)
  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedOpp) return;
    if (selectedOpp.isCvRequired && !cvFile && !applyCvUrl.trim()) {
      showFeedback('error', 'A PDF CV upload or CV link is mandatory for this opportunity');
      return;
    }

    setApplying(true);
    try {
      const formData = new FormData();
      if (applyMessage.trim()) formData.append('message', applyMessage.trim());
      if (applyCvUrl.trim()) formData.append('cvUrl', applyCvUrl.trim());
      if (cvFile) formData.append('cv', cvFile);

      const res = await api.post(`/api/opportunities/${selectedOpp.id}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        showFeedback('success', 'Application submitted successfully to the alumni creator!');
        setSelectedOpp(null);
        setApplyMessage('');
        setApplyCvUrl('');
        setCvFile(null);
        fetchOpportunities();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  // Open Post Modal
  const handleOpenPostModal = () => {
    setEditingOpp(null);
    setNewOppType('FULL_TIME');
    setNewOppContent('');
    setNewOppIsCvRequired(true);
    setIsPostModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (opp) => {
    setEditingOpp(opp);
    setNewOppType(opp.type || 'FULL_TIME');
    setNewOppContent(opp.content || '');
    setNewOppIsCvRequired(Boolean(opp.isCvRequired));
    setIsPostModalOpen(true);
  };

  // Handle Save (Create or Edit)
  const handleSaveOpportunity = async (e) => {
    e.preventDefault();
    if (!newOppContent.trim()) return;
    setPosting(true);
    try {
      if (editingOpp) {
        const res = await api.put(`/api/opportunities/${editingOpp.id}`, {
          type: newOppType,
          content: newOppContent.trim(),
          isCvRequired: newOppIsCvRequired,
        });
        if (res.data?.success) {
          showFeedback('success', 'Opportunity updated successfully!');
          setIsPostModalOpen(false);
          fetchOpportunities();
        }
      } else {
        const res = await api.post('/api/opportunities', {
          type: newOppType,
          content: newOppContent.trim(),
          isCvRequired: newOppIsCvRequired,
        });
        if (res.data?.success) {
          showFeedback('success', 'Opportunity posted successfully!');
          setIsPostModalOpen(false);
          setNewOppContent('');
          fetchOpportunities();
        }
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to save opportunity');
    } finally {
      setPosting(false);
    }
  };

  // Handle Delete Opportunity
  const handleDeleteOpportunity = async (oppId) => {
    const isConfirmed = await confirmAlert({
      title: 'Delete Opportunity?',
      text: 'Are you sure you want to delete this job / opportunity posting?',
      confirmButtonText: 'Yes, Delete Posting',
    });
    if (!isConfirmed) return;
    setDeletingId(oppId);
    try {
      const res = await api.delete(`/api/opportunities/${oppId}`);
      if (res.data?.success) {
        showFeedback('success', 'Opportunity deleted successfully');
        setOpportunities(opportunities.filter((o) => o.id !== oppId));
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to delete opportunity');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Toggle Opportunity Status (ACTIVE <-> CLOSED)
  const handleToggleOppStatus = async (opp) => {
    const nextStatus = opp.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    try {
      const res = await api.patch(`/api/opportunities/${opp.id}/status`, { status: nextStatus });
      if (res.data?.success) {
        showFeedback('success', `Opportunity status changed to ${nextStatus}`);
        fetchOpportunities();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to update status');
    }
  };

  // Handle View Applicants List
  const handleViewApplicants = async (opp) => {
    setViewingApplicantsOpp(opp);
    setLoadingApplicants(true);
    try {
      const res = await api.get(`/api/opportunities/${opp.id}/applicants`);
      if (res.data?.success && Array.isArray(res.data.applicants)) {
        setApplicantsList(res.data.applicants);
      } else {
        setApplicantsList([]);
      }
    } catch (err) {
      showFeedback('error', 'Could not load applicants list');
      setApplicantsList([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  // Handle Review Applicant Status
  const handleUpdateApplicantStatus = async (applicationId, status) => {
    try {
      const res = await api.patch(`/api/opportunities/applications/${applicationId}/status`, { status });
      if (res.data?.success) {
        showFeedback('success', `Applicant status updated to ${status}`);
        if (viewingApplicantsOpp) handleViewApplicants(viewingApplicantsOpp);
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to update applicant status');
    }
  };

  // Filter by local search query
  const filteredOpps = opportunities.filter((opp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      opp.content?.toLowerCase().includes(q) ||
      opp.name?.toLowerCase().includes(q) ||
      opp.type?.toLowerCase().includes(q)
    );
  });

  const canPost = user && (user.role === 'ALUMNI' || user.role === 'ADMIN');

  return (
    <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Opportunities Hub
            </h1>
            <Badge variant="secondary_1" className="bg-primary/10 text-primary border-none px-2 py-0.5 text-xs font-bold">
              Careers & Jobs
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Discover job openings, internships, and research collaborations posted directly by verified PSTU alumni.
          </p>
        </div>

        {canPost && (
          <Button
            size="sm"
            onClick={() => setIsPostModalOpen(true)}
            className="text-xs font-semibold gap-1.5 cursor-pointer h-9 shadow-2xs self-start md:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Post Opportunity</span>
          </Button>
        )}
      </div>

      {/* Search & Type Filter Tabs */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search opportunities, keywords, or authors..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {OpportunityTypes.map((t) => {
            const isSelected = selectedType === t.id;
            return (
              <Button
                key={t.id}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedType(t.id);
                  setPage(1);
                }}
                className={`h-8 px-3 text-xs font-semibold cursor-pointer shrink-0 rounded-lg ${
                  isSelected ? 'shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Opportunities List */}
      {loading ? (
        <div className="space-y-3.5">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="p-5 border border-border bg-card rounded-xl shadow-2xs space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-36 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
              <div className="h-12 bg-muted rounded" />
            </Card>
          ))}
        </div>
      ) : filteredOpps.length === 0 ? (
        <Card className="p-12 text-center text-xs text-muted-foreground border-dashed">
          <Briefcase className="h-8 w-8 mx-auto opacity-40 mb-2 text-primary" />
          <p className="font-semibold text-foreground text-sm">No opportunities found</p>
          <p className="mt-1">Try selecting a different opportunity filter or search query.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOpps.map((opp) => (
            <Card key={opp.id} className="border border-border bg-card p-5 rounded-2xl shadow-2xs space-y-3.5 hover:border-primary/40 transition-all">
              {/* Top Row: Author Info */}
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={opp.userId ? `/profile/${opp.userId}` : '#'}
                  className="flex items-center gap-3 group cursor-pointer"
                >
                  <Avatar className="h-11 w-11 border border-border shrink-0 shadow-2xs group-hover:border-primary/50 transition-colors">
                    {opp.profileImageUrl && <AvatarImage src={opp.profileImageUrl} alt={opp.name} />}
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                      {opp.name ? opp.name.slice(0, 2).toUpperCase() : 'AL'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{opp.name || 'Alumni Member'}</h3>
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 text-[10px] font-semibold">
                        {opp.role || 'Alumni'}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {new Date(opp.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>

                <Badge variant="outline" className="text-xs font-bold px-2.5 py-0.5 border-primary/40 text-primary">
                  {opp.type.replace('_', ' ')}
                </Badge>
              </div>

              {/* Body Content */}
              <p className="text-xs text-foreground/95 leading-relaxed whitespace-pre-line bg-muted/20 p-4 rounded-xl border border-border/50">
                {opp.content}
              </p>

              {/* Card Footer Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-[11px]">
                  {user && (Number(user.id) === Number(opp.userId) || user.role === 'ADMIN') ? (
                    <button
                      onClick={() => handleViewApplicants(opp)}
                      className="flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer"
                    >
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span>{opp.applicationCount || 0} applicants (View List)</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span>{opp.applicationCount || 0} applicants</span>
                    </span>
                  )}

                  {opp.isCvRequired && (
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      CV Required
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {user && (Number(user.id) === Number(opp.userId) || user.role === 'ADMIN') ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleOppStatus(opp)}
                        className={`h-8 px-2.5 text-[11px] font-semibold cursor-pointer ${
                          opp.status === 'ACTIVE'
                            ? 'text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10'
                            : 'text-muted-foreground border-border'
                        }`}
                      >
                        {opp.status === 'ACTIVE' ? 'Active' : 'Closed'}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEditModal(opp)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                        title="Edit Opportunity"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteOpportunity(opp.id)}
                        disabled={deletingId === opp.id}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                        title="Delete Opportunity"
                      >
                        {deletingId === opp.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  ) : user && user.role === 'USER' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => (window.location.href = '/dashboard')}
                      className="h-8.5 px-3 text-xs font-semibold gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer shadow-2xs"
                    >
                      <span>Verification Required</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!user) {
                          window.location.href = '/login';
                        } else {
                          setSelectedOpp(opp);
                        }
                      }}
                      disabled={opp.status === 'CLOSED'}
                      className="h-8.5 px-4 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{opp.status === 'CLOSED' ? 'Application Closed' : 'Apply Now'}</span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Apply for Opportunity */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <form onSubmit={handleApply} className="w-full max-w-lg bg-card border border-border p-6 rounded-2xl shadow-xl space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Apply for Opportunity</h3>
              <p className="text-xs text-muted-foreground">Posted by {selectedOpp.name} ({selectedOpp.type.replace('_', ' ')})</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">Introduction / Cover Message</label>
                <textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="Introduce yourself, your relevant background, skills, and why you are interested in this role..."
                  rows={3}
                  className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  Upload Resume / CV (PDF / Word) {selectedOpp.isCvRequired ? '*' : '(Optional)'}
                </label>
                <div className="border border-dashed border-border p-3 rounded-xl bg-muted/20 text-center">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                    className="text-xs text-muted-foreground w-full cursor-pointer"
                  />
                  {cvFile && <p className="text-[11px] font-semibold text-primary mt-1">Selected: {cvFile.name}</p>}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  Or External CV / Portfolio Link (Optional)
                </label>
                <Input
                  type="url"
                  value={applyCvUrl}
                  onChange={(e) => setApplyCvUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/your-cv or portfolio link"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setSelectedOpp(null)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={applying} className="h-9 text-xs font-semibold gap-1.5">
                {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>Submit Application</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Post / Edit Opportunity (Alumni / Admin) */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <form onSubmit={handleSaveOpportunity} className="w-full max-w-lg bg-card border border-border p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground">
              {editingOpp ? 'Edit Opportunity' : 'Post New Job / Opportunity'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Opportunity Type</label>
                <select
                  value={newOppType}
                  onChange={(e) => setNewOppType(e.target.value)}
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
                  value={newOppContent}
                  onChange={(e) => setNewOppContent(e.target.value)}
                  placeholder="Describe the role, responsibilities, tech stack, and how to apply..."
                  required
                  rows={5}
                  className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newOppIsCvRequired}
                  onChange={(e) => setNewOppIsCvRequired(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>Require Applicants to provide CV / Resume</span>
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsPostModalOpen(false)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={posting} className="h-9 text-xs font-semibold">
                {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : editingOpp ? 'Update Opportunity' : 'Publish Opportunity'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: View Applicants List (Alumni / Admin) */}
      {viewingApplicantsOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-card border border-border p-6 rounded-2xl shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">Applicants List</h3>
                <p className="text-xs text-muted-foreground">{viewingApplicantsOpp.type.replace('_', ' ')} Opportunity</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingApplicantsOpp(null)} className="h-7 w-7 p-0">
                ✕
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {loadingApplicants ? (
                <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  <p>Loading applicants...</p>
                </div>
              ) : applicantsList.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground space-y-1">
                  <Users className="h-8 w-8 mx-auto opacity-40 mb-1" />
                  <p className="font-semibold text-foreground text-sm">No applications submitted yet</p>
                </div>
              ) : (
                applicantsList.map((app) => (
                  <div key={app.id} className="p-4 bg-muted/30 rounded-xl border border-border space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-9 w-9 border border-border">
                          {app.profileImageUrl && <AvatarImage src={app.profileImageUrl} />}
                          <AvatarFallback className="font-bold text-xs">
                            {app.studentName ? app.studentName.slice(0, 2).toUpperCase() : 'AP'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-foreground">{app.studentName || 'Applicant'}</h4>
                          <span className="text-[10px] text-muted-foreground">{app.studentEmail || app.departmentName}</span>
                        </div>
                      </div>

                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold ${
                          app.status === 'ACCEPTED' || app.status === 'SHORTLISTED'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : app.status === 'REJECTED'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-amber-500/10 text-amber-700'
                        }`}
                      >
                        {app.status}
                      </Badge>
                    </div>

                    {app.message && (
                      <p className="text-xs text-muted-foreground bg-background p-2.5 rounded-lg border border-border/60">
                        "{app.message}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      {app.cvUrl ? (
                        <a
                          href={app.cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-semibold flex items-center gap-1"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>View Submitted CV</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">No CV attached</span>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateApplicantStatus(app.id, 'SHORTLISTED')}
                          className="h-7 px-2 text-[10px] font-semibold text-emerald-600 hover:bg-emerald-500/10"
                        >
                          Shortlist
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateApplicantStatus(app.id, 'REJECTED')}
                          className="h-7 px-2 text-[10px] font-semibold text-destructive hover:bg-destructive/10"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setViewingApplicantsOpp(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityPage;