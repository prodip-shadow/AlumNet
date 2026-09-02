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
  Calendar,
  MapPin,
  Clock,
  Users,
  Plus,
  CheckCircle,
  Ticket,
  Search,
  Loader2,
  CalendarCheck,
  Building,
  Sparkles,
  Pencil,
  Trash2,
  Eye,
  CreditCard,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { confirmAlert } from '@/lib/swal';
import Link from 'next/link';
import PaymentHistoryModal from '@/components/dashboard/PaymentHistoryModal';

const EventPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, UPCOMING, FREE, PAID

  // Register Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());

  // Create / Edit Event Modal (Permitted/Admin)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newRegistrationDeadline, setNewRegistrationDeadline] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newContactInfo, setNewContactInfo] = useState('');
  const [newMaxAttendees, setNewMaxAttendees] = useState(100);
  const [newIsPaid, setNewIsPaid] = useState(false);
  const [newPrice, setNewPrice] = useState(0);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Attendees List Viewer State
  const [viewingAttendeesEvent, setViewingAttendeesEvent] = useState(null);
  const [attendeesList, setAttendeesList] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  // Payment History Modal State
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);

  const showFeedback = (type, msg) => {
    if (type === 'success') toast.success(msg, { autoClose: 1500 });
    else if (type === 'error') toast.error(msg, { autoClose: 2000 });
    else toast.info(msg, { autoClose: 1500 });
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/events');
      if (res.data?.success && Array.isArray(res.data.events)) {
        setEvents(res.data.events);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();

    if (user) {
      api.get('/api/payments/history')
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.history)) {
            const ids = res.data.history.map((item) => Number(item.eventId || item.id));
            setRegisteredEventIds(new Set(ids));
          }
        })
        .catch((err) => console.warn('Error loading user registered events:', err));
    }
  }, [fetchEvents, user]);

  // Handle Event Registration (With Stripe Redirect for Paid Events)
  const handleRegisterEvent = async (eventId) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setRegistering(true);
    try {
      const res = await api.post(`/api/events/${eventId}/register`);
      if (res.data?.success) {
        if (res.data.checkoutUrl) {
          showFeedback('info', 'Redirecting to secure Stripe Checkout...');
          window.location.href = res.data.checkoutUrl;
          return;
        }

        showFeedback('success', res.data.message || 'Successfully registered for this event!');
        setRegisteredEventIds((prev) => new Set([...prev, Number(eventId)]));
        setSelectedEvent(null);
        fetchEvents();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to register for event';
      showFeedback('error', msg);
      if (msg.toLowerCase().includes('already registered')) {
        setRegisteredEventIds((prev) => new Set([...prev, Number(eventId)]));
      }
    } finally {
      setRegistering(false);
    }
  };

  // Open Create Event Modal
  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setNewTitle('');
    setNewDesc('');
    setNewDate('');
    setNewRegistrationDeadline('');
    setNewLocation('');
    setNewContactInfo(user?.email || '');
    setNewMaxAttendees(100);
    setNewIsPaid(false);
    setNewPrice(0);
    setBannerFile(null);
    setBannerPreview(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Event Modal
  const handleOpenEditModal = (ev) => {
    setEditingEvent(ev);
    setNewTitle(ev.title || '');
    setNewDesc(ev.description || '');
    let formattedDate = '';
    if (ev.eventDate) {
      const d = new Date(ev.eventDate);
      formattedDate = d.toISOString().slice(0, 16);
    }
    setNewDate(formattedDate);

    let formattedDeadline = '';
    if (ev.registrationDeadline) {
      const d = new Date(ev.registrationDeadline);
      formattedDeadline = d.toISOString().slice(0, 16);
    }
    setNewRegistrationDeadline(formattedDeadline);

    setNewLocation(ev.location || '');
    setNewContactInfo(ev.contactInfo || user?.email || '');
    setNewMaxAttendees(ev.maxAttendees || ev.maxParticipants || 100);
    setNewIsPaid(Boolean(ev.isPaid || (ev.registrationFee && ev.registrationFee > 0)));
    setNewPrice(ev.price || ev.registrationFee || 0);
    setBannerFile(null);
    setBannerPreview(ev.bannerUrl || ev.bannerImageUrl || null);
    setIsCreateModalOpen(true);
  };

  // Handle Create / Edit Event Submit
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate || !newLocation.trim()) return;
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('title', newTitle.trim());
      formData.append('description', newDesc.trim());
      formData.append('eventDate', newDate);
      formData.append('registrationDeadline', newRegistrationDeadline || newDate);
      formData.append('location', newLocation.trim());
      formData.append('contactInfo', newContactInfo.trim() || user?.email || 'events@pstu.ac.bd');
      formData.append('maxParticipants', String(Number(newMaxAttendees) || 100));
      formData.append('maxAttendees', String(Number(newMaxAttendees) || 100));
      formData.append('isFree', String(!newIsPaid));
      formData.append('isPaid', String(newIsPaid));
      formData.append('registrationFee', String(newIsPaid ? Number(newPrice) : 0));
      formData.append('price', String(newIsPaid ? Number(newPrice) : 0));
      if (bannerFile) formData.append('banner', bannerFile);

      if (editingEvent) {
        const res = await api.put(`/api/events/${editingEvent.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data?.success) {
          showFeedback('success', 'Event updated successfully!');
          setIsCreateModalOpen(false);
          fetchEvents();
        }
      } else {
        const res = await api.post('/api/events', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data?.success) {
          showFeedback('success', 'Event created and published successfully!');
          setIsCreateModalOpen(false);
          fetchEvents();
        }
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to save event.');
    } finally {
      setCreating(false);
    }
  };

  // Handle Delete Event
  const handleDeleteEvent = async (eventId) => {
    const isConfirmed = await confirmAlert({
      title: 'Delete Event?',
      text: 'Are you sure you want to delete this event? This action cannot be undone.',
      confirmButtonText: 'Yes, Delete Event',
    });
    if (!isConfirmed) return;
    setDeletingId(eventId);
    try {
      const res = await api.delete(`/api/events/${eventId}`);
      if (res.data?.success) {
        showFeedback('success', 'Event deleted successfully');
        setEvents(events.filter((e) => e.id !== eventId));
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle View Registered Attendees
  const handleViewAttendees = async (ev) => {
    setViewingAttendeesEvent(ev);
    setLoadingAttendees(true);
    try {
      const res = await api.get(`/api/events/${ev.id}/registrations`);
      if (res.data?.success && Array.isArray(res.data.registrations)) {
        setAttendeesList(res.data.registrations);
      } else {
        setAttendeesList([]);
      }
    } catch (err) {
      showFeedback('error', 'Could not load attendees list');
      setAttendeesList([]);
    } finally {
      setLoadingAttendees(false);
    }
  };

  // Filter events
  const filteredEvents = events.filter((ev) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        ev.title?.toLowerCase().includes(q) ||
        ev.location?.toLowerCase().includes(q) ||
        ev.description?.toLowerCase().includes(q) ||
        ev.creatorName?.toLowerCase().includes(q) ||
        ev.userName?.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    const isPaidEvent = Boolean(!ev.isFree && Number(ev.registrationFee || ev.price || 0) > 0);

    // Type filter
    if (filterType === 'FREE') return !isPaidEvent;
    if (filterType === 'PAID') return isPaidEvent;
    if (filterType === 'UPCOMING') return new Date(ev.eventDate) >= new Date();
    return true;
  });

  return (
    <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              University Events & Meetups
            </h1>
            <Badge variant="secondary_1" className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-none px-2 py-0.5 text-xs font-bold">
              Meetups & Talks
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Stay connected with alumni reunions, career webinars, hackathons, and PSTU campus gatherings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPaymentHistoryOpen(true)}
              className="text-xs font-semibold gap-1.5 cursor-pointer h-9 shadow-2xs"
            >
              <CreditCard className="h-4 w-4 text-primary" />
              <span>My Payments</span>
            </Button>
          )}

          {user && (user.role === 'ADMIN' || user.canCreateEvent) && (
            <Button
              size="sm"
              onClick={handleOpenCreateModal}
              className="text-xs font-semibold gap-1.5 cursor-pointer h-9 shadow-2xs"
            >
              <Plus className="h-4 w-4" />
              <span>Create Event</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border p-3.5 rounded-xl shadow-2xs">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title, venue, or speaker..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'UPCOMING', label: 'Upcoming' },
            { id: 'FREE', label: 'Free' },
            { id: 'PAID', label: 'Paid' },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={filterType === tab.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(tab.id)}
              className="h-8 px-3 text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} className="p-5 border border-border bg-card rounded-2xl shadow-2xs space-y-3 animate-pulse">
              <div className="h-6 w-24 bg-muted rounded" />
              <div className="h-5 w-48 bg-muted rounded" />
              <div className="h-16 bg-muted rounded" />
            </Card>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card className="p-12 text-center text-xs text-muted-foreground border-dashed">
          <Calendar className="h-8 w-8 mx-auto opacity-40 mb-2 text-primary" />
          <p className="font-semibold text-foreground text-sm">No events found</p>
          <p className="mt-1">Try switching filters or search terms.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((ev) => {
            const isRegistered = registeredEventIds.has(Number(ev.id));
            const isEventDatePast = new Date(ev.eventDate) < new Date();
            const isOrganizer = Boolean(
              user && (
                Number(user.id) === Number(ev.creatorUserId) ||
                Number(user.id) === Number(ev.createdById) ||
                Number(user.id) === Number(ev.userId) ||
                user.role === 'ADMIN'
              )
            );

            const isPaidEvent = Boolean(!ev.isFree && Number(ev.registrationFee || ev.price || 0) > 0);
            const fee = Number(ev.registrationFee || ev.price || 0);

            return (
              <Card key={ev.id} className="border border-border bg-card p-5 rounded-2xl shadow-2xs space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between group">
                <div className="space-y-3">
                  {/* Event Banner Image */}
                  {(ev.bannerUrl || ev.bannerImageUrl) && (
                    <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border bg-muted">
                      <img src={ev.bannerUrl || ev.bannerImageUrl} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}

                  {/* Top Badges & Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-bold ${
                        isPaidEvent
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {isPaidEvent ? `৳${fee} BDT` : 'Free Event'}
                    </Badge>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded font-medium">
                        {isEventDatePast ? 'Past Event' : 'Upcoming'}
                      </span>

                      {isOrganizer && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(ev)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                            title="Edit Event"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEvent(ev.id)}
                            disabled={deletingId === ev.id}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Delete Event"
                          >
                            {deletingId === ev.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-primary transition-colors">
                    {ev.title}
                  </h3>

                  {/* Date & Location */}
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>
                        {new Date(ev.eventDate).toLocaleDateString([], {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        •{' '}
                        {new Date(ev.eventDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {ev.description && (
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {ev.description}
                    </p>
                  )}
                </div>

                {/* Footer Section */}
                <div className="space-y-3 pt-3 border-t border-border/70">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Link
                      href={ev.creatorUserId || ev.createdById || ev.userId ? `/profile/${ev.creatorUserId || ev.createdById || ev.userId}` : '#'}
                      className="flex items-center gap-2 group cursor-pointer"
                    >
                      <Avatar className="h-6 w-6 border border-border group-hover:border-primary/50 transition-colors">
                        {(ev.creatorProfileImageUrl || ev.userProfileImageUrl) && (
                          <AvatarImage src={ev.creatorProfileImageUrl || ev.userProfileImageUrl} alt={ev.creatorName || ev.userName} />
                        )}
                        <AvatarFallback className="text-[9px] font-bold">
                          {ev.creatorName || ev.userName ? (ev.creatorName || ev.userName).slice(0, 2).toUpperCase() : 'OR'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] truncate max-w-[120px] group-hover:text-primary transition-colors">{ev.creatorName || ev.userName || 'Organizer'}</span>
                    </Link>

                    {isOrganizer ? (
                      <button
                        onClick={() => handleViewAttendees(ev)}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        title="View Registered Attendees List"
                      >
                        <Users className="h-3 w-3" />
                        <span>{ev.currentRegistrationCount || ev.attendeeCount || 0} Registered</span>
                      </button>
                    ) : (
                      <span className="text-[11px] flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3 text-primary shrink-0" />
                        <span>{ev.currentRegistrationCount || ev.attendeeCount || 0} Attending</span>
                      </span>
                    )}
                  </div>

                  {/* Register Button */}
                  <Button
                    size="sm"
                    onClick={() => handleRegisterEvent(ev.id)}
                    disabled={isRegistered || registering}
                    className={`w-full text-xs font-semibold gap-1.5 cursor-pointer h-8.5 shadow-2xs ${
                      isRegistered
                        ? 'bg-muted text-muted-foreground hover:bg-muted border border-border'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {isRegistered ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Registered</span>
                      </>
                    ) : (
                      <>
                        <Ticket className="h-3.5 w-3.5" />
                        <span>{isPaidEvent ? `Register (৳${fee})` : 'Join Free'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Event */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <form onSubmit={handleSaveEvent} className="w-full max-w-lg bg-card border border-border p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground">
              {editingEvent ? 'Edit Event Details' : 'Host New Event'}
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">Event Title *</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. PSTU Alumni Tech Summit 2026"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description & Agenda</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Event schedule, speakers, target audience..."
                  rows={3}
                  className="w-full p-2.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold block mb-1">Event Date & Time *</label>
                  <Input
                    type="datetime-local"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Registration Deadline</label>
                  <Input
                    type="datetime-local"
                    value={newRegistrationDeadline}
                    onChange={(e) => setNewRegistrationDeadline(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold block mb-1">Venue / Online Link *</label>
                  <Input
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Auditorium / Zoom"
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Contact Email / Phone *</label>
                  <Input
                    value={newContactInfo}
                    onChange={(e) => setNewContactInfo(e.target.value)}
                    placeholder="e.g. organizer@pstu.ac.bd / +88017..."
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold block mb-1">Max Attendees</label>
                  <Input
                    type="number"
                    value={newMaxAttendees}
                    onChange={(e) => setNewMaxAttendees(e.target.value)}
                    min={1}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block mb-1">Ticket Type</label>
                  <div className="flex items-center gap-2 h-9">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newIsPaid}
                        onChange={(e) => setNewIsPaid(e.target.checked)}
                        className="rounded text-primary"
                      />
                      <span>Paid Event</span>
                    </label>

                    {newIsPaid && (
                      <Input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="Fee in ৳"
                        min={0}
                        className="h-8 text-xs w-24"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Event Banner Image</label>
                <div className="border border-dashed border-border rounded-xl p-3 bg-muted/20 text-center">
                  {bannerPreview ? (
                    <div className="relative h-28 w-full rounded-lg overflow-hidden border border-border mb-2">
                      <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-muted-foreground">
                      <ImageIcon className="h-5 w-5 mb-1 text-primary" />
                      <span className="text-[11px]">Upload custom event banner image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setBannerFile(file);
                        setBannerPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="text-xs text-muted-foreground w-full cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={creating} className="h-9 text-xs font-semibold">
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : editingEvent ? 'Update Event' : 'Publish Event'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: View Registered Attendees */}
      {viewingAttendeesEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border p-5 rounded-2xl shadow-xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground">Registered Attendees</h3>
                <p className="text-xs text-muted-foreground">{viewingAttendeesEvent.title}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingAttendeesEvent(null)} className="h-7 w-7 p-0">
                ✕
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {loadingAttendees ? (
                <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                  <p>Loading attendee list...</p>
                </div>
              ) : attendeesList.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                  <Users className="h-6 w-6 mx-auto opacity-40 mb-1" />
                  <p className="font-medium text-foreground">No registrations yet</p>
                </div>
              ) : (
                attendeesList.map((att, i) => (
                  <div key={att.id || i} className="p-3 bg-muted/30 rounded-xl border border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 border border-border">
                        {att.profileImageUrl && <AvatarImage src={att.profileImageUrl} />}
                        <AvatarFallback className="text-[10px] font-bold">
                          {att.name ? att.name.slice(0, 2).toUpperCase() : 'AT'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-foreground">{att.name || att.userName || 'Attendee'}</h4>
                        <span className="text-[10px] text-muted-foreground block">{att.email || att.role}</span>
                      </div>
                    </div>

                    <Badge variant="outline" className="text-[10px]">
                      Registered
                    </Badge>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setViewingAttendeesEvent(null)} className="text-xs h-8">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      <PaymentHistoryModal
        isOpen={isPaymentHistoryOpen}
        onClose={() => setIsPaymentHistoryOpen(false)}
      />
    </div>
  );
};

export default EventPage;
