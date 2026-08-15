'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ThumbsUp,
  MessageSquare,
  Send,
  MoreHorizontal,
  CornerDownRight,
  Reply,
  Loader2,
  Pencil,
  Trash2,
  Image as ImageIcon,
  X,
  AlertTriangle,
  Maximize2,
} from 'lucide-react';

function formatTimeAgo(dateInput) {
  if (!dateInput) return 'Just now';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput;

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

const PostCard = ({ post, onToggleLike, onRefreshPosts }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [loadingComments, setLoadingComments] = useState(false);
  const [mainCommentText, setMainCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Large Image Preview Lightbox State
  const [isPreviewImageOpen, setIsPreviewImageOpen] = useState(false);

  // Active reply state
  const [activeReplyState, setActiveReplyState] = useState(null);
  const [replyInputText, setReplyInputText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Post Options Dropdown & Modals state
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Edit post form state
  const [editContent, setEditContent] = useState(post.content || '');
  const [editImagePreview, setEditImagePreview] = useState(post.image || null);
  const [editFile, setEditFile] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const editFileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Check if logged in user is post owner
  const isOwner = Boolean(
    user && (user.id === post.userId || user.id === post.author?.id)
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close Image Preview on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsPreviewImageOpen(false);
      }
    };
    if (isPreviewImageOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewImageOpen]);

  const fetchComments = useCallback(async () => {
    try {
      const response = await api.get(`/api/posts/${post.id}/comments`);
      if (response.data?.success) {
        const rawComments = response.data.comments || [];
        const commentsWithReplies = await Promise.all(
          rawComments.map(async (c) => {
            try {
              const repRes = await api.get(`/api/comments/${c.id}/replies`);
              return {
                id: c.id,
                userId: c.userId,
                authorName: c.name || 'User',
                authorAvatar: c.profileImageUrl || '',
                text: c.content,
                timeAgo: formatTimeAgo(c.createdAt),
                likes: Number(c.likeCount || 0),
                isLiked: Boolean(c.isLiked),
                replies: (repRes.data?.replies || []).map((r) => ({
                  id: r.id,
                  userId: r.userId,
                  authorName: r.name || 'User',
                  authorAvatar: r.profileImageUrl || '',
                  text: r.content,
                  timeAgo: formatTimeAgo(r.createdAt),
                  likes: Number(r.likeCount || 0),
                  isLiked: Boolean(r.isLiked),
                })),
              };
            } catch (err) {
              return {
                id: c.id,
                userId: c.userId,
                authorName: c.name || 'User',
                authorAvatar: c.profileImageUrl || '',
                text: c.content,
                timeAgo: formatTimeAgo(c.createdAt),
                likes: Number(c.likeCount || 0),
                isLiked: Boolean(c.isLiked),
                replies: [],
              };
            }
          })
        );
        setComments(commentsWithReplies);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  }, [post.id]);

  // Fetch comments when opened
  useEffect(() => {
    if (showComments && post.id) {
      queueMicrotask(() => {
        fetchComments();
      });
    }
  }, [showComments, post.id, fetchComments]);

  const handleToggleComments = () => {
    if (!showComments) {
      setLoadingComments(true);
    }
    setShowComments((prev) => !prev);
  };

  const handleMainCommentSubmit = async (e) => {
    e.preventDefault();
    if (!mainCommentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const response = await api.post(`/api/posts/${post.id}/comments`, {
        content: mainCommentText.trim(),
      });

      if (response.data?.success) {
        setMainCommentText('');
        fetchComments();
        if (onRefreshPosts) onRefreshPosts();
      }
    } catch (err) {
      const newComment = {
        id: Date.now(),
        userId: user?.id,
        authorName: user?.name || 'You',
        authorAvatar: user?.profileImageUrl || '',
        text: mainCommentText.trim(),
        timeAgo: 'Just now',
        likes: 0,
        isLiked: false,
        replies: [],
      };
      setComments([...comments, newComment]);
      setMainCommentText('');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await api.delete(`/api/comments/${commentId}`);
      if (response.data?.success) {
        setComments(comments.filter((c) => c.id !== commentId));
        if (onRefreshPosts) onRefreshPosts();
      }
    } catch (err) {
      console.error('Delete comment error:', err);
      setComments(comments.filter((c) => c.id !== commentId));
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    const targetComment = comments.find((c) => c.id === commentId);
    if (!targetComment) return;

    const newIsLiked = !targetComment.isLiked;
    const newLikes = newIsLiked
      ? targetComment.likes + 1
      : Math.max(0, targetComment.likes - 1);

    setComments(
      comments.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            isLiked: newIsLiked,
            likes: newLikes,
          };
        }
        return c;
      })
    );

    try {
      if (newIsLiked) {
        await api.post(`/api/comments/${commentId}/like`);
      } else {
        await api.delete(`/api/comments/${commentId}/like`);
      }
    } catch (err) {
      console.error('Comment like error:', err);
    }
  };

  const handleOpenReplyBox = (commentId, authorName) => {
    if (
      activeReplyState &&
      activeReplyState.commentId === commentId &&
      activeReplyState.replyingToName === authorName
    ) {
      setActiveReplyState(null);
      setReplyInputText('');
    } else {
      setActiveReplyState({ commentId, replyingToName: authorName });
      setReplyInputText(`@${authorName} `);
    }
  };

  const handleReplySubmit = async (commentId, e) => {
    e.preventDefault();
    if (!replyInputText.trim() || submittingReply) return;

    setSubmittingReply(true);
    try {
      const response = await api.post(`/api/comments/${commentId}/replies`, {
        content: replyInputText.trim(),
      });

      if (response.data?.success) {
        setReplyInputText('');
        setActiveReplyState(null);
        fetchComments();
      }
    } catch (err) {
      const newReply = {
        id: Date.now(),
        userId: user?.id,
        authorName: user?.name || 'You',
        authorAvatar: user?.profileImageUrl || '',
        text: replyInputText.trim(),
        timeAgo: 'Just now',
        likes: 0,
        isLiked: false,
      };
      setComments(
        comments.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              replies: [...(c.replies || []), newReply],
            };
          }
          return c;
        })
      );
      setReplyInputText('');
      setActiveReplyState(null);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    try {
      await api.delete(`/api/replies/${replyId}`);
    } catch (err) {
      console.error('Delete reply error:', err);
    } finally {
      setComments(
        comments.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              replies: c.replies.filter((r) => r.id !== replyId),
            };
          }
          return c;
        })
      );
    }
  };

  const handleToggleReplyLike = async (commentId, replyId) => {
    setComments(
      comments.map((c) => {
        if (c.id === commentId) {
          const updatedReplies = c.replies.map((r) => {
            if (r.id === replyId) {
              const newIsLiked = !r.isLiked;
              const newLikes = newIsLiked
                ? (r.likes || 0) + 1
                : Math.max(0, (r.likes || 0) - 1);
              return {
                ...r,
                isLiked: newIsLiked,
                likes: newLikes,
              };
            }
            return r;
          });
          return { ...c, replies: updatedReplies };
        }
        return c;
      })
    );

    const targetComment = comments.find((c) => c.id === commentId);
    const targetReply = targetComment?.replies?.find((r) => r.id === replyId);
    if (!targetReply) return;

    try {
      if (!targetReply.isLiked) {
        await api.post(`/api/replies/${replyId}/like`);
      } else {
        await api.delete(`/api/replies/${replyId}/like`);
      }
    } catch (err) {
      console.error('Reply like error:', err);
    }
  };

  // Image change for Edit modal
  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Update Post handler
  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!editContent.trim() && !editImagePreview) return;

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('content', editContent.trim());
      if (editFile) {
        formData.append('postImage', editFile);
      }

      const response = await api.put(`/api/posts/${post.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.success) {
        setIsEditModalOpen(false);
        if (onRefreshPosts) onRefreshPosts();
      }
    } catch (err) {
      console.error('Error updating post:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Delete Post handler
  const handleDeletePost = async () => {
    setDeleting(true);
    try {
      const response = await api.delete(`/api/posts/${post.id}`);
      if (response.data?.success) {
        setIsDeleteModalOpen(false);
        if (onRefreshPosts) onRefreshPosts();
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    } finally {
      setDeleting(false);
    }
  };

  const authorProfileLink = post.userId ? `/profile/${post.userId}` : '/profile';

  return (
    <>
      <Card className="border border-border bg-card shadow-xs hover:shadow-sm transition-shadow overflow-hidden rounded-xl">
        {/* Post Header */}
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 relative">
          <Link
            href={authorProfileLink}
            className="flex items-center gap-3 group/author cursor-pointer"
          >
            <Avatar className="h-10 w-10 border border-border group-hover/author:ring-2 group-hover/author:ring-primary/40 transition-all">
              <AvatarImage src={post.author?.avatar} alt={post.author?.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {post.author?.name ? post.author.name.slice(0, 2).toUpperCase() : 'US'}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-foreground leading-none group-hover/author:text-primary group-hover/author:underline transition-colors">
                  {post.author?.name || 'User'}
                </h3>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {post.author?.role || 'Alumni'}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">{post.timeAgo}</span>
            </div>
          </Link>

          {/* 3-Dot Options Button (Owner only) */}
          {isOwner && (
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDropdown(!showDropdown)}
                className="rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>

              {/* Options Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-lg p-1.5 z-30 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      setEditContent(post.content || '');
                      setEditImagePreview(post.image || null);
                      setIsEditModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5 text-primary" />
                    <span>Edit Post</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      setIsDeleteModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Post</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        {/* Post Body */}
        <CardContent className="p-4 pt-1 space-y-3">
          {post.content && (
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {post.content}
            </p>
          )}

          {/* Post Image with Click-to-Preview Fullscreen */}
          {post.image && (
            <div
              onClick={() => setIsPreviewImageOpen(true)}
              className="rounded-lg overflow-hidden border border-border max-h-96 bg-muted/20 cursor-pointer group/img relative"
              title="Click to view full screen"
            >
              <img
                src={post.image}
                alt="Post attachment"
                className="w-full h-full object-cover max-h-96 group-hover/img:scale-[1.01] transition-transform duration-200"
              />
              <div className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity">
                <Maximize2 className="h-4 w-4" />
              </div>
            </div>
          )}

          {/* Actions Row: Like & Comment Side-by-Side */}
          <div className="flex items-center gap-2 pt-3 border-t border-border text-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleLike(post.id)}
              className={`gap-2 cursor-pointer ${
                post.isLiked
                  ? 'text-primary font-semibold bg-primary/10 hover:bg-primary/15'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ThumbsUp
                className={`h-4 w-4 ${
                  post.isLiked ? 'fill-primary text-primary' : ''
                }`}
              />
              <span>{post.likes} Likes</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleComments}
              className="gap-2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>{post.commentsCount ?? comments.length} Comments</span>
            </Button>
          </div>
        </CardContent>

        {/* Facebook-style Comment & Reply Section */}
        {showComments && (
          <div className="bg-muted/30 border-t border-border p-4 space-y-4">
            {/* Main Comment Input */}
            <form
              onSubmit={handleMainCommentSubmit}
              className="flex items-center gap-2.5"
            >
              <Avatar className="h-8 w-8 shrink-0 border border-border">
                {user?.profileImageUrl ? (
                  <AvatarImage src={user.profileImageUrl} alt={user?.name || 'User'} />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                </AvatarFallback>
              </Avatar>

              <Input
                value={mainCommentText}
                onChange={(e) => setMainCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-background text-xs h-9"
              />

              <Button
                type="submit"
                size="sm"
                disabled={!mainCommentText.trim() || submittingComment}
                className="h-9 px-3 cursor-pointer gap-1"
              >
                {submittingComment ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </form>

            {/* Comments List */}
            <div className="space-y-3.5 pt-1">
              {loadingComments ? (
                <div className="flex items-center justify-center py-4 text-xs text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Loading comments...</span>
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-2">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => {
                  const isCommentOwner = Boolean(
                    user && (user.id === comment.userId || user.role === 'ADMIN')
                  );

                  return (
                    <div key={comment.id} className="space-y-2">
                      {/* Parent Comment Item */}
                      <div className="flex items-start gap-2.5">
                        <Link href={comment.userId ? `/profile/${comment.userId}` : '/profile'}>
                          <Avatar className="h-7 w-7 mt-0.5 shrink-0 border border-border hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer">
                            <AvatarImage
                              src={comment.authorAvatar}
                              alt={comment.authorName}
                            />
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px] font-bold">
                              {comment.authorName
                                ? comment.authorName.slice(0, 2).toUpperCase()
                                : 'CM'}
                            </AvatarFallback>
                          </Avatar>
                        </Link>

                        <div className="flex-1 bg-background rounded-lg p-2.5 border border-border text-xs group/comment">
                          <div className="flex justify-between items-center mb-1">
                            <Link
                              href={comment.userId ? `/profile/${comment.userId}` : '/profile'}
                              className="font-semibold text-foreground hover:text-primary hover:underline transition-colors cursor-pointer"
                            >
                              {comment.authorName}
                            </Link>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">
                                {comment.timeAgo}
                              </span>
                              {isCommentOwner && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  title="Delete Comment"
                                  className="text-muted-foreground/60 hover:text-destructive transition-colors opacity-0 group-hover/comment:opacity-100 cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-muted-foreground leading-snug">
                            {comment.text}
                          </p>

                          {/* Comment Action Bar */}
                          <div className="mt-1.5 pt-1 border-t border-border/50 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleCommentLike(comment.id)}
                              className={`flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
                                comment.isLiked
                                  ? 'text-primary font-semibold'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <ThumbsUp
                                className={`h-3 w-3 ${
                                  comment.isLiked ? 'fill-primary text-primary' : ''
                                }`}
                              />
                              <span>
                                {comment.isLiked ? 'Liked' : 'Like'}
                                {comment.likes > 0 ? ` (${comment.likes})` : ''}
                              </span>
                            </button>

                            <span className="text-[10px] text-muted-foreground/40">•</span>

                            <button
                              type="button"
                              onClick={() =>
                                handleOpenReplyBox(comment.id, comment.authorName)
                              }
                              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary font-medium transition-colors cursor-pointer"
                            >
                              <Reply className="h-3 w-3" />
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Inline Reply Input Box */}
                      {activeReplyState?.commentId === comment.id && (
                        <form
                          onSubmit={(e) => handleReplySubmit(comment.id, e)}
                          className="ml-9 flex items-center gap-2 pt-1"
                        >
                          <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <Input
                            value={replyInputText}
                            onChange={(e) => setReplyInputText(e.target.value)}
                            placeholder={`Reply to ${activeReplyState.replyingToName}...`}
                            className="flex-1 bg-background text-[11px] h-8"
                            autoFocus
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!replyInputText.trim() || submittingReply}
                            className="h-8 px-2.5 text-[11px] cursor-pointer gap-1"
                          >
                            {submittingReply ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Reply'
                            )}
                          </Button>
                        </form>
                      )}

                      {/* Nested Replies List */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-9 space-y-2 border-l-2 border-border/60 pl-3 pt-1">
                          {comment.replies.map((reply) => {
                            const isReplyOwner = Boolean(
                              user && (user.id === reply.userId || user.role === 'ADMIN')
                            );

                            return (
                              <div key={reply.id} className="flex items-start gap-2">
                                <Link href={reply.userId ? `/profile/${reply.userId}` : '/profile'}>
                                  <Avatar className="h-6 w-6 shrink-0 border border-border hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer">
                                    <AvatarImage
                                      src={reply.authorAvatar}
                                      alt={reply.authorName}
                                    />
                                    <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-bold">
                                      {reply.authorName
                                        ? reply.authorName.slice(0, 2).toUpperCase()
                                        : 'RP'}
                                    </AvatarFallback>
                                  </Avatar>
                                </Link>

                                <div className="flex-1 bg-background rounded-md p-2 border border-border text-[11px] group/reply">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <Link
                                      href={reply.userId ? `/profile/${reply.userId}` : '/profile'}
                                      className="font-semibold text-foreground hover:text-primary hover:underline transition-colors cursor-pointer"
                                    >
                                      {reply.authorName}
                                    </Link>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] text-muted-foreground">
                                        {reply.timeAgo}
                                      </span>
                                      {isReplyOwner && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteReply(comment.id, reply.id)}
                                          title="Delete Reply"
                                          className="text-muted-foreground/60 hover:text-destructive transition-colors opacity-0 group-hover/reply:opacity-100 cursor-pointer"
                                        >
                                          <Trash2 className="h-2.5 w-2.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-muted-foreground leading-snug">
                                    {reply.text}
                                  </p>

                                  {/* Reply Action Bar */}
                                  <div className="mt-1 pt-0.5 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleReplyLike(comment.id, reply.id)}
                                      className={`flex items-center gap-1 text-[10px] font-medium transition-colors cursor-pointer ${
                                        reply.isLiked
                                          ? 'text-primary font-semibold'
                                          : 'text-muted-foreground hover:text-foreground'
                                      }`}
                                    >
                                      <ThumbsUp
                                        className={`h-2.5 w-2.5 ${
                                          reply.isLiked ? 'fill-primary text-primary' : ''
                                        }`}
                                      />
                                      <span>
                                        {reply.isLiked ? 'Liked' : 'Like'}
                                        {reply.likes > 0 ? ` (${reply.likes})` : ''}
                                      </span>
                                    </button>

                                    <span className="text-[9px] text-muted-foreground/40">•</span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenReplyBox(
                                          comment.id,
                                          reply.authorName
                                        )
                                      }
                                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary font-medium transition-colors cursor-pointer"
                                    >
                                      <Reply className="h-2.5 w-2.5" />
                                      <span>Reply</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </Card>

      {/* True Fullscreen Image Preview Lightbox Modal */}
      {isPreviewImageOpen && post.image && (
        <div
          onClick={() => setIsPreviewImageOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-150 cursor-zoom-out select-none"
        >
          <button
            type="button"
            onClick={() => setIsPreviewImageOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/60 hover:bg-black/90 p-3 rounded-full transition-all cursor-pointer z-50 shadow-2xl hover:scale-110"
            title="Close Fullscreen (Esc)"
          >
            <X className="h-6 w-6 stroke-[2.5]" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full flex items-center justify-center overflow-hidden cursor-default"
          >
            <img
              src={post.image}
              alt="Post attachment full screen view"
              className="w-full h-full object-contain select-none max-w-none max-h-none"
            />
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
                Edit Post
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditModalOpen(false)}
                className="h-7 w-7 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleUpdatePost} className="space-y-4">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit post content..."
                className="min-h-[110px] text-sm bg-background border-border"
              />

              <input
                type="file"
                ref={editFileInputRef}
                onChange={handleEditImageChange}
                accept="image/*"
                className="hidden"
              />

              {editImagePreview && (
                <div className="relative rounded-lg overflow-hidden border border-border max-h-48 inline-block">
                  <img
                    src={editImagePreview}
                    alt="Edit preview"
                    className="max-h-44 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      setEditImagePreview(null);
                      setEditFile(null);
                    }}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editFileInputRef.current?.click()}
                  className="gap-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <span>
                    {editImagePreview ? 'Change Photo' : 'Upload Photo'}
                  </span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updating || (!editContent.trim() && !editImagePreview)}
                    size="sm"
                    className="text-xs font-semibold px-4 cursor-pointer gap-1.5"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden p-5 space-y-4 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground">
                Delete Post?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-center items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
                className="text-xs min-w-[90px]"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeletePost}
                disabled={deleting}
                className="text-xs min-w-[90px] font-semibold gap-1.5 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostCard;
