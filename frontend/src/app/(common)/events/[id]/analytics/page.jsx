'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  DollarSign,
  Search,
  ExternalLink,
  ShieldCheck,
  Loader2,
  RefreshCw,
  User,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function EventAnalyticsPage({ params }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams?.id;
  const { user } = useAuth();

  const [eventData, setEventData] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setUnauthorized(false);
    try {
      // 1. Fetch Event Info
      const evtRes = await api.get(`/api/events/${eventId}`);
      if (evtRes.data?.success && evtRes.data.event) {
        setEventData(evtRes.data.event);
      }

      // 2. Fetch Event Registrations & Payment Receipts
      const regRes = await api.get(`/api/events/${eventId}/registrations`);
      if (regRes.data?.success && Array.isArray(regRes.data.registrations)) {
        setRegistrations(regRes.data.registrations);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setUnauthorized(true);
      } else {
        toast.error('Could not load event registration analytics');
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Filtered Attendees List
  const filteredRegistrations = registrations.filter((reg) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      reg.name?.toLowerCase().includes(q) ||
      reg.email?.toLowerCase().includes(q) ||
      reg.role?.toLowerCase().includes(q)
    );
  });

  // Calculate Revenue Stats
  const totalRevenue = registrations.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const paidCount = registrations.filter((r) => r.paymentStatus === 'PAID').length;
  const freeCount = registrations.filter((r) => r.paymentStatus === 'FREE' || parseFloat(r.amount) === 0).length;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">Loading event analytics and payment records...</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-md mx-auto my-12 p-4 text-center">
        <Card className="p-8 border border-border bg-card rounded-2xl shadow-xl space-y-4">
          <div className="h-14 w-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="font-extrabold text-lg text-foreground">Access Restricted</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You do not have permission to view this event's financial receipts and registration details. Only the Event Creator or an Admin can access this page.
          </p>
          <Link href="/dashboard" className="block pt-2">
            <Button size="sm" className="w-full text-xs font-semibold">
              Return to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
                {eventData?.title || `Event #${eventId}`}
              </h1>
              <Badge
                variant="secondary"
                className={`text-[10px] font-bold ${
                  !eventData?.isFree
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {!eventData?.isFree ? `৳${eventData?.registrationFee || eventData?.price} BDT` : 'Free Event'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Event Analytics & Registered Attendees Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnalytics} className="h-9 text-xs gap-1.5 cursor-pointer">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Data</span>
          </Button>
          <Link href={`/events`}>
            <Button size="sm" className="h-9 text-xs gap-1.5 cursor-pointer">
              <Calendar className="h-3.5 w-3.5" />
              <span>All Events</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected Revenue */}
        <Card className="border border-border bg-card p-5 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              ৳{totalRevenue.toLocaleString()} BDT
            </h3>
            <p className="text-[11px] text-muted-foreground">Total tickets revenue collected</p>
          </div>
        </Card>

        {/* Total Registered Attendees */}
        <Card className="border border-border bg-card p-5 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Registered</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-extrabold text-foreground">{registrations.length}</h3>
            <p className="text-[11px] text-muted-foreground">Attendees confirmed seat</p>
          </div>
        </Card>

        {/* Paid vs Free Breakout */}
        <Card className="border border-border bg-card p-5 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Paid vs Free</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-extrabold text-foreground">
              {paidCount} <span className="text-xs font-normal text-muted-foreground">Paid / {freeCount} Free</span>
            </h3>
            <p className="text-[11px] text-muted-foreground">Successful Stripe checkouts</p>
          </div>
        </Card>

        {/* Date & Location */}
        <Card className="border border-border bg-card p-5 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Schedule & Location</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="font-bold text-foreground truncate">
              {eventData?.eventDate ? new Date(eventData.eventDate).toLocaleDateString() : 'N/A'}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">{eventData?.location || 'Venue N/A'}</div>
          </div>
        </Card>
      </div>

      {/* Attendees Table & Detailed Receipts */}
      <Card className="border border-border bg-card p-5 rounded-2xl shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h3 className="font-bold text-base text-foreground tracking-tight">Registered Attendees & Payment Receipts</h3>
            <p className="text-xs text-muted-foreground">Detailed view of user payments, payment dates, and profile links.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by attendee name or email..."
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        {filteredRegistrations.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2 border border-dashed border-border rounded-xl">
            <Users className="h-8 w-8 mx-auto opacity-40 text-primary mb-1" />
            <p className="font-semibold text-foreground text-sm">No registered attendees found</p>
            <p>When users register for this event, their details and payment receipts will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRegistrations.map((reg, idx) => {
              const amountPaid = parseFloat(reg.amount) || 0;
              const regDate = reg.registrationTime || reg.createdAt;

              return (
                <div
                  key={reg.registrationId || reg.id || idx}
                  className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: User Profile Summary */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-11 w-11 border border-border shrink-0">
                      {reg.profileImageUrl && <AvatarImage src={reg.profileImageUrl} alt={reg.name} />}
                      <AvatarFallback className="font-bold text-xs bg-primary text-primary-foreground">
                        {reg.name ? reg.name.slice(0, 2).toUpperCase() : 'AT'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground truncate">{reg.name || 'Attendee'}</h4>
                        <Badge variant="outline" className="text-[9px] uppercase font-semibold px-1.5 py-0">
                          {reg.role || 'USER'}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground truncate">{reg.email}</p>
                    </div>
                  </div>

                  {/* Middle: Payment Amount & Date */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs md:text-right border-t md:border-t-0 border-border/60 pt-3 md:pt-0">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Amount Paid</span>
                      <span className="font-extrabold text-foreground">
                        {amountPaid > 0 ? `৳${amountPaid} BDT` : 'Free Ticket'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground block">Payment Date</span>
                      <span className="font-medium text-foreground">
                        {regDate
                          ? new Date(regDate).toLocaleDateString([], {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground block">Status</span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold ${
                          reg.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : reg.paymentStatus === 'FREE'
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                            : 'bg-amber-500/10 text-amber-700'
                        }`}
                      >
                        {reg.paymentStatus || 'REGISTERED'}
                      </Badge>
                    </div>
                  </div>

                  {/* Right: View Profile Button */}
                  <div className="flex items-center justify-end border-t md:border-t-0 border-border/60 pt-2 md:pt-0">
                    <Link href={`/profile/${reg.userId}`}>
                      <Button size="sm" variant="outline" className="text-xs font-semibold gap-1.5 h-8.5 cursor-pointer">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span>View Profile</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
