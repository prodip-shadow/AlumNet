'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/home/Sidebar';
import RightEventsSidebar from '@/components/home/RightEventsSidebar';
import CreatePostCard from '@/components/home/CreatePostCard';
import PostCard from '@/components/home/PostCard';
import ScrollToTop from '@/components/home/ScrollToTop';
import { Loader2, MessageSquareOff, CheckCircle } from 'lucide-react';

function formatTimeAgo(dateInput) {
  if (!dateInput) return 'Just now';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput;

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function formatPost(p) {
  return {
    id: p.id,
    userId: p.userId,
    author: {
      id: p.userId,
      name: p.name || 'Anonymous User',
      role: p.role
        ? p.role.charAt(0).toUpperCase() + p.role.slice(1).toLowerCase()
        : 'Alumni',
      avatar: p.profileImageUrl || '',
    },
    timeAgo: formatTimeAgo(p.createdAt),
    content: p.content || '',
    image: p.imageUrl || null,
    likes: Number(p.likeCount || 0),
    isLiked: Boolean(p.isLiked),
    commentsCount: Number(p.commentCount || 0),
    comments: [],
  };
}

const PAGE_SIZE = 10;

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const observerTargetRef = useRef(null);

  const fetchInitialPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/posts?page=1&pageSize=${PAGE_SIZE}`);
      if (response.data?.success && Array.isArray(response.data.posts)) {
        const formatted = response.data.posts.map(formatPost);
        setPosts(formatted);
        setPage(1);
        setHasMore(
          response.data.hasMore ?? response.data.posts.length === PAGE_SIZE,
        );
      } else {
        setPosts([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading posts from database:', err);
      setError(
        err.response?.data?.message || 'Could not load posts from database',
      );
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMorePosts = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const response = await api.get(
        `/api/posts?page=${nextPage}&pageSize=${PAGE_SIZE}`,
      );
      if (response.data?.success && Array.isArray(response.data.posts)) {
        const newPostsFormatted = response.data.posts.map(formatPost);

        setPosts((prevPosts) => {
          const existingIds = new Set(prevPosts.map((p) => p.id));
          const uniqueNewPosts = newPostsFormatted.filter(
            (p) => !existingIds.has(p.id),
          );
          return [...prevPosts, ...uniqueNewPosts];
        });

        setPage(nextPage);
        setHasMore(
          response.data.hasMore ?? response.data.posts.length === PAGE_SIZE,
        );
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, page]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchInitialPosts();
    });
  }, [fetchInitialPosts]);

  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchMorePosts();
        }
      },
      { threshold: 0.1, rootMargin: '300px' },
    );

    observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loading, loadingMore, fetchMorePosts]);

  const handlePostCreated = () => {
    fetchInitialPosts();
  };

  const handleToggleLike = async (postId) => {
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return;

    const newIsLiked = !targetPost.isLiked;
    const newLikeCount = newIsLiked
      ? targetPost.likes + 1
      : Math.max(0, targetPost.likes - 1);

    // Optimistic UI update
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: newIsLiked,
            likes: newLikeCount,
          };
        }
        return post;
      }),
    );

    // Call Backend API
    try {
      if (newIsLiked) {
        await api.post(`/api/posts/${postId}/like`);
      } else {
        await api.delete(`/api/posts/${postId}/like`);
      }
    } catch (err) {
      console.error('Backend like error:', err);
      // Revert if API failed
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              isLiked: targetPost.isLiked,
              likes: targetPost.likes,
            };
          }
          return post;
        }),
      );
    }
  };

  return (
    <div className="px-4 md:px-6 py-6 max-w-[1750px] mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start relative w-full">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Middle Main Feed Area */}
        <main className="flex-1 space-y-6 max-w-3xl min-w-0 mx-auto w-full">
          {/* Share Post Card Component */}
          <CreatePostCard onPostCreated={handlePostCreated} />

          {/* Database Posts Feed List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-14 space-y-3 bg-card border border-border rounded-xl shadow-xs">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">
                Fetching posts from database...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-card border border-destructive/20 rounded-xl space-y-2">
              <p className="text-sm font-semibold text-destructive">{error}</p>
              <button
                onClick={fetchInitialPosts}
                className="text-xs text-primary hover:underline font-medium cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center bg-card border border-border rounded-xl space-y-3 shadow-xs">
              <MessageSquareOff className="h-10 w-10 text-muted-foreground/60" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  No posts in database yet
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Be the first to share an update with your community!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onToggleLike={handleToggleLike}
                  onRefreshPosts={fetchInitialPosts}
                />
              ))}

              <div ref={observerTargetRef} className="py-4 text-center">
                {loadingMore && (
                  <div className="flex items-center justify-center space-x-2 py-3 bg-card border border-border/60 rounded-xl shadow-2xs">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground font-medium">
                      Loading more posts...
                    </span>
                  </div>
                )}
                {!hasMore && posts.length > 0 && (
                  <div className="flex items-center justify-center space-x-2 py-4 text-muted-foreground text-xs">
                    <CheckCircle className="h-4 w-4 text-primary/70" />
                    <span>You have reached the end of the feed</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar: Top 3 Latest Events */}
        <RightEventsSidebar />
      </div>

      <ScrollToTop />
    </div>
  );
};

export default Home;
