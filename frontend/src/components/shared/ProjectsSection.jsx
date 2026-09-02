'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Code2,
  FolderGit2,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Image as ImageIcon,
  CheckCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa6';
import { toast } from 'react-toastify';
import { confirmAlert } from '@/lib/swal';

export default function ProjectsSection({ userId = null, isOwner = false }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [liveLink, setLiveLink] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fileInputRef = useRef(null);

  const showFeedback = (type, msg) => {
    if (type === 'success') toast.success(msg, { autoClose: 1500 });
    else if (type === 'error') toast.error(msg, { autoClose: 2000 });
    else toast.info(msg, { autoClose: 1500 });
  };

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = userId ? `/api/projects/user/${userId}` : '/api/projects';
      const res = await api.get(endpoint);
      if (res.data?.success && Array.isArray(res.data.projects)) {
        setProjects(res.data.projects);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.warn('Error fetching projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleOpenAddModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setGithubLink('');
    setLiveLink('');
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (proj) => {
    setEditingProject(proj);
    setName(proj.name || '');
    setDescription(proj.description || '');
    setGithubLink(proj.githubLink || '');
    setLiveLink(proj.liveLink || '');
    setImageFile(null);
    setImagePreview(proj.imageUrl || null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      showFeedback('error', 'Project name and description are required');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      if (githubLink.trim()) formData.append('githubLink', githubLink.trim());
      if (liveLink.trim()) formData.append('liveLink', liveLink.trim());
      if (imageFile) formData.append('projectImage', imageFile);

      if (editingProject) {
        const res = await api.put(`/api/projects/${editingProject.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data?.success) {
          showFeedback('success', 'Project updated successfully!');
          setIsModalOpen(false);
          fetchProjects();
        }
      } else {
        const res = await api.post('/api/projects', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data?.success) {
          showFeedback('success', 'Project created successfully!');
          setIsModalOpen(false);
          fetchProjects();
        }
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAlert({
      title: 'Delete Project?',
      text: 'Are you sure you want to delete this project from your portfolio?',
      confirmButtonText: 'Yes, Delete Project',
    });
    if (!isConfirmed) return;
    setDeletingId(id);
    try {
      const res = await api.delete(`/api/projects/${id}`);
      if (res.data?.success) {
        showFeedback('success', 'Project deleted successfully');
        setProjects(projects.filter((p) => p.id !== id));
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <FolderGit2 className="h-5 w-5 text-primary" />
            <span>Showcase Projects</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Key software, research, and technical projects built by this user.
          </p>
        </div>

        {isOwner && (
          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="text-xs font-semibold gap-1.5 cursor-pointer h-8.5 shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Project</span>
          </Button>
        )}
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="p-4 border border-border bg-card rounded-xl space-y-3 animate-pulse">
              <div className="h-32 bg-muted rounded-lg" />
              <div className="h-5 w-40 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-8 text-center text-xs text-muted-foreground border-dashed">
          <FolderGit2 className="h-8 w-8 mx-auto opacity-40 mb-2 text-primary" />
          <p className="font-semibold text-foreground text-sm">No projects added yet</p>
          {isOwner && <p className="mt-1">Click "Add Project" to display your technical work and portfolio.</p>}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <Card
              key={proj.id}
              className="border border-border bg-card p-4 rounded-xl shadow-2xs space-y-3 flex flex-col justify-between hover:border-primary/40 transition-all group"
            >
              <div className="space-y-3">
                {/* Project Image Banner */}
                {proj.imageUrl ? (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border bg-muted">
                    <img
                      src={proj.imageUrl}
                      alt={proj.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full h-24 rounded-lg bg-muted/40 border border-border flex items-center justify-center text-muted-foreground/60">
                    <Code2 className="h-8 w-8" />
                  </div>
                )}

                {/* Title & Description */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                      {proj.name}
                    </h4>
                    {isOwner && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(proj)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                          title="Edit Project"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(proj.id)}
                          disabled={deletingId === proj.id}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                          title="Delete Project"
                        >
                          {deletingId === proj.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">
                    {proj.description}
                  </p>
                </div>
              </div>

              {/* External Links */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/70 text-xs">
                {proj.githubLink && (
                  <a
                    href={proj.githubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted text-foreground font-medium text-[11px] transition-colors"
                  >
                    <FaGithub className="h-3.5 w-3.5" />
                    <span>Repository</span>
                  </a>
                )}

                {proj.liveLink && (
                  <a
                    href={proj.liveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-medium text-[11px] transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Live Demo</span>
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg bg-card border border-border p-6 rounded-2xl shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">
                {editingProject ? 'Edit Project' : 'Add Showcase Project'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Project Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AlumNet Portal or Smart Farm IoT"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Project Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview of the project, features, technology stack used..."
                  required
                  rows={4}
                  className="w-full p-2.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">GitHub / Code Repository URL</label>
                  <Input
                    type="url"
                    value={githubLink}
                    onChange={(e) => setGithubLink(e.target.value)}
                    placeholder="https://github.com/user/project"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Live Demo / Deployed URL</label>
                  <Input
                    type="url"
                    value={liveLink}
                    onChange={(e) => setLiveLink(e.target.value)}
                    placeholder="https://myproject.com"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Project Cover Image / Screenshot</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-3 text-center cursor-pointer transition-colors bg-muted/20"
                >
                  {imagePreview ? (
                    <div className="relative h-28 w-full rounded-lg overflow-hidden">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-muted-foreground">
                      <ImageIcon className="h-6 w-6 mb-1 text-primary" />
                      <span className="text-[11px] font-medium">Click to upload cover image</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="h-9 text-xs font-semibold">
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Project'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
