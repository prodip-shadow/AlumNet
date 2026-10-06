'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Ticket,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Mail,
  Eye,
  CreditCard,
  Building,
  Sparkles,
  Share2,
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id;
  const { user } = useAuth();

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const fetchEventDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/events/${eventId}`);
      if (res.data?.success && res.data.event) {
        setEventData(res.data.event);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error('Error loading event detail:', err);
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error('Failed to load event details');
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const checkRegistrationStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/events/my-registrations');
      if (res.data?.success && Array.isArray(res.data.registrations)) {
        const registered = res.data.registrations.some(
          (reg) => Number(reg.eventId) === Number(eventId)
        );
        setIsRegistered(registered);
      }
    } catch (err) {
      console.warn('Error checking registration status:', err);
    }
  }, [user, eventId]);

  useEffect(() => {
    fetchEventDetail();
    checkRegistrationStatus();
  }, [fetchEventDetail, checkRegistrationStatus]);

  const handleRegister = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setRegistering(true);
    try {
      const res = await api.post(`/api/events/${eventId}/register`);
      if (res.data?.success) {
        if (res.data.checkoutUrl) {
          toast.info('Redirecting to secure Stripe Checkout...');
          window.location.href = res.data.checkoutUrl;
          return;
        }

        toast.success(res.data.message || 'Successfully registered for this event!');
        setIsRegistered(true);
        fetchEventDetail();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to register for event';
      toast.error(msg);
      if (msg.toLowerCase().includes('already registered')) {
        setIsRegistered(true);
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: eventData?.title || 'PSTU Event',
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Event link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-muted-foreground space-y-3">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="font-semibold text-foreground text-sm">Loading event details...</p>
      </div>
    );
  }

  if (notFound || !eventData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 rounded-full bg-muted/40 w-16 h-16 mx-auto flex items-center justify-center text-muted-foreground">
          <Calendar className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Event Not Found</h2>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          The event you are looking for does not exist or may have been removed by the organizer.
        </p>
        <Link href="/events">
          <Button size="sm" variant="outline" className="text-xs font-semibold gap-1.5 h-9">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Events</span>
          </Button>
        </Link>
      </div>
    );
  }

  const bannerImg = eventData.bannerUrl || eventData.bannerImageUrl;
  const isPaidEvent = Boolean(!eventData.isFree && Number(eventData.registrationFee || eventData.price || 0) > 0);
  const fee = Number(eventData.registrationFee || eventData.price || 0);
  const isPast = new Date(eventData.eventDate) < new Date();
  const isOrganizer = Boolean(
    user && (
      Number(user.id) === Number(eventData.creatorUserId || eventData.creator?.id || eventData.createdById) ||
      user.role === 'ADMIN'
    )
  );

  const creatorName = eventData.creator?.name || eventData.creatorName || 'Organizer';
  const creatorImage = eventData.creator?.profileImageUrl || eventData.creatorProfileImageUrl;
  const creatorId = eventData.creator?.id || eventData.creatorUserId;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link href="/events">
          <Button variant="outline" size="sm" className="h-9 text-xs font-semibold gap-1.5 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            <span>All Events</span>
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare} className="h-9 text-xs font-semibold gap-1.5 cursor-pointer">
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </Button>

          {isOrganizer && (
            <Link href={`/events/${eventId}/analytics`}>
              <Button size="sm" variant="secondary" className="h-9 text-xs font-semibold gap-1.5 cursor-pointer">
                <Eye className="h-3.5 w-3.5" />
                <span>Event Analytics & Attendees</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Banner Hero Section */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-border bg-card shadow-md">
        {bannerImg ? (
          <div className="relative w-full h-64 md:h-96 bg-muted">
            <img src={bannerImg} alt={eventData.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-48 md:h-64 bg-gradient-to-r from-primary/20 via-primary/10 to-muted flex items-center justify-center p-6 text-center">
            <div className="space-y-2">
              <Calendar className="h-12 w-12 text-primary mx-auto opacity-60" />
              <h2 className="text-xl font-bold text-foreground line-clamp-1">{eventData.title}</h2>
            </div>
          </div>
        )}

        {/* Overlay Title & Quick Meta on Banner */}
        <div className="p-6 md:p-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={`text-xs font-extrabold px-3 py-1 ${
                isPaidEvent
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
              }`}
            >
              {isPaidEvent ? `৳${fee} BDT Ticket` : 'Free Event'}
            </Badge>

            <Badge variant="outline" className="text-xs font-medium px-2.5 py-0.5">
              {isPast ? 'Past Event' : 'Upcoming Event'}
            </Badge>

            {eventData.status !== 'ACTIVE' && (
              <Badge variant="destructive" className="text-xs font-bold px-2.5 py-0.5">
                DEACTIVATED / CLOSED
              </Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold text-foreground leading-tight tracking-tight">
            {eventData.title}
          </h1>

          {/* Organizer Info Row */}
          <div className="flex items-center justify-between border-t border-border/60 pt-4 flex-wrap gap-3">
            <Link
              href={creatorId ? `/profile/${creatorId}` : '#'}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <Avatar className="h-10 w-10 border-2 border-primary/20 group-hover:border-primary transition-colors">
                {creatorImage && <AvatarImage src={creatorImage} alt={creatorName} />}
                <AvatarFallback className="text-xs font-bold">
                  {creatorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div>
                <span className="text-[11px] text-muted-foreground block leading-none">Hosted & Organized By</span>
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {creatorName}
                </span>
              </div>
            </Link>

            {/* Main Action Register Button */}
            <Button
              size="lg"
              onClick={handleRegister}
              disabled={isRegistered || registering || isPast}
              className={`text-xs md:text-sm font-bold px-6 h-10.5 rounded-xl cursor-pointer shadow-md ${
                isRegistered
                  ? 'bg-muted text-muted-foreground border border-border hover:bg-muted'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {registering ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  <span>Processing...</span>
                </>
              ) : isRegistered ? (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mr-1.5" />
                  <span>Registered Seat Confirmed</span>
                </>
              ) : isPast ? (
                <span>Event Ended</span>
              ) : (
                <>
                  <Ticket className="h-4 w-4 mr-1.5" />
                  <span>{isPaidEvent ? `Register Ticket (৳${fee} BDT)` : 'Join Event (Free)'}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Key Info Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date & Time Card */}
        <Card className="border border-border bg-card p-5 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5 text-primary">
            <div className="p-2 rounded-xl bg-primary/10">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-foreground">Date & Schedule</span>
          </div>
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-foreground text-sm">
              {new Date(eventData.eventDate).toLocaleDateString([], {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-muted-foreground font-medium">
              {new Date(eventData.eventDate).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </Card>

        {/* Location & Venue Card */}
        <Card className="border border-border bg-card p-5 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-foreground">Venue & Location</span>
          </div>
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-foreground text-sm line-clamp-1">{eventData.location}</p>
            <p className="text-muted-foreground">Check venue details or online stream link</p>
          </div>
        </Card>

        {/* Attendees & Capacity Card */}
        <Card className="border border-border bg-card p-5 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-foreground">Attendees & Capacity</span>
          </div>
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-foreground text-sm">
              {eventData.currentRegistrationCount || 0} Registered Attendees
            </p>
            <p className="text-muted-foreground">
              {eventData.maxParticipants ? `Max Capacity: ${eventData.maxParticipants} seats` : 'Open for everyone'}
            </p>
          </div>
        </Card>
      </div>

      {/* Full Description & Event Agenda Section */}
      <Card className="border border-border bg-card p-6 md:p-8 rounded-2xl shadow-2xs space-y-4">
        <div className="border-b border-border pb-3">
          <h3 className="font-extrabold text-lg text-foreground tracking-tight flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <span>About Event & Program Agenda</span>
          </h3>
        </div>

        <div className="text-sm text-foreground/90 leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
          {eventData.description || 'No detailed agenda description provided for this event.'}
        </div>

        {/* Contact Info Footer Bar */}
        {eventData.contactInfo && (
          <div className="mt-6 pt-4 border-t border-border flex items-center gap-2.5 text-xs text-muted-foreground bg-muted/20 p-4 rounded-xl">
            <Mail className="h-4 w-4 text-primary shrink-0" />
            <div>
              <span className="font-bold text-foreground block">Organizer Contact:</span>
              <span>{eventData.contactInfo}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
