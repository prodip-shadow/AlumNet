'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { confirmAlert } from '@/lib/swal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Users,
  Loader2,
  RefreshCw,
  Clock,
  MapPin,
  ExternalLink,
  Eye,
  TrendingUp,
  Trash2,
  Power,
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function MyCreatedEventsSection({ isAdmin = false }) {
  const { user } = useAuth();
  const [viewTab, setViewTab] = useState('hosted'); // 'hosted' | 'my'
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoadingId, setStatusLoadingId] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      // 'hosted' fetches all platform events, 'my' fetches logged in user's created events
      const endpoint = viewTab === 'my' ? '/api/events/my' : '/api/events?includeInactive=true';
      const res = await api.get(endpoint);

      if (res.data?.success && Array.isArray(res.data.events)) {
        setEvents(res.data.events);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.warn('Error loading events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [viewTab]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Toggle Event Active / Deactive
  const handleToggleEventStatus = async (ev, e) => {
    if (e) e.stopPropagation();
    const newStatus = ev.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    setStatusLoadingId(ev.id);
    try {
      const res = await api.patch(`/api/events/${ev.id}/status`, { status: newStatus });
      if (res.data?.success) {
        toast.success(newStatus === 'ACTIVE' ? 'Event activated successfully!' : 'Event deactivated successfully!');
        fetchEvents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update event status');
    } finally {
      setStatusLoadingId(null);
    }
  };

  // Delete Individual Event (With SweetAlert2)
  const handleDeleteEvent = async (ev, e) => {
    if (e) e.stopPropagation();
    const isConfirmed = await confirmAlert({
      title: 'Delete Event?',
      text: `Are you sure you want to delete "${ev.title}"? This action cannot be undone.`,
      confirmButtonText: 'Yes, Delete Event',
    });
    if (!isConfirmed) return;

    try {
      const res = await api.delete(`/api/events/${ev.id}`);
      if (res.data?.success) {
        toast.success('Event deleted successfully');
        fetchEvents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete event');
    }
  };

  // Delete All My Events (With SweetAlert2)
  const handleDeleteAllEvents = async () => {
    const isConfirmed = await confirmAlert({
      title: 'Delete All My Events?',
      text: 'Are you sure you want to delete ALL your created events? This action cannot be undone.',
      confirmButtonText: 'Yes, Delete All',
    });
    if (!isConfirmed) return;

    try {
      const res = await api.delete('/api/events/my/all');
      if (res.data?.success) {
        toast.success(res.data.message || 'All your created events have been deleted');
        fetchEvents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete all events');
    }
  };

  return (
    <Card className="border border-border bg-card rounded-2xl shadow-2xs space-y-4 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground tracking-tight">
              Event Management Dashboard
            </h3>
            <p className="text-xs text-muted-foreground">
              {viewTab === 'my'
                ? 'Manage your created events, track sales, or delete your events.'
                : 'Browse hosted platform events, toggle Active/Deactive status, and view analytics.'}
            </p>
          </div>
        </div>

        {/* Tab & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-0.5 bg-muted/60 rounded-lg border border-border">
            <Button
              variant={viewTab === 'hosted' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewTab('hosted')}
              className="h-7 text-xs font-semibold px-2.5 rounded-md cursor-pointer"
            >
              Hosted Events
            </Button>
            <Button
              variant={viewTab === 'my' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewTab('my')}
              className="h-7 text-xs font-semibold px-2.5 rounded-md cursor-pointer"
            >
              My Organized Events
            </Button>
          </div>

          {viewTab === 'my' && events.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAllEvents}
              disabled={loading}
              className="h-7 text-xs gap-1 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete All</span>
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading} className="h-7 text-xs gap-1 cursor-pointer">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      <CardContent className="p-0">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2 border border-dashed border-border rounded-xl">
            <Calendar className="h-8 w-8 mx-auto opacity-40 text-primary mb-1" />
            <p className="font-semibold text-foreground text-sm">No events found</p>
            <p>{viewTab === 'my' ? 'You have not created any events yet.' : 'No platform events published yet.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => {
              const totalCollected = parseFloat(ev.totalCollectedAmount) || 0;
              const regCount = Number(ev.currentRegistrationCount || ev.registrationCount || ev.attendeeCount || 0);
              const isActive = ev.status === 'ACTIVE';
              const isMine = Boolean(user && Number(user.id) === Number(ev.creatorUserId || ev.userId || ev.createdById));
              const canDelete = isMine || isAdmin || user?.role === 'ADMIN';

              return (
                <div
                  key={ev.id}
                  className={`p-4 rounded-xl border transition-colors space-y-3 flex flex-col justify-between ${
                    isActive ? 'border-border bg-card hover:border-primary/40' : 'border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/10 opacity-80'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-1">{ev.title}</h4>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className={`text-[9px] font-bold ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {isActive ? 'ACTIVE' : 'DEACTIVATED'}
                          </Badge>
                          {isMine && (
                            <Badge variant="outline" className="text-[9px] font-medium border-primary/30 text-primary">
                              Mine
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold shrink-0 ${
                          !ev.isFree
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {!ev.isFree ? `৳${ev.registrationFee || ev.price} BDT` : 'Free Event'}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{new Date(ev.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Attendees Summary Bar */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-muted/30 rounded-lg border border-border/60 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Total Registered</span>
                      <span className="font-extrabold text-foreground flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        {regCount} attendees
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Total Revenue</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        ৳{totalCollected} BDT
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Bar: View Details, Active Toggle & Delete */}
                  <div className="flex items-center gap-2 pt-1">
                    <Link href={`/events/${ev.id}/analytics`} className="flex-1">
                      <Button
                        size="sm"
                        className="w-full text-xs font-semibold gap-1.5 h-8.5 cursor-pointer shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Details & Financials</span>
                        <ExternalLink className="h-3 w-3 text-primary-foreground/80" />
                      </Button>
                    </Link>

                    {/* Active / Deactive Toggle Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={statusLoadingId === ev.id}
                      onClick={(e) => handleToggleEventStatus(ev, e)}
                      className={`h-8.5 px-2.5 text-xs font-semibold gap-1 cursor-pointer border ${
                        isActive
                          ? 'border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10'
                          : 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10'
                      }`}
                      title={isActive ? 'Deactivate Event (Hide from events page)' : 'Activate Event (Show on events page)'}
                    >
                      {statusLoadingId === ev.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Power className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{isActive ? 'Deactivate' : 'Activate'}</span>
                        </>
                      )}
                    </Button>

                    {/* Delete Button (Only for mine or admin) */}
                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleDeleteEvent(ev, e)}
                        className="h-8.5 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:border-destructive/30 cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
