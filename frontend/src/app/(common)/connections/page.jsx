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
  Users,
  UserCheck,
  UserPlus,
  UserX,
  Search,
  Check,
  X,
  Clock,
  Loader2,
  CheckCircle,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';

const ConnectionsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const [activeTab, setActiveTab] = useState('connections'); // connections, incoming, outgoing

  // Connections Data
  const [connections, setConnections] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // User Profile Modal State
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const fetchConnectionsData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const promises = [
        api.get('/api/connections'),
        api.get('/api/connections/outgoing'),
        api.get('/api/connections/incoming'),
      ];

      const results = await Promise.allSettled(promises);
      const connRes = results[0];
      const outRes = results[1];
      const incRes = results[2];

      if (connRes.status === 'fulfilled' && connRes.value.data?.success) {
        setConnections(connRes.value.data.connections || []);
      }
      if (outRes.status === 'fulfilled' && outRes.value.data?.success) {
        setOutgoing(outRes.value.data.requests || []);
      }
      if (incRes && incRes.status === 'fulfilled' && incRes.value.data?.success) {
        setIncoming(incRes.value.data.requests || []);
      }
    } catch (err) {
      console.warn('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConnectionsData();
  }, [fetchConnectionsData]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) {
        if (tab === 'received' || tab === 'incoming') setActiveTab('incoming');
        else if (tab === 'sent' || tab === 'outgoing') setActiveTab('outgoing');
        else if (tab === 'connections') setActiveTab('connections');
      }
    }
  }, []);

  // Handle Accept
  const handleAccept = async (reqId, reqName) => {
    setActionLoadingId(reqId);
    try {
      const res = await api.patch(`/api/connections/${reqId}/accept`);
      if (res.data?.success) {
        toast.success(`Connected with ${reqName || 'alumni'}!`, { autoClose: 1500 });
        fetchConnectionsData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept connection', { autoClose: 2000 });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject
  const handleReject = async (reqId) => {
    setActionLoadingId(reqId);
    try {
      const res = await api.patch(`/api/connections/${reqId}/reject`);
      if (res.data?.success) {
        toast.info('Connection request ignored', { autoClose: 1500 });
        fetchConnectionsData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject connection', { autoClose: 2000 });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Cancel Outgoing
  const handleCancelOutgoing = async (reqId, targetName) => {
    setActionLoadingId(reqId);
    try {
      const res = await api.delete(`/api/connections/${reqId}/cancel`);
      if (res.data?.success) {
        toast.info(`Cancelled request to ${targetName || 'alumni'}`, { autoClose: 1500 });
        fetchConnectionsData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel request', { autoClose: 2000 });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Remove Connection (Unfriend)
  const handleRemoveConnection = async (connectionId, targetName) => {
    if (!confirm(`Are you sure you want to remove connection with ${targetName || 'this user'}?`)) return;
    setActionLoadingId(connectionId);
    try {
      const res = await api.delete(`/api/connections/${connectionId}/remove`);
      if (res.data?.success) {
        toast.info(`Connection removed with ${targetName || 'alumni'}`, { autoClose: 1500 });
        fetchConnectionsData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove connection', { autoClose: 2000 });
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Users className="h-12 w-12 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-bold text-foreground">Sign In to Manage Connections</h2>
        <p className="text-xs text-muted-foreground max-w-sm">Connect with fellow PSTU students, graduates, and professors.</p>
        <Link href="/login">
          <Button size="sm" className="text-xs font-semibold">
            Log In Now
          </Button>
        </Link>
      </div>
    );
  }

  // Filtered lists by search
  const filteredConnections = connections.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.currentCompany?.toLowerCase().includes(q);
  });

  const handleOpenProfile = (targetUserId) => {
    if (!targetUserId) return;
    router.push(`/profile/${targetUserId}`);
  };

  const tabs = [
    { id: 'connections', label: `My Connections (${connections.length})`, icon: Users },
    { id: 'incoming', label: `Received (${incoming.length})`, icon: UserCheck, badge: incoming.length },
    { id: 'outgoing', label: `Sent (${outgoing.length})`, icon: Clock },
  ];

  return (
    <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto space-y-6">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              My Network & Connections
            </h1>
            <Badge variant="secondary_1" className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-none px-2 py-0.5 text-xs font-bold">
              {connections.length} Connected
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isStudent
              ? 'Manage your connections with PSTU alumni and track your sent connection requests.'
              : 'Manage your peer relationships, respond to incoming requests, and discover PSTU alumni.'}
          </p>
        </div>

        <Link href="/alumni">
          <Button size="sm" variant="outline" className="text-xs font-semibold gap-1.5 h-9 cursor-pointer">
            <UserPlus className="h-3.5 w-3.5 text-primary" />
            <span>Discover Alumni</span>
          </Button>
        </Link>
      </div>

      {/* Search Filter & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 border-b sm:border-b-0 border-border pb-2 sm:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs font-semibold gap-1.5 cursor-pointer h-9 px-3.5 rounded-lg ${
                  isActive ? 'shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </div>

        {activeTab === 'connections' && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search connections..."
              className="pl-8 h-9 text-xs"
            />
          </div>
        )}
      </div>

      {/* Tab 1: My Connections */}
      {activeTab === 'connections' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Loading connections...</div>
          ) : filteredConnections.length === 0 ? (
            <Card className="p-12 text-center text-xs text-muted-foreground border-dashed">
              <Users className="h-8 w-8 mx-auto opacity-40 mb-2 text-primary" />
              <p className="font-semibold text-foreground text-sm">No connections found</p>
              <p className="mt-1">Connect with classmates and alumni on the Alumni directory.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredConnections.map((c) => (
                <Card key={c.connectionId} className="border border-border bg-card p-4 rounded-xl shadow-2xs flex items-center justify-between gap-3 hover:border-primary/40 transition-colors">
                  <div
                    onClick={() => handleOpenProfile(c.connectedUserId)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                  >
                    <Avatar className="h-12 w-12 border border-border shrink-0 group-hover:border-primary/50 transition-colors">
                      {c.profileImageUrl && <AvatarImage src={c.profileImageUrl} alt={c.name} />}
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                        {c.name ? c.name.slice(0, 2).toUpperCase() : 'AL'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {c.name}
                        </h4>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                          {c.role || 'Member'}
                        </Badge>
                      </div>
                      {(c.currentPosition || c.currentCompany) && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {c.currentPosition} {c.currentCompany ? `at ${c.currentCompany}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenProfile(c.connectedUserId)}
                      className="h-8 px-2.5 text-xs font-semibold cursor-pointer"
                    >
                      Profile
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveConnection(c.connectionId, c.name)}
                      disabled={actionLoadingId === c.connectionId}
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      title="Remove connection"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Incoming Requests */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Loading received requests...</div>
          ) : incoming.length === 0 ? (
            <Card className="p-12 text-center text-xs text-muted-foreground border-dashed">
              <UserCheck className="h-8 w-8 mx-auto opacity-40 mb-2 text-primary" />
              <p className="font-semibold text-foreground text-sm">No incoming connection requests</p>
              <p className="mt-1">When someone sends you a connection request, it will appear here.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {incoming.map((req) => (
                <Card key={req.id} className="border border-border bg-card p-4 rounded-xl shadow-2xs flex flex-col justify-between gap-3">
                  <div
                    onClick={() => handleOpenProfile(req.requesterId)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <Avatar className="h-12 w-12 border border-border shrink-0 group-hover:border-primary/50 transition-colors">
                      {req.profileImageUrl && <AvatarImage src={req.profileImageUrl} alt={req.name} />}
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                        {req.name ? req.name.slice(0, 2).toUpperCase() : 'US'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {req.name}
                        </h4>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {req.role || 'Member'}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        Sent on {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenProfile(req.requesterId)}
                      className="h-8 text-xs font-semibold cursor-pointer"
                    >
                      View Profile
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAccept(req.id, req.name)}
                      disabled={actionLoadingId === req.id}
                      className="flex-1 text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Accept</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(req.id)}
                      disabled={actionLoadingId === req.id}
                      className="h-8 text-xs font-semibold gap-1 text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Ignore</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Outgoing Requests */}
      {activeTab === 'outgoing' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Loading sent requests...</div>
          ) : outgoing.length === 0 ? (
            <Card className="p-12 text-center text-xs text-muted-foreground border-dashed">
              <Clock className="h-8 w-8 mx-auto opacity-40 mb-2 text-primary" />
              <p className="font-semibold text-foreground text-sm">No pending sent requests</p>
              <p className="mt-1">You can send connection requests to alumni in the Alumni Directory.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {outgoing.map((req) => (
                <Card key={req.id} className="border border-border bg-card p-4 rounded-xl shadow-2xs flex items-center justify-between gap-3">
                  <div
                    onClick={() => handleOpenProfile(req.recipientId)}
                    className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                  >
                    <Avatar className="h-10 w-10 border border-border shrink-0 group-hover:border-primary/50 transition-colors">
                      {req.profileImageUrl && <AvatarImage src={req.profileImageUrl} alt={req.name} />}
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                        {req.name ? req.name.slice(0, 2).toUpperCase() : 'US'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {req.name}
                      </h4>
                      <span className="text-[11px] text-muted-foreground">Request Pending</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenProfile(req.recipientId)}
                      className="h-8 px-2.5 text-xs font-semibold cursor-pointer"
                    >
                      Profile
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancelOutgoing(req.id, req.name)}
                      disabled={actionLoadingId === req.id}
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionsPage;
