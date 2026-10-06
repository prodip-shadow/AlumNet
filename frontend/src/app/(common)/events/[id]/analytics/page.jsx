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

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'accepted' | 'rejected'
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Status update handler (Accept / Reject)
  const handleUpdateRegistrationStatus = async (registrationId, status) => {
    setActionLoadingId(registrationId);
    try {
      const res = await api.patch(`/api/events/registrations/${registrationId}/status`, { status });
      if (res.data?.success) {
        toast.success(res.data.message || `Registration ${status.toLowerCase()} successfully!`);
        fetchAnalytics();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Attendees List by search & activeTab
  const filteredRegistrations = registrations.filter((reg) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        reg.name?.toLowerCase().includes(q) ||
        reg.email?.toLowerCase().includes(q) ||
        reg.role?.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    const regStatus = (reg.registrationStatus || 'PENDING').toUpperCase();

    if (activeTab === 'accepted') return regStatus === 'ACCEPTED' || regStatus === 'ATTENDED';
    if (activeTab === 'rejected') return regStatus === 'REJECTED';
    return true;
  });

  const totalRevenue = registrations.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const paidCount = registrations.filter((r) => r.paymentStatus === 'PAID' || parseFloat(r.amount) > 0).length;
  const freeCount = registrations.filter((r) => r.paymentStatus === 'FREE' || parseFloat(r.amount) === 0).length;
  const acceptedCount = registrations.filter((r) => (r.registrationStatus || '').toUpperCase() === 'ACCEPTED' || (r.registrationStatus || '').toUpperCase() === 'ATTENDED').length;
  const rejectedCount = registrations.filter((r) => (r.registrationStatus || '').toUpperCase() === 'REJECTED').length;

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h3 className="font-bold text-base text-foreground tracking-tight">Registered Attendees & Payment Receipts</h3>
            <p className="text-xs text-muted-foreground">Review registration applications, update attendee status, or view receipts.</p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by attendee name or email..."
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        {/* 3 Tabs: All Users | Accepted | Rejected */}
        <div className="flex items-center gap-1.5 border-b border-border/80 pb-2">
          {[
            { id: 'all', label: `All Users (${registrations.length})` },
            { id: 'accepted', label: `Accepted (${acceptedCount})` },
            { id: 'rejected', label: `Rejected (${rejectedCount})` },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={`h-8 px-3 text-xs font-semibold cursor-pointer rounded-lg ${
                  isActive ? 'shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        {filteredRegistrations.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2 border border-dashed border-border rounded-xl">
            <Users className="h-8 w-8 mx-auto opacity-40 text-primary mb-1" />
            <p className="font-semibold text-foreground text-sm">No attendees found in this tab</p>
            <p>When users register for this event, their details and payment receipts will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRegistrations.map((reg, idx) => {
              const amountPaid = parseFloat(reg.amount) || 0;
              const regDate = reg.registrationTime || reg.createdAt;
              const regStatus = (reg.registrationStatus || 'PENDING').toUpperCase();
              const isAccepted = regStatus === 'ACCEPTED' || regStatus === 'ATTENDED';
              const isRejected = regStatus === 'REJECTED';
              const regId = reg.registrationId || reg.id;

              return (
                <div
                  key={regId || idx}
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

                  {/* Middle: Payment Amount & Status Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs md:text-right border-t md:border-t-0 border-border/60 pt-3 md:pt-0">
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
                          isAccepted
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : isRejected
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-amber-500/10 text-amber-700'
                        }`}
                      >
                        {regStatus}
                      </Badge>
                    </div>
                  </div>

                  {/* Right: Actions (Accept / Reject & View Profile) */}
                  <div className="flex items-center justify-end gap-2 border-t md:border-t-0 border-border/60 pt-2 md:pt-0 shrink-0">
                    {/* Action Buttons */}
                    {!isAccepted && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateRegistrationStatus(regId, 'ACCEPTED')}
                        disabled={actionLoadingId === regId}
                        className="h-8 px-2.5 text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs"
                      >
                        {actionLoadingId === regId ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        <span>Accept</span>
                      </Button>
                    )}

                    {!isRejected && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateRegistrationStatus(regId, 'REJECTED')}
                        disabled={actionLoadingId === regId}
                        className="h-8 px-2.5 text-xs font-semibold gap-1 text-muted-foreground hover:text-destructive border-border cursor-pointer"
                      >
                        {actionLoadingId === regId ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        <span>Reject</span>
                      </Button>
                    )}

                    <Link href={`/profile/${reg.userId}`}>
                      <Button size="sm" variant="outline" className="text-xs font-semibold gap-1 h-8 px-2.5 cursor-pointer">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span>Profile</span>
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
