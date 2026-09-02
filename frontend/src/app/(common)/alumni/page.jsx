'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import AlumniCard from '@/components/alumni/AlumniCard';
import AlumniCardSkeleton from '@/components/alumni/AlumniCardSkeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  X,
  ArrowUpDown,
  Users,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

const PAGE_SIZE = 10;

const AlumniDirectoryPage = () => {
  const { user } = useAuth();
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // User's existing connections
  const [connectedUserIds, setConnectedUserIds] = useState(new Set());
  const [pendingUserIds, setPendingUserIds] = useState(new Set());

  // Search Debounce ref
  const searchTimeoutRef = useRef(null);

  // Fetch Connected & Pending user IDs if logged in
  const fetchUserConnections = useCallback(async () => {
    if (!user) return;
    try {
      const [connectionsRes, outgoingRes] = await Promise.allSettled([
        api.get('/api/connections'),
        api.get('/api/connections/outgoing'),
      ]);

      if (
        connectionsRes.status === 'fulfilled' &&
        connectionsRes.value.data?.success &&
        Array.isArray(connectionsRes.value.data.connections)
      ) {
        const ids = new Set();
        connectionsRes.value.data.connections.forEach((c) => {
          const cId =
            c.connectedUserId ||
            (c.requesterId && c.recipientId
              ? Number(c.requesterId) === Number(user.id)
                ? c.recipientId
                : c.requesterId
              : c.userId);
          if (cId) {
            ids.add(Number(cId));
          }
        });
        setConnectedUserIds(ids);
      }

      if (
        outgoingRes.status === 'fulfilled' &&
        outgoingRes.value.data?.success &&
        Array.isArray(outgoingRes.value.data.requests)
      ) {
        const pIds = new Set(
          outgoingRes.value.data.requests.map((r) =>
            Number(r.recipientId || r.targetUserId || r.userId)
          )
        );
        setPendingUserIds(pIds);
      }
    } catch (err) {
      console.warn('Could not fetch user connection states:', err);
    }
  }, [user]);

  // Fetch Alumni List from Backend
  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (activeSearch.trim()) {
        params.append('search', activeSearch.trim());
      }
      if (sortBy) {
        params.append('sort', sortBy);
      }
      params.append('page', String(page));
      params.append('pageSize', String(PAGE_SIZE));

      const response = await api.get(`/api/alumni?${params.toString()}`);

      if (response.data?.success && Array.isArray(response.data.alumni)) {
        setAlumniList(response.data.alumni);
        setHasMore(response.data.alumni.length === PAGE_SIZE);
      } else {
        setAlumniList([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching alumni directory:', err);
      setError(
        err.response?.data?.message || 'Failed to load alumni directory',
      );
      setAlumniList([]);
    } finally {
      setLoading(false);
    }
  }, [activeSearch, sortBy, page]);

  // Debounced search term updater
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setActiveSearch(val);
      setPage(1);
    }, 400);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearch('');
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setActiveSearch('');
    setSortBy('');
    setPage(1);
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchAlumni();
    });
  }, [fetchAlumni]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchUserConnections();
    });
  }, [fetchUserConnections]);

  const handleOpenProfileModal = (userId) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
  };

  const handleConnectionSent = (targetUserId) => {
    setPendingUserIds((prev) => new Set([...prev, Number(targetUserId)]));
  };

  return (
    <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Alumni Directory
            </h1>
            <Badge
              variant="secondary_1"
              className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-none"
            >
              Network
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Connect, network, and discover PSTU alumni across faculties and
            graduation sessions.
          </p>
        </div>

        {/* Quick count indicator */}
        {!loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground self-start md:self-auto bg-muted/40 px-3 py-1.5 rounded-lg border border-border/60">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>
              {alumniList.length > 0
                ? `Showing ${alumniList.length} alumni on page ${page}`
                : 'No alumni found'}
            </span>
          </div>
        )}
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by alumni name or skill (e.g. React, Python)..."
            className="pl-9 pr-8 h-9 text-xs bg-background border-border"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="h-9 w-full sm:w-48 text-xs bg-background border border-border rounded-md px-3 pr-8 text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer appearance-none"
            >
              <option value="">Recently Joined</option>
              <option value="graduationdesc">Graduation: Newest First</option>
              <option value="graduationasc">Graduation: Oldest First</option>
              <option value="nameasc">Name: A to Z</option>
              <option value="namedesc">Name: Z to A</option>
            </select>
            <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {(activeSearch || sortBy) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              title="Reset all filters"
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Directory List (One per row, Facebook/LinkedIn style) */}
      {loading ? (
        <div className="flex flex-col space-y-3.5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <AlumniCardSkeleton key={idx} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card border border-destructive/20 rounded-xl space-y-3 shadow-xs">
          <p className="text-sm font-semibold text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlumni}
            className="text-xs cursor-pointer"
          >
            Try again
          </Button>
        </div>
      ) : alumniList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card border border-border rounded-xl space-y-3 shadow-xs">
          <div className="p-3 bg-muted rounded-full text-muted-foreground">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              No alumni found
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {activeSearch
                ? `No alumni matching "${activeSearch}". Try searching with a different name or skill.`
                : 'No verified alumni profiles available in the directory yet.'}
            </p>
          </div>
          {activeSearch && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs cursor-pointer mt-1"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col space-y-3.5">
            {alumniList.map((alumni) => {
              const uId = Number(alumni.userId || alumni.id);
              return (
                <AlumniCard
                  key={uId}
                  alumni={alumni}
                  isInitiallyConnected={connectedUserIds.has(uId)}
                  isInitiallyPending={pendingUserIds.has(uId)}
                />
              );
            })}
          </div>

          {/* Pagination Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-border/70">
            <div className="text-xs text-muted-foreground">
              Page <span className="font-semibold text-foreground">{page}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="h-8 px-3 text-xs gap-1 cursor-pointer disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore || loading}
                className="h-8 px-3 text-xs gap-1 cursor-pointer disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlumniDirectoryPage;
