'use client';

import React, { useState, useRef } from 'react';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, X, Send, Loader2 } from 'lucide-react';

const CreatePostCard = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!content.trim() && !selectedFile) || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      if (content.trim()) {
        formData.append('content', content.trim());
      }
      if (selectedFile) {
        formData.append('postImage', selectedFile);
      }

      const response = await api.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        setContent('');
        setImagePreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (onPostCreated) onPostCreated();
      }
    } catch (err) {
      console.error('Failed to create post on database:', err);
      setErrorMsg(
        err.response?.data?.message || 'Failed to create post on database'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex gap-3 items-start">
          <Avatar className="h-10 w-10 shrink-0 border border-border">
            {user?.profileImageUrl ? (
              <AvatarImage src={user.profileImageUrl} alt={user?.name || 'User'} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share an update, industry news, or ask a question..."
              className="min-h-[85px] border-border text-sm placeholder:text-muted-foreground bg-background focus-visible:ring-primary/30"
            />

            {errorMsg && (
              <p className="text-xs text-destructive font-medium">{errorMsg}</p>
            )}

            {/* Hidden File Input for Laptop/Mobile Device Storage Picker */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />

            {/* Selected Image Thumbnail Preview */}
            {imagePreview && (
              <div className="relative rounded-lg overflow-hidden border border-border max-h-60 bg-muted/20 inline-block group">
                <img
                  src={imagePreview}
                  alt="Selected upload preview"
                  className="max-h-56 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-md cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center pt-2.5 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/70 cursor-pointer"
          >
            <ImageIcon className="h-4 w-4 text-primary" />
            <span>{imagePreview ? 'Change Photo' : 'Upload Photo'}</span>
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={(!content.trim() && !selectedFile) || submitting}
            size="sm"
            className="px-5 text-xs font-semibold gap-1.5 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <span>Post</span>
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatePostCard;
